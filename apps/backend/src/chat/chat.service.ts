import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { IntChatMessageDto } from './chat.schema';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async saveMessage(message: IntChatMessageDto) {
    return this.prisma.chatMessage.upsert({
      where: { id: message.id },
      create: {
        id: message.id,
        eventId: message.eventId,
        authorId: message.authorId,
        text: message.text,
      },
      update: {},
    });
  }

  async loadMessages(eventId: number, limit = 10, cursor?: { createdAt: Date; id: string }) {
    return this.prisma.chatMessage.findMany({
      where: {
        eventId,
        ...(cursor && {
          OR: [
            { createdAt: { lt: cursor.createdAt } },
            {
              createdAt: cursor.createdAt,
              id: { lt: cursor.id },
            },
          ],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
}
