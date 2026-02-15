import { MailService } from '@/mail/mail.service';
import { PrismaService } from '@/prisma/prisma.service';
import { StorageService } from '@/storage/storage.service';
import {
  ReqUserGetAllDto,
  ReqUserPatchDto,
  ReqUserPostDto,
  ResUserBaseDto,
  ResUserPostDto,
} from '@/user/user.schema';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

import { userCursorFilter, userEncodeCursor } from './user.utils';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private mailService: MailService
  ) {}

  async userGet(input: ReqUserGetAllDto) {
    const cursorFilter = userCursorFilter(input);
    const { limit } = input;

    const users = await this.prisma.user.findMany({
      where: cursorFilter,
      include: {
        attending: true,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limit + 1,
    });

    const hasMore = users.length > limit;
    const slicedData = hasMore ? users.slice(0, limit) : users;

    return {
      data: slicedData,
      pagination: {
        nextCursor: hasMore
          ? userEncodeCursor(
              slicedData[slicedData.length - 1].createdAt,
              slicedData[slicedData.length - 1].id
            )
          : null,
        hasMore,
      },
    };
  }

  async userGetById(id: number) {
    return await this.prisma.user.findUnique({
      where: { id },
      include: { attending: true },
    });
  }

  async userGetByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
      include: { attending: true },
    });
  }

  async userGetEvents(userId: number) {
    return this.prisma.event.findMany({
      where: {
        attendees: {
          some: {
            userId: userId,
          },
        },
      },
    });
  }

  async userIsAttendingEvent(userId: number, eventId: number): Promise<boolean> {
    const attendance = await this.prisma.eventAttendee.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    return !!attendance;
  }

  async userPost(data: ReqUserPostDto): Promise<ResUserPostDto> {
    const token = randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: await bcrypt.hash(data.password, 10),
        avatarKey: data.avatarKey,
        isConfirmed: false,
        confirmationToken: token,
      },
      include: {
        attending: true,
      },
    });

    // Send confirmation email
    try {
      await this.mailService.sendConfirmationEmail(user.email, token);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }

    return {
      ...user,
      attending: [],
      message: 'Registration successful. Please check your email to confirm your account.',
    };
  }

  async userConfirm(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { confirmationToken: token },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired confirmation token.');
    }

    return await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isConfirmed: true,
        confirmationToken: null, // Token is one-time use
      },
      include: {
        attending: true,
      },
    });
  }

  async userUpdateAvatar(userId: number, file: Express.Multer.File): Promise<ResUserBaseDto> {
    const bucket = 'user-avatars';
    let newBucketKey: string | null = null;

    // Find the current user to check for an existing avatar
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true },
    });

    try {
      // Upload the new file to MinIO
      newBucketKey = await this.storage.uploadFile(file, bucket);

      // Update the database with the new key
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { avatarKey: newBucketKey },
        include: {
          attending: {
            include: {
              event: true,
            },
          },
        },
      });

      // Cleanup: If there was an old avatar, delete it from MinIO
      if (currentUser?.avatarKey && currentUser.avatarKey !== newBucketKey) {
        try {
          await this.storage.deleteFile(currentUser.avatarKey, bucket);
        } catch (error) {
          console.error(`Failed to cleanup old avatar: ${currentUser.avatarKey}`, error);
        }
      }
      return {
        ...updatedUser,
        attending: updatedUser.attending.map((a) => a.event),
      };
    } catch (error) {
      // ROLLBACKL: If file uploaded, but DP update failed, delete orphaned file
      if (newBucketKey) {
        console.warn(`DB Update failed. Rolling back storage: deleting ${newBucketKey}`);
        await this.storage.deleteFile(newBucketKey, bucket);
      }
      throw error;
    }
  }

  async userPatch(userId: number, data: ReqUserPatchDto) {
    const newData: Prisma.UserUpdateInput = {};
    if (data.name !== undefined) newData.name = data.name;

    if (data.attending) {
      /**
       * Define operations we want to execute. These are types from the prisma client. The shape of the operations
       * include connect and delete keys which will be executed as commands
       */
      const attendingOps: Prisma.EventAttendeeUpdateManyWithoutUserNestedInput = {};
      const membershipOps: Prisma.ConversationParticipantUpdateManyWithoutUserNestedInput = {};

      // If data attending has information for connecting (attending). Naming is historical, we actually create now.
      if (data.attending.connect?.length) {
        // Get event data
        const events = await this.prisma.event.findMany({
          where: { id: { in: data.attending.connect } },
          select: {
            id: true,
            conversation: { select: { id: true } },
          },
        });

        // Making sure that events and their conversation data exists
        if (events.length !== data.attending.connect.length) {
          throw new NotFoundException('One or more events not found');
        }

        for (const event of events) {
          if (!event.conversation) {
            throw new Error(`Event ${event.id} has no conversation`);
          }
        }

        // Storing the changes in the operation objects
        attendingOps.create = events.map((e) => ({
          eventId: e.id,
        }));

        membershipOps.create = events.map((e) => ({
          conversationId: e.conversation!.id,
        }));
      }

      // If data attending has information for disconnecting (de-attending). Naming is historical, we actually create now.
      if (data.attending.disconnect?.length) {
        const events = await this.prisma.event.findMany({
          where: { id: { in: data.attending.disconnect } },
          select: {
            id: true,
            conversation: { select: { id: true } },
          },
        });

        // Making sure that events and their conversation data exists
        if (events.length !== data.attending.disconnect.length) {
          throw new NotFoundException('One or more events not found');
        }

        for (const event of events) {
          if (!event.conversation) {
            throw new Error(`Event ${event.id} has no conversation`);
          }
        }

        // Storing the changes in the operation objects
        attendingOps.deleteMany = data.attending.disconnect.map((eventId) => ({
          eventId,
          userId,
        }));

        membershipOps.deleteMany = events.map((e) => ({
          conversationId: e.conversation!.id,
          userId,
        }));
      }

      if (Object.keys(attendingOps).length) {
        newData.attending = attendingOps;
      }

      if (Object.keys(membershipOps).length) {
        newData.convMemberships = membershipOps;
      }
    }

    if (Object.keys(newData).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const user_raw = await this.prisma.user.update({
      where: { id: userId },
      data: newData,
      include: {
        attending: {
          select: {
            event: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    const user = {
      ...user_raw,
      attending: user_raw.attending.map((a) => ({
        title: a.event.title,
      })),
    };
    return user;
  }
}
