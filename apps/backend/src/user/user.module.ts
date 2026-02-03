import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { EventModule } from '@/event/event.module';
import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [PrismaModule, EventModule, MailModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
