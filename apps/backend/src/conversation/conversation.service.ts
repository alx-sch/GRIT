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
      eventId: number;
      directId: number;
      groupIds: number[];
    },
    userId: number
  ) {
    if (data.type === 'EVENT') return this.conversationGetOrCreateForEvent(data.eventId, userId);
    if (data.type === 'DIRECT') return this.conversationGetOrCreateForDirect(data.directId, userId);
    if (data.type === 'GROUP') return this.conversationGetOrCreateForGroup(data.groupIds, userId);
    throw new Error('Data problem');
  }

  async conversationGetOrCreateForEvent(eventId: number, userId: number) {
    // Bail early if the user is not attending the event
    const eventData = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        attending: {
          some: {
            id: userId,
          },
        },
      },
    });
    if (!eventData) throw new ForbiddenException('You are not attending this event');
    // Check if the event conversation was already created and return it in case
    const existingConv = await this.prisma.conversation.findUnique({
      where: { eventId },
    });
    if (existingConv) return existingConv;
    // Otherwise create the EVENT conversation
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { authorId: true },
    });
    if (!event) throw new Error('Event not found, cannot create conversation');
    return this.prisma.conversation.upsert({
      where: { eventId },
      update: {},
      create: {
        type: ConversationType.EVENT,
        createdBy: event.authorId,
        eventId: eventId,
      },
    });
  }

  async conversationGetOrCreateForDirect(directId: number, userId: number) {
    // Bail early if the user wants to chat with himself.
    if (directId === userId) throw new Error('Chat with yourself');

    // Check if we already have a conversation with just these two and return it in case
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
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
