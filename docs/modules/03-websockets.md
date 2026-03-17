# Module 03 — Implement Real-Time Features using WebSockets

| Attribute | Value |
|---|---|
| **Category** | IV.1 |
| **Type** | Major |
| **Points** | 2 |
| **Status** | Done |
| **Developers** | johdac |

---

## Description

A full real-time communication system using WebSockets: event group chats, 1-to-1 direct messages, online friend presence, and instant room synchronization on attendance changes. Chat message URLs are rendered as clickable links.

---

## Justification

A social event platform needs real-time communication. Users attending an event should be able to coordinate instantly without polling. Direct messages between users are equally essential for social interaction. WebSockets were the natural choice over polling because they provide true bidirectional communication with low latency.

---

## Implementation

### Technology

**Backend:** Socket.IO via `@nestjs/websockets` + `@nestjs/platform-socket.io`
**Frontend:** `socket.io-client`

Socket.IO was chosen over raw WebSockets for its automatic reconnection, room abstractions, and clean NestJS Gateway integration.

### Authentication

The WebSocket connection is authenticated by JWT on handshake. The `ChatGateway` registers middleware inside `afterInit()` (runs once when the gateway initializes):

```ts
afterInit(server: Server) {
  server.use((socket, next) => {
    const token = socket.handshake.auth.token;
    // Verify JWT, attach userId to socket
    socket.data.userId = verifiedPayload.sub;
    next();
  });
}
```

The frontend sends the JWT in the handshake:

```ts
const socket = io(WS_URL, { auth: { token } });
```

### Connection Lifecycle

When a socket connects, `handleConnection()` runs automatically:

1. Stores `userId → socketId` in an in-memory map for fast lookup.
2. Calls `syncSocketConversations(userId)` — finds all conversations the user participates in and joins the corresponding Socket.IO rooms.
3. Fetches the last message per conversation and the user's `lastReadAt` timestamp.
4. Emits `initialLastMessages` back to the client.

When a socket disconnects, `handleDisconnect()` removes the `userId` from the online map.

### Room Management

Each `Conversation` record in the database corresponds to a Socket.IO room (identified by `conversationId`). Rooms ensure messages are broadcast only to relevant participants.

**Dynamic resync** — When a user attends or leaves an event via HTTP, `UserService` calls `chatGateway.resyncUserRooms(userId)` after updating the database. This re-runs `syncSocketConversations`, making the user leave old rooms and join new ones — without requiring a page reload.

### Sending and Receiving Messages

**Client → Server** (`sendMessage` event):
```ts
socket.emit('sendMessage', { conversationId, text });
```

**Server → Client** (`messages` event):
```ts
this.server.to(conversationId).emit('messages', savedMessage);
```

The frontend `chatStore` (Zustand) stores only the **last message per conversation** — used to drive unread indicators. Full message history is loaded lazily via HTTP when a conversation is opened.

### Clickable URLs in Chat

Chat message text is parsed on the frontend: any string matching a URL pattern is wrapped in an `<a>` tag that opens in a new tab. This is particularly useful for event invite links automatically sent when inviting a friend to an event.

### Unread Tracking

- `ConversationParticipant.lastReadAt` is updated when the user scrolls to the bottom of a chat.
- If the user has scrolled up, new incoming messages show a "New messages ↓" banner instead of auto-scrolling.
- The navbar shows an orange dot on the chat icon when any conversation has unread messages.

### Online Status

Friends' online status is derived from the `userId → socketId` map. When the frontend renders the friends overview, the backend checks which userIds have an active socket entry.

### Handling New Conversations

When a user starts a new direct message via `POST /conversations`, the backend:
1. Creates or retrieves the `Conversation` record.
2. Calls `resyncUserRooms` for **both** participants so they immediately receive messages from each other.

When the user is on the chat overview page and a new conversation appears, the `socketProvider` dispatches a `chat:conversationsChanged` window event. `ChatFeedLayout` listens for this and calls `useRevalidator` to reload the conversation list.

### Frontend Architecture

```
socketProvider.tsx      — Creates socket, handles auth, populates chatStore
chatStore.ts (Zustand)  — Stores { lastMessage, lastReadAt } per conversationId
ChatFeedLayout.tsx      — Loads conversation list, listens for 'chat:conversationsChanged'
ChatBox.tsx             — Renders messages, manages scroll, sends messages
useChat.tsx             — Hook: message loading, sending, scroll handling
```
