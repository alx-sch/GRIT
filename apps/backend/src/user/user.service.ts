import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ReqUserPostDto, ReqUserAttendDto } from './user.schema';
import { Prisma } from '@/generated/client/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  userGet() {
    return this.prisma.user.findMany({
      include: {
        attending: true,
      },
    });
  }

  userPost(data: ReqUserPostDto) {
    return this.prisma.user.create({
      data,
    });
  }

  userAttend(id: number, data: ReqUserAttendDto) {
    const attendingIds = Array.isArray(data.attending) ? data.attending : [data.attending];

    return this.prisma.user.update({
      where: { id },
      data: {
        attending: {
          connect: attendingIds.map((id) => ({ id })),
        },
      },
      include: {
        attending: true,
        location: true,
        events: true,
      },
    });
  }
}
