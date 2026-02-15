import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ConversationType } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async conversationGetOrCreate(
    data: {
      type: string;
      directId: number;
      groupIds: number[];
    },
    userId: number
  ) {
    // Note that event conversations are created automatically during event creation and are passed in the event object to fe
    if (data.type === 'DIRECT') return this.conversationGetOrCreateForDirect(data.directId, userId);
    // if (data.type === 'GROUP') return this.conversationGetOrCreateForGroup(data.groupIds, userId);
    throw new Error('Data problem');
  }

  async conversationGetOrCreateForDirect(directId: number, userId: number) {
    // Bail early if the user wants to chat with himself.
    if (directId === userId) throw new ForbiddenException('You cannot chat with yourself');

    // Check if we already have a conversation with just these two and return it in case
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: ConversationType.DIRECT,
        AND: [
          { participants: { some: { userId: directId } } },
          { participants: { some: { userId: userId } } },
        ],
      },
      include: { participants: true },
    });
    if (existing && existing.participants.length === 2) return existing;

    // Otherwise create the DIRECT conversation
    const newConversation = await this.prisma.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        createdBy: userId,
        participants: {
          create: [{ userId }, { userId: directId }],
        },
      },
      include: { participants: true },
    });
    return newConversation;
  }

  // async conversationGetOrCreateForGroup(groupIds: number[], userId: number) {}
}
