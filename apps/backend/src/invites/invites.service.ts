import { PrismaService } from '@/prisma/prisma.service';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InviteStatus } from '@grit/schema';

@Injectable()
export class InvitesService {
  constructor(private prisma: PrismaService) {}

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

    // Check if sender is event owner
    if (event.authorId !== senderId) {
      throw new ForbiddenException('Only event owner can send invites');
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

    return invite;
  }
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

    const updatedInvite = await this.prisma.eventInvite.update({
      where: { id },
      data: { status },
      include: {
        event: { select: { id: true, title: true, imageKey: true, isPublic: true } },
        sender: { select: { id: true, name: true, avatarKey: true } },
        receiver: { select: { id: true, name: true, avatarKey: true } },
      },
    });

    // If accepted, add to attendees
    if (status === InviteStatus.ACCEPTED) {
      await this.prisma.eventAttendee.create({
        data: {
          eventId: invite.eventId,
          userId: invite.receiverId,
        },
      });
    }

    // If declined AND public -> delete event invite
    // Else -> keep event invite (so user still has access to see event)
    if (status === InviteStatus.DECLINED && updatedInvite.event.isPublic) {
      return await this.prisma.eventInvite.delete({
        where: { id },
        include: {
          event: { select: { id: true, title: true, imageKey: true, isPublic: true } },
          sender: { select: { id: true, name: true, avatarKey: true } },
          receiver: { select: { id: true, name: true, avatarKey: true } },
        },
      });
    }

    return updatedInvite;
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
  async listOutgoing(userId: number) {
    return await this.prisma.eventInvite.findMany({
      where: { senderId: userId },
      include: {
        event: { select: { id: true, title: true, imageKey: true } },
        sender: { select: { id: true, name: true, avatarKey: true } },
        receiver: { select: { id: true, name: true, avatarKey: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
  }
}
