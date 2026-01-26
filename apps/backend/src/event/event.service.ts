import { Prisma } from '@prisma/client';
import { LocationService } from '@/location/location.service';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { ReqEventGetPublishedDto, ReqEventPatchDto, ReqEventPostDraftDto } from './event.schema';
import {
  encodeCursor,
  decodeCursor,
  eventSearchFilter,
  eventCursorFilter,
} from '@/event/event.utils';

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private locationService: LocationService
  ) {}

  async eventDelete(id: number, userId: number) {
    const exists = await this.eventExists(id);

    if (!exists) {
      throw new NotFoundException(`Event with id ${id.toString()} not found`);
    }
    try {
      return await this.prisma.event.delete({
        where: {
          id,
          authorId: userId,
        },
        include: {
          author: true,
          location: true,
        },
      });
    } catch {
      throw new UnauthorizedException(`No permission to delete event with id ${id.toString()}.`);
    }
  }

  async eventGetPublished(input: ReqEventGetPublishedDto) {
    const where: Prisma.EventWhereInput = eventSearchFilter(input); // event.utils.ts
    let cursorFilter = eventCursorFilter(input); // event.utils.ts

    const finalWhere = { ...where, ...cursorFilter };
    const { limit } = input;

    const events = await this.prisma.event.findMany({
      where: finalWhere,
      include: {
        author: true,
        location: true,
        attending: true,
      },
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
      take: limit + 1,
    });

    const hasMore = events.length > limit;
    const slice = hasMore ? events.slice(0, limit) : events;

    return {
      data: slice,
      pagination: {
        nextCursor: hasMore
          ? encodeCursor(slice[slice.length - 1].startAt!, slice[slice.length - 1].id)
          : null,
        hasMore,
      },
    };
  }

  async eventGetById(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        author: true,
        location: true,
        attending: true,
      },
    });
    if (!event) {
      throw new NotFoundException(`Event with id ${id.toString()} not found`);
    }
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

    try {
      return await this.prisma.event.update({
        where: { id, authorId: userId },
        data: newData,
        include: {
          author: true,
          location: true,
        },
      });
    } catch {
      throw new NotFoundException(`Event not found or no permission to update it.`);
    }
  }

  async eventPostDraft(data: ReqEventPostDraftDto & { authorId: number }) {
    return await this.prisma.event.create({
      data: {
        title: data.title,
        content: data.content,
        startAt: data.startAt,
        endAt: data.endAt,
        isPublic: data.isPublic,
        isPublished: data.isPublished,
        imageKey: data.imageKey,
        author: {
          connect: { id: data.authorId },
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
  }

  async eventExists(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!event;
  }
}
