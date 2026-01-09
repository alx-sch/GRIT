import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ReqUserPostDto } from './user.schema';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  userGet() {
    return this.prisma.user.findMany();
  }

  userPost(data: ReqUserPostDto) {
    return this.prisma.user.create({
      data,
    });
  }
}
