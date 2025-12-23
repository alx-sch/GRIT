import { PrismaClient } from '@generated/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config'; // load DATABASE_URL

// Setup the connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Initialize the client WITH the adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Seeding database...');

  // upsert: "Update or Insert" - prevents errors if the user already exists
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@grit.com' },
    update: {},
    create: {
      email: 'alice@grit.com',
      name: 'Alice',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@google.com' },
    update: {},
    create: {
      email: 'bob@google.com',
      name: 'Bob',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'Cindy@yahoo.com' },
    update: {},
    create: {
      email: 'Cindy@yahoo.com',
      name: 'Cindy',
    },
  });

  // Log the results so you can see the IDs generated in the terminal
  console.log({ user1, user2, user3 });
}

main()
  // Successfully finished, close the connection
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  // Handle errors and ensure connection closes even on failure
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
