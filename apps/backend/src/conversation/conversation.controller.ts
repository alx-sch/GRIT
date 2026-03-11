import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/guards/get-user.decorator';
import { type ReqConversationCreate, ResConversationSingleIdSchema } from '@grit/schema';
import { ZodSerializerDto } from 'nestjs-zod';

@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResConversationSingleIdSchema)
  conversationCreate(@Body() data: ReqConversationCreate, @GetUser('id') userId: number) {
    return this.conversationService.conversationGetOrCreate(data, userId);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  conversationGetMany(@GetUser('id') userId: number) {
    return this.conversationService.conversationGetMany(userId);
  }
}
