import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventService } from './event.service';
import {
  ReqEventDeleteDto,
  ReqEventGetByIdDto,
  ReqEventGetPublishedDto,
  ReqEventPatchDto,
  ReqEventPostDraftDto,
  ResEventDeleteSchema,
  ResEventGetByIdSchema,
  ResEventGetPublishedSchema,
  ResEventPatchSchema,
  ResEventPostDraftSchema,
} from './event.schema';
import { ZodSerializerDto } from 'nestjs-zod';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/guards/get-user.decorator';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // Delete an event
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResEventDeleteSchema)
  eventDelete(@Param() param: ReqEventDeleteDto, @GetUser('id') userId: number) {
    return this.eventService.eventDelete(param.id, userId);
  }

  // Get an individual event by id
  @Get(':id')
  @ZodSerializerDto(ResEventGetByIdSchema)
  eventGetById(@Param() param: ReqEventGetByIdDto) {
    return this.eventService.eventGetById(param.id);
  }

  // Get all published events or search published events
  @Get()
  @ZodSerializerDto(ResEventGetPublishedSchema)
  eventGetPublished(@Query() query: ReqEventGetPublishedDto) {
    return this.eventService.eventGetPublished(query);
  }

  // Patch an event (Update)
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResEventPatchSchema)
  eventPatch(
    @Body() data: ReqEventPatchDto,
    @Param() param: ReqEventGetByIdDto,
    @GetUser('id') userId: number
  ) {
    return this.eventService.eventPatch(param.id, data, userId);
  }

  // Post a new event draft
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResEventPostDraftSchema)
  eventCreateDraft(@Body() data: ReqEventPostDraftDto, @GetUser('id') userId: number) {
    return this.eventService.eventPostDraft(Object.assign(data, { authorId: userId }));
  }
}
