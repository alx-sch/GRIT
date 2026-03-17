# Module 02 — Standard User Management and Authentication

| Attribute | Value |
|---|---|
| **Category** | IV.3 |
| **Type** | Major |
| **Points** | 2 |
| **Status** | Done |
| **Developers** | alx-sch (backend auth, email), Busedame (auto-login on register), dovy-mus (frontend auth UI, profile), AudreyBil (profile editing UI) |

---

## Description

A complete user account system covering registration, login, email confirmation, profile management, avatar upload, and secure session handling.

---

## Justification

User management is the foundation of any social platform. Without secure authentication and rich user profiles, no other feature can function correctly. This module was prioritized as foundational to unlock every other feature in GRIT.

---

## Implementation

### Registration

**Endpoint:** `POST /auth/register`

1. The user submits email, name, and password.
2. Zod validates the `RegisterSchema` (email format, minimum name/password length).
3. The password is hashed with **bcrypt** (salt rounds: 10).
4. A cryptographically secure confirmation token is generated with Node's `crypto.randomBytes`.
5. The user is saved to the database with `isConfirmed: false`.
6. A confirmation email is sent via **Nodemailer** with a link: `GET /auth/confirm?token=<token>`.
7. The user is **automatically logged in** after registration (a JWT is issued immediately), reducing friction.

### Email Confirmation

**Endpoint:** `GET /auth/confirm?token=<token>`

- The backend looks up the user by `confirmationToken`.
- Sets `isConfirmed: true` and clears the token.
- The frontend shows contextual toast notifications depending on login state and confirmation status (4 possible states).

### Login

**Endpoint:** `POST /auth/login`

- Validates credentials; returns a signed **JWT** (`@nestjs/jwt`, HS256).
- Supports an optional `?redirect=` query parameter so users return to the page they came from after authenticating.
- The frontend stores the token in Zustand's `authStore` (persisted to `localStorage` for page reloads).

### State Rehydration

**Endpoint:** `GET /auth/me`

- Returns the full current user object from the JWT.
- Called on every page load by `DefaultLayout` to restore the authenticated session without a full login.

### JWT Guard

Routes decorated with `@UseGuards(JwtAuthGuard)` require a valid Bearer token. An `OptionalJwtGuard` variant allows routes to function for both authenticated and anonymous users (e.g., public event pages).

### Profile Management

**Endpoint:** `PATCH /users/me`

Accepts any subset of: `name`, `bio`, `city`, `country`, `isProfilePublic`. All string fields are trimmed with minimum length 1 to prevent whitespace-only values. Duplicate name errors are caught and shown as explicit error messages in the UI.

### Avatar Upload

**Endpoint:** `PATCH /users/me/avatar`

1. Image uploaded via multipart form (Multer).
2. Server validates MIME type and file size (≤ 5 MB, `image/*`).
3. Stored in MinIO under the `avatars` bucket with a unique key.
4. Old avatar deleted from MinIO on replacement.
5. Frontend shows an image cropper (`react-easy-crop`) before upload — supports zoom, rotation, and grid overlay.

### Public Profiles & Privacy

**Endpoint:** `GET /users/:id`

- Any user can view another user's public profile.
- If `isProfilePublic = false`, only the user themselves or confirmed friends can view the profile.
- Non-friends accessing a private profile receive `404` (not `403`) to prevent user enumeration.

### Unique Username for OAuth Users

When a user signs up via Google OAuth, their display name is used as the username. A short `nanoid` is appended to guarantee uniqueness. If the generated name still collides in the database (P2002 error), generation retries recursively.

---

## Database Schema

```prisma
model User {
  id                Int      @id @default(autoincrement())
  email             String   @unique
  password          String?
  name              String   @unique
  avatarKey         String?
  bio               String?
  city              String?
  country           String?
  confirmationToken String?  @unique
  googleId          String?
  isConfirmed       Boolean  @default(false)
  isProfilePublic   Boolean  @default(true)
  isAdmin           Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

---

## Frontend Routes

| Route | Purpose |
|---|---|
| `/register` | Registration form |
| `/login` | Login form with optional `?redirect=` param |
| `/profile` | Edit own profile, upload avatar |
| `/users/:id` | View another user's public profile |
