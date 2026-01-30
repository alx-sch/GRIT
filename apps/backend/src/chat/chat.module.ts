import { Module } from '@nestjs/common';
import { ChatGateway } from '@/chat/chat.gateway';
import { AuthModule } from '@/auth/auth.module';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [AuthModule, UserModule],
  providers: [ChatGateway],
})
export class ChatModule {}
