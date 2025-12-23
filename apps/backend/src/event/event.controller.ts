import { Controller, Get, Param, Post, Body, Put, Delete, Query } from '@nestjs/common';
import { EventService } from './event.service';
import { Event as EventModel } from '@generated/client/client';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get(':id')
  async getEventById(@Param('id') id: string): Promise<EventModel | null> {
    return this.eventService.event({ id: Number(id) });
  }

  /*
   The endpoints 'events' can deal as a search endpoint if the query string contains
   a search parameter e.g. /events?search=world
  */
  @Get()
  async getEvents(@Query('search') search?: string): Promise<EventModel[]> {
    if (search) return this.searchPublishedEvents(search);
    return this.getPublishedEvents();
  }

  private async getPublishedEvents(): Promise<EventModel[]> {
    return this.eventService.events({
      where: { published: true },
    });
  }

  private async searchPublishedEvents(searchString: string): Promise<EventModel[]> {
    return this.eventService.events({
      where: {
        OR: [
          {
            title: { contains: searchString },
          },
          {
            content: { contains: searchString },
          },
        ],
        AND: { published: true },
      },
    });
  }

  @Post()
  async createDraft(
    @Body() eventData: { title: string; content?: string; authorEmail: string }
  ): Promise<EventModel> {
    const { title, content, authorEmail } = eventData;
    return this.eventService.createEvent({
      title,
      content,
      author: {
        connect: { email: authorEmail },
      },
    });
  }

  @Put(':id/publish')
  async publishEvent(@Param('id') id: string): Promise<EventModel> {
    return this.eventService.updateEvent({
      where: { id: Number(id) },
      data: { published: true },
    });
  }

  @Delete(':id')
  async deleteEvent(@Param('id') id: string): Promise<EventModel> {
    return this.eventService.deleteEvent({ id: Number(id) });
  }
}
