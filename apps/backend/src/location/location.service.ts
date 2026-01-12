import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ReqLocationPostDto } from '@/location/location.schema';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  locationGet() {
    return this.prisma.location.findMany({
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
}
