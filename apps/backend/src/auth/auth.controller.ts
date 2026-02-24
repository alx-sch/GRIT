import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  Query,
  Param,
  ParseIntPipe,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ReqRegisterDto,
  ResRegisterDto,
  ReqConfirmEmailDto,
  ReqLoginDto,
  ResLoginDto,
  ResLoginSchema,
  ResAuthMeDto,
  GoogleProfile,
} from '@/auth/auth.schema';
import { ZodSerializerDto } from 'nestjs-zod';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/guards/get-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(): Promise<void> {
    // Handled by Passport
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    // req.user now contains the profile from GoogleStrategy
    const user = await this.authService.validateOAuthUser(req.user as GoogleProfile);
    const result = this.authService.login(user);

    // Redirect back to frontend with the token
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?token=${result.accessToken}`);
  }
}
