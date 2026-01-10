import { Controller, Get, Param, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiOperation, ApiTags, ApiParam, ApiResponse } from '@nestjs/swagger';
import { env } from '@config/env';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  @Get('debug/token/:id')
  @ApiOperation({
    summary: 'Generate Test Token',
    description:
      'Generates a signed JWT for a specific user ID. This is a bypass tool for development and is disabled in production environments.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'The User ID you want to impersonate',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a Bearer token valid for 7 days.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1...' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Returned if the server is running in production mode.',
  })
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
