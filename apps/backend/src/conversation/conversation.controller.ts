import { Body, Controller, UseGuards, Post } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/guards/get-user.decorator';

@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  // TODO Data validation
  conversationCreate(
    @Body() data: { type: string; eventId: number; directId: number; groupIds: number[] },
    @GetUser('id') userId: number
  ) {
    return this.conversationService.conversationGetOrCreate(data, userId);
  }
}
