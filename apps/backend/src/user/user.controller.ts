import { GetUser } from '@/auth/guards/get-user.decorator';
import { JwtAuthOptionalGuard } from '@/auth/guards/jwt-auth-optional.guard';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  ReqUserGetAllDto,
  ReqUserPatchDto,
  ReqUserPostDto,
  ResMyEventsDto,
  ResUserBaseDto,
  ResUserDeleteSchema,
  ResUserPatchSchema,
  ResUserPostDto,
} from '@/user/user.schema';
import { UserService } from '@/user/user.service';
import { ResUserGetAllSchema } from '@grit/schema';
import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';

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
  userPatch(@Body() data: ReqUserPatchDto, @GetUser('id') userId: number) {
    return this.userService.userPatch(userId, data);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserBaseDto)
  async getMe(@GetUser('id') userId: number): Promise<ResUserBaseDto> {
    const user = await this.userService.userGetById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  // Get user events
  @Get('me/events')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResMyEventsDto)
  async getMyEvents(@GetUser('id') userId: number) {
    return await this.userService.userGetEvents(userId);
  }
  // Delete a user
  @Delete('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserDeleteSchema)
  async userDelete(@GetUser('id') id: number) {
    return this.userService.userDelete(id);
  }

  // Delete avatar (reset to default)
  @Delete('me/avatar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserBaseDto)
  async deleteAvatar(@GetUser('id') userId: number): Promise<ResUserBaseDto> {
    return await this.userService.userDeleteAvatar(userId);
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

  @Get(':id')
  @UseGuards(JwtAuthOptionalGuard)
  async getUserById(@Param('id') id: string, @GetUser('id') requestingUserId?: number) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new NotFoundException('User not found');
    }
    const user = await this.userService.userGetPublic(userId, requestingUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Get(':id/events')
  @UseGuards(JwtAuthOptionalGuard)
  async getUserEvents(@Param('id') id: string, @GetUser('id') requestingUserId?: number) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new NotFoundException('User not found');
    }
    const events = await this.userService.userGetPublicEvents(userId, requestingUserId);
    if (events === null) {
      throw new NotFoundException('User not found');
    }
    return events;
  }
}
