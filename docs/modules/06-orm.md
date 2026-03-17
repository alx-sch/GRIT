# Module 06 — Use an ORM for the Database

| Attribute | Value |
|---|---|
| **Category** | IV.1 |
| **Type** | Minor |
| **Points** | 1 |
| **Status** | Done |
| **Developers** | alx-sch (setup, production build), Busedame (schema evolution, test isolation) |

---

## Description

Use an ORM (Object-Relational Mapper) to interact with the PostgreSQL database instead of writing raw SQL queries.

---

## Justification

An ORM provides type-safe database access, automatic schema migrations, and protection against SQL injection by default. Prisma's schema-first approach also serves as the single source of truth for the database structure, making it easy to understand relationships at a glance. The generated TypeScript client makes database access feel like working with typed objects, not SQL strings.

---

## Implementation

### ORM: Prisma v7

**Prisma** was chosen for:
- **Type safety**: The generated Prisma Client provides TypeScript types derived directly from the schema. Accessing a non-existent field is a compile-time error.
- **Schema as documentation**: `schema.prisma` is the authoritative definition of all tables, columns, and relationships.
- **Migration system**: `prisma migrate dev` creates timestamped, versioned SQL migration files. `prisma migrate deploy` applies them in production.
- **Parameterized queries by default**: All Prisma Client queries are parameterized — user input never reaches a SQL string. The only `$queryRaw` in the codebase is the health-check `SELECT 1` in `app.service.ts`, which contains no user input.

### Database Adapter

Prisma uses `@prisma/adapter-pg` with a `pg` connection pool:

```ts
const pool = new Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);
this.prisma = new PrismaClient({ adapter });
```

### Key Schema Design Decisions

- **SetNull on author delete**: When a user is deleted, their events and locations remain in the database with `authorId = null`, preserving community content.
- **Cascade on event delete**: When an event is deleted, its conversation, attendees, files, and invites are all cascade-deleted.
- **Explicit join tables**: `EventAttendee` and `ConversationParticipant` are explicit (not implicit) join tables, allowing metadata (`lastReadAt`) to be stored on the relationship.
- **EventInvite model**: Added late in the project; uses an `InviteStatus` enum (`PENDING`, `ACCEPTED`, `DECLINED`) and cascades on user or event deletion.

### Migrations

```bash
make db               # Apply all pending migrations (development)
make create-migration # Create a new migration (name derived from git branch)
# In CI/CD:
prisma migrate deploy # Apply pending migrations in production
```

The `create-migration` target extracts the last segment of the current git branch and uses it as the migration name:

```makefile
MIGRATION_NAME := $(shell git rev-parse --abbrev-ref HEAD | sed 's|.*/||' | tr '-' '_')
create-migration:
    cd $(BACKEND_FOLDER) && prisma migrate dev --name $(MIGRATION_NAME)
```

### Bulk Operations for Performance

For large seeding operations, `prisma.createMany()` is used instead of individual `create()` calls:

```ts
// Seed 1000 test users efficiently
await this.prisma.user.createMany({
  data: testUsers,
  skipDuplicates: true,  // Idempotent — safe to re-run
});
```

This reduces seeding time from minutes to seconds for large datasets.

### Test Database Isolation

E2E tests run against a separate database (`<DB_NAME>_test`). The `DATABASE_URL` is constructed at runtime by appending `_test` when `NODE_ENV=test`:

```ts
const dbName = process.env.POSTGRES_DB + (process.env.NODE_ENV === 'test' ? '_test' : '');
```

A `cleanDb()` helper truncates all tables between test suites without re-running migrations, and `afterEach(() => app.close())` releases the connection pool to prevent race conditions between parallel test suites.
