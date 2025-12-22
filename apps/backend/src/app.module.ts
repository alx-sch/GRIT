import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UserModule } from './user/user.module.js';
import { PostModule } from './post/post.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { EventsModule } from './events/events.module.js';

@Module({
  imports: [ConfigModule.forRoot(), UserModule, PostModule, PrismaModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
