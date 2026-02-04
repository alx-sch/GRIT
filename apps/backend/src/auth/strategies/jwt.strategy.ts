import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from '@/config/env';
import { UserService } from '@/user/user.service';

/**
 * JWT STRATEGY
 * -------------------------------------------------------------------------
 * ROLE:
 * This class is the "Security Guard" for protected routes.
 * When a controller uses @UseGuards(JwtAuthGuard), this strategy is triggered.
 *
 * HOW IT WORKS:
 * 1. It extracts the Bearer Token from the "Authorization" header.
 * 2. It decrypts the token using the JWT_SECRET to ensure it hasn't been forged.
 * 3. It checks if the token is expired.
 * 4. If valid, the 'validate' method runs, extracting user data from the token.
 * 5. This data is then attached to the Request object, allowing you to use
 *    the @GetUser() decorator in your controllers.
 * -------------------------------------------------------------------------
 */

interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly userService: UserService) {
    super({
      // Look for the token in the "Authorization: Bearer <token>" header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  // If the token is valid, this function runs. Verifies if user (still) exists in DB before allowing request to proceed.
  async validate(payload: JwtPayload) {
    const user = await this.userService.userGetById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    return user;
  }
}
