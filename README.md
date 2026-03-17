*This project has been created as part of the 42 curriculum by abillote, aschenk, nholbroo, jdach, dmusulas.*

---

# GRIT: Get Together

> **GRIT fills the gap between "Hey, we should do something?" and actually making it happen.**

GRIT is a social event platform where users can create, discover, and attend real-world events with their friends. It combines an event feed, real-time chat, a friends system, event invites, and profile management into a polished, production-ready web application.

---

## Table of Contents

1. [Description](#description)
2. [Team Information](#team-information)
3. [Project Management](#project-management)
4. [Instructions](#instructions)
5. [Technical Stack](#technical-stack)
6. [Database Schema](#database-schema)
7. [Features List](#features-list)
8. [Modules](#modules)
9. [Individual Contributions](#individual-contributions)
10. [Resources](#resources)

---

## Description

### Goal

Build a production-grade social web application for organizing and attending events — from local meetups to recurring group activities. GRIT lets users register, create events with rich metadata (images, files, locations), invite friends, and chat in real time — all from a single, responsive interface.

### Key Features

- **Event Management** — Create, edit, publish, or draft events with cover images, PDFs, locations
- **Real-Time Chat** — Event group chats and 1-to-1 direct messages via WebSockets
- **Friends System** — Send, accept, and decline friend requests
- **Event Invite System** — Invite friends to events from within the app
- **Google OAuth** — Register and sign in with a Google account
- **Public Profiles** — User profiles with bio, city, country, and optional privacy controls
- **Google Maps** — Interactive location picker using the Google Maps Geocoding API
- **File Uploads** — Event cover images and attachments (PDF) stored in MinIO object storage
- **CI/CD Pipeline** — Automated Quality Assurance (unit, integration, E2E tests) + continuous deployment to a Hetzner server

---

## Team Information

| GitHub | 42 Login | Role |
|---|---|---|
| [alx-sch](https://github.com/alx-sch) | `aschenk` | Project Manager / DevOps |
| [dovy-mus](https://github.com/dovy-mus) | `dmusulas` | Product Owner / Frontend Developer |
| [johdac](https://github.com/johdac) | `jdach` | Tech Lead / Full-Stack Developer |
| [Busedame](https://github.com/Busedame) | `nholbroo` | Backend Developer |
| [AudreyBil](https://github.com/AudreyBil) | `abillote` | Frontend Developer |

### Responsibilities

**Alexander Schenk — Project Manager / DevOps**
Responsible for the overall backend architecture, monorepo setup, authentication system (JWT, Google OAuth, email confirmation), infrastructure (Docker, Caddy reverse proxy, MinIO), environment configuration, production deployment pipeline, shared `@grit/schema` Zod validation package, performance-oriented bulk seeding, and frontend test suite cleanup.

**Dovi Musulas — Product Owner / Frontend Developer**
Led frontend architecture (Turborepo monorepo, routing, design system, OKLCH color scheme), the login/auth UI, public user profiles with privacy controls, the My Events page redesign, the global search feature (Ctrl+K), avatar image cropping, and Prisma migration workflow improvements.

**Johannes Dach — Tech Lead / Full-Stack Developer**
Implemented the entire real-time chat system (event group chats + direct messages via Socket.IO), the Google Maps geocoding integration for location creation, the Zod + Swagger API documentation setup, the CI/CD deployment workflow to the Hetzner server, and online friend status.

**Natalie Holbrook — Backend Developer**
Implemented the friends system backend, the event invite system (full CRUD, frontend across multiple pages), the advanced permissions system, cursor-based pagination, infinite scroll, frontend and backend E2E test suites (Jest + Playwright).

**Audrey Billoteau — Frontend Developer**
Implemented frontend development for the event and location creation form, events feed page, single event page, file uploads module (BE and FE), the friends frontend, toast notification system, and various UI/UX improvements and bugfixes.

---

## Project Management

### Work Organization

The team organized work around GitHub Issues and Pull Requests. Features were broken into focused PRs with detailed descriptions. Code reviews were required before merging. The team held bi-weekly syncs and worked in parallel across frontend and backend tracks.

### Tools

- **GitHub Issues** — Task tracking, bug reports, feature requests
- **GitHub Pull Requests** — Code review and integration
- **GitHub Actions** — Automated CI pipeline (lint, typecheck, unit tests, integration tests, E2E tests, deployment)
- **Notion** — Technical documentation and notes during early development

### Communication

- **Slack** — Daily communication, code discussion, pair programming coordination

---

## Instructions

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Docker + Docker Compose | Latest | Runs PostgreSQL, MinIO, Caddy |
| Node.js | v20+ | Runtime (via Docker in prod, locally for dev) |
| pnpm | v9+ | Package manager (monorepo workspaces) |
| Make | Any | Task runner |
| Google Cloud account | — | Google OAuth + Maps API keys |
| SMTP credentials | — | Email confirmation (Mailtrap for dev) |

### 1. Clone the repository

```bash
git clone git@github.com:alx-sch/GRIT.git
cd GRIT
```

### 2. Configure environment variables

```bash
make init-env
# Copies .env.example → .env
```

Edit `.env` and fill in the required secrets:

```env
# Database
POSTGRES_DB=your_db_name
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password_min_10_chars

# MinIO (object storage)
MINIO_USER=your_minio_user
MINIO_PASSWORD=your_minio_password_min_10_chars

# Authentication
JWT_SECRET=a_very_long_random_string_at_least_32_chars

# Email (use Mailtrap for development)
MAIL_USER=your_smtp_username
MAIL_PASS=your_smtp_password

# Google OAuth (https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Maps (frontend)
VITE_GOOGLE_MAPS_API=your_google_maps_api_key
```

`APP_BASE_URL` defaults to `https://grit.social`. For local development, leave it unset — the backend derives a fallback from `FE_PORT`.

### 3. Run in development mode

```bash
make dev
```

Starts PostgreSQL and MinIO via Docker, then runs the backend (NestJS watch mode) and frontend (Vite HMR) locally.

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Swagger API docs: `http://localhost:3000/api`
- MinIO Dashboard: `http://localhost:9001`

### 4. Run in production mode (Docker)

```bash
make
# or: make start-local
```

Builds and starts the full stack in Docker with Caddy as the HTTPS reverse proxy.

- App: `https://localhost:8443`
- HTTP (redirects to HTTPS): `http://localhost:8080`

### 5. Seed the database

```bash
make seed
```

Creates demo users (Alice, Bob, and bulk test users), locations, and events for testing.

### 6. Run tests

```bash
make test-be-unit         # Backend unit tests
make test-be-integration  # Backend integration tests
make test-be-e2e          # Backend E2E tests (isolated test DB)
make test-fe-integration  # Frontend integration tests (Vitest)
make test-fe-e2e          # Frontend E2E tests (Playwright)
```

### 7. Stop the project

```bash
make stop    # Stop all containers
make clean   # Stop + remove containers and processes
make fclean  # Full clean including backups
```

---

## Technical Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool and dev server |
| **React Router v7** | Client-side routing with data loaders |
| **TailwindCSS v4** | Utility-first CSS (OKLCH color system) |
| **Radix UI + shadcn/ui** | Accessible, headless component primitives |
| **React Hook Form + Zod** | Form validation |
| **Zustand** | Client-side state management (auth store, chat store) |
| **Socket.IO Client** | Real-time WebSocket communication |
| **@vis.gl/react-google-maps** | Google Maps integration |
| **Sonner** | Toast notification system |
| **Vitest + Testing Library** | Unit and integration tests |
| **Playwright** | End-to-end browser tests |

### Backend

| Technology | Purpose |
|---|---|
| **NestJS v11** | Server framework with dependency injection |
| **TypeScript** | Type safety |
| **Prisma ORM v7** | Database access and schema management |
| **PostgreSQL** | Relational database |
| **Socket.IO** | Real-time WebSocket gateway |
| **Passport.js** | Authentication middleware (JWT + Google OAuth) |
| **Nodemailer** | Transactional email delivery |
| **MinIO (S3-compatible)** | Object storage for images and files |
| **Zod + nestjs-zod** | Request validation and response serialization |
| **Swagger** | Auto-generated API documentation |
| **Jest + Supertest** | Unit, integration, and E2E tests |

### Infrastructure

| Technology | Purpose |
|---|---|
| **Docker + Docker Compose** | Container orchestration |
| **Caddy** | Reverse proxy with automatic HTTPS |
| **pnpm workspaces** | Monorepo package management |
| **Turborepo** | Monorepo build orchestration and caching |
| **GitHub Actions** | CI/CD pipeline (QA + deployment) |
| **Hetzner** | Production server hosting |

### Shared Package

`@grit/schema` — A shared Zod schema package consumed by both the frontend (types) and backend (validation). Prevents schema drift between API request/response contracts.

### Key Technical Decisions

- **PostgreSQL over NoSQL**: The relational data model (Users ↔ Events ↔ Conversations ↔ Friends ↔ EventInvites) maps cleanly to SQL tables with foreign key integrity. Cascade deletes ensure no orphaned data.
- **Prisma ORM**: Type-safe database access, automatic migrations, and a clean schema definition. All user-facing queries use parameterized Prisma Client calls — no raw SQL with user input.
- **MinIO for object storage**: S3-compatible API allows identical code on localhost (MinIO container) and production. Separate buckets for avatars, event images, and event files.
- **Socket.IO over raw WebSockets**: NestJS WebSocket gateway abstraction and built-in room management simplify the chat and presence system significantly.
- **Monorepo with pnpm + Turborepo**: Enables the shared `@grit/schema` package, parallel builds, and consistent tooling across frontend and backend.

---

## Database Schema

### Entity Relationship Overview

```
User ──< Event (author)
User ><─ Event (attending)      via EventAttendee
User ──< Location (author)
Location ──< Event
Event ──< EventFile
Event ──1 Conversation (event chat)
User ──< Conversation (creator)
Conversation ><─ User            via ConversationParticipant
Conversation ──< ChatMessage
User ──< ChatMessage (author)
User ──< FriendRequest (sent)
User ──< FriendRequest (received)
User ><─ User (friends)          via Friends
User ──< EventInvite (sender)
User ──< EventInvite (receiver)
Event ──< EventInvite
```

### Tables

#### `User`
| Field | Type | Notes |
|---|---|---|
| `id` | Int PK | Auto-increment |
| `email` | String UNIQUE | Login email |
| `password` | String? | Nullable for OAuth users |
| `name` | String UNIQUE | Display username |
| `avatarKey` | String? | MinIO object key |
| `bio` | String? | Short biography |
| `city` | String? | City of residence |
| `country` | String? | Country of residence |
| `confirmationToken` | String? UNIQUE | Email verification token |
| `googleId` | String? | Google OAuth ID |
| `isConfirmed` | Boolean | Email verified (default false) |
| `isProfilePublic` | Boolean | Profile visibility (default true) |
| `isAdmin` | Boolean | Admin privileges (default false) |

#### `Event`
| Field | Type | Notes |
|---|---|---|
| `id` | Int PK | Auto-increment |
| `title` | String | Event name |
| `slug` | String UNIQUE | URL-safe identifier (nanoid-collision-safe) |
| `content` | String? | Description |
| `startAt` | DateTime | Start time |
| `endAt` | DateTime | End time |
| `imageKey` | String? | Cover image (MinIO) |
| `isPublished` | Boolean | Draft vs. published |
| `isPublic` | Boolean | Public vs. private |
| `authorId` | Int? FK → User | SetNull on delete |
| `locationId` | Int? FK → Location | SetNull on delete |

#### `EventInvite`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `senderId` | Int FK → User | Cascade delete |
| `receiverId` | Int FK → User | Cascade delete |
| `eventId` | Int FK → Event | Cascade delete |
| `status` | Enum | `PENDING`, `ACCEPTED`, `DECLINED` |
| `createdAt` | DateTime | |

#### `Location`
| Field | Type | Notes |
|---|---|---|
| `id` | Int PK | |
| `name` | String | Venue name |
| `address` | String? | Street address |
| `city` | String? | City |
| `country` | String? | Country |
| `postalCode` | String? | |
| `longitude` | Float | GPS coordinate |
| `latitude` | Float | GPS coordinate |
| `isPublic` | Boolean | |
| `authorId` | Int? FK → User | SetNull on delete |

#### `EventFile`
| Field | Type | Notes |
|---|---|---|
| `id` | Int PK | |
| `fileKey` | String | MinIO object key |
| `bucket` | String | MinIO bucket name |
| `fileName` | String | Original filename |
| `mimeType` | String | MIME type |
| `eventId` | Int FK → Event | Cascade delete |

#### `Conversation`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `type` | Enum | `DIRECT`, `EVENT`, `GROUP` |
| `title` | String? | |
| `createdBy` | Int? FK → User | SetNull on delete |
| `eventId` | Int? UNIQUE FK → Event | Cascade delete |

#### `ConversationParticipant` (join table)
| Field | Type | Notes |
|---|---|---|
| `conversationId` | UUID FK → Conversation | Cascade delete |
| `userId` | Int FK → User | Cascade delete |
| `lastReadAt` | DateTime? | Unread message tracking |

#### `EventAttendee` (join table)
| Field | Type | Notes |
|---|---|---|
| `eventId` | Int FK → Event | Cascade delete |
| `userId` | Int FK → User | Cascade delete |

#### `ChatMessage`
| Field | Type | Notes |
|---|---|---|
| `id` | String PK | |
| `conversationId` | String FK → Conversation | Cascade delete |
| `text` | String | Message content; URLs rendered as links |
| `authorId` | Int? FK → User | SetNull on delete |
| `createdAt` | DateTime | |

#### `FriendRequest`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `requesterId` | Int FK → User | Cascade delete |
| `receiverId` | Int FK → User | Cascade delete |

#### `Friends`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `userId` | Int FK → User | Cascade delete |
| `friendId` | Int FK → User | Cascade delete |

---

## Features List

### Authentication & User Accounts

| Feature | Description | Developer(s) |
|---|---|---|
| Email/password registration | Account creation with Zod-validated fields; auto-login after register | alx-sch, Busedame |
| Email confirmation flow | Cryptographic token sent via SMTP; contextual toasts for all states | alx-sch |
| Google OAuth login | Sign in / sign up via Google OAuth 2.0; auto-generates unique username with nanoid | alx-sch |
| JWT authentication | Stateless auth with Bearer tokens; Zustand + localStorage persistence | alx-sch, johdac, dovy-mus |
| Profile editing | PATCH `/users/me` — bio, city, country, name, avatar, privacy; | dovy-mus |
| Public user profiles | `/users/:id` with hosted events and friendship status | dovy-mus |
| Admin role | `isAdmin` flag; bypasses ownership checks | Busedame |

### Events

| Feature | Description | Developer(s) |
|---|---|---|
| Event creation form | React Hook Form + Zod; auto-save to localStorage; draft/publish workflow | AudreyBil |
| Cover image upload | Drag-and-drop with preview and progress bar; stored in MinIO | AudreyBil |
| PDF / file attachments | Multi-file upload (images, PDFs); thumbnails + lightbox viewer | AudreyBil |
| Event page | Full detail page: edit, delete, share (Web Share API), attend/unattend, chat button | AudreyBil |
| Edit event | Pre-filled form; supports deleting attached files on submission | AudreyBil |
| Delete event | Confirmation dialog; cascades to images, files, attendees, conversation, invites | AudreyBil |
| Attend / Unattend | Toggle attendance; auto-joins/leaves event conversation | AudreyBil, Busedame |
| My Events page | Tabs: Upcoming, Organizing, Invitations, Past | dovy-mus, Busedame |

### Event Invite System

| Feature | Description | Developer(s) |
|---|---|---|
| Send invite | Author (or any user on public events) invites friends via the "Invite" button on the event page | Busedame |
| Friend picker | Searchable list of friends with statuses: Invite / Invited / Already going | Busedame |
| Chat notification | Invited user receives a chat message with a link to the event | Busedame |
| Accept / Decline on event page | Accept/decline dropdown shown to invited users on the single event page | Busedame |
| Invitations tab (My Events) | Shows all pending invitations; clicking navigates to the event | Busedame |
| Invite permissions | Friends-only invites; private events only invitable by author; greyed out otherwise | Busedame |
| Auto-cleanup | Invite deleted on accept, decline, event attendance, or when user/event is deleted | Busedame |

### Event Feed & Search

| Feature | Description | Developer(s) |
|---|---|---|
| Event feed page | Paginated grid of published public events only | AudreyBil |
| Filtering | Filter by date range, location | AudreyBil |
| Sorting | Sort by date (asc/desc), name (A-Z/Z-A), popularity | AudreyBil |
| Keyword search | Debounced input; case-insensitive backend query | AudreyBil |
| Infinite scroll | IntersectionObserver-based auto-load on scroll | Busedame |
| Cursor-based pagination | Scalable `(startAt, id)` cursor; no drift on concurrent mutations | Busedame |
| Global search (⌘K) | Command-palette; parallel event + user search; debounce + AbortSignal; URL sync | dovy-mus |

### Locations

| Feature | Description | Developer(s) |
|---|---|---|
| Location creation | Modal form with name, address, city, country, postal code | AudreyBil |
| Google Maps geocoding | Address search autocomplete populates lat/lng | johdac |
| Google Maps preview | Click location on event page → map dialog with directions link | AudreyBil |
| Location infinite scroll | Scroll-event-based pagination in combobox dropdown | Busedame |

### Chat

| Feature | Description | Developer(s) |
|---|---|---|
| Event group chat | Dedicated chat room per event; only attendees can access | johdac |
| Direct messages | 1-to-1 conversations created on demand | johdac |
| Real-time delivery | Socket.IO rooms; `userId → socketId` map for instant routing | johdac |
| Chat overview | Sidebar sorted by latest message; event metadata shown | johdac |
| Unread indicators | Orange dot on navbar; "new messages" banner when scrolled up | johdac |
| Message history | Lazy-load older messages on scroll to top | johdac |
| `lastReadAt` tracking | Per-user read receipts in `ConversationParticipant` | johdac |
| Room resync | Socket rooms updated instantly on attend/leave event | johdac |
| Clickable URLs | Chat message text URLs rendered as clickable `<a>` links | Busedame |
| Deleted user handling | Messages from deleted users shown as unclickable "unknown" | alx-sch |

### Friends

| Feature | Description | Developer(s) |
|---|---|---|
| Send friend request | Stored in `FriendRequest` table | Busedame |
| Accept / Decline request | Accept creates `Friends` record; deletes request | Busedame |
| Cancel sent request | Sender can retract a pending request | alx-sch |
| Remove friend | Deletes `Friends` record | Busedame |
| Friends page | Three sections: search, incoming requests, confirmed friends | AudreyBil |
| Sort friends | A→Z / Z→A alphabetical sort button on My Friends page | Busedame |
| Friendship status API | Returns `none` / `pending_sent` / `pending_received` / `friends` / `self` | dovy-mus |
| Online status | Friends overview shows live presence via WebSocket | johdac |
| Polling fallback | Friends page re-validates every 30s | AudreyBil |

### Infrastructure & Developer Experience

| Feature | Description | Developer(s) |
|---|---|---|
| Monorepo (pnpm + Turborepo) | Shared `@grit/schema` Zod package; parallel builds | dovy-mus, alx-sch |
| Docker Compose | PostgreSQL, MinIO, Caddy, Backend, Frontend in one compose file | alx-sch, johdac |
| Caddy reverse proxy | Automatic HTTPS; HTTP → HTTPS redirect; proxies API and static assets | alx-sch |
| Environment agnostic | Works on localhost, GitHub Codespaces, and production with one `.env` | alx-sch |
| Swagger API docs | Auto-generated from Zod schemas via nestjs-zod | johdac |
| CI pipeline | 3-stage GitHub Actions: lint/typecheck → unit/integration → E2E | johdac, dovy-mus |
| CD pipeline | On merge to `main`, SSH into Hetzner, pull, migrate, restart | johdac |
| Playwright artifacts | HTML test report uploaded on pass and fail (7-day retention) | dovy-mus |
| Prisma migrations | `make db` applies migrations; `make create-migration` names from git branch | dovy-mus |
| Bulk seeding | `createMany` bulk inserts; 1000+ test users, events, friendships; skips existing data | alx-sch |

---

## Modules

> Major module = 2 pts | Minor module = 1 pt | Required total: 14 pts
>
> Detailed documentation for each module: [`docs/modules/`](./docs/modules/)

| # | Module | Category | Type | Points | Status | Developer(s) |
|---|---|---|---|---|---|---|
| 1 | [Use a framework for both the frontend and backend](./docs/modules/01-framework.md) | IV.1 | Major | 2 | Done | alx-sch, dovy-mus |
| 2 | [Standard user management and authentication](./docs/modules/02-user-management.md) | IV.3 | Major | 2 | Done | alx-sch, dovy-mus, AudreyBil |
| 3 | [Implement real-time features using WebSockets](./docs/modules/03-websockets.md) | IV.1 | Major | 2 | Done | johdac |
| 4 | [Allow users to interact with other users](./docs/modules/04-user-interaction.md) | IV.1 | Major | 2 | Done | Busedame, AudreyBil, johdac, dovy-mus |
| 5 | [Advanced permissions system](./docs/modules/05-permissions.md) | IV.3 | Major | 2 | Done | Busedame |
| 6 | [Use an ORM for the database](./docs/modules/06-orm.md) | IV.1 | Minor | 1 | Done | alx-sch, Busedame |
| 7 | [Custom-made design system](./docs/modules/07-design-system.md) | IV.1 | Minor | 1 | Done | dovy-mus, AudreyBil |
| 8 | [Implement remote authentication with OAuth 2.0](./docs/modules/08-oauth.md) | IV.3 | Minor | 1 | Done | alx-sch |
| 9 | [Implement advanced search functionality](./docs/modules/09-search.md) | IV.1 | Minor | 1 | Done | AudreyBil, Busedame, dovy-mus |
| 10 | [File upload and management system](./docs/modules/10-file-upload.md) | IV.1 | Minor | 1 | Done | AudreyBil, alx-sch |
| 11 | [A complete notification system](./docs/modules/11-notifications.md) | IV.1 | Minor | 1 | Done | johdac, AudreyBil |
| 12 | [Module of choice — Monorepo](./docs/modules/12-monorepo.md) | IV.10 | Minor | 1 | Done | dovy-mus, alx-sch |
| 13 | [Module of choice — Google Maps API](./docs/modules/13-google-maps.md) | IV.10 | Minor | 1 | Done | johdac, AudreyBil |
| 14 | [Module of choice — CI/CD](./docs/modules/14-cicd.md) | IV.10 | Minor | 1 | Done | johdac, alx-sch, dovy-mus |

**Total: 19 pts** (5 Major × 2 + 9 Minor × 1)

---

## Individual Contributions

### Alexander Schenk (`alx-sch` / `aschenk`)

**Infrastructure & DevOps**
- Designed the Docker Compose stack (Caddy + MinIO + PostgreSQL + backend + frontend)
- Implemented environment-agnostic networking — same Docker image works on localhost, GitHub Codespaces, and production
- Built the shared `@grit/schema` Zod validation package and fixed the production Docker build for pnpm monorepos using `pnpm deploy`
- Configured Caddy as the reverse proxy with automatic HTTPS
- Authored the `.env.example` template with detailed per-environment documentation

**Authentication**
- JWT authentication backend (Passport JWT strategy)
- User registration with bcrypt password hashing
- Email confirmation flow using Nodemailer + Mailtrap (cryptographic tokens; contextual toasts for all states)
- Google OAuth 2.0 integration (passport-google-oauth20); unique username generation with nanoid and recursive collision retry

**Features & Fixes**
- MinIO image storage infrastructure for avatars and event covers
- Cancel friendship request (sender can retract pending requests)
- Fixed the "My Events" query to include events the user organizes but does not attend
- Frontend test suite cleanup: resolved hydration warnings, accessibility warnings, and `act()` violations in Vitest
- Performance-oriented bulk seeding using `createMany` — 1000+ test users, events, and friendships for realistic load testing

**Challenges**
Google OAuth redirection required careful env var design. The root cause was `FRONTEND_URL` being hardcoded while production needs a dynamic base URL. The fix was replacing it with `APP_BASE_URL`, falling back to a value derived from `FE_PORT`, making the callback URL work identically everywhere.

---

### Dovi Musulas (`dovy-mus` / `dmusulas`)

**Frontend Architecture**
- Set up Turborepo monorepo with Vite, React Router v7, TailwindCSS v4 (OKLCH color system), centralized routing
- Frontend testing infrastructure (Vitest + Testing Library)
- ESLint, Prettier, TypeScript configuration

**Features**
- Login/auth UI and routing (ProtectedLayout, redirect after login)
- Public user profiles (`/users/:id`) with privacy controls, hosted events, friendship actions
- My Events page redesign (tabs: Upcoming / Organizing / Invitations / Past)
- Avatar image cropping with react-easy-crop
- Global search command palette (⌘K / Ctrl+K) with debouncing, AbortSignal, URL sync
- Centralized `UserAvatar` component

**DevOps**
- Fixed Prisma migration workflow (dotenv loading order bug)
- `make create-migration` with auto-naming from git branch
- Improved CI: frontend integration vs. E2E separation; Playwright HTML artifact upload

**Challenges**
The Prisma config had a subtle dotenv loading order bug — ES module imports are hoisted before `dotenv` loads, causing Zod validation to always run against empty variables. Fixed by switching to explicit `require('dotenv').config({ path: rootEnvFile })`.

---

### Audrey Billoteau (`AudreyBil` / `abillote`)

**Event Creation & Management**
- Full event creation form (React Hook Form + Zod, auto-save to localStorage, draft/publish workflow)
- Conditional toast messages: different feedback for saving as draft vs. publishing
- Image upload with drag-and-drop, preview, and progress bar
- PDF and multi-file attachment support with a reusable `FileUpload` component
- Single event page: edit, delete (with confirmation dialog), share (Web Share API), location map preview, attend/unattend, file gallery with lightbox

**Friends Frontend**
- Friends page with search, incoming requests, and confirmed friends sections
- Polling-based refresh (every 30s via `useRevalidator`)
- Toast notifications for all friend actions; alert dialog for destructive actions
- "Friends going" section on event cards — fetches all friends via repeated paginated API calls if the friend list is large

**Event Feed & UI**
- Connected event feed to backend API via React Router data loaders
- Sorting, filtering, and debounced keyword search
- Numerous responsive design fixes and UI polish PRs

**Challenges**
- Learning Typescript and React in a few weeks

---

### Natalie Holbrook (`Busedame` / `nholbroo`)

**Event Invite System**
- Designed and implemented the `EventInvite` Prisma model with `InviteStatus` enum (`PENDING`, `ACCEPTED`, `DECLINED`)
- Full CRUD API: send, update (accept/decline), delete, list incoming/outgoing invites
- Frontend: "Invite" button on single event page with searchable friend picker showing statuses (Invite / Invited / Already going)
- Chat message automatically sent to invited user containing a link to the event
- Accept/decline dropdown on the single event page for invited users
- Invitations tab in My Events page; clicking navigates to the event
- Invite permission rules: friends-only, private events restricted to author, greyed-out state for disallowed actions
- Cascade delete: invites removed when user, event, or invitation is accepted/declined

**Friends System Backend**
- Designed `FriendRequest` and `Friends` Prisma models; all lifecycle endpoints
- Sort button (A→Z / Z→A) on My Friends page
- Clickable URL rendering in chat messages
- Cascading delete of all user data on account deletion

**Permissions & Testing**
- Advanced permissions system: role-based access (admin, event author, attendee, invited)
- Private event visibility: hidden from feed; 404 for unauthorized access
- Established Jest E2E test structure with isolated test DB, `beforeEach` DB clean/seed, full controller-path coverage
- Fixed race condition: `afterEach(() => app.close())` prevents pg connection pool leaks between test suites

**Pagination**
- Cursor-based pagination with `(startAt, id)` base64-encoded cursor
- Custom `useInfiniteScroll` hook; IntersectionObserver for event feed; scroll listener for location dropdowns

**Challenges**
The event invite system required changes across the entire stack — new Prisma model, NestJS module, multiple frontend pages, and permission logic that interacts with existing attendance and friends systems. The trickiest part was ensuring all edge cases (private events, already-attending users, deleted events) were handled consistently without breaking existing features.

---

### Johannes Dach (`johdac` / `jdach`)

**Real-Time Chat System**
- Full Socket.IO gateway: per-user socket registration, `userId → socketId` map, JWT middleware on handshake
- Event group chats and 1-to-1 direct messages
- Room synchronization when users attend/leave events (`resyncUserRooms()`)
- `lastReadAt` tracking, unread indicators, new message banner, lazy-load history
- Chat overview sidebar with event metadata; window event dispatch for real-time conversation list updates

**Other Features**
- Google Maps geocoding integration for location creation
- Zod + Swagger API documentation setup (nestjs-zod)
- Online friends status via WebSocket presence detection
- CI/CD deployment workflow: GitHub Actions → SSH into Hetzner → `make stop && make start-prod` → Prisma migrations

**Challenges**
Integrating room resynchronization between the HTTP attendance service and the WebSocket gateway required careful NestJS module architecture to avoid circular dependencies.

---

## Resources

### Documentation & Frameworks

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma ORM Docs](https://www.prisma.io/docs/)
- [React Router v7 Docs](https://reactrouter.com/en/main)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Zod Documentation](https://zod.dev/)
- [TailwindCSS v4 Docs](https://tailwindcss.com/docs)
- [Radix UI Docs](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [Vite Docs](https://vitejs.dev/guide/)
- [Caddy Documentation](https://caddyserver.com/docs/)
- [MinIO Documentation](https://min.io/docs/)
- [Turborepo Docs](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Docs](https://www.passportjs.org/docs/)
- [Sonner Toast Library](https://sonner.emilkowal.ski/)

### AI Usage

AI tools (primarily **Claude** and **GitHub Copilot**) were used throughout the project as a development aid:

- **Documentation**: Drafting the project license explanation, generating this README from PR history and codebase analysis
- **Code review**: Identifying potential issues in service logic and suggesting improvements
- **Problem solving**: Getting unstuck on specific technical questions

No AI was used to bypass understanding — every PR was reviewed by at least one other team member before merging.

---

## License

GRIT is licensed under the [GNU Affero General Public License v3.0](./LICENSE).

The AGPL closes the "SaaS loophole": any party running a modified version of GRIT over a network must make their source code available to users.
