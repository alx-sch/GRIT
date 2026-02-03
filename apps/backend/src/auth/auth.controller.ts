import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import {
  ReqRegisterDto,
  ResRegisterDto,
  ReqConfirmEmailDto,
  ReqLoginDto,
  ResLoginDto,
  ResLoginSchema,
  ResAuthMeDto,
} from '@/auth/auth.schema';
import { ZodSerializerDto } from 'nestjs-zod';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/guards/get-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ZodSerializerDto(ResRegisterDto)
  async register(@Body() data: ReqRegisterDto): Promise<ResRegisterDto> {
    return this.authService.register(data);
  }

  @Get('confirm')
  async confirm(@Query() query: ReqConfirmEmailDto) {
    return this.authService.confirmEmail(query.token);
  }

  @Post('login')
  @ZodSerializerDto(ResLoginSchema)
  async login(@Body() data: ReqLoginDto) {
    const user = await this.authService.validateUser(data);
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
  @ZodSerializerDto(ResLoginDto)
  async generateTestToken(@Param('id', ParseIntPipe) id: number) {
    if (this.authService.isProduction()) {
      throw new ForbiddenException('This debug route is disabled in production.');
    }
    const user = await this.authService.getMe(id);
    return this.authService.login(user);
  }
}
