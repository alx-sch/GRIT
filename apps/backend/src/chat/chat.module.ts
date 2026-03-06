import { Module } from '@nestjs/common';
import { ChatGateway } from '@/chat/chat.gateway';
import { ChatService } from '@/chat/chat.service';

/**
 * Below we import JwtModule to check the token within the chat gateway directly and not via the auth
 * module to prevent circular dependencies.
 */

@Module({
  providers: [ChatGateway, ChatService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
