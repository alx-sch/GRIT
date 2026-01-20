import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { env } from '@/config/env';
import { ReqAuthLoginDto } from '@/user/user.schema';
import { UserService } from '@/user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService
  ) {}

  @Get('debug/token/:id')
  generateTestToken(@Param('id', ParseIntPipe) id: number) {
    if (env.NODE_ENV === 'production') {
      throw new ForbiddenException('This debug route is disabled in production.');
    }

    const payload = { sub: id, email: `user${String(id)}@example.com` };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  @Post('login')
  async login(@Body() body: ReqAuthLoginDto) {
    const { email, password } = body;

    const user = await this.userService.userGetByEmail(email);

    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate token and return user info
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarKey: user.avatarKey,
        attending: user.attending,
      },
    };
  }
}
