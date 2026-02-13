import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { IntChatMessageDto } from './chat.schema';
import { ConversationService } from '@/conversation/conversation.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversation: ConversationService
  ) {}

  // async saveMessage(message: IntChatMessageDto) {
  //   return this.prisma.chatMessage.upsert({
  //     where: { id: message.id },
  //     create: {
  //       id: message.id,
  //       eventId: message.eventId,
  //       authorId: message.authorId,
  //       text: message.text,
  //     },
  //     update: {},
  //   });
  // }

  async loadMessages(conversationId: string, limit = 10, cursor?: { createdAt: Date; id: string }) {
    return this.prisma.chatMessage.findMany({
      where: {
        conversationId,
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
