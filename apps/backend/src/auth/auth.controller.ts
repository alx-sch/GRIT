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
  ConflictException,
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
  async confirm(@Query() query: ReqConfirmEmailDto, @Res() res: Response) {
    const appBaseUrl = this.configService.get<string>('APP_BASE_URL');
    const fePort = this.configService.get<number>('FE_PORT');
    const frontendUrl = appBaseUrl ?? `http://localhost:${String(fePort)}`;

    try {
      await this.authService.confirmEmail(query.token);
      // Success - email confirmed for the first time
      res.redirect(`${frontendUrl}/login?confirmed=true`);
      return;
    } catch (error) {
      if (error instanceof ConflictException) {
        // Token valid, but email already confirmed
        res.redirect(`${frontendUrl}/login?already_confirmed=true`);
        return;
      }
      // Invalid or expired token
      res.redirect(`${frontendUrl}/login?error=true`);
      return;
    }
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
    const appBaseUrl = this.configService.get<string>('APP_BASE_URL');
    const fePort = this.configService.get<number>('FE_PORT') ?? 5173;
    const frontendUrl = appBaseUrl ?? `http://localhost:${String(fePort)}`;
    res.redirect(`${frontendUrl}/login?token=${result.accessToken}`);
  }
}
