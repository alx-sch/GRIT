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
import { ResUserBaseDto, ResUserPostDto, ReqUserPostDto } from '@/user/user.schema';
import { UserService } from '@/user/user.service';
import { ZodSerializerDto } from 'nestjs-zod';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ZodSerializerDto([ResUserBaseDto])
  userGetAll() {
    return this.userService.userGet();
  }

  @Post()
  @ZodSerializerDto(ResUserPostDto)
  userPost(@Body() data: ReqUserPostDto): Promise<ResUserPostDto> {
    return this.userService.userPost(data);
  }

  // ADD IMAGE UPLOAD ROUTINE
  @Patch('me/avatar')
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
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB Limit
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      })
    )
    file: Express.Multer.File
  ): Promise<ResUserBaseDto> {
    const userId = 1; // temp placeholder. GetUser decorator used here before
    console.log('File received:', file.originalname);
    return await this.userService.userUpdateAvatar(userId, file);
  }
}
