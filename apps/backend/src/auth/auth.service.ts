import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/user/user.service';
import { ResAuthMeDto, ResAuthLoginDto } from '@/auth/auth.schema';
import * as bcrypt from 'bcrypt';
import { type LoginInput } from '@grit/schema';
import { env } from '@/config/env';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService
  ) {}

  // Logic for verifying user credentials
  async validateUser(loginDto: LoginInput): Promise<ResAuthMeDto> {
    const user = await this.userService.userGetByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return ResAuthMeDto.create({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarKey: user.avatarKey,
    });
  }

  // Logic for creating the session response
  login(user: ResAuthMeDto): ResAuthLoginDto {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: user,
    };
  }

  // Logic for the rehydration endpoint
  async getMe(userId: number): Promise<ResAuthMeDto> {
    const user = await this.userService.userGetById(userId);
    if (!user) throw new NotFoundException('User not found');

    return ResAuthMeDto.create({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarKey: user.avatarKey,
    });
  }

  // For test purposes (since NODE_ENV is read-only).
  isProduction(): boolean {
    return env.NODE_ENV === 'production';
  }

  // For Sockets we cannot use the AuthGuard decorator so need a manual verify Token function
  async verifyToken(token: string): Promise<number | null> {
    try {
      const payload = this.jwtService.verify(token) as { sub: number };
      return payload.sub;
    } catch {
      return null;
    }
  }
}
