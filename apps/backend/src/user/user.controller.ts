import {
  Body,
  Query,
  Controller,
  Get,
  Post,
  Patch,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ResUserBaseDto,
  ResUserPostDto,
  ReqUserPostDto,
  ResUserEventsDto,
  ReqUserGetAllDto,
  ResUserPatchSchema,
  ReqUserPatchDto,
  ReqUserDeleteByIdDto,
  ResUserDeleteSchema,
  ReqUserPatchByIdDto,
} from '@/user/user.schema';
import { UserService } from '@/user/user.service';
import { ZodSerializerDto } from 'nestjs-zod';
import { ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/guards/get-user.decorator';
import { ResUserGetAllSchema } from '@grit/schema';
import { User } from '@/auth/interfaces/user.interface';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Get all users
  @Get()
  @ZodSerializerDto(ResUserGetAllSchema)
  userGetAll(@Query() query: ReqUserGetAllDto) {
    return this.userService.userGet(query);
  }

  // Create new user
  @Post()
  @ZodSerializerDto(ResUserPostDto)
  userPost(@Body() data: ReqUserPostDto): Promise<ResUserPostDto> {
    return this.userService.userPost(data);
  }

  // User attend event
  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserPatchSchema)
  userPatchMe(@Body() data: ReqUserPatchDto, @GetUser('id') userId: number) {
    return this.userService.userPatch(userId, data);
  }

  // ADMIN -> edit a user by id
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserPatchSchema)
  userPatchById(
    @Param() param: ReqUserPatchByIdDto,
    @Body() data: ReqUserPatchDto,
    @GetUser() user: User
  ) {
    return this.userService.userPatchById(param.id, data, user);
  }

  // Delete logged in user
  @Delete('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserDeleteSchema)
  userDeleteMe(@GetUser() user: User) {
    return this.userService.userDeleteMe(user);
  }

  // ADMIN -> delete a user by id
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserDeleteSchema)
  userDelete(@Param() param: ReqUserDeleteByIdDto, @GetUser() user: User) {
    return this.userService.userDelete(param.id, user);
  }

  // ADD IMAGE UPLOAD ROUTINE
  @Patch('me/upload-avatar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserBaseDto)
  @ApiConsumes('multipart/form-data') // to send raw image file; not json
  @ApiBody({
    // Needed for file upload in Swagger
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @GetUser('id') userId: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      })
    )
    file: Express.Multer.File
  ): Promise<ResUserBaseDto> {
    console.log('File received:', file.originalname);
    return await this.userService.userUpdateAvatar(userId, file);
  }

  @Get('me/events')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserEventsDto)
  async getMyEvents(@GetUser('id') userId: number): Promise<ResUserEventsDto> {
    const events = await this.userService.userGetEvents(userId);

    return ResUserEventsDto.create(events);
  }
}
