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
        attending: {
          some: {
            id: userId,
          },
        },
      },
    });
  }

  async userIsAttendingEvent(userId: number, eventId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        attending: {
          where: { id: eventId },
          select: { id: true },
        },
      },
    });

    if (!user) return false;
    return user.attending.length === 1;
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
        include: { attending: true },
      });

      // Cleanup: If there was an old avatar, delete it from MinIO
      if (currentUser?.avatarKey && currentUser.avatarKey !== newBucketKey) {
        try {
          await this.storage.deleteFile(currentUser.avatarKey, bucket);
        } catch (error) {
          console.error(`Failed to cleanup old avatar: ${currentUser.avatarKey}`, error);
        }
      }
      return updatedUser;
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
    if (data.attending !== undefined) {
      const attendingUpdate: Prisma.EventUpdateManyWithoutAttendingNestedInput = {};

      if (data.attending.connect?.length) {
        // Validate event exists
        for (const eventId of data.attending.connect) {
          const exists = await this.prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true },
          });
          if (!exists) {
            throw new NotFoundException(`Event with id ${String(eventId)} not found`);
          }
        }
        attendingUpdate.connect = data.attending.connect.map((id) => ({ id }));
      }
      if (data.attending.disconnect?.length) {
        attendingUpdate.disconnect = data.attending.disconnect.map((id) => ({ id }));
      }
      newData.attending = attendingUpdate;
    }

    if (Object.keys(newData).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: newData,
      include: { attending: true },
    });
  }
}
