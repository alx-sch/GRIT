import { MailModule } from '@/mail/mail.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { Module } from '@nestjs/common';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ChatModule } from '@/chat/chat.module';

@Module({
  imports: [PrismaModule, MailModule, ChatModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
