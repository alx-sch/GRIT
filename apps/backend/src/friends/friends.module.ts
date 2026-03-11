import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { ChatModule } from '@/chat/chat.module';

@Module({
  imports: [PrismaModule, ChatModule],
  providers: [FriendsService],
  controllers: [FriendsController],
})
export class FriendsModule {}
