# Module 05 — Advanced Permissions System

| Attribute | Value |
|---|---|
| **Category** | IV.3 |
| **Type** | Major |
| **Points** | 2 |
| **Status** | Done |
| **Notes** | CRUD, Roles management |
| **Developers** | Busedame |

---

## Description

A role-based access control system distinguishing between anonymous users, authenticated users, event authors, invited users, and administrators. Enforces consistent authorization across all CRUD operations.

---

## Justification

In a social event platform, different actors need different capabilities. An event should only be editable by its author. An admin should be able to moderate content. Private events should be invisible to non-invited users. Without a structured permissions system, these boundaries are ad-hoc and error-prone. A formalized permission layer prevents privilege escalation and accidental data exposure.

---

## Implementation

### Roles

| Role | Description |
|---|---|
| **Anonymous** | Not authenticated. Can browse published public events and public profiles. |
| **Authenticated user** | Logged in. Can create events, attend events, send friend requests, chat, invite friends. |
| **Event author** | Creator of a specific event. Can edit, publish/unpublish, delete, and invite anyone to their event. |
| **Invited user** | Received an event invite. Can view private events they are invited to; see accept/decline UI. |
| **Admin** | Platform administrator. Can manage any content regardless of ownership. |

### Authentication Guards (NestJS)

**`JwtAuthGuard`** — Requires a valid JWT Bearer token. Applied to all mutating endpoints.

**`OptionalJwtGuard`** — Attaches the user to the request if a valid token is present, but does not reject unauthenticated requests. Used for public endpoints that behave differently for logged-in vs. anonymous users.

### Ownership Checks

For every mutating operation on a user-owned resource, the service verifies that the requesting user is the owner — or an admin:

```ts
if (event.authorId !== userId && !user.isAdmin) {
  throw new ForbiddenException('You do not own this event');
}
```

Applied to: event edit/delete/publish, file upload/delete, location edit/delete, avatar change.

### Event Visibility Rules

| Event state | Who can see it |
|---|---|
| Published + public | Everyone (anonymous included) |
| Published + private | Author, attendees, and invited users only |
| Draft | Author only |

The event feed page shows only **published + public** events. Private events (even if published) do not appear in the feed — only in the My Events / Invitations tabs for relevant users.

Non-invited, non-attending, non-author users navigating directly to the URL of a private event receive a proper error page.

### Profile Privacy

- `isProfilePublic = true` → visible to all authenticated users
- `isProfilePublic = false` → visible only to self and confirmed friends

Both the profile endpoint and the hosted events endpoint enforce the same privacy check and return `404` for unauthorized access.

### Event Invite Permissions

| Scenario | Can Invite? |
|---|---|
| Public event, any authenticated user | Yes |
| Private event, event author | Yes |
| Private event, non-author | No (button greyed out in UI) |
| Event is a draft | No |

Only **friends** of the current user can be invited. The friend picker shows each friend's status: Invite / Invited / Already going.

### Not-Logged-In Access Control

Clicking **Going**, **Invite**, or **Chat** while not logged in redirects to the login page (`/login?redirect=<current-path>`). After successful login, the user is sent back to the page they were trying to access.

### Registration-On-Login Flow

Users are automatically logged in immediately after registration (a JWT is issued), removing the friction of a separate login step while still requiring email confirmation.

### Admin Role

The `isAdmin` boolean on the `User` model grants platform-wide override capabilities. Admin users bypass ownership checks. Admin status is set directly in the database and cannot be self-assigned through the API.

### Chat Access Control

The WebSocket gateway verifies that a socket is a participant of a conversation before allowing message delivery. Attending an event is the only way to join its event conversation; accepting an event invite automatically adds the user to attendance.
