import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { IntChatMessageDto } from './chat.schema';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async save(message: IntChatMessageDto) {
    return this.prisma.chatMessage.upsert({
      where: { id: message.id },
      create: {
        id: message.id,
        eventId: message.eventId,
        authorId: message.authorId,
        text: message.text,
        sentAt: message.sentAt,
      },
      update: {},
    });
  }
}
