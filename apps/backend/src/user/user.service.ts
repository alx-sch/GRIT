import { Injectable, NotFoundException } from '@nestjs/common';
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

  async userGetById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id.toString()} not found`);
    }
    return user;
  }

  // This one to be called from AuthService.
  async userGetByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }
}
