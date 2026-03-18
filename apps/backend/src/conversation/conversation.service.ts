import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ConversationType } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { ReqConversationCreate } from '@grit/schema';
import { ChatGateway } from '@/chat/chat.gateway';
import { conversationCursorFilter, conversationEncodeCursor } from './conversation.utils';

@Injectable()
export class ConversationService {
  constructor(
    private prisma: PrismaService,
    private readonly chatGateway: ChatGateway
  ) {}

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
    if (existing?.participants.length === 2) return existing;

    // Check if the directId is in the friends list of the user
    const friendship = await this.prisma.friends.findFirst({
      where: {
        OR: [
          { userId, friendId: directId },
          { userId: directId, friendId: userId },
        ],
      },
    });
    const areFriends = !!friendship;
    if (!areFriends)
      throw new ForbiddenException(
        'You cannot create a chat with this user since you are not friends'
      );

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

    // When we have created a new conversation we need to resync the rooms the user and his chat partner should have joined
    await this.chatGateway.resyncUserRooms(userId);
    await this.chatGateway.resyncUserRooms(directId);

    return newConversation;
  }

  // async conversationGetOrCreateForGroup(groupIds: number[], userId: number) {}

  async conversationGetMany(userId: number, input?: { limit?: number; cursor?: string }) {
    const limit = input?.limit ?? 20;
    const cursorFilter = conversationCursorFilter(input ?? {});

    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
        OR: [
          { event: null },
          {
            event: {
              isPublished: true,
            },
          },
        ],
        ...cursorFilter,
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
            slug: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit + 1,
    });

    const hasMore = conversations.length > limit;
    const slicedData = hasMore ? conversations.slice(0, limit) : conversations;

    return {
      data: slicedData,
      pagination: {
        nextCursor: hasMore
          ? conversationEncodeCursor(
              slicedData[slicedData.length - 1].updatedAt,
              slicedData[slicedData.length - 1].id
            )
          : null,
        hasMore,
      },
    };
  }
}
