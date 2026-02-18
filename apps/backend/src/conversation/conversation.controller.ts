import { Body, Controller, UseGuards, Post } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/guards/get-user.decorator';
import { type ConversationCreateReq, conversationResSchema } from '@grit/schema';
import { ZodSerializerDto } from 'nestjs-zod';

@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(conversationResSchema)
  conversationCreate(@Body() data: ConversationCreateReq, @GetUser('id') userId: number) {
    return this.conversationService.conversationGetOrCreate(data, userId);
  }
}
