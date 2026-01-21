import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/user/user.service';
import { ReqAuthLoginDto, ResAuthMeDto, ResAuthLoginDto } from '@/auth/auth.schema';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService
  ) {}

  // Logic for verifying user credentials
  async validateUser(loginDto: ReqAuthLoginDto) {
    const user = await this.userService.userGetByEmail(loginDto.email);

    if (!user || user.password !== loginDto.password) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  // Logic for creating the session response
  async login(user: Pick<User, 'id' | 'email' | 'name' | 'avatarKey'>): Promise<ResAuthLoginDto> {
    const payload = { sub: user.id, email: user.email };
    return Promise.resolve({
      accessToken: this.jwtService.sign(payload),
      user: ResAuthMeDto.create({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarKey: user.avatarKey,
      }),
    });
  }

  // Logic for the rehydration endpoint
  async getMe(userId: number) {
    const user = await this.userService.userGetById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    return ResAuthMeDto.create({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarKey: user.avatarKey,
    });
  }
}
