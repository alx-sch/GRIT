# Module 12 — Module of Choice: Monorepo

| Attribute      | Value                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Category**   | IV.10                                                                                                            |
| **Type**       | Minor                                                                                                            |
| **Points**     | 1                                                                                                                |
| **Status**     | Done                                                                                                             |
| **Developers** | dovy-mus (Turborepo setup, migration tooling), alx-sch (pnpm workspace config, shared package, production build) |

---

## Description

A monorepo architecture using **pnpm workspaces** and **Turborepo**, hosting the frontend, backend, and a shared schema package in a single repository with unified tooling, shared dependencies, and optimized parallel builds.

---

## Justification

### Why we chose this module

GRIT is a full-stack application where the frontend and backend share a contract: every API request and response has a shape that both sides must agree on. In a standard multi-repo setup this contract is either duplicated (copy-paste) or published as a versioned package — both approaches introduce drift, lag, and human error. A monorepo with a shared package eliminates the problem entirely.

### Technical challenges it addresses

**Schema synchronization across the stack.** Both the NestJS backend and the React frontend import from `@grit/schema`, a shared Zod package. A single field rename in a schema produces a TypeScript compile error in both apps simultaneously — it is impossible to ship a breaking API change without fixing both sides first. This would be unachievable in a multi-repo setup without a cumbersome publish-and-bump cycle.

**Production Docker builds with pnpm workspaces.** Standard `COPY . .` Docker patterns break when workspace packages use symlinks. Solving this required using `pnpm deploy` to produce a flat, symlink-free `node_modules` for the backend image — a non-trivial build engineering problem specific to the monorepo architecture.

**Coordinated tooling across packages.** Turborepo's dependency graph (`"dependsOn": ["^build"]`) ensures `@grit/schema` is always compiled before any app attempts to build or typecheck, preventing a whole class of CI failures that occur when build order is undefined.

### Value added to the project

- **Type safety across the entire stack** — validated at compile time, not at runtime
- **Single source of truth** for all API contracts — one change propagates everywhere
- **Unified developer experience** — one `pnpm install`, one lint command, one CI pipeline covering all packages
- **Faster CI** via Turborepo remote caching, which skips redundant builds when inputs have not changed

---

## Implementation

### Repository Structure

```
/
├── apps/
│   ├── backend/        @grit/backend  — NestJS API
│   └── frontend/       @grit/frontend — React + Vite
├── packages/
│   └── schema/         @grit/schema   — Shared Zod schemas
├── docs/
│   └── modules/        — Module documentation (this file)
├── pnpm-workspace.yaml
├── turbo.json
├── package.json        (root — dev tooling only)
└── Makefile
```

### pnpm Workspaces

`pnpm-workspace.yaml` declares all workspace packages:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Apps import the shared package as a workspace dependency:

```json
"dependencies": {
  "@grit/schema": "workspace:^"
}
```

pnpm hoists shared dependencies to the root `node_modules`, deduplicating them across packages.

### Shared Package: `@grit/schema`

```
packages/schema/src/
├── event/       req.ts, res.ts
├── user/        req.ts, res.ts
├── auth/        req.ts, res.ts
├── location/    req.ts, res.ts
├── friend/      req.ts, res.ts
├── invite/      req.ts, res.ts
└── index.ts     Re-exports all schemas and types
```

- **Backend** imports schemas for request validation via `nestjs-zod`.
- **Frontend** imports inferred TypeScript types (`z.infer<typeof Schema>`) for type-safe API calls.

A breaking API change (e.g., renaming a field) causes a TypeScript compile error in both apps simultaneously — impossible to miss.

### Turborepo

```json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "lint": {}
  }
}
```

The `^build` dependency ensures `@grit/schema` is always compiled before any app attempts to build. Remote caching skips redundant builds when inputs haven't changed.

### Production Docker Build

The standard `COPY . .` approach breaks with pnpm workspaces because symlinks between workspace packages don't resolve correctly in a container.

**Solution:** `pnpm deploy` — resolves all workspace dependencies for a specific package, copies only relevant source files, installs production dependencies only, and produces a flat `node_modules` without symlinks:

```dockerfile
RUN pnpm --filter @grit/backend deploy /app/deploy
WORKDIR /app/deploy
RUN node_modules/.bin/nest build
```

This produces a minimal Docker image containing only the backend code and production dependencies, with the Prisma Client binary correctly included.

### Prisma Migration Tooling

The `make create-migration` target auto-derives the migration name from the current git branch:

```makefile
MIGRATION_NAME := $(shell git rev-parse --abbrev-ref HEAD | sed 's|.*/||' | tr '-' '_')
create-migration:
    cd $(BACKEND_FOLDER) && prisma migrate dev --name $(MIGRATION_NAME)
```

Example: branch `nat/fea/invite-friends-to-event` → migration name `invite_friends_to_event`.
