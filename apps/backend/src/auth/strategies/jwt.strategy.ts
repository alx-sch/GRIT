import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

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

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      // Look for the token in the "Authorization: Bearer <token>" header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  // If the token is valid, this function runs
  async validate(payload: any) {
    // payload.sub is usually where the userId is stored in a JWT
    // Whatever we return here is what @GetUser() will pick up
    return { id: payload.sub, email: payload.email };
  }
}
