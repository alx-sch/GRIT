import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@/auth/strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { env } from '@/config/env';
import { UserModule } from '@/user/user.module';

/**
 * AUTH MODULE
 * -------------------------------------------------------------------------
 * USAGE:
 * This module sets up the infrastructure for JSON Web Tokens (JWT).
 *
 * HOW IT WORKS:
 * 1. PassportModule: Initializes the strategy engine.
 * 2. JwtModule: Configures how tokens are signed (created) and verified.
 * 3. Providers: Registers the JwtStrategy so NestJS can find it.
 * 4. Exports: Shares the JWT and Passport logic with the rest of the app.
 * -------------------------------------------------------------------------
 */

@Global()
@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy],
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}
