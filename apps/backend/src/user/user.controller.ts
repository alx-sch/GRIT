import { ResUserAttendSchema, ReqUserAttendDto } from './user.schema';
import {
  Body,
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResUserBaseDto, ResUserPostDto, ReqUserPostDto } from '@/user/user.schema';
import { UserService } from '@/user/user.service';
import { ZodSerializerDto } from 'nestjs-zod';
import { ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/guards/get-user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Get all users
  @Get()
  @ZodSerializerDto([ResUserBaseDto])
  userGetAll() {
    return this.userService.userGet();
  }

  // Create new user
  @Post()
  @ZodSerializerDto(ResUserPostDto)
  userPost(@Body() data: ReqUserPostDto): Promise<ResUserPostDto> {
    return this.userService.userPost(data);
  }

  // User attend event
  @Patch('attend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserAttendSchema)
  userAttend(@Body() data: ReqUserAttendDto, @GetUser('id') userId: number) {
    return this.userService.userAttend(userId, data);
  }

  // ADD IMAGE UPLOAD ROUTINE
  @Patch('me/avatar')
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
}
