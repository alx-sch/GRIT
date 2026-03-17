# Module 04 — Allow Users to Interact with Other Users

| Attribute      | Value                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Category**   | IV.1                                                                                                                                                                                             |
| **Type**       | Major                                                                                                                                                                                            |
| **Points**     | 2                                                                                                                                                                                                |
| **Status**     | Done                                                                                                                                                                                             |
| **Developers** | Busedame (friends backend, invite system, sort), AudreyBil (friends frontend, event attend/unattend), johdac (direct messages, online status), dovy-mus (public profiles, friendship status API) |

---

## Description

A comprehensive social interaction system: users can view each other's public profiles, manage friendships, attend events together, invite friends to events, initiate direct messages, and see which friends are online.

---

## Justification

A social event platform only becomes social when users can find and connect with each other. This module brings the "social" into GRIT — without it, the app is a solitary event listing tool. It enables the network effect: discovering events through friends, coordinating attendance, and communicating in context.

---

## Implementation

### Public User Profiles

**Endpoints:**

- `GET /users/:id` — Returns public profile data (name, avatar, bio, city, country, hosted events)
- `GET /users/:id/events` — Returns published events hosted by this user

Privacy rules:

- `isProfilePublic = true` (default): visible to all authenticated users.
- `isProfilePublic = false`: visible only to self and confirmed friends.
- Non-friends accessing a private profile receive `404` (not `403`) to prevent user enumeration.

### User Discovery

**Endpoint:** `GET /users?search=<query>&limit=<n>&cursor=<cursor>`

Keyword search with cursor-based pagination. Used in:

- The **Friends page** search box.
- The **Global search** (⌘K) to show up to 5 matching users.

### Friends System

#### Database Models

```prisma
model FriendRequest {
  id          String   @id @default(uuid())
  requesterId Int
  receiverId  Int
  requester   User     @relation("requester", ...)
  receiver    User     @relation("receiver", ...)
  createdAt   DateTime @default(now())
  @@unique([requesterId, receiverId])
}

model Friends {
  id        String   @id @default(uuid())
  userId    Int
  friendId  Int
  user      User     @relation("FriendUserA", ...)
  friend    User     @relation("FriendUserB", ...)
  createdAt DateTime @default(now())
  @@unique([userId, friendId])
}
```

#### Lifecycle

1. **Send request** — Creates a `FriendRequest` record.
2. **Accept** — Creates a `Friends` record; deletes the `FriendRequest`.
3. **Decline** — Deletes the `FriendRequest`.
4. **Cancel** (by sender) — Sender retracts a pending request.
5. **Remove friend** — Deletes the `Friends` record.

#### Friendship Status API

**Endpoint:** `GET /users/me/friends/status/:userId`

Returns one of: `none` | `pending_sent` | `pending_received` | `friends` | `self`

Powers the action buttons on public profile pages and user cards in the friends search results.

### Friends Page (Frontend)

Three sections driven by three parallel loader calls:

- **Friend search**: debounced 500ms input, filters out existing friends and the current user.
- **Pending requests**: incoming requests with Accept / Decline buttons.
- **Your friends**: confirmed friends with Chat and Remove buttons; **sort button** (A→Z / Z→A) to order alphabetically.

All actions call `revalidate()` after completing. A 30-second polling interval (`useRevalidator`) provides live updates.

### Event Invite System

See [Module 05 — Advanced Permissions System](./05-permissions.md) for permission rules, and [the Features List in README](../../README.md#event-invite-system) for the full feature description.

#### Database Model

```prisma
enum InviteStatus { PENDING  ACCEPTED  DECLINED }

model EventInvite {
  id         String       @id @default(uuid())
  senderId   Int
  receiverId Int
  eventId    Int
  status     InviteStatus @default(PENDING)
  sender     User         @relation("InviteSender", ...)
  receiver   User         @relation("InviteReceiver", ...)
  event      Event        @relation(...)
  createdAt  DateTime     @default(now())
}
```

#### Flow

1. Author (or any user on public events) opens the "Invite" button on the single event page.
2. A searchable list of friends appears with per-friend statuses: **Invite** / **Invited** / **Already going**.
3. Clicking "Invite" sends a `POST /event-invites` request, creating the `EventInvite` record and automatically sending a chat message with a link to the event.
4. The invited user sees the event in their **Invitations tab** (My Events page).
5. On the single event page, invited users see an **Accept / Decline** dropdown.
6. Accepting attendance removes the invite and adds the user to `EventAttendee`.
7. The invite is automatically cascade-deleted when: the user or event is deleted, or the invite is accepted/declined.

### Event Attendance (Social Layer)

**Endpoint:** `PATCH /users/me` with `{ attending: eventId }` / `{ unattending: eventId }`

When a user marks themselves as attending:

- Added to `EventAttendee` join table.
- Automatically added to the event's `Conversation` as a participant.
- WebSocket synced to the event's chat room.
- Any pending `EventInvite` for that event is deleted.

### "Friends Going" on Event Cards

Event cards show avatars of attending friends plus a count. Computed in the frontend by cross-referencing the event's `attendees` with the current user's full friends list (fetched via repeated paginated API calls if needed).

### Online Status

The `ChatGateway` maintains a `userId → socketId` map. The friends overview queries this map to show a live presence indicator next to each friend's name.

### Cascading Deletes

When a user is deleted:

- Friend requests and friendships deleted.
- Event invites (sent and received) deleted.
- Conversation participations deleted.
- Chat messages: `authorId` set to null (message content preserved as "unknown").
- Event attendance deleted.
