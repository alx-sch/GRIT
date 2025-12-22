import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [ConfigModule.forRoot(), UserModule, PostModule, PrismaModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
