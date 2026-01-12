closes #54 and closes #47 too because it was easy fix.

## Dovy's summary

- added testing run with `pnpm run test` inside frontend app or run `pnpm run test:ui` to see another nice dashboard
-

## AI summary

This pull request introduces several improvements to the frontend codebase, focusing on UI consistency, environment configuration, navigation structure, and developer tooling. Notable updates include a new environment variable validation system, a unified navigation config, enhanced UI styling with new color and shadow systems, and the addition of frontend testing infrastructure.

### Environment and Configuration

- Added a new `env.ts` file that validates frontend environment variables at runtime using Zod, ensuring required variables like `VITE_API_BASE_URL` and `VITE_APP_NAME` are present and correctly formatted
- Updated `.env.example` to include frontend-specific variables for API base URL and app name, improving developer onboarding.

### Navigation and Routing

- Centralized navigation configuration into a `navConfig` array in `router.tsx`, making navigation links a single source of truth and updating the `Navbar` component to use this config for consistency.
- Enhanced route definitions to include a `handle` property for route titles, supporting better metadata management.

### UI and Design System Enhancements

- Switched to OKLCH color space for all CSS color variables, introduced new shadow variables (`--shadow-grit`), and updated container, button, card, and input components for improved consistency and accessibility.
- Updated layout components to use the new `Container` abstraction with customizable element type and responsive paddings.

### Testing and Developer Tooling

- Added Vitest and Testing Library dependencies, created a sample test for the `Button` component, and removed the old dummy test, establishing a foundation for frontend testing.
- Updated ESLint config to ignore coverage files, reducing noise in linting results.

### Minor Improvements

- Minor UI tweaks, such as background color adjustments for empty event states.
