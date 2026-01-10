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
import {
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/guards/get-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ZodSerializerDto([ResUserBaseDto])
  userGetAll() {
    return this.userService.userGet();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: ResUserPostDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Email already exists.',
  })
  @ZodSerializerDto(ResUserPostDto)
  userPost(@Body() data: ReqUserPostDto): Promise<ResUserPostDto> {
    return this.userService.userPost(data);
  }

  // ADD IMAGE UPLOAD ROUTINE
  @Patch('me/avatar')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update your profile picture',
    description:
      'Uploads an image to MinIO, updates the user record and deletes the old avatar from storage.',
  })
  @ZodSerializerDto(ResUserBaseDto)
  @ApiConsumes('multipart/form-data') // to send raw image file; not json
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Avatar updated successfully.', type: ResUserBaseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized: Missing or invalid JWT.' })
  @ApiResponse({ status: 413, description: 'File too large (Max 5MB).' })
  @ApiResponse({ status: 415, description: 'Unsupported Media Type (Only images allowed).' })
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtAuthGuard)
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB Limit
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      })
    )
    file: Express.Multer.File,
    @GetUser('id') userId: number
  ): Promise<ResUserBaseDto> {
    console.log('File received:', file.originalname);
    return await this.userService.userUpdateAvatar(userId, file);
  }
}
