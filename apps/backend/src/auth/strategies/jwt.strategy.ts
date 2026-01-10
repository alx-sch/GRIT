import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from '@config/env';

/**
 * JWT STRATEGY
 * -------------------------------------------------------------------------
 * USAGE:
 * This class is the "Security Guard" for your protected routes.
 * When a controller uses @UseGuards(JwtAuthGuard), this strategy is triggered.
 *
 * HOW IT WORKS:
 * 1. It extracts the Bearer Token from the "Authorization" header.
 * 2. It decrypts the token using the JWT_SECRET to ensure it hasn't been forged.
 * 3. It checks if the token is expired.
 * 4. If valid, the 'validate' method runs, extracting user data from the token.
 * 5. This data is then attached to the Request object, allowing you to use
 * the @GetUser() decorator in your controllers.
 * -------------------------------------------------------------------------
 */

interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      // Look for the token in the "Authorization: Bearer <token>" header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET ?? 'fallback_for_lint',
    });
  }

  // If the token is valid, this function runs
  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email };
  }
}
