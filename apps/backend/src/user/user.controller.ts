import { Body, Controller, Get, Post } from '@nestjs/common';
import { ReqUserPostDto } from './user.schema';
import { ResUserPostSchema, ResUserGetAllSchema } from './user.schema';
import { UserService } from './user.service';
import { ZodSerializerDto } from 'nestjs-zod';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ZodSerializerDto(ResUserGetAllSchema)
  userGetAll() {
    return this.userService.userGet();
  }

  @Post()
  @ZodSerializerDto(ResUserPostSchema)
  userPost(@Body() data: ReqUserPostDto) {
    return this.userService.userPost(data);
  }
}
