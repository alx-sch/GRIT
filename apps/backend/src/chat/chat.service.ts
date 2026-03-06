import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { IntChatMessageDto } from './chat.schema';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async saveMessage(message: IntChatMessageDto) {
    await this.prisma.$transaction(async (tx) => {
      await tx.chatMessage.upsert({
        where: { id: message.id },
        create: {
          id: message.id,
          conversationId: message.conversationId,
          authorId: message.authorId,
          text: message.text,
        },
        update: {},
      });

      // Updating the conversation so that we can get properly ordered chat boxes
      await tx.conversation.update({
        where: { id: message.conversationId },
        data: {
          updatedAt: new Date(),
        },
      });
    });
  }

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
