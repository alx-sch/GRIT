import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';

import { UserModule } from '@/user/user.module';
// Import JWT_SECRET at some point (where to place it?)

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [
    UserModule,
    JwtModule.register({
      global: true,
      secret: 'temp-secret-please-store-this-safer-and-better-tysm',
      signOptions: { expiresIn: '30m' },
    }),
  ],
})
export class AuthModule {}
