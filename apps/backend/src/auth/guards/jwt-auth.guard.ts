import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Auth Guard
 * * Acts as a 'Bouncer' for protected routes.
 * 1. Checks for a valid Bearer Token in the request headers.
 * 2. If valid, populates 'req.user' with the token payload.
 * 3. If missing or invalid, returns a 401 Unauthorized error.
 */

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // No need to add anything here!
  // By extending AuthGuard('jwt'), all the logic is inherited.
}
