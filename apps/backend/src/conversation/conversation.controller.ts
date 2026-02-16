import { Body, Controller, Get, Post, UseFilters, UseGuards } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/guards/get-user.decorator';
import {
  type ReqConversationCreate,
  ResConversationSingleSchema,
  ResConversationSingleIdSchema,
} from '@grit/schema';
import { ZodSerializerDto } from 'nestjs-zod';

import { ArgumentsHost, Catch, WsExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Catch()
export class AllWsExceptionsFilter implements WsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();

    // Log full error for debugging
    console.error('WS Exception:', exception);

    if (exception instanceof WsException) {
      client.emit('error', {
        message: exception.message,
      });
      return;
    }

    if (exception instanceof Error) {
      client.emit('error', {
        message: exception.message,
      });
      return;
    }

    client.emit('error', {
      message: 'Internal server error',
    });
  }
}

@UseFilters(AllWsExceptionsFilter)
@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResConversationSingleIdSchema)
  // TODO Check again that validation works as expected
  async conversationCreate(@Body() data: ReqConversationCreate, @GetUser('id') userId: number) {
    const want = await this.conversationService.conversationGetOrCreate(data, userId);
    console.log(want);
    return want;
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  // TODO Serialize and Validate
  conversationGetMany(@GetUser('id') userId: number) {
    return this.conversationService.conversationGetMany(userId);
  }
}
