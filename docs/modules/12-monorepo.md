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

A monorepo is the right choice when multiple projects share code and need to stay in sync. In GRIT, both the frontend and backend consume the same Zod validation schemas. Without a monorepo, keeping these schemas synchronized requires publishing a package or copy-pasting — both error-prone. With a monorepo, a schema change in `@grit/schema` immediately affects both apps, and a TypeScript compile error in either is caught before merging.

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
