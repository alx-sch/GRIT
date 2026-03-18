# Module 14 — Custom Module: CI/CD

| Attribute      | Value                                                                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**   | IV.10                                                                                                                                                                                           |
| **Type**       | Minor                                                                                                                                                                                           |
| **Points**     | 1                                                                                                                                                                                               |
| **Status**     | Done                                                                                                                                                                                            |
| **Developers** | johdac (CD pipeline, Hetzner deployment), alx-sch (Docker production build, environment config, test suite cleanup), dovy-mus (CI pipeline improvements, test separation, Playwright artifacts) |

---

## Description

A fully automated CI/CD pipeline using GitHub Actions: a 3-stage quality assurance pipeline that blocks merges on failure, and a continuous deployment pipeline that automatically deploys to a Hetzner production server on every push to `main`.

---

## Justification

### Why we chose this module

GRIT is developed by a 5-person team working in parallel feature branches. Without automated quality gates, broken code reaches `main` silently, regressions go undetected until manual testing, and deployments require someone to SSH into the server and run commands by hand. A CI/CD pipeline was not a convenience — it was a prerequisite for the team to work at speed without constantly breaking each other's work.

### Technical challenges it addresses

**Multi-stage CI with strict sequencing.** The pipeline runs three sequential stages — lint/typecheck, then unit/integration tests, then E2E tests — where a failure in any stage blocks all later stages. This required careful separation of test types: frontend integration tests (Vitest) and frontend E2E tests (Playwright) run in separate CI jobs to prevent Playwright from executing twice, which was a real bug in an earlier version of the pipeline.

**Reliable PostgreSQL readiness checks in CI.** The backend E2E tests require a running, authenticated PostgreSQL instance. Using `pg_isready` (the common solution) only confirms TCP connectivity, not that the server accepts authenticated connections. The pipeline uses `psql -c '\q'` instead, which verifies a full authenticated connection — a subtle but important distinction that prevented flaky test runs.

**Playwright cross-browser in a headless Linux CI environment.** Running Playwright on Linux requires specific system library dependencies. The pipeline runs `playwright install --with-deps` unconditionally (rather than guarding with `ldconfig`) to ensure no system library is silently missing, which would cause tests to fail with cryptic errors.

**Zero-downtime continuous deployment.** The CD pipeline SSHs into the Hetzner production server, hard-resets to `origin/main`, rebuilds Docker images, applies pending Prisma migrations, and restarts all services — all in a single automated sequence triggered by every push to `main`. Coordinating migration application with container restart (migrations must run before the new backend starts serving traffic) required careful ordering in the `Makefile`.

**Isolated test database.** Backend E2E tests run against a dedicated test database that is initialised from scratch on each CI run. This prevents test pollution from affecting the development database and ensures tests are fully reproducible.

### Value added to the project

- **Merge confidence** — no code reaches `main` without passing lint, type checking, unit, integration, and E2E tests
- **Deployment safety** — every production deployment is identical and reproducible; no manual steps, no forgotten environment variables
- **Team velocity** — 5 developers can merge independently without a manual integration phase
- **Regression detection** — Playwright HTML reports are uploaded as artifacts on both pass and fail, making failures immediately diagnosable

---

## Implementation

### CI Pipeline — Quality Assurance

Defined in `.github/workflows/ci.yml`. Runs on every pull request and push to `main`. Three sequential stages — a later stage only runs if all earlier stages pass.

#### Stage 1: Linting & Type Checking (parallel)

- `make lint` — ESLint across frontend and backend
- `make typecheck` — `tsc --noEmit` across all packages via Turborepo

#### Stage 2: Unit & Integration Tests (parallel)

- `make test-be-unit` — Backend unit tests (Jest, `*.spec.ts`)
- `make test-be-integration` — Backend integration tests (Jest, `*.int.spec.ts`)
- `make test-fe-integration` — Frontend integration tests (Vitest) — **separate from E2E** to avoid running Playwright twice

#### Stage 3: End-to-End Tests

- `make test-be-e2e` — Backend E2E tests against an isolated test database
- `make test-fe-e2e` — Frontend E2E tests via Playwright (real Chromium browser)

Playwright HTML reports are uploaded as GitHub Actions artifacts (7-day retention) on both pass and fail.

#### Key CI Design Decisions

- Frontend integration tests and E2E tests are **separate CI jobs**. An earlier version ran both in the same job, causing Playwright to run twice.
- Backend E2E tests use `psql -c '\q'` for PostgreSQL readiness checks instead of `pg_isready` — the latter only confirms TCP is open, not that the server accepts authenticated connections.
- On Linux, Playwright runs `playwright install --with-deps` unconditionally (no `ldconfig` guard that could silently skip missing system libraries).
- Frontend test suite cleaned up to remove hydration warnings, accessibility warnings, and `act()` violations, leaving only expected 404 warnings from unauthenticated redirects.

### CD Pipeline — Continuous Deployment

Defined in `.github/workflows/cd.yml`. Triggers on push to `main`.

#### Deployment Steps

1. **SSH into Hetzner** using a stored SSH key (GitHub Actions secret).
2. **Fetch and hard reset** to match remote exactly: `git fetch origin main && git reset --hard origin/main`
3. **Stop**: `make stop`
4. **Build and restart**: `make start-prod`
   - Rebuilds Docker images from the new code.
   - Applies any pending Prisma migrations automatically.
   - Starts all services (backend, frontend assets, PostgreSQL, MinIO, Caddy).

### Production Infrastructure (Docker)

```
services:
  postgres   — PostgreSQL database
  minio      — MinIO object storage
  backend    — NestJS (built with pnpm deploy)
  caddy      — Reverse proxy (HTTPS, static files, MinIO proxy)
```

**Caddy** handles:

- HTTPS termination (Let's Encrypt for production, self-signed for localhost)
- HTTP → HTTPS redirect
- Reverse-proxying `/api/*` to NestJS backend
- Serving Vite-built frontend static assets
- Proxying MinIO file requests (avatars, event images) to the MinIO container

**Environment variables** are injected as GitHub repository secrets in CI/CD — never from a `.env` file in production.

### Bulk Seeding for Realistic Testing

The seeding script uses `createMany()` bulk inserts to create 1000+ test users, events, locations, and friendships efficiently:

```ts
await this.prisma.user.createMany({
  data: testUsers,
  skipDuplicates: true, // Idempotent — safe to re-run
});
```

This reduced seeding time from several minutes to seconds for large datasets, making load testing and evaluation setup much faster.

### Makefile Integration

```makefile
test-be-unit:
    cd $(BACKEND_FOLDER) && pnpm test:unit

test-be-e2e: start-postgres test-be-testdb-init
    cd $(BACKEND_FOLDER) && pnpm test:e2e

test-fe-integration:
    cd $(FRONTEND_FOLDER) && pnpm test:integration

test-fe-e2e: install-playwright
    cd $(FRONTEND_FOLDER) && pnpm exec playwright test

start-prod:
    $(DC) up --build -d
    $(DC) exec backend npx prisma migrate deploy
```
