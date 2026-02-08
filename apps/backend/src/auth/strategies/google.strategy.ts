import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions, Profile } from 'passport-google-oauth20';
import { env } from '@/config/env';

/**
 * GOOGLE OAUTH STRATEGY
 * -------------------------------------------------------------------------
 * ROLE:
 * This strategy handles the external authentication handshake with Google.
 * It facilitates the "Login with Google" flow for the application.
 *
 * HOW IT WORKS:
 * 1. Redirection: When the user hits the /auth/google endpoint, Passport
 *    redirects them to Google's consent screen.
 * 2. Callback: After approval, Google sends the user back to the
 *    callbackURL with an authorization code.
 * 3. Exchange: This strategy automatically exchanges that code for a
 *    user profile and access tokens.
 * 4. Validation: The 'validate' method formats the raw Google profile
 *    into a clean user object for your AuthService to process (find/create).
 * -------------------------------------------------------------------------
 */

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const options: StrategyOptions = {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    };
    super(options);
  }

  /**
   * Validation Hook
   * This method is called after a successful Google login.
   * The returned object is attached to the Request as 'req.user'.
   */
  validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const { name, emails, id } = profile;
    const user = {
      email: emails?.[0]?.value ?? '',
      firstName: name?.givenName ?? '',
      providerId: id,
    };
    return user;
  }
}
