import { Body, Controller, Get, Post, Param } from '@nestjs/common';
import {
  ReqUserPostDto,
  ReqUserGetByIdDto,
  ResUserPostSchema,
  ResUserGetAllSchema,
  ResUserGetByIdSchema,
} from './user.schema';
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

  @Get(':id')
  @ZodSerializerDto(ResUserGetByIdSchema)
  userGetById(@Param() param: ReqUserGetByIdDto) {
    return this.userService.userGetById(param.id);
  }

  @Post()
  @ZodSerializerDto(ResUserPostSchema)
  userPost(@Body() data: ReqUserPostDto) {
    return this.userService.userPost(data);
  }
}
