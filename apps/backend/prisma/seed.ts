import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from '@/config/env';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import * as bcrypt from 'bcrypt';

// Setup the Postgres connection
const pool = new Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }); // Initialize the client WITH the adapter

// Setup S3/minIO Client
const s3 = new S3Client({
  region: 'us-east-1', // MinIO requires a region, even if ignored
  endpoint: env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: env.MINIO_USER,
    secretAccessKey: env.MINIO_PASSWORD,
  },
  forcePathStyle: true,
});

interface S3Error {
  $metadata?: { httpStatusCode?: number };
}

// This ensures that anyone can view the images via a URL without needing a
// private signature.
const getPublicPolicy = (bucketName: string) =>
  JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  });

// Helper: Check if bucket exists, create if not
async function ensureBucket(bucketName: string) {
  console.log(`Checking for bucket: ${bucketName}...`);
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`✅ Bucket ' ${bucketName}' exists.`);
  } catch (error: unknown) {
    const isS3Error = (err: unknown): err is S3Error =>
      typeof err === 'object' && err !== null && '$metadata' in err;

    const isNotFound =
      error instanceof Error &&
      (error.name === 'NotFound' || (isS3Error(error) && error.$metadata?.httpStatusCode === 404));

    if (isNotFound) {
      console.log(`Bucket not found. Creating '${bucketName}'...`);
      await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
      await s3.send(
        new PutBucketPolicyCommand({
          Bucket: bucketName,
          Policy: getPublicPolicy(bucketName),
        })
      );
      console.log(`✅ Bucket '${bucketName}' created.`);
    } else {
      throw error;
    }
  }
}

// Helper: Upload file to bukcet
async function uploadToBucket(bucketName: string, localFilePath: string, originalName: string) {
  // 1. Check if local file exists
  if (!fs.existsSync(localFilePath)) {
    console.warn(`⚠️  File not found locally: ${localFilePath}. Skipping.`);
    return null;
  }

  // 2. Read file from disk
  const fileBuffer = fs.readFileSync(localFilePath);

  const fileHash = crypto.randomBytes(4).toString('hex');
  const timestamp = Date.now();
  const extension = path.extname(originalName);
  const s3Key = `${String(timestamp)}-${fileHash}${extension}`;

  // 3. Upload to S3/MinIO
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: 'image/jpeg',
      })
    );
    const fileName = path.basename(localFilePath);
    console.log(`⬆️  Uploaded: ${fileName} (Bucket: ${bucketName})`);
    return s3Key;
  } catch (error) {
    console.error(`❌ Upload failed for ${s3Key}:`, error);
    return null;
  }
}

async function main() {
  console.log('--- Seeding database...');

  const AVATAR_BUCKET = 'user-avatars';
  const EVENT_BUCKET = 'event-images';

  await ensureBucket(AVATAR_BUCKET);
  await ensureBucket(EVENT_BUCKET);

  //////////////////
  // USER SEEDING //
  //////////////////

  console.log('--- Seeding Users ---');

  const usersToCreate = [
    { email: 'alice@example.com', name: 'Alice', password: '0123456789', image: 'avatar-1.jpg' },
    { email: 'bob@example.com', name: 'Bob', password: '12345678pw', image: 'avatar-2.jpg' },
    { email: 'cindy@example.com', name: 'Cindy', password: '0123456789', image: null },
  ];

  // upsert: "Update or Insert" - prevents errors if the user already exists
  for (const u of usersToCreate) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    // Create User in DB
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, password: hashedPassword },
      create: { email: u.email, name: u.name, password: hashedPassword },
    });
    console.log(`👤 Processed User: ${user.name ?? 'Unknown'} (${String(user.id)})`);

    // Upload Image (Only if one is provided)
    if (u.image && !user.avatarKey) {
      // Where is the file on the machine?
      const localPath = path.join(__dirname, 'seed-assets', u.image);

      // Where should it go in MinIO?
      const bucketKey = await uploadToBucket(AVATAR_BUCKET, localPath, u.image);

      if (bucketKey) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarKey: bucketKey },
        });
        console.log(`   📝 Saved to DB: ${bucketKey}`);
      }
    } else if (u.image && user.avatarKey) {
      console.log(`   ⏩ User ${user.name ?? 'Unknown'} already has an avatar. Skipping upload.`);
    }
  }

  const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
  const bob = await prisma.user.findUnique({ where: { email: 'bob@example.com' } });

  if (!alice || !bob) {
    throw new Error('Seed users Alice or Bob not found');
  }

  //////////////////////
  // LOCATION SEEDING //
  //////////////////////

  console.log('--- Seeding Locations ---');

  const locationsToCreate = [
    {
      name: 'GRIT HQ',
      city: 'Berlin',
      country: 'Germany',
      longitude: 13.4482509,
      latitude: 52.485021,
      authorId: alice.id,
      isPublic: true,
    },
  ];

  let gritHqId = 0;

  for (const loc of locationsToCreate) {
    const existing = await prisma.location.findFirst({
      where: { name: loc.name },
    });

    if (!existing) {
      const createdLoc = await prisma.location.create({
        data: loc,
      });
      console.log(`📍 Created Location: ${createdLoc.name ?? 'Unknown Location'} `);
      gritHqId = createdLoc.id;
    } else {
      console.log(`⏩ Location '${loc.name}' already exists. Skipping.`);
      gritHqId = existing.id;
    }
  }

  ///////////////////
  // EVENT SEEDING //
  ///////////////////

  console.log('--- Seeding Events ---');

  const eventsToCreate = [
    {
      title: 'Grit Launch Party',
      authorId: bob.id,
      locationId: gritHqId,
      content: 'Celebrating the first release of our app!',
      isPublic: true,
      isPublished: true,
      startAt: new Date('2026-02-01T18:00:00Z'),
      endAt: new Date('2026-02-01T22:00:00Z'),
      image: 'grit-launch.jpg', // local filename in seed-assets
    },
    {
      title: 'Private Strategy Meeting',
      authorId: alice.id,
      content: 'Discussing SECRETS!',
      isPublic: false,
      isPublished: false,
      startAt: new Date('2026-02-15T10:00:00Z'),
      endAt: new Date('2026-02-15T12:00:00Z'),
      image: null as string | null,
    },
    {
      title: 'Alice in Wonderland',
      authorId: alice.id,
      content: 'We’re all mad here!',
      isPublic: true,
      isPublished: true,
      startAt: new Date('2027-02-15T10:00:00Z'),
      endAt: new Date('2027-02-15T12:00:00Z'),
      image: null as string | null,
    },
  ];

  for (const e of eventsToCreate) {
    // Simple check to avoid duplicates if seed run twice
    const existing = await prisma.event.findFirst({
      where: { title: e.title, authorId: e.authorId },
    });

    if (!existing) {
      // Extract image from event data (not a DB field)
      const { image, ...eventData } = e;
      const event = await prisma.event.create({ data: eventData });
      console.log(`📅 Created Event: ${e.title} for User ${String(e.authorId)}`);

      // Upload image if specified
      if (image) {
        const localPath = path.join(__dirname, 'seed-assets', image);
        const bucketKey = await uploadToBucket(EVENT_BUCKET, localPath, image);

        if (bucketKey) {
          await prisma.event.update({
            where: { id: event.id },
            data: { imageKey: bucketKey },
          });
          console.log(`   📝 Event image saved: ${bucketKey}`);
        }
      }
    }
  }

  ////////////////////////
  // ATTENDANCE SEEDING //
  ////////////////////////

  console.log('--- Seeding Atendance ---');

  const aliceFromDb = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
  const bobFromDb = await prisma.user.findUnique({ where: { email: 'bob@example.com' } });
  const party = await prisma.event.findFirst({ where: { title: 'Grit Launch Party' } });

  const attendees = [aliceFromDb, bobFromDb];

  if (!party) throw new Error('Party not found');
  for (const attendee of attendees) {
    if (!attendee) continue;
    await prisma.user.update({
      where: { id: attendee.id },
      data: {
        attending: { connect: { id: party.id } },
      },
    });
    if (attendee.name) console.log(`✅ ${attendee.name} is now attending the Party`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e: unknown) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
