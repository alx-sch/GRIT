import { PrismaClient } from '@prisma/client';

// Initialize the database connection client
const prisma = new PrismaClient();

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
  })
  // Handle errors and ensure connection closes even on failure
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
