import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ConversationType } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { ReqConversationCreate } from '@grit/schema';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  // Note that event conversations are created automatically during event creation and are passed in the event object to fe
  async conversationGetOrCreate(data: ReqConversationCreate, userId: number) {
    if (data.type === 'DIRECT' && data.directId)
      return this.conversationGetOrCreateForDirect(data.directId, userId);
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
      select: { id: true, participants: true },
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
    console.log(newConversation);
    return newConversation;
  }

  // async conversationGetOrCreateForGroup(groupIds: number[], userId: number) {}

  async conversationGetMany(userId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
        type: true,
        title: true,
        updatedAt: true,
        participants: {
          select: {
            user: {
              select: {
                id: true,
                avatarKey: true,
                name: true,
              },
            },
          },
        },
        event: {
          select: {
            startAt: true,
            id: true,
            imageKey: true,
            title: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            text: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                avatarKey: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return conversations;
  }
}
