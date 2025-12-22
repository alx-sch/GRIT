import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Event, Prisma } from '../generated/prisma/client';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async event(eventWhereUniqueInput: Prisma.EventWhereUniqueInput): Promise<Event | null> {
    return this.prisma.event.findUnique({
      where: eventWhereUniqueInput,
    });
  }

  async events(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.EventWhereUniqueInput;
    where?: Prisma.EventWhereInput;
    orderBy?: Prisma.EventOrderByWithRelationInput;
  }): Promise<Event[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.event.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createEvent(data: Prisma.EventCreateInput): Promise<Event> {
    return this.prisma.event.create({
      data,
    });
  }

  async updateEvent(params: {
    where: Prisma.EventWhereUniqueInput;
    data: Prisma.EventUpdateInput;
  }): Promise<Event> {
    const { data, where } = params;
    return this.prisma.event.update({
      data,
      where,
    });
  }

  async deleteEvent(where: Prisma.EventWhereUniqueInput): Promise<Event> {
    return this.prisma.event.delete({
      where,
    });
  }
}
