import { PrismaClient } from '@generated/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from '@config/env';
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
  $metadata?: {
    httpStatusCode?: number;
  };
}

// This ensures that anyone can view the images via a URL without needing a private signature.
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
    console.log(`⬆️  Uploaded: ${s3Key} (Bucket: ${bucketName})`);
    return `${bucketName}/${s3Key}`;
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

  const usersToCreate = [
    { email: 'alice@example.com', name: 'Alice', image: 'avatar-1.jpg' },
    { email: 'bob@example.com', name: 'Bob', image: 'avatar-2.jpg' },
    { email: 'cindy@example.com', name: 'Cindy', image: null },
  ];

  console.log('--- Seeding Users ---');
  // upsert: "Update or Insert" - prevents errors if the user already exists
  for (const u of usersToCreate) {
    // Create User in DB
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, name: u.name },
    });
    console.log(`👤 Processed User: ${user.name ?? 'Unknown'} (${String(user.id)})`);

    // Upload Image (Only if one is provided)
    if (u.image && !user.avatarUrl) {
      // Where is the file on the machine?
      const localPath = path.join(__dirname, 'seed-assets', u.image);

      // Where should it go in MinIO?
      const dbPath = await uploadToBucket(AVATAR_BUCKET, localPath, u.image);

      if (dbPath) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: dbPath },
        });
        console.log(`   📝 Saved to DB: ${dbPath}`);
      }
    } else if (u.image && user.avatarUrl) {
      console.log(`   ⏩ User ${user.name ?? 'Unknown'} already has an avatar. Skipping upload.`);
    }
  }

  ///////////////////
  // EVENT SEEDING //
  ///////////////////

  const eventsToCreate = [
    {
      title: 'Grit Launch Party',
      authorId: 2,
      content: 'Celebrating the first release of our app!',
      isPublic: true,
      isPublished: true,
      startAt: new Date('2026-02-01T18:00:00Z'),
      endAt: new Date('2026-02-01T22:00:00Z'),
    },
    {
      title: 'Private Strategy Meeting',
      authorId: 1,
      content: 'Discussing SECRETS!',
      isPublic: false,
      isPublished: false,
      startAt: new Date('2026-02-15T10:00:00Z'),
      endAt: new Date('2026-02-15T12:00:00Z'),
    },
  ];

  console.log('--- Seeding Events ---');

  for (const e of eventsToCreate) {
    // Simple check to avoid duplicates if seed run twice
    const existing = await prisma.event.findFirst({
      where: { title: e.title, authorId: e.authorId },
    });

    if (!existing) {
      await prisma.event.create({ data: e });
      console.log(`📅 Created Event: ${e.title} for User ${String(e.authorId)}`);
    }
  }
}

main()
  // Successfully finished, close the connection
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  // Handle errors and ensure connection closes even on failure
  .catch(async (e: unknown) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
