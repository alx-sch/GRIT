import { GetUser } from '@/auth/guards/get-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { JwtAuthOptionalGuard } from '@/auth/guards/jwt-auth-optional.guard';
import { ResEventBaseSchema, ResEventGetPublishedSchema } from '@grit/schema';
import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  ReqEventDeleteDto,
  ReqEventGetByIdDto,
  ReqEventGetPublishedDto,
  ReqEventPatchDto,
  ReqEventPostDraftDto,
  ResEventDeleteSchema,
  ResEventPatchSchema,
  ResEventPostDraftSchema,
  ResEventGetAllSchema,
} from './event.schema';
import { EventService } from './event.service';
import { User } from '@/auth/interfaces/user.interface';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // Delete an event
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResEventDeleteSchema)
  eventDelete(@Param() param: ReqEventDeleteDto, @GetUser() user: User) {
    return this.eventService.eventDelete(param.id, user.id, user.isAdmin);
  }

  // Get all published events or search published events
  @Get()
  @ZodSerializerDto(ResEventGetPublishedSchema)
  eventGetPublished(@Query() query: ReqEventGetPublishedDto) {
    return this.eventService.eventGetPublished(query);
  }

  // Admin -> Get ALL events
  @Get('admin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResEventGetAllSchema)
  eventGetAll(@GetUser() user: User) {
    return this.eventService.eventGetAll(user);
  }

  // Get event by ID (numeric) OR by Slug (string)
  @Get(':identifier')
  @UseGuards(JwtAuthOptionalGuard)
  @ZodSerializerDto(ResEventBaseSchema)
  async getEventByIdOrSlug(
    @Param('identifier') identifier: string,
    @GetUser('id') userId?: number
  ) {
    return this.eventService.eventGetById(identifier, userId);
  }

  // Patch an event (Update)
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResEventPatchSchema)
  eventPatch(
    @Body() data: ReqEventPatchDto,
    @Param() param: ReqEventGetByIdDto,
    @GetUser() user: User
  ) {
    return this.eventService.eventPatch(param.id, data, user.id, user.isAdmin);
  }

  // ADD Image upload routine
  @Patch(':id/upload-image')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResEventBaseSchema)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadEventImage(
    @Param() param: ReqEventGetByIdDto,
    @GetUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      })
    )
    file: Express.Multer.File
  ) {
    return await this.eventService.eventUpdateImage(param.id, user.id, user.isAdmin, file);
  }

  // Delete event image
  @Delete(':id/image')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResEventBaseSchema)
  async deleteEventImage(@Param() param: ReqEventDeleteDto, @GetUser() user: User) {
    return this.eventService.eventDeleteImage(param.id, user.id, user.isAdmin);
  }

  // Upload new documents (image or pdf)
  @Post(':id/files')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadEventFile(
    @Param() param: ReqEventGetByIdDto,
    @GetUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
          new FileTypeValidator({ fileType: /(image\/.+|application\/pdf)/ }),
        ],
      })
    )
    file: Express.Multer.File
  ) {
    return this.eventService.eventUploadFile(param.id, user.id, user.isAdmin, file);
  }

  // Delete documents (image or pdf)
  @Delete(':id/files/:fileId')
  @UseGuards(JwtAuthGuard)
  deleteEventFile(
    @Param('id', ParseIntPipe) eventId: number,
    @Param('fileId', ParseIntPipe) fileId: number,
    @GetUser() user: User
  ) {
    return this.eventService.eventDeleteFile(String(eventId), user.id, user.isAdmin, fileId);
  }

  // Post a new event draft
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResEventPostDraftSchema)
  eventCreateDraft(@Body() data: ReqEventPostDraftDto, @GetUser() user: User) {
    return this.eventService.eventPostDraft(Object.assign(data, { authorId: user.id }));
  }
}
