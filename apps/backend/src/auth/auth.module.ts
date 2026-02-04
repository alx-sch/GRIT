import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@/auth/strategies/jwt.strategy';
import { GoogleStrategy } from '@/auth/strategies/google.strategy';
import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { env } from '@/config/env';
import { UserModule } from '@/user/user.module';
import { ConfigModule } from '@nestjs/config';

/**
 * AUTH MODULE
 * -------------------------------------------------------------------------
 * USAGE:
 * This module serves as the central security hub for the application.
 * It handles identity provider integration (Google OAuth), session-less
 * authentication via JWT, and exports these capabilities globally.
 *
 * HOW IT WORKS:
 * 1. Global Scope: Decorated with @Global() to make authentication logic
 *    available across the entire app without repetitive imports.
 * 2. Passport Integration: Configures strategies for both local/JWT
 *    verification and external OAuth flows.
 * 3. JwtModule: Manages the signing and verification of Bearer tokens
 *    using the app-wide secret.
 * 4. User Lifecycle: Interacts with UserModule to validate, find or
 *    create users during the login process.
 * -------------------------------------------------------------------------
 */

@Global()
@Module({
  imports: [
    UserModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'googles' }),
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}
