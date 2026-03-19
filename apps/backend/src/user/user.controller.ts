import { GetUser } from '@/auth/guards/get-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { JwtAuthOptionalGuard } from '@/auth/guards/jwt-auth-optional.guard';
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
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ResUserBaseDto,
  ResUserPostDto,
  ReqUserPostDto,
  ReqUserGetAllDto,
  ReqUserPatchDto,
  ReqUserDeleteByIdDto,
  ReqUserPatchByIdDto,
  ReqUserDeleteAvatarDto,
  ResUserDeleteSchema,
  ResUserPatchSchema,
  ReqUserPublicEventsDto,
  ReqMyEventsDto,
} from '@/user/user.schema';
import { UserService } from '@/user/user.service';
import { ResUserGetAllSchema, ResUserAdminGetAllSchema } from '@grit/schema';
import { User } from '@/auth/interfaces/user.interface';
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
  userPatchMe(@Body() data: ReqUserPatchDto, @GetUser('id') userId: number) {
    return this.userService.userPatch(userId, data);
  }

  // Get user
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

  // Get user events — tab param selects upcoming | past | organizing | invited
  @Get('me/events')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMyEvents(@GetUser('id') userId: number, @Query() query: ReqMyEventsDto) {
    return await this.userService.userGetMyEvents(userId, query.tab, query.limit, query.cursor);
  }

  // Delete logged in user
  @Delete('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserDeleteSchema)
  userDeleteMe(@GetUser() user: User) {
    return this.userService.userDeleteMe(user);
  }

  // Delete avatar (reset to default)
  @Delete('me/avatar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserBaseDto)
  async deleteAvatar(@GetUser('id') userId: number): Promise<ResUserBaseDto> {
    return await this.userService.userDeleteAvatar(userId);
  }

  // Set random avatar
  @Post('me/random-avatar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserBaseDto)
  async setRandomAvatar(@GetUser('id') userId: number): Promise<ResUserBaseDto> {
    return await this.userService.userSetRandomAvatar(userId);
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
    return await this.userService.userUpdateAvatar(userId, file);
  }

  // ADMIN -> Get ALL users
  @Get('admin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserAdminGetAllSchema)
  userAdminGetAll(@GetUser() user: User) {
    return this.userService.userAdminGetAll(user);
  }

  // ADMIN -> delete avatar (reset to default)
  @Delete(':id/avatar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserBaseDto)
  async deleteAvatarById(
    @Param() param: ReqUserDeleteAvatarDto,
    @GetUser() user: User
  ): Promise<ResUserBaseDto> {
    return await this.userService.userDeleteAvatarById(param.id, user);
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

  // ADMIN -> delete a user by id
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(ResUserDeleteSchema)
  userDelete(@Param() param: ReqUserDeleteByIdDto, @GetUser() user: User) {
    return this.userService.userDelete(param.id, user);
  }

  @Get(':username')
  @UseGuards(JwtAuthOptionalGuard)
  async getUserByUsername(
    @Param('username') username: string,
    @GetUser('id') requestingUserId?: number
  ) {
    const user = await this.userService.userGetPublicByName(username, requestingUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Get(':username/events')
  @UseGuards(JwtAuthOptionalGuard)
  async getUserEventsByUsername(
    @Param('username') username: string,
    @Query() query: ReqUserPublicEventsDto,
    @GetUser('id') requestingUserId?: number
  ) {
    const events = await this.userService.userGetPublicEventsByName(
      username,
      requestingUserId,
      query.limit,
      query.cursor
    );
    if (events === null) {
      throw new NotFoundException('User not found');
    }
    return events;
  }
}
