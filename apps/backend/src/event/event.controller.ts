import {GetUser} from '@/auth/guards/get-user.decorator';
import {JwtAuthGuard} from '@/auth/guards/jwt-auth.guard';
import {ResEventBaseSchema, ResEventGetPublishedSchema} from '@grit/schema';
import {Body, Controller, Delete, FileTypeValidator, Get, MaxFileSizeValidator, Param, ParseFilePipe, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors,} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {ApiBearerAuth, ApiBody, ApiConsumes} from '@nestjs/swagger';
import {ZodSerializerDto} from 'nestjs-zod';

import {ReqEventDeleteDto, ReqEventGetByIdDto, ReqEventGetPublishedDto, ReqEventPatchDto, ReqEventPostDraftDto, ResEventDeleteSchema, ResEventGetByIdSchema, ResEventPatchSchema, ResEventPostDraftSchema,} from './event.schema';
import {EventService} from './event.service';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // Delete an event
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResEventDeleteSchema)
  eventDelete(
      @Param() param: ReqEventDeleteDto, @GetUser('id') userId: number) {
    return this.eventService.eventDelete(param.id, userId);
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResEventPatchSchema)
  eventPatch(
      @Body() data: ReqEventPatchDto, @Param() param: ReqEventGetByIdDto,
      @GetUser('id') userId: number) {
    return this.eventService.eventPatch(param.id, data, userId);
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
        file: {type: 'string', format: 'binary'},
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadEventImage(
      @Param() param: ReqEventGetByIdDto, @GetUser('id') userId: number,
      @UploadedFile(new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({maxSize: 1024 * 1024 * 5}),
          new FileTypeValidator({fileType: 'image/*'}),
        ],
      })) file: Express.Multer.File) {
    console.log('File received:', file.originalname);
    return await this.eventService.eventUpdateImage(param.id, userId, file);
  }

  // Delete event image
  @Delete(':id/image')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResEventBaseSchema)
  async deleteEventImage(
      @Param() param: ReqEventDeleteDto, @GetUser('id') userId: number) {
    return this.eventService.eventDeleteImage(param.id, userId);
  }

  // Upload new documents (image or pdf)
  @Post(':id/files')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadEventFile(
      @Param() param: ReqEventGetByIdDto, @GetUser('id') userId: number,
      @UploadedFile(new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({maxSize: 1024 * 1024 * 10}),
          new FileTypeValidator({fileType: /(image\/.+|application\/pdf)/}),
        ],
      })) file: Express.Multer.File) {
    return this.eventService.eventUploadFile(param.id, userId, file);
  }


  // Delete documents (image or pdf)
  @Delete(':id/files/:fileId')
  @UseGuards(JwtAuthGuard)
  deleteEventFile(
      @Param('id', ParseIntPipe) eventId: number,
      @Param('fileId', ParseIntPipe) fileId: number,
      @GetUser('id') userId: number,
  ) {
    return this.eventService.eventDeleteFile(eventId, userId, fileId);
  }
  // Post a new event draft
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResEventPostDraftSchema)
  eventCreateDraft(
      @Body() data: ReqEventPostDraftDto, @GetUser('id') userId: number) {
    return this.eventService.eventPostDraft(
        Object.assign(data, {authorId: userId}));
  }
}
