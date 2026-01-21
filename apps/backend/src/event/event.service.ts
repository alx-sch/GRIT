import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ReqEventGetPublishedDto, ReqEventPostDraftDto, ReqEventPatchDto } from './event.schema';
import { LocationService } from '@/location/location.service';

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private locationService: LocationService
  ) {}

  async eventDelete(id: number, userId: number) {
    const exists = await this.eventExists(where.id);

    if (!exists) {
      throw new NotFoundException(`Event with id ${where.id.toString()} not found`);
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
      throw new NotFoundException(`No permission to delete event with id ${where.id.toString()}.`);
    }
  }

  eventGetPublished(input: ReqEventGetPublishedDto) {
    const where: Prisma.EventWhereInput = {
      isPublished: true,
    };
    if (input.search) {
      where.OR = [
        { title: { contains: input.search, mode: 'insensitive' } },
        { content: { contains: input.search, mode: 'insensitive' } },
      ];
    }
    if (input.author_id) {
      where.authorId = input.author_id;
    }
    if (input.start_from || input.start_until) {
      where.startAt = {};
      if (input.start_from) where.startAt.gte = input.start_from;
      if (input.start_until) where.startAt.lte = input.start_until;
    }
    return this.prisma.event.findMany({
      where,
      include: {
        author: true,
        location: true,
        attending: true,
      },
      orderBy: {
        startAt: 'asc',
      },
    });
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
