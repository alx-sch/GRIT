import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { ResAuthMeDto, ReqAuthLoginDto, ResAuthLoginDto } from '@/auth/auth.schema';
import { ZodSerializerDto } from 'nestjs-zod';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/guards/get-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ZodSerializerDto(ResAuthLoginDto)
  async login(@Body() body: ReqAuthLoginDto) {
    const user = await this.authService.validateUser(body);
    return this.authService.login(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ZodSerializerDto(ResAuthMeDto)
  async getMe(@GetUser('id') userId: number) {
    return this.authService.getMe(userId);
  }

  @Get('debug/token/:id')
  @ZodSerializerDto(ResAuthLoginDto)
  async generateTestToken(@Param('id', ParseIntPipe) id: number) {
    if (this.authService.isProduction()) {
      throw new ForbiddenException('This debug route is disabled in production.');
    }
    const user = await this.authService.getMe(id);
    return this.authService.login(user);
  }
}
