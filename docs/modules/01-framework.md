# Module 01 — Use a Framework for Both the Frontend and Backend

| Attribute | Value |
|---|---|
| **Category** | IV.1 |
| **Type** | Major |
| **Points** | 2 |
| **Status** | Done |
| **Developers** | alx-sch (backend), dovy-mus (frontend) |

---

## Description

Use a recognized, production-grade web framework for both the frontend and the backend, rather than writing raw HTTP servers or vanilla DOM manipulation.

---

## Justification

Frameworks provide battle-tested abstractions for routing, dependency injection, middleware, and build tooling. They enforce consistent architectural patterns, reduce boilerplate, and come with large ecosystems. Choosing established frameworks for both layers made it easier to onboard all team members, as each framework has extensive documentation and community support.

---

## Implementation

### Backend — NestJS v11

**Framework:** [NestJS](https://nestjs.com/) — a TypeScript-first Node.js framework built on Express, using a modular architecture inspired by Angular.

Key NestJS features used in GRIT:

- **Modules**: Each domain (user, event, location, auth, chat, conversation, friend, invite, storage, mail) is encapsulated in its own NestJS module with explicit imports/exports.
- **Controllers**: Handle HTTP routing and request/response serialization. All DTOs are Zod-validated via `nestjs-zod`.
- **Services**: Contain business logic; injected into controllers and other services via dependency injection.
- **Guards**: `JwtAuthGuard` and `OptionalJwtGuard` protect routes using Passport JWT strategy.
- **WebSocket Gateway**: `ChatGateway` uses `@nestjs/websockets` + `@nestjs/platform-socket.io` for real-time chat.
- **Exception filters**: Prisma errors (`P2002`, `P2025`) caught and mapped to HTTP exceptions.
- **Swagger**: Auto-generated API documentation at `/api` via `@nestjs/swagger` + `nestjs-zod`.

```
apps/backend/src/
├── auth/          # JWT + Google OAuth, registration, email confirmation
├── user/          # User CRUD, profile, avatar, attendance
├── event/         # Event CRUD, publish/draft, image, files
├── event-invite/  # Event invite CRUD (send, accept, decline)
├── location/      # Location CRUD, geocoding
├── chat/          # WebSocket gateway, message handling
├── conversation/  # Conversation management
├── friend/        # Friend requests and friendships
├── storage/       # MinIO abstraction
└── mail/          # Nodemailer / email service
```

### Frontend — React 19 + Vite + React Router v7

**Framework:** [React 19](https://react.dev/) with [Vite](https://vitejs.dev/) and [React Router v7](https://reactrouter.com/)

Key frontend framework features used in GRIT:

- **React Router v7 loaders**: Data fetching co-located with routes. Loaders run before the component renders, eliminating useEffect waterfalls.
- **Protected routes**: `ProtectedLayout` wraps authenticated routes and redirects unauthenticated users.
- **Default layout**: `DefaultLayout` mounts global providers (socket, toasts, auth rehydration).
- **TypeScript**: Strict typing across all components, services, and route loaders.
- **Vite**: Sub-second HMR in development; optimized chunked output in production.

```
apps/frontend/src/
├── pages/         # Route-level components with co-located loaders
├── components/    # Reusable UI components (layout, ui, events, chat...)
├── features/      # Feature-specific logic (search, friends, invites...)
├── stores/        # Zustand state (auth, chat)
├── services/      # API call wrappers (axios)
├── lib/           # Utilities and hooks
└── router.tsx     # Centralized route definitions
```

---

## Technical Notes

- The frontend uses `envPrefix: ['VITE_', 'BE_']` in `vite.config.ts` to expose backend port variables to the Vite build, enabling a single root `.env` to drive both apps.
- The backend runs `nest start --watch` in development and `node dist/main` in production (compiled NestJS output).
- In production, the frontend is built to static assets by Vite and served by Caddy; the backend runs as a Node process inside Docker.
