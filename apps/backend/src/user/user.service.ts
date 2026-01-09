import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ReqUserPostDto } from './user.schema';
import { StorageService } from '@/storage/storage.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService
  ) {}

  userGet() {
    return this.prisma.user.findMany();
  }

  userPost(data: ReqUserPostDto) {
    return this.prisma.user.create({
      data,
    });
  }

  async userUpdateAvatar(userId: number, file: Express.Multer.File) {
    const bucket = 'user-avatars';

    // 1. Upload to MinIO
    const dbPath: string = await this.storage.uploadFile(file, bucket);

    // 2. Update DB
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: dbPath },
    });
  }
}
