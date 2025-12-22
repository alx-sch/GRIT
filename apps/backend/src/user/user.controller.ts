import { Controller, Get, Param, Post, Body, Put, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { User as UserModel } from '../generated/prisma/client';

@Controller()
export class UserController {
  constructor(private readonly UserService: UserService) {}

  @Post('users')
  async signupUser(@Body() userData: { name?: string; email: string }): Promise<UserModel> {
    return this.UserService.createUser(userData);
  }
}
