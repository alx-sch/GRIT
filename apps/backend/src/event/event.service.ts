import { ChatGateway } from '@/chat/chat.gateway';
import {
  ReqEventGetPublishedDto,
  ReqEventPatchDto,
  ReqEventPostDraftDto,
} from '@/event/event.schema';
import {
  eventCursorFilter,
  eventEncodeCursor,
  eventGenerateSlug,
  eventSearchFilter,
} from '@/event/event.utils';
import { LocationService } from '@/location/location.service';
import { PrismaService } from '@/prisma/prisma.service';
import { StorageService } from '@/storage/storage.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConversationType, Prisma } from '@prisma/client';
import { User } from '@/auth/interfaces/user.interface';

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private locationService: LocationService,
    private storage: StorageService,
    private readonly chatGateway: ChatGateway
  ) {}

  /**
   * HELPER: Resolves an event ID from either a numeric ID string or a Slug.
   * Also checks if user has permission to delete event
   */
  async resolveEventId(idOrSlug: string): Promise<number> {
    const event = await this.prisma.event.findFirst({
      where: {
        OR: [{ slug: idOrSlug }, { id: isNaN(Number(idOrSlug)) ? undefined : Number(idOrSlug) }],
      },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundException(`Event "${idOrSlug}" not found`);
    }

    return event.id;
  }

  async eventDelete(idOrSlug: string, userId: number, isAdmin: boolean) {
    const eventId = await this.resolveEventId(idOrSlug);
    const eventData = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        authorId: true,
        attendees: true,
        conversation: true,
      },
    });
    if (eventData?.authorId !== userId && !isAdmin)
      throw new UnauthorizedException(`No permission to delete event with id ${idOrSlug}.`);

    if (!eventData) return;

    // We send a message to the people who might still be in the chat, that the chat was just deleted
    if (eventData.conversation)
      await this.chatGateway.handleConversationDeletion(eventData.conversation.id);

    // We delete the event we remove all user sockets from the room and send initial messages again
    await Promise.all(
      eventData.attendees.map((attendee) => this.chatGateway.resyncUserRooms(attendee.userId))
    );

    const deleted = await this.prisma.event.delete({
      where: {
        id: eventId,
      },
      include: {
        author: true,
        location: true,
        files: true,
      },
    });

    if (deleted.imageKey) {
      try {
        await this.storage.deleteFile(deleted.imageKey, 'event-images');
      } catch (error) {
        console.error(`Failed to delete event image with key ${deleted.imageKey}:`, error);
      }
    }
    for (const file of deleted.files) {
      try {
        await this.storage.deleteFile(file.fileKey, file.bucket);
      } catch (error) {
        console.error(`Failed to delete file ${file.fileKey}:`, error);
      }
    }
    return deleted;
  }

  async eventGetPublished(input: ReqEventGetPublishedDto, userId?: number) {
    // First two functions -----> event.utils.ts
    const where: Prisma.EventWhereInput = eventSearchFilter(input, userId);
    const cursorFilter = eventCursorFilter(input);
    const finalWhere = { ...where, ...cursorFilter, isPublished: true };
    const { limit, sort } = input;
    const orderByMap: Record<string, object[]> = {
      'date-asc': [{ startAt: 'asc' }, { id: 'asc' }],
      'date-dsc': [{ startAt: 'desc' }, { id: 'desc' }],
      'alpha-asc': [{ title: 'asc' }, { startAt: 'asc' }, { id: 'asc' }],
      'alpha-dsc': [{ title: 'desc' }, { startAt: 'asc' }, { id: 'asc' }],
      popularity: [{ attendeeCount: 'desc' }, { startAt: 'asc' }, { id: 'asc' }],
    };
    const orderBy = orderByMap[sort ?? 'date-asc'];

    const events_raw = await this.prisma.event.findMany({
      orderBy,
      where: finalWhere,
      include: {
        author: true,
        location: true,
        files: true,
        attendees: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarKey: true,
              },
            },
          },
        },
      },
      take: limit + 1,
    });

    const events = events_raw.map((event) => ({
      ...event,
      attendees: event.attendees.map((a) => a.user),
    }));

    const hasMore = events.length > limit;
    const slicedData = hasMore ? events.slice(0, limit) : events;

    return {
      data: slicedData,
      pagination: {
        nextCursor: hasMore
          ? eventEncodeCursor(
              slicedData[slicedData.length - 1].startAt,
              slicedData[slicedData.length - 1].id,
              sort ?? 'date-asc',
              slicedData[slicedData.length - 1].title,
              slicedData[slicedData.length - 1].attendees.length
            )
          : null,
        hasMore,
      },
    };
  }

  async eventGetAll(user: User) {
    if (!user.isAdmin)
      throw new UnauthorizedException('You do not have permission to access this.');
    return await this.prisma.event.findMany({
      orderBy: [{ isPublished: 'desc' }, { startAt: 'asc' }, { id: 'asc' }],
    });
  }

  async eventGetById(idOrSlug: string, userId?: number) {
    const eventId = await this.resolveEventId(idOrSlug);

    const event_raw = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        author: true,
        location: true,
        files: true,
        attendees: {
          select: {
            user: { select: { id: true, name: true, displayName: true, avatarKey: true } },
          },
        },
        conversation: { select: { id: true } },
        invites: {
          where: { receiverId: userId },
          select: { id: true },
        },
      },
    });

    if (!event_raw) {
      throw new NotFoundException(`Event "${idOrSlug}" not found`);
    }

    const isOwner = event_raw.authorId === userId;
    const isAttending = event_raw.attendees.some((a) => a.user.id === userId);
    const isInvited = event_raw.invites.length > 0;

    const hasAccess = // If any of these three lines evaluate to true, user has access:
      (event_raw.isPublished && event_raw.isPublic) || // If event published and public.
      (event_raw.isPublished && !event_raw.isPublic && (isOwner || isInvited || isAttending)) || // If event published and private, and user is owner, invited or attending.
      (!event_raw.isPublished && isOwner); // If event is not published and user is owner.

    if (!hasAccess) {
      if (!event_raw.isPublished)
        throw new NotFoundException('This event is under construction. Stay tuned!');
      throw new NotFoundException(`Event "${idOrSlug}" not found`);
    }

    return {
      ...event_raw,
      attendees: event_raw.attendees.map((a) => a.user),
      invites: undefined,
    };
  }

  async eventPatch(idOrSlug: string, data: ReqEventPatchDto, userId: number, isAdmin: boolean) {
    const newData: Prisma.EventUpdateInput = {};
    if (data.content !== undefined) newData.content = data.content;
    if (data.endAt !== undefined) newData.endAt = data.endAt;
    if (data.isPublic !== undefined) newData.isPublic = data.isPublic;
    if (data.isPublished !== undefined) newData.isPublished = data.isPublished;
    if (data.startAt !== undefined) newData.startAt = data.startAt;
    if (data.title !== undefined) newData.title = data.title; // Don't update slug

    if (data.locationId !== undefined) {
      if (data.locationId === null) {
        newData.location = { disconnect: true };
      } else {
        const exists = await this.locationService.locationExists(data.locationId);
        if (!exists) {
          throw new NotFoundException(`Location with id ${String(data.locationId)} not found`);
        }
        newData.location = { connect: { id: data.locationId } };
      }
    }

    if (Object.keys(newData).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const eventId = await this.resolveEventId(idOrSlug);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { authorId: true },
    });

    if (event?.authorId !== userId && !isAdmin)
      throw new UnauthorizedException('You can only modify your own events');

    return await this.prisma.event.update({
      where: { id: eventId },
      data: newData,
      include: {
        author: true,
        location: true,
        files: true,
      },
    });
  }

  async eventUpdateImage(
    idOrSlug: string,
    userId: number,
    isAdmin: boolean,
    file: Express.Multer.File
  ) {
    const eventId = await this.resolveEventId(idOrSlug);
    const bucket = 'event-images';
    let newBucketKey: string | null = null;

    // Verify ownership
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { authorId: true, imageKey: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.authorId !== userId && !isAdmin)
      throw new UnauthorizedException('You can only modify images as an event owner or admin.');

    try {
      // Upload new image
      newBucketKey = await this.storage.uploadFile(file, bucket);

      // Update the database with the new key
      const updatedEvent = await this.prisma.event.update({
        where: { id: eventId },
        data: { imageKey: newBucketKey },
        include: {
          author: true,
          location: true,
          files: true,
          attendees: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                  avatarKey: true,
                },
              },
            },
          },
        },
      });

      // Cleanup - delete old image from miniIO if exists
      if (event.imageKey && event.imageKey !== newBucketKey) {
        try {
          await this.storage.deleteFile(event.imageKey, bucket);
        } catch (error) {
          console.error(`Failed to cleanup old event image: ${event.imageKey}`, error);
        }
      }
      return {
        ...updatedEvent,
        attendees: updatedEvent.attendees.map((a) => a.user),
      };
    } catch (error) {
      // Rollback: delete file if DB update failed
      if (newBucketKey) {
        await this.storage.deleteFile(newBucketKey, bucket);
      }
      throw error;
    }
  }

  async eventDeleteImage(idOrSlug: string, userId: number, isAdmin: boolean) {
    const eventId = await this.resolveEventId(idOrSlug);
    // Verify ownership
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { authorId: true, imageKey: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.authorId !== userId && !isAdmin)
      throw new UnauthorizedException('You can only delete your own images');
    if (!event.imageKey) throw new BadRequestException('Event has no image');

    await this.storage.deleteFile(event.imageKey, 'event-images');
    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: { imageKey: null },
      include: {
        author: true,
        location: true,
        files: true,
        attendees: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarKey: true,
              },
            },
          },
        },
      },
    });
    return {
      ...updatedEvent,
      attendees: updatedEvent.attendees.map((a) => a.user),
    };
  }

  async eventUploadFile(
    idOrSlug: string,
    userId: number,
    isAdmin: boolean,
    file: Express.Multer.File
  ) {
    const eventId = await this.resolveEventId(idOrSlug);
    const bucket = 'event-files';
    let newFileKey: string | null = null;

    // Verify ownership
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { authorId: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.authorId !== userId && !isAdmin)
      throw new UnauthorizedException('You can only upload files to your own event.');

    try {
      // Upload new file
      newFileKey = await this.storage.uploadFile(file, bucket);
      await this.prisma.eventFile.create({
        data: {
          fileKey: newFileKey,
          bucket: bucket,
          mimeType: file.mimetype,
          fileName: file.originalname,
          eventId: eventId,
        },
      });

      // Update the database with the new key
      const updatedEvent = await this.prisma.event.findUniqueOrThrow({
        where: { id: eventId },
        include: {
          author: true,
          location: true,
          files: true,
          conversation: { select: { id: true } },
          attendees: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                  avatarKey: true,
                },
              },
            },
          },
        },
      });
      return {
        ...updatedEvent,
        attendees: updatedEvent.attendees.map((a) => a.user),
      };
    } catch (error) {
      // Rollback: delete file if DB update failed
      if (newFileKey) {
        await this.storage.deleteFile(newFileKey, bucket);
      }
      throw error;
    }
  }

  async eventDeleteFile(idOrSlug: string, userId: number, isAdmin: boolean, fileId: number) {
    const eventId = await this.resolveEventId(idOrSlug);
    // Verify ownership
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { authorId: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.authorId !== userId && !isAdmin)
      throw new UnauthorizedException('You can only delete files from your own events.');

    // Verify file exists and belongs to this event
    const file = await this.prisma.eventFile.findUnique({
      where: { id: fileId },
    });
    if (file?.eventId !== eventId) throw new NotFoundException('File not found');

    await this.storage.deleteFile(file.fileKey, file.bucket);
    await this.prisma.eventFile.delete({ where: { id: fileId } });

    const updatedEvent = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      include: {
        author: true,
        location: true,
        files: true,
        conversation: { select: { id: true } },
        attendees: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarKey: true,
              },
            },
          },
        },
      },
    });
    return {
      ...updatedEvent,
      attendees: updatedEvent.attendees.map((a) => a.user),
    };
  }

  async eventPostDraft(data: ReqEventPostDraftDto & { authorId: number }) {
    const duplicate = await this.prisma.event.findFirst({
      where: data,
    });
    if (duplicate) {
      throw new BadRequestException(`Identical event already exists`);
    }

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const slug = eventGenerateSlug(data.title);
        const createdEvent = await this.prisma.event.create({
          data: {
            title: data.title,
            slug: slug,
            content: data.content,
            startAt: data.startAt,
            endAt: data.endAt,
            isPublic: data.isPublic,
            isPublished: data.isPublished,
            imageKey: data.imageKey,
            attendeeCount: 1,
            attendees: {
              create: {
                userId: data.authorId,
              },
            },
            author: {
              connect: { id: data.authorId },
            },
            conversation: {
              create: {
                type: ConversationType.EVENT,
                createdBy: data.authorId,
                participants: {
                  create: [{ userId: data.authorId }],
                },
              },
            },
            ...(data.locationId
              ? {
                  location: {
                    connect: { id: data.locationId },
                  },
                }
              : {}),
          },
          include: {
            author: true,
            location: true,
          },
        });
        await this.chatGateway.resyncUserRooms(data.authorId);
        return createdEvent;
      } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            const target = error.meta?.target as string[] | undefined;
            if (target?.includes('slug')) {
              attempts++;
              continue;
            }
          }
        }
        throw error;
      }
    }
    throw new Error('Could not generate a unique event slug after multiple attempts.');
  }

  async eventExists(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!event;
  }
}
