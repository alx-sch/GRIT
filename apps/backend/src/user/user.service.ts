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
  ConflictException,
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
      data: slicedData.map((user) => ({
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        avatarKey: user.avatarKey,
        bio: user.bio,
        city: user.city,
        country: user.country,
        createdAt: user.createdAt.toISOString(),
      })),
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

  async userGetByName(name: string) {
    // Normalize to lowercase for case-insensitive lookup (uses DB index!)
    const normalizedName = name.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { name: normalizedName },
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

  async userPost(data: ReqUserPostDto): Promise<ResUserPostDto> {
    const token = randomBytes(32).toString('hex');

    // Normalize username to lowercase for case-insensitive uniqueness
    const normalizedName = data.name.toLowerCase();

    // A hard-coded check (since we use the name 'Unknown' for deleted users).
    if (normalizedName === 'unknown') {
      throw new ConflictException('Name unknown is reserved for deleted users');
    }

    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    // Check if name already exists (case-insensitive via exact match on normalized value)
    const existingName = await this.prisma.user.findUnique({
      where: { name: normalizedName },
    });

    if (existingName) {
      throw new ConflictException('Username already taken');
    }

    const user = await this.prisma.user.create({
      data: {
        name: normalizedName,
        displayName: data.name, // Store original casing for display
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

    if (user.isConfirmed) {
      throw new ConflictException('Email already confirmed.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isConfirmed: true,
      },
    });

    return { success: true };
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
              event: {
                include: { location: true },
              },
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
          imageKey: a.event.imageKey,
          location: a.event.location,
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

    if (currentUser.avatarKey && !currentUser.avatarKey.startsWith('default-')) {
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
            event: {
              include: { location: true },
            },
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
        imageKey: a.event.imageKey,
        location: a.event.location,
      })),
    };
  }

  async userSetRandomAvatar(userId: number): Promise<ResUserBaseDto> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // Clean up old custom avatar if exists (but not default- avatars)
    if (currentUser.avatarKey && !currentUser.avatarKey.startsWith('default-')) {
      try {
        await this.storage.deleteFile(currentUser.avatarKey, 'user-avatars');
      } catch (error) {
        console.error(`Failed to delete old avatar: ${currentUser.avatarKey}`, error);
      }
    }

    // Generate a random seed for the avatar
    const randomSeed = randomBytes(16).toString('hex');
    const avatarKey = `default-${randomSeed}`;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarKey },
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

    return {
      ...updatedUser,
      createdAt: updatedUser.createdAt.toISOString(),
      attending: updatedUser.attending.map((a) => ({
        id: a.event.id,
        title: a.event.title,
        slug: a.event.slug,
        startAt: a.event.startAt.toISOString(),
        isOrganizer: a.event.authorId === updatedUser.id,
        imageKey: a.event.imageKey,
        location: a.event.location,
      })),
    };
  }

  async userPatch(userId: number, data: ReqUserPatchDto) {
    // Wrap everything in a transaction (if one call fails, then they all roll back - making every
    // call to the DB dependent on each other)
    return await this.prisma.$transaction(async (tx) => {
      const newData: Prisma.UserUpdateInput = {};

      if (data.name !== undefined) {
        // Normalize username to lowercase
        const normalizedName = data.name.toLowerCase();

        if (normalizedName === 'unknown') throw new ConflictException('Username already taken');

        // Check if name already exists (case-insensitive via normalized value)
        const existingName = await tx.user.findFirst({
          where: { name: normalizedName, id: { not: userId } },
        });

        if (existingName) {
          throw new ConflictException('Username already taken');
        }
        newData.name = normalizedName;
        newData.displayName = data.name; // Store original casing for display
      }
      if (data.bio !== undefined) newData.bio = data.bio;
      if (data.city !== undefined) newData.city = data.city;
      if (data.country !== undefined) newData.country = data.country;
      if (data.isProfilePublic !== undefined) newData.isProfilePublic = data.isProfilePublic;

      if (data.attending) {
        const attendingOps: Prisma.EventAttendeeUpdateManyWithoutUserNestedInput = {};
        const membershipOps: Prisma.ConversationParticipantUpdateManyWithoutUserNestedInput = {};

        if (data.attending.connect?.length) {
          const events = await tx.event.findMany({
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

          await tx.eventInvite.deleteMany({
            where: {
              eventId: { in: data.attending.connect },
              receiverId: userId,
            },
          });
        }

        if (data.attending.disconnect?.length) {
          const events = await tx.event.findMany({
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

      const user_raw = await tx.user.update({
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
    });
  }

  /**
   * Get events user is attending or owns
   * (Public events only)
   */
  async userGetEvents(userId: number) {
    const events = await this.prisma.event.findMany({
      where: {
        OR: [
          {
            attendees: {
              some: { userId: userId },
            },
          },
          {
            authorId: userId,
          },
        ],
      },
      include: {
        location: true,
        conversation: {
          select: {
            id: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarKey: true,
          },
        },
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
      endAt: e.endAt.toISOString(),
      isOrganizer: e.authorId === userId,
      imageKey: e.imageKey,
      location: e.location,
      conversationId: e.conversation?.id,
      isPublished: e.isPublished,
      isPublic: e.isPublic,
      author: e.author,
    }));
  }

  /**
   * Get events user is invited to
   * (Can be public or private)
   */
  async userGetInvitedEvents(userId: number) {
    const events = await this.prisma.event.findMany({
      where: {
        invites: {
          some: { receiverId: userId },
        },
      },
      include: {
        location: true,
        conversation: {
          select: {
            id: true,
          },
        },
        invites: {
          where: { receiverId: userId },
          select: {
            id: true,
            status: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarKey: true,
          },
        },
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
      endAt: e.endAt.toISOString(),
      isOrganizer: e.authorId === userId,
      imageKey: e.imageKey,
      location: e.location,
      conversationId: e.conversation?.id,
      isPublished: e.isPublished,
      isPublic: e.isPublic,
      author: e.author,
      invite: e.invites[0] ?? null,
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

  async userAdminGetAll(user: User) {
    if (!user.isAdmin)
      throw new UnauthorizedException('You do not have permission to access this.');
    const users = await this.prisma.user.findMany({
      orderBy: [{ isAdmin: 'desc' }, { name: 'asc' }],
    });
    return users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    }));
  }

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

    const isTargetAdmin = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { isAdmin: true },
    });
    if (isTargetAdmin?.isAdmin) {
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

  async userGetPublic(id: number, requestingUserId?: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        displayName: true,
        avatarKey: true,
        createdAt: true,
        bio: true,
        city: true,
        country: true,
        isProfilePublic: true,
      },
    });

    if (!user) {
      return null;
    }

    // If profile is private, only allow full access to:
    // 1. The user themselves
    // 2. Their friends
    // Otherwise, return minimal info so they can still send a friend request
    if (!user.isProfilePublic) {
      const isOwner = requestingUserId === id;
      let isFriend = false;

      if (requestingUserId && !isOwner) {
        const areFriends = await this.prisma.friends.findFirst({
          where: {
            OR: [
              { userId: requestingUserId, friendId: id },
              { userId: id, friendId: requestingUserId },
            ],
          },
        });
        isFriend = !!areFriends;
      }

      // If not owner and not friend, return minimal info
      if (!isOwner && !isFriend) {
        return {
          id: user.id,
          name: user.name,
          displayName: user.displayName,
          avatarKey: user.avatarKey,
          createdAt: user.createdAt.toISOString(),
          bio: null,
          city: null,
          country: null,
          isProfilePublic: false,
        };
      }
    }

    return {
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      avatarKey: user.avatarKey,
      createdAt: user.createdAt.toISOString(),
      bio: user.bio,
      city: user.city,
      country: user.country,
      isProfilePublic: user.isProfilePublic,
    };
  }

  async userGetPublicEvents(userId: number, requestingUserId?: number) {
    // First check if the user's profile is accessible
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isProfilePublic: true },
    });

    if (!user) {
      return null;
    }

    // If profile is private, check access permissions
    if (!user.isProfilePublic) {
      if (!requestingUserId || requestingUserId !== userId) {
        if (requestingUserId) {
          const areFriends = await this.prisma.friends.findFirst({
            where: {
              OR: [
                { userId: requestingUserId, friendId: userId },
                { userId, friendId: requestingUserId },
              ],
            },
          });
          if (!areFriends) {
            return null;
          }
        } else {
          return null;
        }
      }
    }

    const events = await this.prisma.event.findMany({
      where: {
        authorId: userId,
        isPublished: true,
        isPublic: true,
      },
      include: {
        location: true,
      },
      orderBy: {
        startAt: 'desc',
      },
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      startAt: event.startAt.toISOString(),
      imageKey: event.imageKey,
      location: event.location,
    }));
  }
}
