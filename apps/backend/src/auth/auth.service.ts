import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/user/user.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ResAuthMeDto, ReqRegisterDto, ResLoginDto, GoogleProfile } from '@/auth/auth.schema';
import * as bcrypt from 'bcrypt';
import { type LoginInput } from '@grit/schema';
import { env } from '@/config/env';
import { StorageService } from '@/storage/storage.service';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService
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
    if (!user || !user.password) {
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
    });
  }

  // Handles both new signups and returning logins via upsert.
  // If a user originally signed up with a password but now clicks "Login with Google",
  // this will "link" their Google ID to their existing email account automatically.
  async validateOAuthUser(profile: GoogleProfile) {
    const { email, firstName, provider, providerId, picture } = profile;

    let GoogleAvatarKey: string | null = null;

    // Download picture and sync avatar, if it exists in GoogleProfile
    if (picture) {
      try {
        // Download the actual image bytes from the Google URL
        const response = await axios.get(picture, { responseType: 'arraybuffer' });

        // Upload those bytes to bucket
        GoogleAvatarKey = await this.storageService.uploadBuffer(
          Buffer.from(response.data as ArrayBuffer),
          'user-avatars',
          `google-${providerId}.jpg`
        );
      } catch (error) {
        console.error(`Avatar sync failed for ${email}:`, error);
      }
    }
    // Upsert: Find by email, update provider info, or create new
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        provider,
        providerId,
        isConfirmed: true, // OAuth emails are trusted
        ...(GoogleAvatarKey && { avatarKey: GoogleAvatarKey }),
      },
      create: {
        email,
        name: firstName,
        provider,
        providerId,
        isConfirmed: true,
        password: null, // No password for OAuth users
        avatarKey: GoogleAvatarKey ?? null,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarKey: user.avatarKey,
      isConfirmed: user.isConfirmed,
      attending: [],
    };
  }

  // For test purposes (since NODE_ENV is read-only).
  isProduction(): boolean {
    return env.NODE_ENV === 'production';
  }
}
