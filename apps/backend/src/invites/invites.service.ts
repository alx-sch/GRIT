import { PrismaService } from '@/prisma/prisma.service';
import { EventService } from '@/event/event.service';
import { ChatService } from '@/chat/chat.service';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InviteStatus } from '@grit/schema';
import { env } from '@/config/env';
import { randomUUID } from 'crypto';

@Injectable()
export class InvitesService {
  constructor(
    private prisma: PrismaService,
    private eventService: EventService,
    private chatService: ChatService
  ) {}

  /**
   * Send an event invite to a friend.
   * @param senderId User who sends invite
   * @param receiverId User who receives invite
   * @param eventId Event
   */
  async sendInvite(senderId: number, receiverId: number, eventId: number) {
    // Check if inviting self
    if (senderId === receiverId) throw new ForbiddenException('You can not invite yourself.');

    // Check if receiving user exists
    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) throw new NotFoundException('Receiving user does not exist');

    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { authorId: true, isPublic: true },
    });
    if (!event) throw new NotFoundException('Event does not exist');

    // Check if sender is event owner (only if private event)
    if (event.authorId !== senderId && !event.isPublic) {
      throw new ForbiddenException('Only event owner can send invites for private events');
    }

    // Check if the users are friends
    const friendship = await this.prisma.friends.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: receiverId },
          { userId: receiverId, friendId: senderId },
        ],
      },
    });
    if (!friendship) {
      throw new ForbiddenException('You can only invite friends');
    }

    // Check invite doesn't already exist
    const existingInvite = await this.prisma.eventInvite.findUnique({
      where: { eventId_receiverId: { eventId, receiverId } },
    });
    if (existingInvite) {
      throw new ConflictException('Invite already exists between these users');
    }

    // Create invite
    const invite = await this.prisma.eventInvite.create({
      data: {
        eventId,
        senderId,
        receiverId,
        status: InviteStatus.PENDING,
      },
      include: {
        event: { select: { id: true, title: true, imageKey: true } },
        sender: { select: { id: true, name: true, avatarKey: true } },
        receiver: { select: { id: true, name: true, avatarKey: true } },
      },
    });

    try {
      await this.sendInviteMessage(senderId, receiverId, invite.event.title, eventId);
    } catch (error) {
      console.error('Failed to send invite message:', error);
    }

    return invite;
  }

  /*
   *
   * Helper function to send automatic DIRECT chat message when inviting to an event.
   */
  private async sendInviteMessage(
    senderId: number,
    receiverId: number,
    eventTitle: string,
    eventId: number
  ) {
    // Find or create conversation between sender and receiver
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        participants: {
          every: {
            userId: { in: [senderId, receiverId] },
          },
        },
        AND: {
          participants: {
            some: { userId: senderId },
          },
        },
      },
    });

    // If no conversation exists, create one
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          type: 'DIRECT',
          createdBy: senderId,
          participants: {
            createMany: {
              data: [{ userId: senderId }, { userId: receiverId }],
            },
          },
        },
      });
    } else {
      // Ensure receiver is a participant
      await this.prisma.conversationParticipant.upsert({
        // Upsert tries to update, if it doesn't exist, it creates.
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId: receiverId,
          },
        },
        // If it doesn't exist -> create.
        create: {
          conversationId: conversation.id,
          userId: receiverId,
        },
        // If it exsists -> update.
        update: {},
      });
    }

    // Create base URL depending on production / development
    const frontendUrl =
      env.NODE_ENV === 'production' ? 'https://grit.social' : 'http://localhost:5173';
    const eventUrl = `${frontendUrl}/events/${String(eventId)}`;

    // Send automated message
    const messageId = randomUUID();
    await this.chatService.saveMessage({
      id: messageId,
      conversationId: conversation.id,
      authorId: senderId,
      text: `I'm inviting you to "${eventTitle}"! Check it out: ${eventUrl}`,
    });
  }

  /**
   * Accept or decline an invite
   * @param id Event invite ID
   * @param userId Current user
   * @param status ACCEPTED, DECLINED or PENDING
   */
  async updateInvite(id: string, userId: number, status: InviteStatus) {
    const invite = await this.prisma.eventInvite.findUnique({
      where: { id },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.receiverId !== userId) {
      throw new ForbiddenException('Only receiver can accept/decline this invite');
    }

    // If accepted, add to attendees + conversation
    if (status === InviteStatus.ACCEPTED) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Add to attendees
          await tx.eventAttendee.create({
            data: {
              eventId: invite.eventId,
              userId: invite.receiverId,
            },
          });

          // Add to conversation
          const event = await tx.event.findUnique({
            where: { id: invite.eventId },
            select: {
              conversation: { select: { id: true } },
            },
          });

          if (event?.conversation) {
            await tx.conversationParticipant.upsert({
              where: {
                conversationId_userId: {
                  conversationId: event.conversation.id,
                  userId: invite.receiverId,
                },
              },
              create: {
                conversationId: event.conversation.id,
                userId: invite.receiverId,
              },
              update: {},
            });
          }
          await tx.eventInvite.delete({ where: { id } });
        });
      } catch {
        throw new ConflictException('You are already going to this event.');
      }
    }

    // If declined, ALWAYS delete (both private + public)
    if (status === InviteStatus.DECLINED) {
      return await this.prisma.eventInvite.delete({
        where: { id },
        include: {
          event: { select: { id: true, title: true, imageKey: true, isPublic: true } },
          sender: { select: { id: true, name: true, avatarKey: true } },
          receiver: { select: { id: true, name: true, avatarKey: true } },
        },
      });
    }

    return await this.prisma.eventInvite.findUnique({
      where: { id },
      include: {
        event: { select: { id: true, title: true, imageKey: true, isPublic: true } },
        sender: { select: { id: true, name: true, avatarKey: true } },
        receiver: { select: { id: true, name: true, avatarKey: true } },
      },
    });
  }

  /**
   * Deletes an event invite
   */
  async deleteInvite(id: string, userId: number) {
    const eventInvite = await this.prisma.eventInvite.findUnique({ where: { id } });

    if (!eventInvite) throw new NotFoundException('Invite does not exist');

    if (eventInvite.senderId !== userId && eventInvite.receiverId !== userId)
      throw new ForbiddenException('You can not delete an invite you are not part of.');

    return await this.prisma.eventInvite.delete({
      where: { id },
      include: {
        event: { select: { id: true, title: true, imageKey: true, isPublic: true } },
        sender: { select: { id: true, name: true, avatarKey: true } },
        receiver: { select: { id: true, name: true, avatarKey: true } },
      },
    });
  }

  /**
   * List all incoming event invites
   * @returns An array of user's incoming event invites
   */
  async listIncoming(userId: number) {
    return await this.prisma.eventInvite.findMany({
      where: { receiverId: userId },
      include: {
        event: { select: { id: true, title: true, imageKey: true } },
        sender: { select: { id: true, name: true, avatarKey: true } },
        receiver: { select: { id: true, name: true, avatarKey: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
  }

  /**
   * List all outgoing event invites
   * @returns An array of user's outgoing event invites
   */
  async listOutgoing(userId: number, idOrSlug?: string) {
    let eventId: number | undefined;

    if (idOrSlug) {
      eventId = await this.eventService.resolveEventId(idOrSlug);
    }
    const invites = this.prisma.eventInvite.findMany({
      where: {
        senderId: userId,
        ...(eventId && { eventId }), // If eventId is defined -> also filter by eventId.
      },
      include: {
        event: { select: { id: true, title: true, imageKey: true } },
        sender: { select: { id: true, name: true, avatarKey: true } },
        receiver: { select: { id: true, name: true, avatarKey: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });

    return invites;
  }
}
