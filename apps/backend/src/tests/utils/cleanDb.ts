import { PrismaClient } from '@prisma/client';

export async function cleanDb(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "ChatMessage",
      "ConversationParticipant",
      "Conversation",
      "Event",
      "Location",
      "User"
    RESTART IDENTITY CASCADE;
  `);
}
