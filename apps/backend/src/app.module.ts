import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { PrismaModule } from './prisma/prisma.module';
import { EventModule } from './event/event.module';

@Module({
  imports: [ConfigModule.forRoot(), UserModule, PostModule, PrismaModule, EventModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
