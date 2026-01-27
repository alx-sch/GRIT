# Agent Guide for GRIT Monorepo

This documentation provides essential context, commands, and standards for AI agents operating within the GRIT codebase.

## 1. Project Structure

- **Monorepo Manager:** TurboRepo + pnpm
- **Apps:**
  - `apps/backend`: NestJS application (API).
  - `apps/frontend`: React + Vite application (UI).
- **Packages:**
  - `packages/schema`: Shared Zod schemas and types.
- **Root Configuration:** `turbo.json`, `pnpm-workspace.yaml`, `Makefile`.

## 2. Build, Lint, and Test Commands

### Global Commands (Root)

- **Install Dependencies:** `pnpm install` (or `make install`)
- **Build All:** `turbo build` (or `make build`)
- **Lint All:** `turbo lint` (or `make lint`)
- **Typecheck All:** `turbo typecheck` (or `make typecheck`)
- **Format All:** `prettier --write .` (or `make format`)

### Backend (`apps/backend`)

- **Framework:** NestJS
- **Run Development:** `pnpm --filter @grit/backend start:dev` (or `make dev-be`)
- **Run Single Test:** `pnpm --filter @grit/backend test -- <path/to/file.spec.ts>`
- **Run All Tests:** `pnpm --filter @grit/backend test`
- **Run E2E Tests:** `pnpm --filter @grit/backend test:e2e`

### Frontend (`apps/frontend`)

- **Framework:** React + Vite
- **Run Development:** `pnpm --filter @grit/frontend dev` (or `make dev-fe`)
- **Run Single Test:** `pnpm --filter @grit/frontend test -- <path/to/file.test.tsx>`
- **Run All Tests:** `pnpm --filter @grit/frontend test`

### Makefile Shortcuts

The `Makefile` in the root is a primary interface for human developers.

- `make dev`: Starts both backend and frontend in dev mode.
- `make db`: Starts Postgres and MinIO, pushes Prisma schema, and seeds data.
- `make clean`: Cleans build artifacts and node_modules.

## 3. Code Style & Conventions

### General

- **Formatting:** Prettier is strictly enforced. Run `make format` before committing.
- **Linting:** ESLint with `typescript-eslint` rules.
- **Path Aliases:** Use `@/` aliases for imports within apps (e.g., `import { User } from '@/user/user.entity'`).

### Backend (NestJS)

- **File Naming:** `kebab-case` (e.g., `auth.service.ts`, `user.controller.ts`).
- **Class Naming:** `PascalCase` (e.g., `AuthService`, `UserController`).
- **Method Naming:** `camelCase`.
- **DTOs:** Use strict DTOs with Zod validation. Use `create` static methods for response DTOs if applicable.
- **Error Handling:** Use standard NestJS exceptions (`NotFoundException`, `UnauthorizedException`).
- **Dependency Injection:** Use constructor injection with `private readonly`.
- **Imports:** Group NestJS imports, then internal imports (`@/...`), then third-party.

### Frontend (React)

- **File Naming:** `kebab-case` for files (e.g., `theme-provider.tsx`, `button.tsx`).
- **Component Naming:** `PascalCase` for component functions.
- **Exports:** Prefer named exports over default exports.
- **Hooks:** Custom hooks should start with `use`.
- **Styling:** Tailwind CSS is used (implied by `tailwindcss` dependency).
- **State:** Zustand is used for global state management.

### Shared Packages

- **Schema:** modifications to `packages/schema` require a build step or reinstall to be reflected in consuming apps if they are not using TypeScript project references strictly.

## 4. Testing Guidelines

- **Unit Tests:** Co-locate with source files (e.g., `auth.service.spec.ts` next to `auth.service.ts`).
- **Integration Tests:** backend integration tests are often in `test/` or marked with specific jest projects.
- **Mocking:** Use `jest.mock` or NestJS `Test.createTestingModule` for backend mocking.
- **Safety:** Always run tests relevant to your changes before submitting.

## 5. Environment Variables

- **.env:** Managed via `make init-env` (copies `.env.example` to `.env`).
- **Validation:** Checked at startup. Ensure new env vars are added to `.env.example` and validation schemas.
