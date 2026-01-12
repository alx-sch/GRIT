import { env } from '@config/env';
import { PrismaClient } from '@generated/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Setup the connection pool
const pool = new Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Initialize the client WITH the adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Seeding database...');

  // upsert: "Update or Insert" - prevents errors if the user already exists
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'Cindy@example.com' },
    update: {},
    create: {
      email: 'Cindy@example.com',
      name: 'Cindy',
    },
  });

  const event1 = await prisma.event.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      authorId: user1.id,
      content:
        'A night of unforgettable techno beats, in Not Berghain. Join us for an immersive experience with top DJs and a vibrant crowd.',
      title:
        'MEGA SUPER DUPER COOL PARTY super hyper long title super hyper long title super hyper long titlesuper hyper long title super hyper long title super hyper long titlesuper hyper long title super hyper long title super hyper long titlesuper hyper long title super hyper long title super hyper long title super hyper long title super hyper long title super hyper long title',
      startAt: '2026-03-02T10:00:00Z',
      endAt: '2026-03-02T10:00:00Z',
      isPublished: true,
      isPublic: true,
    },
  });

  const event2 = await prisma.event.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      authorId: user2.id,
      content:
        'A session of beer-yoga at Lotus. Unwind with a refreshing beer in hand while stretching and strengthening your body in a fun and social environment.',
      createdAt: '2026-01-03T10:00:00Z',
      endAt: '2026-01-03T10:00:00Z',
      isPublished: true,
      isPublic: true,
      startAt: '2026-01-03T10:00:00Z',
      title: 'Beer-Yoga Session',
    },
  });

  const event3 = await prisma.event.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      authorId: user3.id,
      content: 'Come to my awesome event!',
      createdAt: '2026-01-03T10:00:00Z',
      endAt: '2026-01-15T10:00:00Z',
      isPublished: true,
      isPublic: false,
      startAt: '2026-01-15T10:00:00Z',
      title: 'Fireplace Gathering',
    },
  });

  // Log the results so you can see the IDs generated in the terminal
  console.log({ user1, user2, user3, event1, event2, event3 });
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
