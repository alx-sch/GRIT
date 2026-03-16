import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { LocationModule } from '@/location/location.module';
import { ConversationModule } from '@/conversation/conversation.module';
import { ChatModule } from '@/chat/chat.module';

@Module({
  imports: [PrismaModule, LocationModule, ConversationModule, ChatModule],
  providers: [EventService],
  controllers: [EventController],
  exports: [EventService],
})
export class EventModule {}
