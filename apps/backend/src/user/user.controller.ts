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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReqUserPostDto } from './user.schema';
import { ResUserPostSchema, ResUserGetAllSchema, ResUserBaseSchema } from './user.schema';
import { UserService } from './user.service';
import { ZodSerializerDto } from 'nestjs-zod';
import { ApiConsumes, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ZodSerializerDto(ResUserGetAllSchema)
  @ApiOperation({ summary: 'List all users' })
  userGetAll() {
    return this.userService.userGet();
  }

  @Post()
  @ZodSerializerDto(ResUserPostSchema)
  @ApiOperation({ summary: 'Create a new user' })
  userPost(@Body() data: ReqUserPostDto) {
    return this.userService.userPost(data);
  }

  // ADD IMAGE UPLOAD ROUTINE
  @Patch('me/avatar')
  @ZodSerializerDto(ResUserBaseSchema)
  @ApiOperation({ summary: 'Upload and set user avatar' })
  @ApiConsumes('multipart/form-data') // to send raw image file; not json
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB Limit
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      })
    )
    file: Express.Multer.File
  ) {
    console.log('File received:', file.originalname);
  }
}
