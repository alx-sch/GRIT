import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '@/user/user.service';
import { ReqAuthPostDto } from '@/auth/auth.schema';
import { JwtService } from '@nestjs/jwt';

type User = {
  email: string;
  password: string;
  id: number;
  createdAt: Date;
  name: string | null;
  accessToken: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async authenticate(data: ReqAuthPostDto) {
    const user = await this.validateUser(data);

    if (!user) {
      throw new UnauthorizedException('Wrong password.');
    }

    return this.signIn(user);
  }

  async validateUser(data: ReqAuthPostDto) {
    const user = await this.userService.userGetByEmail(data.email);

    if (user && user.password == data.password) {
      return user;
    }

    return null;
  }

  async signIn(user: User) {
    const tokenPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload);
    user.accessToken = accessToken;
    return user;
  }
}
