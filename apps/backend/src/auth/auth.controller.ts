import { Controller, Get, Param, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { env } from '@/config/env';

@Controller('auth')
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  @Get('debug/token/:id')
  generateTestToken(@Param('id', ParseIntPipe) id: number) {
    if (env.NODE_ENV === 'production') {
      throw new ForbiddenException('This debug route is disabled in production.');
    }

    // You can now test AS any user by changing the ID in the URL!
    const payload = { sub: id, email: `user${String(id)}@example.com` };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
