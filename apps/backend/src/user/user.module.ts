import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { StorageService } from '@/storage/storage.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, StorageService],
  exports: [UserService],
})
export class UserModule {}
