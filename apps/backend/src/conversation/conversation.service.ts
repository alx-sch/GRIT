import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateEventConversation(eventId: number) {
    const existing = await this.prisma.conversation.findUnique({
      where: { eventId },
    });

    if (existing) return existing;

    return this.prisma.conversation.upsert({
      where: { eventId },
      update: {},
      create: {
        type: 'EVENT',
        event: { connect: { id: eventId } },
      },
    });
  }
}
