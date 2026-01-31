import { Module } from '@nestjs/common';
import { ChatGateway } from '@/chat/chat.gateway';
import { AuthModule } from '@/auth/auth.module';
import { UserModule } from '@/user/user.module';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule, UserModule],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
