import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Auth Guard
 * * Acts as an optional authentication mechanism for routes that can be accessed both
 * * authenticated and unauthenticated (e.g., viewing public events vs draft events).
 *
 * 1. If a valid Bearer Token is provided, populates 'req.user' with the token payload.
 * 2. If missing or invalid, allows the request to proceed without user information (req.user = undefined).
 * 3. The endpoint logic can then decide what to show based on whether user is authenticated.
 */

@Injectable()
export class JwtAuthOptionalGuard extends AuthGuard('jwt') {
  // Override handleRequest to allow unauthenticated access
  handleRequest<TUser = unknown>(err: unknown, user: TUser | false): TUser | undefined {
    if (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new UnauthorizedException();
    }
    return user ? user : undefined;
  }
}
