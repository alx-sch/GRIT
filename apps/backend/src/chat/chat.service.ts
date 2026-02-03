import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { IntChatMessageDto } from './chat.schema';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async save(message: IntChatMessageDto) {
    return this.prisma.chatMessage.upsert({
      where: { id: message.id },
      create: {
        id: message.id,
        eventId: message.eventId,
        authorId: message.authorId,
        text: message.text,
        sentAt: message.sentAt,
      },
      update: {},
    });
  }

  async loadRecentForEvent(eventId: number, limit = 10, cursor?: { sentAt: Date; id: string }) {
    return this.prisma.chatMessage.findMany({
      where: { eventId },
      orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarKey: true,
          },
        },
      },
    });
  }

  async loadBeforeForEvent(eventId: number, cursor: { sentAt: Date; id: string }, limit = 5) {
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        eventId,
        OR: [
          { sentAt: { lt: cursor.sentAt } },
          {
            sentAt: cursor.sentAt,
            id: { lt: cursor.id },
          },
        ],
      },
      orderBy: [{ sentAt: 'desc' }, { id: 'desc' }], // for cursor based pagination reverse order is better
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarKey: true,
          },
        },
      },
    });
    return messages;
  }
}
