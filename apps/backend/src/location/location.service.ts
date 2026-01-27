import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ReqLocationPostDto, ReqLocationGetAllDto } from '@/location/location.schema';
import { locationEncodeCursor, locationCursorFilter } from './location.utils';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async locationGet(input: ReqLocationGetAllDto) {
    const cursorFilter = locationCursorFilter(input);
    const { limit } = input;

    const locations = await this.prisma.location.findMany({
      where: cursorFilter,
      include: {
        events: true,
      },
      orderBy: [{ name: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
      take: limit + 1,
    });

    const hasMore = locations.length > limit;
    const slicedData = hasMore ? locations.slice(0, limit) : locations;

    return {
      data: slicedData,
      pagination: {
        nextCursor: hasMore
          ? locationEncodeCursor(
              slicedData[slicedData.length - 1].name,
              slicedData[slicedData.length - 1].id
            )
          : null,
        hasMore,
      },
    };
  }

  locationPost(data: ReqLocationPostDto) {
    return this.prisma.location.create({
      data: {
        name: data.name,
        city: data.city,
        country: data.country,
        longitude: data.longitude,
        latitude: data.latitude,
        isPublic: data.isPublic,
        author: {
          connect: { id: data.authorId },
        },
      },
      include: {
        author: true,
        events: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async locationDelete(where: { id: number }) {
    const exist = await this.locationExists(where.id);
    if (!exist) {
      throw new NotFoundException(`Location with id ${String(where.id)} not found`);
    }

    return this.prisma.location.delete({
      where,
      include: {
        author: true,
        events: true,
      },
    });
  }

  async locationExists(id: number) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!location;
  }
}
