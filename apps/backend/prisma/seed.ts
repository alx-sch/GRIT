import { env } from '@/config/env';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, User, Location } from '@prisma/client';
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
    // console.log(`✅ Bucket ' ${bucketName}' exists.`);
  } catch (error: unknown) {
    const isS3Error = (err: unknown): err is S3Error =>
      typeof err === 'object' && err !== null && '$metadata' in err;

    const isNotFound =
      error instanceof Error &&
      (error.name === 'NotFound' || (isS3Error(error) && error.$metadata?.httpStatusCode === 404));

    if (isNotFound) {
      // console.log(`Bucket not found. Creating '${bucketName}'...`);
      await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
      await s3.send(
        new PutBucketPolicyCommand({
          Bucket: bucketName,
          Policy: getPublicS3Policy(bucketName),
        })
      );
      // console.log(`✅ Bucket '${bucketName}' created.`);
    } else {
      console.error(`❌ Unexpected error with bucket '${bucketName}':`, error);
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
    // const fileName = path.basename(localFilePath);
    // console.log(`⬆️  Uploaded: ${fileName} (Bucket: ${bucketName})`);
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

  console.log('--- Seeding Users...');

  const coreUsers = [
    { email: 'admin@example.com', name: 'Admin', password: 'admin123', image: null, isAdmin: true },
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

  // Process Core Users (Since they need avatars and specific upserts)
  for (const u of coreUsers) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, password: hashedPassword, isConfirmed: true },
      create: {
        email: u.email,
        name: u.name,
        password: hashedPassword,
        isConfirmed: true,
        isAdmin: u.isAdmin ?? false,
      },
    });

    if (u.image && !user.avatarKey) {
      const localPath = path.join(__dirname, 'seed-assets', u.image);
      const bucketKey = await uploadToBucket(AVATAR_BUCKET, localPath, u.image);
      if (bucketKey) {
        await prisma.user.update({ where: { id: user.id }, data: { avatarKey: bucketKey } });
      }
    }
  }

  // TEST USER seeding
  const existingTestUsersCount = await prisma.user.count({
    where: { email: { startsWith: 'test' } },
  });

  if (existingTestUsersCount === 0) {
    console.log(`Seeding ${String(TEST_RECORD_COUNT)} test user...`);
    // Pre-hash the test password exactly ONCE
    const testHashedPassword = await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);

    // Bulk insert all test users in a single database trip
    const testUsersData = [];
    for (let i = 1; i <= TEST_RECORD_COUNT; i++) {
      testUsersData.push({
        email: `test${String(i)}@example.com`,
        name: `TestUser${String(i)}`,
        password: testHashedPassword, // use pre-calculated hash to save time
        isConfirmed: true,
        isAdmin: false,
        bio: `This is auto-generated test user ${String(i)}.`,
      });
    }

    // Push test users to db in a single query
    await prisma.user.createMany({
      data: testUsersData,
      skipDuplicates: true,
    });
  } else {
    console.log(`Found ${String(existingTestUsersCount)} test users. Skipping.`);
  }

  const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
  const bob = await prisma.user.findUnique({ where: { email: 'bob@example.com' } });

  if (!alice || !bob) {
    throw new Error('Seed users Alice or Bob not found');
  }

  //////////////////////
  // LOCATION SEEDING //
  //////////////////////

  console.log('--- Seeding Locations...');

  const coreLocations = [
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
  let gritHqId: Location['id'] | null = null;
  let superCoolId: Location['id'] | null = null;

  for (const loc of coreLocations) {
    const existing = await prisma.location.findFirst({ where: { name: loc.name } });
    let currentLocId;
    if (!existing) {
      const createdLoc = await prisma.location.create({ data: loc });
      currentLocId = createdLoc.id;
    } else {
      currentLocId = existing.id;
    }
    if (loc.name === 'GRIT HQ') gritHqId = currentLocId;
    if (loc.name === 'Super Cool Event Space') superCoolId = currentLocId;
  }

  // Bulk Insert Test Locations
  const existingTestLocationsCount = await prisma.location.count({
    where: { name: { startsWith: 'Test Location' } },
  });

  if (existingTestLocationsCount === 0) {
    console.log(`Seeding ${String(TEST_RECORD_COUNT)} test locations...`);
    const testLocationsData = [];
    for (let i = 1; i <= TEST_RECORD_COUNT; i++) {
      testLocationsData.push({
        name: `Test Location ${String(i)}`,
        city: 'Berlin',
        country: 'Germany',
        longitude: 13.45 + i * 0.001,
        latitude: 52.5 + i * 0.001,
        authorId: alice.id,
        isPublic: true,
      });
    }

    await prisma.location.createMany({
      data: testLocationsData,
      skipDuplicates: true,
    });
  } else {
    console.log(`Found ${String(existingTestLocationsCount)} test locations. Skipping.`);
  }

  const testLocations = await prisma.location.findMany({
    where: { name: { startsWith: 'Test Location' } },
    select: { id: true, name: true },
  });

  const locationMap = new Map<string, number>();
  for (const loc of testLocations) {
    locationMap.set(loc.name, loc.id);
  }

  ///////////////////////////////////
  // EVENT SEEDING & CONVERSATIONS //
  ///////////////////////////////////

  console.log('--- Seeding Events & Chats...');

  const coreEvents = [
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
      image: 'grit-launch.jpg',
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
      image: null,
    },
    {
      title: 'Alice in Wonderland',
      slug: eventGenerateSlug('Alice in Wonderland'),
      authorId: alice.id,
      locationId: superCoolId,
      content: 'We’re all mad here!',
      isPublic: true,
      isPublished: true,
      startAt: new Date('2026-04-01T10:00:00Z'),
      endAt: new Date('2027-04-01T12:00:00Z'),
      image: null,
    },
  ];

  for (const e of coreEvents) {
    const existingEvent = await prisma.event.findFirst({
      where: { title: e.title, authorId: e.authorId },
    });
    if (!existingEvent) {
      const { image, ...eventData } = e; // pull 'image' out of object
      const event = await prisma.event.create({
        data: {
          ...eventData,
          attendees: { create: [{ userId: e.authorId }] },
          conversation: {
            create: {
              type: 'EVENT',
              createdBy: e.authorId,
              participants: { create: [{ userId: e.authorId }] },
            },
          },
        },
      });

      if (image) {
        const localPath = path.join(__dirname, 'seed-assets', image);
        const bucketKey = await uploadToBucket(EVENT_BUCKET, localPath, image);
        if (bucketKey) {
          await prisma.event.update({ where: { id: event.id }, data: { imageKey: bucketKey } });
        }
      }
    }
  }

  // Bulk insert test events
  const existingTestEventsCount = await prisma.event.count({
    where: { title: { startsWith: 'Test Party' } },
  });

  if (existingTestEventsCount === 0) {
    console.log(`Seeding ${String(TEST_RECORD_COUNT)} test events...`);
    const testEventsData = [];

    for (let i = 1; i <= TEST_RECORD_COUNT; i++) {
      const startDate = new Date('2025-12-01T18:00:00Z');
      startDate.setDate(startDate.getDate() + i);
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 4);

      testEventsData.push({
        title: `Test Party ${String(i)}`,
        slug: eventGenerateSlug(`Test Party ${String(i)}`),
        locationId: locationMap.get(`Test Location ${String(i)}`) ?? null,
        authorId: alice.id,
        content: `This is auto-generated test party number ${String(i)}.`,
        isPublic: true,
        isPublished: true,
        startAt: startDate,
        endAt: endDate,
      });
    }

    await prisma.event.createMany({
      data: testEventsData,
      skipDuplicates: true,
    });

    // Get test events back to link attendees and conversations
    const testEventsFromDb = await prisma.event.findMany({
      where: { title: { startsWith: 'Test Party' } },
      select: { id: true, authorId: true },
    });

    if (testEventsFromDb.length > 0) {
      // Setup the arrays with the authors (who must be attending their own events)
      const eventAttendeeData = testEventsFromDb.flatMap((e) =>
        e.authorId !== null ? [{ eventId: e.id, userId: e.authorId }] : []
      );

      // Create the conversations for these events
      await prisma.conversation.createMany({
        data: testEventsFromDb.map((e) => ({
          type: 'EVENT',
          createdBy: e.authorId,
          eventId: e.id,
        })),
        skipDuplicates: true,
      });

      // Fetch the conversations back so we know IDs
      const eventConversations = await prisma.conversation.findMany({
        where: { eventId: { in: testEventsFromDb.map((e) => e.id) } },
        select: { id: true, createdBy: true, eventId: true }, // Ensure we grab eventId too!
      });

      const participantData = eventConversations.flatMap((c) =>
        c.createdBy !== null ? [{ conversationId: c.id, userId: c.createdBy }] : []
      );

      const allTestUsers = await prisma.user.findMany({
        where: { email: { startsWith: 'test' } },
        select: { id: true },
      });

      const eventToConvMap = new Map(eventConversations.map((c) => [c.eventId, c.id]));

      for (const event of testEventsFromDb) {
        // Pick random number of attendees for this specific event (between 0 and 100)
        const numAttendees = Math.floor(Math.random() * 100);
        const randomUserIds = new Set<number>();

        // Keep picking random test users until target number is hit
        while (randomUserIds.size < numAttendees && randomUserIds.size < allTestUsers.length) {
          const randomIndex = Math.floor(Math.random() * allTestUsers.length);
          randomUserIds.add(allTestUsers[randomIndex].id);
        }

        const conversationId = eventToConvMap.get(event.id);

        for (const userId of randomUserIds) {
          // Prevent adding the author twice if they were randomly selected
          if (userId === event.authorId) continue;

          // Push to our bulk arrays
          eventAttendeeData.push({ eventId: event.id, userId });
          if (conversationId) {
            participantData.push({ conversationId, userId });
          }
        }
      }

      // Execute the massive bulk inserts!
      await prisma.eventAttendee.createMany({
        data: eventAttendeeData,
        skipDuplicates: true,
      });

      await prisma.conversationParticipant.createMany({
        data: participantData,
        skipDuplicates: true,
      });
    }
  } else {
    console.log(`Found ${String(existingTestEventsCount)} test events. Skipping.`);
  }

  ////////////////////////
  // ATTENDANCE SEEDING //
  ////////////////////////

  console.log('--- Seeding Attendance...');

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

  // for (const attendee of attendees) {
  //   if (attendee?.name) console.log(`✅ ${attendee.name} is now attending the Party`);
  // }

  ////////////////////////
  // FRIENDSHIP SEEDING //
  ////////////////////////

  console.log('--- Seeding Friendships...');

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
    // console.log(`👫 Alice & Bob are now friends`);
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
    // console.log(`👫 Alice & Cindy are now friends`);
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
    // console.log(`👫 Bob & Cindy are now friends`);
  }

  ///////////////////////////////////////////
  // ALICE <-> ALL TEST USERS FRIENDSHIPS  //
  ///////////////////////////////////////////

  // grab all auto-generates test users
  const testUsers = await prisma.user.findMany({
    where: {
      email: {
        startsWith: 'test',
      },
    },
    select: { id: true }, // only need their IDs
  });

  // Build the array of bidirectional friendships
  const bulkFriendships = [];
  for (const testUser of testUsers) {
    // Alice -> Test User
    bulkFriendships.push({ userId: aliceFromDb.id, friendId: testUser.id });
    // Test User -> Alice
    bulkFriendships.push({ userId: testUser.id, friendId: aliceFromDb.id });
  }

  // Bulk insert them
  if (bulkFriendships.length > 0) {
    await prisma.friends.createMany({
      data: bulkFriendships,
      skipDuplicates: true,
    });
    // console.log(
    //   `👫 Alice is now friends with ${String(testUsers.length)} test users! Popular girl.`
    // );
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
