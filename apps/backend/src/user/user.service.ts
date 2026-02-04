import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EventService } from '@/event/event.service';
import {
  ReqUserPostDto,
  ResUserPostDto,
  ResUserBaseDto,
  ReqUserAttendDto,
  ReqUserGetAllDto,
} from '@/user/user.schema';
import { StorageService } from '@/storage/storage.service';
import * as bcrypt from 'bcrypt';
import { userEncodeCursor, userCursorFilter } from './user.utils';
import { randomBytes } from 'crypto';
import { MailService } from '@/mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private eventService: EventService,
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

  async userAttend(id: number, data: ReqUserAttendDto) {
    const user = await this.prisma.user.findUnique({ where: { id: id } });
    if (!user) throw new NotFoundException(`User with id ${String(id)} not found`);

    const event = await this.eventService.eventExists(data.attending);
    if (!event) {
      throw new NotFoundException(`Event with id ${String(data.attending)} not found`);
    }

    const attendingIds: number[] = Array.isArray(data.attending)
      ? data.attending
      : [data.attending];

    return this.prisma.user.update({
      where: { id },
      data: {
        attending: {
          connect: attendingIds.map((id) => ({ id })),
        },
      },
      include: {
        attending: true,
      },
    });
  }
}
