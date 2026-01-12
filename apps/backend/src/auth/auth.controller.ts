import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { ReqAuthPostDto, ResAuthPostSchema } from './auth.schema';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //@HttpCode(HttpStatus.OK)
  @Post('login')
  @ZodSerializerDto(ResAuthPostSchema)
  login(@Body() data: ReqAuthPostDto) {
    return this.authService.validateUser(data);
  }
}
