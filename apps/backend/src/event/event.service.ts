import {ConversationService} from '@/conversation/conversation.service';
import {ReqEventGetPublishedDto, ReqEventPatchDto, ReqEventPostDraftDto,} from '@/event/event.schema';
import {eventCursorFilter, eventEncodeCursor, eventSearchFilter} from '@/event/event.utils';
import {LocationService} from '@/location/location.service';
import {PrismaService} from '@/prisma/prisma.service';
import {StorageService} from '@/storage/storage.service';
import {BadRequestException, Injectable, NotFoundException, UnauthorizedException,} from '@nestjs/common';
import {ConversationType, Prisma} from '@prisma/client';

@Injectable()
export class EventService {
  constructor(
      private prisma: PrismaService, private locationService: LocationService,
      private storage: StorageService,
      private readonly conversation: ConversationService) {}

  async eventDelete(id: number, userId: number) {
    const exists = await this.eventExists(id);

    if (!exists) {
      throw new NotFoundException(`Event with id ${id.toString()} not found`);
    }
    try {
      const deleted = await this.prisma.event.delete({
        where: {
          id,
          authorId: userId,
        },
        include: {
          author: true,
          location: true,
        },
      });

      if (deleted.imageKey) {
        try {
          await this.storage.deleteFile(deleted.imageKey, 'event-images');
        } catch (error) {
          console.error(
              `Failed to delete event image with key ${deleted.imageKey}:`,
              error);
        }
      }
      return deleted;
    } catch {
      throw new UnauthorizedException(
          `No permission to delete event with id ${id.toString()}.`);
    }
  }

  async eventGetPublished(input: ReqEventGetPublishedDto) {
    // First two functions -----> event.utils.ts
    const where: Prisma.EventWhereInput = eventSearchFilter(input);
    const cursorFilter = eventCursorFilter(input);
    const finalWhere = {...where, ...cursorFilter};
    const {limit, sort} = input;
    const orderByMap: Record<string, object[]> = {
      'date-asc': [{startAt: 'asc'}, {id: 'asc'}],
      'date-dsc': [{startAt: 'desc'}, {id: 'desc'}],
      'alpha-asc': [{title: 'asc'}, {startAt: 'asc'}, {id: 'asc'}],
      'alpha-dsc': [{title: 'desc'}, {startAt: 'asc'}, {id: 'asc'}],
      popularity:
          [{attending: {_count: 'desc'}}, {startAt: 'asc'}, {id: 'asc'}],
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
              },
            },
          },
        },
      },
      take: limit + 1,
    });

    const events =
        events_raw.map((event) => ({
                         ...event,
                         attendees: event.attendees.map((a) => a.user),
                       }));

    const hasMore = events.length > limit;
    const slicedData = hasMore ? events.slice(0, limit) : events;

    return {
      data: slicedData,
      pagination: {
        nextCursor: hasMore ? eventEncodeCursor(
                                  slicedData[slicedData.length - 1].startAt,
                                  slicedData[slicedData.length - 1].id) :
                              null,
        hasMore,
      },
    };
  }

  async eventGetById(id: number) {
    const event_raw = await this.prisma.event.findUnique({
      where: {id},
      include: {
        author: true,
        location: true,
		files:true,
        attendees: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        conversation: {
          select: {id: true},
        },
      },
    });
    if (!event_raw) {
      throw new NotFoundException(`Event with id ${id.toString()} not found`);
    }
    const event = {
      ...event_raw,
      attendees: event_raw.attendees.map((a) => a.user),
    };
    return event;
  }

  async eventPatch(id: number, data: ReqEventPatchDto, userId: number) {
    const newData: Prisma.EventUpdateInput = {};
    if (data.content !== undefined) newData.content = data.content;
    if (data.endAt !== undefined) newData.endAt = data.endAt;
    if (data.isPublic !== undefined) newData.isPublic = data.isPublic;
    if (data.isPublished !== undefined) newData.isPublished = data.isPublished;
    if (data.startAt !== undefined) newData.startAt = data.startAt;
    if (data.title !== undefined) newData.title = data.title;

    if (data.locationId !== undefined) {
      if (data.locationId === null) {
        newData.location = {disconnect: true};
      } else {
        const exists =
            await this.locationService.locationExists(data.locationId);
        if (!exists) {
          throw new NotFoundException(
              `Location with id ${String(data.locationId)} not found`);
        }
        newData.location = {connect: {id: data.locationId}};
      }
    }

    if (Object.keys(newData).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    try {
      return await this.prisma.event.update({
        where: {id, authorId: userId},
        data: newData,
        include: {
          author: true,
          location: true,
		  files: true,
        },
      });
    } catch {
      throw new NotFoundException(
          `Event not found or no permission to update it.`);
    }
  }

  async eventUpdateImage(
      eventId: number, userId: number, file: Express.Multer.File) {
    const bucket = 'event-images';
    let newBucketKey: string|null = null;

    // Verify ownership
    const event = await this.prisma.event.findUnique({
      where: {id: eventId},
      select: {authorId: true, imageKey: true},
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.authorId !== userId) throw new UnauthorizedException();

    try {
      // Upload new image
      newBucketKey = await this.storage.uploadFile(file, bucket);

      // Update the database with the new key
      const updatedEvent = await this.prisma.event.update({
        where: {id: eventId},
        data: {imageKey: newBucketKey},
        include: {
          author: true,
          location: true,
		  files:true,
          attendees: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
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
          console.error(
              `Failed to cleanup old event image: ${event.imageKey}`, error);
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

  async eventDeleteImage(eventId: number, userId: number) {
    // Verify ownership
    const event = await this.prisma.event.findUnique({
      where: {id: eventId},
      select: {authorId: true, imageKey: true},
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.authorId !== userId) throw new UnauthorizedException();
    if (!event.imageKey) throw new BadRequestException('Event has no image');

    await this.storage.deleteFile(event.imageKey, 'event-images');
    const updatedEvent = await this.prisma.event.update({
      where: {id: eventId},
      data: {imageKey: null},
      include: {
        author: true,
        location: true,
		files:true,
        attendees: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
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
      eventId: number, userId: number, file: Express.Multer.File) {
    const bucket = 'event-files';
    let newFileKey: string|null = null;

    // Verify ownership
    const event = await this.prisma.event.findUnique({
      where: {id: eventId},
      select: {authorId: true},
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.authorId !== userId) throw new UnauthorizedException();

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
        }
      });

      // Update the database with the new key
      const updatedEvent = await this.prisma.event.findUniqueOrThrow({
        where: {id: eventId},
        include: {
          author: true,
          location: true,
          files: true,
          conversation: {select: {id: true}},
          attendees: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
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

  async eventDeleteFile(eventId: number, userId: number, fileId: number) {
    // Verify ownership
    const event = await this.prisma.event.findUnique({
      where: {id: eventId},
      select: {authorId: true},
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.authorId !== userId) throw new UnauthorizedException();

    // Verify file exists and belongs to this event
    const file = await this.prisma.eventFile.findUnique({
      where: {id: fileId},
    });
    if (!file || file.eventId !== eventId)
      throw new NotFoundException('File not found');

    await this.storage.deleteFile(file.fileKey, file.bucket);
    await this.prisma.eventFile.delete({where: {id: fileId}});

    const updatedEvent = await this.prisma.event.findUniqueOrThrow({
      where: {id: eventId},
      include: {
        author: true,
        location: true,
        files: true,
        conversation: {select: {id: true}},
        attendees: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
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

  async eventPostDraft(data: ReqEventPostDraftDto&{authorId: number}) {
    const createdEvent = await this.prisma.event.create({
      data: {
        title: data.title,
        content: data.content,
        startAt: data.startAt,
        endAt: data.endAt,
        isPublic: data.isPublic,
        isPublished: data.isPublished,
        imageKey: data.imageKey,
        attendees: {
          create: {
            userId: data.authorId,
          },
        },
        author: {
          connect: {id: data.authorId},
        },
        conversation: {
          create: {
            type: ConversationType.EVENT,
            createdBy: data.authorId,
            participants: {
              create: [{userId: data.authorId}],
            },
          },
        },
        ...(data.locationId ? {
          location: {
            connect: {id: data.locationId},
          },
        } :
                              {}),
      },
      include: {
        author: true,
        location: true,
      },
    });
    return createdEvent;
  }

  async eventExists(id: number) {
    const event = await this.prisma.event.findUnique({
      where: {id},
      select: {id: true},
    });
    return !!event;
  }
}
