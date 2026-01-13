import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ReqUserPostDto, ReqUserAttendDto } from './user.schema';
import { EventService } from '@/event/event.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private eventService: EventService
  ) {}

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

  async userAttend(id: number, data: ReqUserAttendDto) {
    const user = await this.prisma.user.findUnique({ where: { id: id } });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    const event = await this.eventService.eventExists(data.attending);
    if (!event) {
      throw new NotFoundException(`Event with id ${data.attending} not found`);
    }

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
      },
    });
  }
}
