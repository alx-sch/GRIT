import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ReqUserPostDto, ResUserPostDto, ResUserBaseDto } from './user.schema';
import { StorageService } from '@/storage/storage.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService
  ) {}

  async userGet(): Promise<ResUserBaseDto[]> {
    return await this.prisma.user.findMany();
  }

  async userPost(data: ReqUserPostDto): Promise<ResUserPostDto> {
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        avatarKey: data.avatarKey,
      },
    });
    return user;
  }

  async userUpdateAvatar(userId: number, file: Express.Multer.File): Promise<ResUserBaseDto> {
    const bucket = 'user-avatars';
    let newBucketKey: string | null = null;

    // Find the current user to check for an existing avatar
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true },
    });

    try {
      // Upload the new file to MinIO
      newBucketKey = await this.storage.uploadFile(file, bucket);

      // Update the database with the new key
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { avatarKey: newBucketKey },
      });

      // Cleanup: If there was an old avatar, delete it from MinIO
      if (currentUser?.avatarKey && currentUser.avatarKey !== newBucketKey) {
        try {
          await this.storage.deleteFile(currentUser.avatarKey, bucket);
        } catch (error) {
          console.error(`Failed to cleanup old avatar: ${currentUser.avatarKey}`, error);
        }
      }
      return updatedUser;
    } catch (error) {
      // ROLLBACKL: If file uploaded, but DP update failed, delete orphaned file
      if (newBucketKey) {
        console.warn(`DB Update failed. Rolling back storage: deleting ${newBucketKey}`);
        await this.storage.deleteFile(newBucketKey, bucket);
      }
      throw error;
    }
  }
}
