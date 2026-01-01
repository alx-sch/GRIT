import { ZodValidationPipe, ZodSerializerInterceptor, ZodSerializationException } from 'nestjs-zod';
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER, BaseExceptionFilter } from '@nestjs/core';
import { ZodError } from 'zod';
import {
  ArgumentsHost,
  Catch,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  Logger,
  Module,
  NotFoundException,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Prisma } from './generated/client/client';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { PrismaModule } from './prisma/prisma.module';
import { EventModule } from './event/event.module';

/**
 * Filter for NestJS's default error handling for enrichment with Zod and Prisma errors
 * HttpException = Zod errors, Prisma.PrismaClientKnownRequestError = Prisma errors
 */
@Catch(HttpException, Prisma.PrismaClientKnownRequestError)
class HttpExceptionFilter extends BaseExceptionFilter {
  private logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException | Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    // For Prisma we map the incoming internal prisma errors to meaningful errors for the client and throw those.
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') throw new NotFoundException('Record not found');
      if (exception.code === 'P2002') throw new ConflictException('Unique constraint violation');
      // We only log on the server in case we have an unexpected error
      this.logger.error(`Prisma error ${exception.code}`, JSON.stringify(exception.meta));
      throw new InternalServerErrorException('Database error');
    }

    // For Zod we simply log the error and hand it off to the BaseExceptionFilter base (super) class
    // The loggin should later probably reduced to only necessary errors.
    if (exception instanceof ZodSerializationException) {
      const zodError = exception.getZodError();
      if (zodError instanceof ZodError) {
        this.logger.error(`ZodSerializationException: ${zodError.message}`);
      }
    }

    // Hand off to normal error handling of base class
    super.catch(exception, host);
  }
}

@Module({
  imports: [ConfigModule.forRoot(), UserModule, EventModule, PostModule, PrismaModule],
  controllers: [AppController],
  providers: [
    // Zod integration for custom validation pipe. No need to add it individually to each route anymore.
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    // Zod integration for response serialization
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    // Exception handling for Zod and Prisma (see HttpExceptionFilter above)
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
