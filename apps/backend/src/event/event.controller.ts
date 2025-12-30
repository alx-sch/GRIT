import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { EventService } from './event.service';
import { Event as EventModel } from '@generated/client/client';
import {
  ReqEventCreateDraftDto,
  ReqEventDeleteDto,
  ReqEventGetPublishedDto,
  ReqEventGetByIdDto,
  ReqEventPatchDto,
  ResEventGetByIdSchema,
  ResEventGetPublishedSchema,
} from './event.schema';
import { ZodSerializerDto } from 'nestjs-zod';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @ApiOperation({
    summary: 'List published events',
    description:
      'Returns all public events. Supports optional full-text search and date range filtering.',
  })
  @ZodSerializerDto(ResEventGetPublishedSchema)
  eventGetPublished(@Query() query: ReqEventGetPublishedDto) {
    return this.eventService.eventGetPublished(query);
  }

  @Get(':id')
  @ZodSerializerDto(ResEventGetByIdSchema)
  eventGetById(@Param() param: ReqEventGetByIdDto) {
    return this.eventService.eventGetById(param.id);
  }

  @Post()
  eventCreateDraft(@Body() data: ReqEventCreateDraftDto) {
    return this.eventService.eventCreateDraft(data);
  }

  @Patch(':id')
  eventPatch(@Body() data: ReqEventPatchDto, @Param() param: ReqEventGetByIdDto) {
    return this.eventService.eventPatch(param.id, data);
  }

  @Delete(':id')
  eventDelete(@Param() param: ReqEventDeleteDto) {
    return this.eventService.deleteEvent({ id: param.id });
  }
}
