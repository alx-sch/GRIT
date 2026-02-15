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
    // Event conversations are created automatically during event creation
    if (data.type === 'DIRECT') return this.conversationGetOrCreateForDirect(data.directId, userId);
    if (data.type === 'GROUP') return this.conversationGetOrCreateForGroup(data.groupIds, userId);
    throw new Error('Data problem');
  }

  // NOT USED ANYMORE

  // async conversationGetOrCreateForEvent(eventId: number, userId: number) {
  //   // Bail early if the user is not attending the event
  //   console.log('Check for event');
  //   const eventData = await this.prisma.event.findFirst({
  //     where: {
  //       id: eventId,
  //       attending: {
  //         some: {
  //           id: userId,
  //         },
  //       },
  //     },
  //   });
  //   if (!eventData) throw new ForbiddenException('You are not attending this event');

  //   // Ensure the conversation for the event exists
  //   const conversation = await this.prisma.conversation.upsert({
  //     where: { eventId },
  //     update: {},
  //     create: {
  //       type: ConversationType.EVENT,
  //       createdBy: eventData.authorId,
  //       eventId,
  //     },
  //   });

  //   // Ensure current user is participant
  //   await this.prisma.conversationParticipant.upsert({
  //     where: {
  //       conversationId_userId: {
  //         conversationId: conversation.id,
  //         userId,
  //       },
  //     },
  //     update: {},
  //     create: {
  //       conversationId: conversation.id,
  //       userId,
  //     },
  //   });

  //   return conversation;
  // }

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
    return this.prisma.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        createdBy: userId,
        participants: {
          create: [{ userId }, { userId: directId }],
        },
      },
      include: { participants: true },
    });
  }

  async conversationGetOrCreateForGroup(groupIds: number[], userId: number) {}
}
