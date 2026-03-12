import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/user/user.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ResAuthMeDto, ReqRegisterDto, ResLoginDto, GoogleProfile } from '@/auth/auth.schema';
import * as bcrypt from 'bcrypt';
import { type LoginInput } from '@grit/schema';
import { env } from '@/config/env';
import { nanoid } from 'nanoid';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService
  ) {}

  async register(data: ReqRegisterDto) {
    return this.userService.userPost(data);
  }

  async confirmEmail(token: string) {
    return this.userService.userConfirm(token);
  }

  // Logic for verifying user credentials
  async validateUser(loginDto: LoginInput): Promise<ResAuthMeDto> {
    const user = await this.userService.userGetByEmail(loginDto.email);

    if (!user?.password) {
      throw new UnauthorizedException('Invalid email or password');
    }
    // if (!user.isConfirmed) {
    //   throw new UnauthorizedException('Please confirm your email address before logging in.');
    // }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarKey: user.avatarKey,
      isConfirmed: user.isConfirmed,
      isAdmin: user.isAdmin,
    } as ResAuthMeDto;
  }

  // Logic for creating the session response
  login(user: ResAuthMeDto): ResLoginDto {
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
      isConfirmed: user.isConfirmed,
      isAdmin: user.isAdmin,
    });
  }

  // Handles both new signups and returning logins via upsert.
  // If a user originally signed up with a password but now clicks "Login with Google",
  // this will "link" their Google ID to their existing email account automatically.
  async validateOAuthUser(profile: GoogleProfile) {
    const { email, firstName, providerId } = profile;

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const user = await this.prisma.user.upsert({
          where: { email },
          update: {
            googleId: providerId,
            isConfirmed: true,
          },
          create: {
            email,
            name: `${firstName}-${nanoid(3)}`,
            googleId: providerId,
            isConfirmed: true,
            password: null,
          },
        });

        return user;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            // P2002 is Prisma's error code for a unique constraint violation
            const target = error.meta?.target as string[];
            if (target.includes('name')) {
              attempts++;
              continue; // Loop around and try again with a new nanoid
            }
          }
        }
        throw error;
      }
    }
    // this should be astronomically unlikely, but oh well.
    throw new Error('Could not generate a unique username after multiple attempts.');
  }

  // For test purposes (since NODE_ENV is read-only).
  isProduction(): boolean {
    return env.NODE_ENV === 'production';
  }

  // For Sockets we cannot use the AuthGuard decorator so we need a manual verify Token function
  verifyToken(token: string): number | null {
    try {
      const payload = this.jwtService.verify<{ sub: number }>(token);
      return payload.sub;
    } catch {
      return null;
    }
  }
}
