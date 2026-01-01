import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EventService } from './event.service';
import {
  ReqEventCreateDraftDto,
  ReqEventDeleteDto,
  ReqEventGetByIdDto,
  ReqEventGetPublishedDto,
  ReqEventPatchDto,
  ResEventCreateDraftSchema,
  ResEventDeleteSchema,
  ResEventGetByIdSchema,
  ResEventGetPublishedSchema,
  ResEventPatchSchema,
} from './event.schema';
import { ZodSerializerDto } from 'nestjs-zod';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // Post a new event draft
  @Post()
  @ZodSerializerDto(ResEventCreateDraftSchema)
  eventCreateDraft(@Body() data: ReqEventCreateDraftDto) {
    return this.eventService.eventCreateDraft(data);
  }

  // Delete an event
  @Delete(':id')
  @ZodSerializerDto(ResEventDeleteSchema)
  eventDelete(@Param() param: ReqEventDeleteDto) {
    return this.eventService.eventDelete({ id: param.id });
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
  @ZodSerializerDto(ResEventPatchSchema)
  eventPatch(@Body() data: ReqEventPatchDto, @Param() param: ReqEventGetByIdDto) {
    return this.eventService.eventPatch(param.id, data);
  }
}
