import { Body, Controller, Get, Post, UseGuards, Query } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/guards/get-user.decorator';
import { ResConversationSingleIdSchema } from '@grit/schema';
import { ZodSerializerDto } from 'nestjs-zod';
import { ReqConversationCreateDto } from './conversation.schema';

@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResConversationSingleIdSchema)
  conversationCreate(@Body() data: ReqConversationCreateDto, @GetUser('id') userId: number) {
    return this.conversationService.conversationGetOrCreate(data, userId);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  conversationGetMany(
    @GetUser('id') userId: number,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string
  ) {
    return this.conversationService.conversationGetMany(userId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }
}
