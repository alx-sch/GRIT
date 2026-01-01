import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@generated/client/client';
import { ReqEventGetPublishedDto, ReqEventPostDraftDto, ReqEventPatchDto } from './event.schema';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  eventDelete(where: { id: number }) {
    return this.prisma.event.delete({
      where,
      include: { author: true },
    });
  }

  eventGetPublished(input: ReqEventGetPublishedDto) {
    const where: Prisma.EventWhereInput = {
      isPublished: true,
    };
    if (input.search) {
      where.OR = [{ title: { contains: input.search } }, { content: { contains: input.search } }];
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
      },
    });
  }

  async eventGetById(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { author: true },
    });
    if (!event) {
      throw new NotFoundException(`Event with id ${id.toString()} not found`);
    }
    return event;
  }

  eventPatch(id: number, data: ReqEventPatchDto) {
    const newData: Prisma.EventUpdateInput = {};
    if (data.content !== undefined) newData.content = data.content;
    if (data.endAt !== undefined) newData.endAt = data.endAt;
    if (data.isPublic !== undefined) newData.isPublic = data.isPublic;
    if (data.isPublished !== undefined) newData.isPublished = data.isPublished;
    if (data.startAt !== undefined) newData.startAt = data.startAt;
    if (data.title !== undefined) newData.title = data.title;

    if (Object.keys(newData).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    return this.prisma.event.update({
      where: { id },
      data: newData,
      include: { author: true },
    });
  }

  eventPostDraft(data: ReqEventPostDraftDto) {
    return this.prisma.event.create({
      data: {
        title: data.title,
        content: data.content,
        startAt: data.startAt,
        endAt: data.endAt,
        isPublic: data.isPublic,
        isPublished: false,
        author: {
          connect: { id: data.authorId },
        },
      },
      include: { author: true },
    });
  }
}
