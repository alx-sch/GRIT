import { Module } from '@nestjs/common';
import { EventService } from './event.service.js';
import { EventController } from './event.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [EventService],
  controllers: [EventController],
})
export class EventModule {}
