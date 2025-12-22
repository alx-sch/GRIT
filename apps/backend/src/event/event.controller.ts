import { Controller, Get, Param, Post, Body, Put, Delete, Query } from '@nestjs/common';
import { EventService } from './event.service';
import { Event as EventModel } from '../generated/prisma/client';

@Controller()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get('events/:id')
  async getEventById(@Param('id') id: string): Promise<EventModel | null> {
    return this.eventService.event({ id: Number(id) });
  }

  /*
   The endpoints 'events' can deal as a search endpoint if the query string contains
   a search parameter e.g. /events?search=world
  */
  @Get('events')
  async getEvents(@Query('search') search?: string): Promise<EventModel[]> {
    if (search) return this.searchPublishedEvents(search);
    return this.getPublishedEvents();
  }

  async getPublishedEvents(): Promise<EventModel[]> {
    return this.eventService.events({
      where: { published: true },
    });
  }

  async searchPublishedEvents(searchString: string): Promise<EventModel[]> {
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

  @Post('events')
  async createDraft(
    @Body() postData: { title: string; content?: string; authorEmail: string }
  ): Promise<EventModel> {
    const { title, content, authorEmail } = postData;
    return this.eventService.createEvent({
      title,
      content,
      author: {
        connect: { email: authorEmail },
      },
    });
  }

  @Put('events/:id/publish')
  async publishPost(@Param('id') id: string): Promise<EventModel> {
    return this.eventService.updateEvent({
      where: { id: Number(id) },
      data: { published: true },
    });
  }

  @Delete('events/:id')
  async deletePost(@Param('id') id: string): Promise<EventModel> {
    return this.eventService.deleteEvent({ id: Number(id) });
  }
}
