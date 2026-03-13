import { env } from '@/config/env';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, User } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { getPublicS3Policy, generateS3Key } from '@/storage/storage.utils';
import { eventGenerateSlug } from '@/event/event.utils';

//#############
//## HELPER ###
//#############

// Setup the Postgres connection
const pool = new Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }); // Initialize the client WITH the adapter

// Setup S3/minIO Client
const s3 = new S3Client({
  region: 'us-east-1', // MinIO requires a region, even if ignored
  endpoint: env.MINIO_INTERNAL_URL,
  credentials: {
    accessKeyId: env.MINIO_USER,
    secretAccessKey: env.MINIO_PASSWORD,
  },
  forcePathStyle: true,
});

interface S3Error {
  $metadata?: { httpStatusCode?: number };
}

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
          Policy: getPublicS3Policy(bucketName),
        })
      );
      console.log(`✅ Bucket '${bucketName}' created.`);
    } else {
      throw error;
    }
  }
}

// Helper: Upload file to bucket
async function uploadToBucket(bucketName: string, localFilePath: string, originalName: string) {
  // 1. Check if local file exists
  if (!fs.existsSync(localFilePath)) {
    console.warn(`⚠️  File not found locally: ${localFilePath}. Skipping.`);
    return null;
  }

  // 2. Read file from disk and hash
  const fileBuffer = fs.readFileSync(localFilePath);
  const s3Key = generateS3Key(originalName);

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

//##############
//## SEEDING ###
//##############

async function main() {
  console.log('--- Seeding database...');

  const TEST_RECORD_COUNT = 1000;
  const DEFAULT_TEST_PASSWORD = 'password123';
  const AVATAR_BUCKET = 'user-avatars';
  const EVENT_BUCKET = 'event-images';

  await ensureBucket(AVATAR_BUCKET);
  await ensureBucket(EVENT_BUCKET);

  //////////////////
  // USER SEEDING //
  //////////////////

  console.log('--- Seeding Users ---');

  const usersToCreate = [
    {
      email: 'admin@example.com',
      name: 'Admin',
      password: 'admin123',
      image: null,
      isAdmin: true,
    },
    {
      email: 'alice@example.com',
      name: 'Alice',
      password: DEFAULT_TEST_PASSWORD,
      image: 'avatar-1.jpg',
    },
    {
      email: 'bob@example.com',
      name: 'Bob',
      password: DEFAULT_TEST_PASSWORD,
      image: 'avatar-2.jpg',
    },
    { email: 'cindy@example.com', name: 'Cindy', password: DEFAULT_TEST_PASSWORD, image: null },
  ];

  // seed much more users into db for testing
  for (let i = 1; i <= TEST_RECORD_COUNT; i++) {
    usersToCreate.push({
      email: `test${i}@example.com`,
      name: `Test User ${i}`,
      password: DEFAULT_TEST_PASSWORD,
      image: null,
    });
  }

  // upsert: "Update or Insert" - prevents errors if the user already exists
  for (const u of usersToCreate) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    // Create User in DB
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, password: hashedPassword, isConfirmed: true },
      create: {
        email: u.email,
        name: u.name,
        password: hashedPassword,
        isConfirmed: true,
        confirmationToken: null,
        isAdmin: u.isAdmin,
      },
    });
    //console.log(`👤 Processed User: ${user.name} (${String(user.id)})`);

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
      console.log(`   ⏩ User ${user.name} already has an avatar. Skipping upload.`);
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
    {
      name: 'Super Cool Event Space',
      city: 'Berlin',
      country: 'Germany',
      longitude: 13.45177,
      latitude: 52.49677,
      authorId: alice.id,
      isPublic: true,
    },
  ];

  // seed much more locations for testing
  for (let i = 1; i <= TEST_RECORD_COUNT; i++) {
    locationsToCreate.push({
      name: `Test Location ${i}`,
      city: 'Berlin',
      country: 'Germany',
      // spread locations out
      longitude: 13.45 + i * 0.001,
      latitude: 52.5 + i * 0.001,
      authorId: alice.id,
      isPublic: true,
    });
  }

  let gritHqId: any = 0;
  let superCoolId: any = 0;
  const testLocationIds: any[] = [];

  for (const loc of locationsToCreate) {
    const existing = await prisma.location.findFirst({
      where: { name: loc.name },
    });

    let currentLocId;

    if (!existing) {
      const createdLoc = await prisma.location.create({
        data: loc,
      });
      currentLocId = createdLoc.id;
    } else {
      currentLocId = existing.id;
    }

    if (loc.name === 'GRIT HQ') gritHqId = currentLocId;
    if (loc.name === 'Super Cool Event Space') superCoolId = currentLocId;
    if (loc.name.startsWith('Test Location')) {
      testLocationIds.push(currentLocId);
    }
  }

  ///////////////////////////////////
  // EVENT SEEDING & CONVERSATIONS //
  ///////////////////////////////////

  console.log('--- Seeding Events & Matching Conversations ---');

  const eventsToCreate = [
    {
      title: 'Grit Launch Party',
      slug: eventGenerateSlug('Grit Launch Party'),
      authorId: bob.id,
      locationId: gritHqId,
      content: 'Celebrating the first release of our app!',
      isPublic: true,
      isPublished: true,
      startAt: new Date('2026-04-01T18:00:00Z'),
      endAt: new Date('2026-04-01T22:00:00Z'),
      image: 'grit-launch.jpg', // local filename in seed-assets
    },
    {
      title: 'Private Strategy Meeting',
      slug: eventGenerateSlug('Private Strategy Meeting'),
      authorId: alice.id,
      content: 'Discussing SECRETS!',
      locationId: null,
      isPublic: false,
      isPublished: false,
      startAt: new Date('2025-04-01T10:00:00Z'),
      endAt: new Date('2025-04-01T12:00:00Z'),
      image: null as string | null,
    },
    {
      title: 'Alice in Wonderland',
      slug: eventGenerateSlug('Alice in Wonderland'),
      authorId: alice.id,
      locationId: superCoolId,
      content: 'We’re all mad here!',
      isPublic: true,
      isPublished: true,
      startAt: new Date('2027-02-15T10:00:00Z'),
      endAt: new Date('2027-02-15T12:00:00Z'),
      image: null as string | null,
    },
  ];

  // add much more events for testing (pagination etc)
  for (let i = 1; i <= TEST_RECORD_COUNT; i++) {
    const startDate = new Date('2024-04-01T18:00:00Z');
    // spread out starting dates
    startDate.setDate(startDate.getDate() + i);

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 4);

    eventsToCreate.push({
      title: `Test Party ${i}`,
      slug: eventGenerateSlug(`Test Party ${i}`),
      locationId: testLocationIds[i - 1],
      authorId: alice.id,
      content: `This is auto-generated test party number ${i}.`,
      isPublic: true,
      isPublished: true,
      startAt: startDate,
      endAt: endDate,
      image: null as string | null,
    });
  }

  for (const e of eventsToCreate) {
    // simple check to avoid duplicate events if seed run twice
    const existingEvent = await prisma.event.findFirst({
      where: { title: e.title, authorId: e.authorId },
    });

    if (!existingEvent) {
      const { image } = e;

      const event = await prisma.event.create({
        data: {
          title: e.title,
          slug: e.slug,
          authorId: e.authorId,
          locationId: e.locationId,
          startAt: e.startAt,
          endAt: e.endAt,
          isPublic: e.isPublic,
          isPublished: e.isPublished,

          attendees: {
            create: [{ userId: e.authorId }],
          },

          conversation: {
            create: {
              type: 'EVENT',
              createdBy: e.authorId,
              participants: {
                create: [{ userId: e.authorId }],
              },
            },
          },
        },
      });

      //console.log(`📅 Created Event: ${e.title} for User ${String(e.authorId)}`);

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

  console.log('--- Seeding Attendance ---');

  const aliceFromDb = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
  const bobFromDb = await prisma.user.findUnique({ where: { email: 'bob@example.com' } });
  const cindyFromDb = await prisma.user.findUnique({ where: { email: 'cindy@example.com' } });
  const party = await prisma.event.findFirst({ where: { title: 'Grit Launch Party' } });

  const attendees = [aliceFromDb, bobFromDb];

  if (!party) throw new Error('Party not found');

  const conversation = await prisma.conversation.findUnique({
    where: { eventId: party.id },
    select: { id: true },
  });

  if (!conversation) throw new Error('Event conversation missing');

  // Seed Attendance

  await prisma.eventAttendee.createMany({
    data: attendees
      .filter((attendee): attendee is User => attendee !== null)
      .map((attendee) => ({
        eventId: party.id,
        userId: attendee.id,
      })),
    skipDuplicates: true,
  });

  // Additionally seed conversation participation for the same users

  await prisma.conversationParticipant.createMany({
    data: attendees
      .filter((attendee): attendee is User => attendee !== null)
      .map((attendee) => ({
        conversationId: conversation.id,
        userId: attendee.id,
      })),
    skipDuplicates: true,
  });

  for (const attendee of attendees) {
    if (attendee?.name) console.log(`✅ ${attendee.name} is now attending the Party`);
  }

  //////////////////////
  // FRIENDSHIP SEEDING //
  //////////////////////

  console.log('--- Seeding Friendships ---');

  if (!aliceFromDb || !bobFromDb || !cindyFromDb) {
    throw new Error('Seed users not found');
  }

  // Alice <-> Bob friendship
  const aliceAndBob = await prisma.friends.findFirst({
    where: {
      userId: aliceFromDb.id,
      friendId: bobFromDb.id,
    },
  });
  if (!aliceAndBob) {
    await prisma.$transaction([
      prisma.friends.create({
        data: {
          userId: aliceFromDb.id,
          friendId: bobFromDb.id,
        },
      }),
      prisma.friends.create({
        data: {
          userId: bobFromDb.id,
          friendId: aliceFromDb.id,
        },
      }),
    ]);
    console.log(`👫 Alice & Bob are now friends`);
  }

  // Alice <-> Cindy friendship
  const aliceAndCindy = await prisma.friends.findFirst({
    where: {
      userId: aliceFromDb.id,
      friendId: cindyFromDb.id,
    },
  });
  if (!aliceAndCindy) {
    await prisma.$transaction([
      prisma.friends.create({
        data: {
          userId: aliceFromDb.id,
          friendId: cindyFromDb.id,
        },
      }),
      prisma.friends.create({
        data: {
          userId: cindyFromDb.id,
          friendId: aliceFromDb.id,
        },
      }),
    ]);
    console.log(`👫 Alice & Cindy are now friends`);
  }

  // Bob <-> Cindy friendship
  const bobAndCindy = await prisma.friends.findFirst({
    where: {
      userId: bobFromDb.id,
      friendId: cindyFromDb.id,
    },
  });
  if (!bobAndCindy) {
    await prisma.$transaction([
      prisma.friends.create({
        data: {
          userId: bobFromDb.id,
          friendId: cindyFromDb.id,
        },
      }),
      prisma.friends.create({
        data: {
          userId: cindyFromDb.id,
          friendId: bobFromDb.id,
        },
      }),
    ]);
    console.log(`👫 Bob & Cindy are now friends`);
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
