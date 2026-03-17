# Module 08 — Implement Remote Authentication with OAuth 2.0

| Attribute | Value |
|---|---|
| **Category** | IV.3 |
| **Type** | Minor |
| **Points** | 1 |
| **Status** | Done |
| **Developers** | alx-sch |

---

## Description

Allow users to register and sign in using their Google account via the OAuth 2.0 Authorization Code flow, without needing to set a password.

---

## Justification

OAuth 2.0 with a trusted provider (Google) reduces registration friction — users don't need to create and remember a new password. It also delegates credential storage and MFA to Google, improving security. In a social app context, Google login significantly lowers the barrier to entry for new users.

---

## Implementation

### Flow Overview

```
User clicks "Sign in with Google"
    ↓
GET /auth/google  (backend initiates OAuth handshake)
    ↓
Google login / consent screen
    ↓
GET /auth/google/callback?code=...  (Google redirects back to backend)
    ↓
Backend exchanges code for tokens, fetches user profile
    ↓
User upserted in DB (created if new, found if returning)
    ↓
Backend redirects to frontend: /auth/success?token=<JWT>
    ↓
Frontend stores JWT, navigates to /events
```

### Backend Implementation

**Strategy:** `passport-google-oauth20` via `@nestjs/passport`

```ts
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${env.APP_BASE_URL}/api/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    return this.authService.validateOAuthUser({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      avatar: profile.photos[0]?.value,
    });
  }
}
```

**Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /auth/google` | Initiates the Google OAuth handshake |
| `GET /auth/google/callback` | Handles the redirect from Google after consent |

### User Upsert Logic

`validateOAuthUser` in `AuthService` performs an upsert:
1. Looks up the user by `googleId` first, then by `email`.
2. If found → updates `googleId` if missing (links existing account).
3. If not found → creates a new user:
   - `password` is `null` (Google users have no local password).
   - `isConfirmed` set to `true` immediately (Google has verified the email).
   - Username is the Google `displayName` + a short nanoid suffix to guarantee uniqueness.
   - If the generated name collides in the database (`P2002` error), generation retries recursively.

### Environment Configuration

```env
GOOGLE_CLIENT_ID=your_client_id_from_google_cloud_console
GOOGLE_CLIENT_SECRET=your_client_secret
APP_BASE_URL=https://your-domain.com
```

The callback URL is derived from `APP_BASE_URL`, making it environment-agnostic: the same configuration works on localhost, GitHub Codespaces, and production.

**Key fix**: An earlier version used `FRONTEND_URL` for the callback URL, which broke in production because the OAuth callback goes to the **backend**, not the frontend. Replacing it with `APP_BASE_URL` (which points to the reverse proxy URL) resolved the issue.

### Frontend

After the Google callback, the backend redirects to `<APP_BASE_URL>/auth/success?token=<JWT>`. The frontend `AuthSuccessPage` reads the token from the URL query parameter, stores it in Zustand (`authStore`), and navigates to `/events`.

### Security Notes

- The `callbackURL` is fully derived from `APP_BASE_URL` — never hardcoded.
- Google API credentials are stored as environment secrets, never committed to the repository.
- The token is delivered as a URL query parameter over HTTPS (Caddy enforces TLS). This is a standard OAuth 2.0 pattern for SPAs.
- Google OAuth users are automatically confirmed (`isConfirmed: true`) since Google has verified the email address.
