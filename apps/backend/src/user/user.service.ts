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
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { userCursorFilter, userEncodeCursor } from './user.utils';
import { User } from '@/auth/interfaces/user.interface';
import { ChatGateway } from '@/chat/chat.gateway';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private mailService: MailService,
    private readonly chatGateway: ChatGateway
  ) {}

  async userGet(input: ReqUserGetAllDto) {
    const search = input.search?.trim();
    const cursorFilter = userCursorFilter(input);
    const searchFilter: Prisma.UserWhereInput = search
      ? {
          name: { contains: search, mode: 'insensitive' },
        }
      : {};

    const where: Prisma.UserWhereInput = {
      AND: [cursorFilter, searchFilter],
    };

    const { limit } = input;

    const users = await this.prisma.user.findMany({
      where: where,
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
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        attending: {
          include: {
            event: {
              include: { location: true },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      attending: user.attending.map((a) => ({
        id: a.event.id,
        title: a.event.title,
        slug: a.event.slug,
        startAt: a.event.startAt.toISOString(),
        isOrganizer: a.event.authorId === user.id,
        imageKey: a.event.imageKey,
        location: a.event.location,
      })),
    };
  }

  async userGetByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        attending: {
          include: { event: true },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      attending: user.attending.map((a) => ({
        id: a.event.id,
        title: a.event.title,
        slug: a.event.slug,
        startAt: a.event.startAt.toISOString(),
        isOrganizer: a.event.authorId === user.id,
      })),
    };
  }

  async userPost(data: ReqUserPostDto): Promise<ResUserPostDto> {
    const token = randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: await bcrypt.hash(data.password, 10),
        isConfirmed: false,
        confirmationToken: token,
      },
      include: {
        attending: true,
      },
    });

    try {
      await this.mailService.sendConfirmationEmail(user.email, token);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
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

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isConfirmed: true,
        confirmationToken: null,
      },
      include: {
        attending: {
          include: { event: true },
        },
      },
    });

    return {
      ...updatedUser,
      createdAt: updatedUser.createdAt.toISOString(),
      attending: updatedUser.attending.map((a) => ({
        id: a.event.id,
        title: a.event.title,
        slug: a.event.slug,
        startAt: a.event.startAt.toISOString(),
        isOrganizer: a.event.authorId === updatedUser.id,
      })),
    };
  }

  async userUpdateAvatar(userId: number, file: Express.Multer.File): Promise<ResUserBaseDto> {
    const bucket = 'user-avatars';
    let newBucketKey: string | null = null;

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true },
    });

    try {
      newBucketKey = await this.storage.uploadFile(file, bucket);

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

      if (currentUser?.avatarKey && currentUser.avatarKey !== newBucketKey) {
        try {
          await this.storage.deleteFile(currentUser.avatarKey, bucket);
        } catch (error) {
          console.error(`Failed to cleanup old avatar: ${currentUser.avatarKey}`, error);
        }
      }
      return {
        ...updatedUser,
        createdAt: updatedUser.createdAt.toISOString(),
        attending: updatedUser.attending.map((a) => ({
          id: a.event.id,
          title: a.event.title,
          slug: a.event.slug,
          startAt: a.event.startAt.toISOString(),
          isOrganizer: a.event.authorId === updatedUser.id,
        })),
      };
    } catch (error) {
      if (newBucketKey) {
        await this.storage.deleteFile(newBucketKey, bucket);
      }
      throw error;
    }
  }

  async userDeleteAvatar(userId: number): Promise<ResUserBaseDto> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, avatarKey: true },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    if (currentUser.avatarKey) {
      try {
        await this.storage.deleteFile(currentUser.avatarKey, 'user-avatars');
      } catch (error) {
        console.error(`Failed to delete old avatar: ${currentUser.avatarKey}`, error);
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarKey: null },
      include: {
        attending: {
          include: {
            event: true,
          },
        },
      },
    });

    return {
      ...updatedUser,
      createdAt: updatedUser.createdAt.toISOString(),
      attending: updatedUser.attending.map((a) => ({
        id: a.event.id,
        title: a.event.title,
        slug: a.event.slug,
        startAt: a.event.startAt.toISOString(),
        isOrganizer: a.event.authorId === updatedUser.id,
      })),
    };
  }

  async userPatch(userId: number, data: ReqUserPatchDto) {
    const newData: Prisma.UserUpdateInput = {};
    if (data.name !== undefined) newData.name = data.name;

    if (data.attending) {
      const attendingOps: Prisma.EventAttendeeUpdateManyWithoutUserNestedInput = {};
      const membershipOps: Prisma.ConversationParticipantUpdateManyWithoutUserNestedInput = {};

      if (data.attending.connect?.length) {
        const events = await this.prisma.event.findMany({
          where: { id: { in: data.attending.connect } },
          select: {
            id: true,
            conversation: { select: { id: true } },
          },
        });

        if (events.length !== data.attending.connect.length) {
          throw new NotFoundException('One or more events not found');
        }

        for (const event of events) {
          if (!event.conversation) {
            throw new Error(`Event ${String(event.id)} has no conversation`);
          }
        }

        attendingOps.create = events.map((e) => ({
          eventId: e.id,
        }));

        membershipOps.connectOrCreate = events.map((e) => ({
          where: {
            conversationId_userId: {
              // @ts-expect-error we validated above that conversation exists.
              conversationId: e.conversation.id,
              userId,
            },
          },
          create: {
            // @ts-expect-error we validated above that conversation exists.
            conversationId: e.conversation.id,
          },
        }));
      }

      if (data.attending.disconnect?.length) {
        const events = await this.prisma.event.findMany({
          where: { id: { in: data.attending.disconnect } },
          select: {
            id: true,
            conversation: { select: { id: true } },
          },
        });

        if (events.length !== data.attending.disconnect.length) {
          throw new NotFoundException('One or more events not found');
        }

        for (const event of events) {
          if (!event.conversation) {
            throw new Error(`Event ${String(event.id)} has no conversation`);
          }
        }

        attendingOps.deleteMany = data.attending.disconnect.map((eventId) => ({
          eventId,
          userId,
        }));

        membershipOps.deleteMany = events.map((e) => ({
          // @ts-expect-error we validated above that conversation exists.
          conversationId: e.conversation.id,
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
          include: {
            event: {
              include: { location: true },
            },
          },
        },
      },
    });

    // After updating the user we need to resync the chat rooms he is in
    await this.chatGateway.resyncUserRooms(userId);

    return {
      ...user_raw,
      createdAt: user_raw.createdAt.toISOString(),
      attending: user_raw.attending.map((a) => ({
        id: a.event.id,
        title: a.event.title,
        slug: a.event.slug,
        startAt: a.event.startAt.toISOString(),
        isOrganizer: a.event.authorId === userId,
        imageKey: a.event.imageKey,
        location: a.event.location,
      })),
    };
  }

  async userGetEvents(userId: number) {
    const events = await this.prisma.event.findMany({
      where: {
        attendees: {
          some: { userId: userId },
        },
      },
      include: {
        location: true,
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    return events.map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      startAt: e.startAt.toISOString(),
      isOrganizer: e.authorId === userId,
      imageKey: e.imageKey,
      location: e.location,
    }));
  }

  async userDeleteMe(user: User) {
    if (user.isAdmin) {
      throw new ForbiddenException('You can not delete an admin user');
    }
    const targetUser = await this.prisma.user.delete({
      where: { id: user.id },
    });
    return {
      ...targetUser,
      createdAt: targetUser.createdAt.toISOString(),
      attending: [],
    };
  }

  // ====== ADMIN SERVICES ======= //

  async userDeleteAvatarById(targetId: number, user: User) {
    if (user.id !== targetId && !user.isAdmin) {
      throw new UnauthorizedException('You do not have permission delete this avatar');
    }
    return this.userDeleteAvatar(targetId);
  }

  async userPatchById(targetId: number, data: ReqUserPatchDto, user: User) {
    if (user.id !== targetId && !user.isAdmin) {
      throw new UnauthorizedException('You do not have permission to modify this user');
    }
    return this.userPatch(targetId, data);
  }

  async userDelete(targetId: number, user: User) {
    if (user.id !== targetId) {
      if (!user.isAdmin)
        throw new UnauthorizedException('You do not have permission to delete this user');
    }
    if (targetId === user.id && user.isAdmin) {
      throw new ForbiddenException('You can not delete an admin user');
    }
    const targetUser = await this.prisma.user.delete({
      where: { id: targetId },
    });
    return {
      ...targetUser,
      createdAt: targetUser.createdAt.toISOString(),
      attending: [],
    };
  }
}
