# Module 07 — Custom-Made Design System

| Attribute | Value |
|---|---|
| **Category** | IV.1 |
| **Type** | Minor |
| **Points** | 1 |
| **Status** | Done |
| **Notes** | 10+ reusable components |
| **Developers** | dovy-mus (system architecture, OKLCH color scheme), AudreyBil (component library, UI refinements) |

---

## Description

A cohesive, custom design system built on TailwindCSS v4 and Radix UI primitives, providing 10+ reusable, accessible, and composable UI components used consistently throughout the application.

---

## Justification

A design system prevents visual inconsistency, reduces duplicated styling logic, and allows every team member to build new pages quickly without reinventing layout patterns. Building on accessible primitives (Radix UI) instead of from scratch ensures keyboard navigation and screen reader support without extra effort.

---

## Implementation

### Foundation: TailwindCSS v4 with OKLCH Colors

GRIT uses **TailwindCSS v4** with a custom **OKLCH color space** instead of the default HSL/RGB system.

OKLCH was chosen because:
- Colors are represented closer to how human vision perceives them, producing more perceptually uniform scales.
- Color manipulation (lightening, darkening) is predictable without unexpected hue shifts.
- Better rendering on wide-gamut (P3) displays common on modern hardware.

```css
:root {
  --background: oklch(100% 0 0);
  --foreground: oklch(15% 0.02 240);
  --primary: oklch(55% 0.18 240);
  --shadow-grit: 0 4px 24px oklch(0% 0 0 / 0.08);
}
.dark {
  --background: oklch(12% 0.02 240);
  --foreground: oklch(95% 0.01 240);
}
```

### Component Architecture: shadcn/ui Pattern

Components follow the **shadcn/ui** pattern: Radix UI primitives wrapped in Tailwind classes, **copied into the codebase** (not a package dependency). This gives full ownership — any component can be modified without fighting a library API.

Components live in `apps/frontend/src/components/ui/`.

### Core Components (10+)

| Component | Description |
|---|---|
| `Button` | Variant system (default, outline, ghost, destructive) with `size` and `asChild`. Always sets `type` attribute to prevent accidental form submissions. |
| `Input` | Styled input with optional `clearable` prop (shows ×). |
| `Textarea` | Auto-styled multi-line input. |
| `Dialog` | Modal dialog via `@radix-ui/react-dialog`. Used for confirmations, location preview, invite modal. |
| `AlertDialog` | Destructive confirmation dialog (e.g., "Delete event?", "Remove friend?"). |
| `DropdownMenu` | Context menus via `@radix-ui/react-dropdown-menu`. Used in navbar and invite accept/decline. |
| `Combobox` | Searchable dropdown built on `cmdk`. Used for location selection with infinite scroll. |
| `Tabs` | Tab navigation via `@radix-ui/react-tabs`. Used on My Events page (Upcoming/Organizing/Invitations/Past). |
| `Switch` | Toggle via `@radix-ui/react-switch`. Used for public/private event toggle. |
| `Avatar / UserAvatar` | Displays user avatar with fallback initials. Centralized to handle all edge cases. |
| `FileUpload` | Drag-and-drop file upload with preview, progress bar, and client-side validation. |
| `ImageCropDialog` | Modal image cropper using `react-easy-crop` — supports zoom, rotation, and grid. |
| `DatePicker` | Responsive date picker: popover on desktop, drawer on mobile. |
| `Toast (Sonner)` | Global toast notification system (see Module 11). |
| `BackButton` | Consistent back navigation across pages. |
| `EmptyState` | Standardized empty state UI with icon and message. |
| `RadioCard` | Card-style radio button group. |
| `PasswordInput` | Password field with show/hide toggle. |
| `AnimatedUnderline` | Smooth CSS underline animation for navigation links. |

### Container System

A `Container` component provides consistent horizontal padding and max-width across all pages:

```tsx
<Container as="main" className="py-8">
  {children}
</Container>
```

### Dark Mode

Implemented via `next-themes`. A `ThemeProvider` wraps the app and toggles the `dark` class on `<html>`, activating the dark CSS variable set. Respects `prefers-color-scheme` by default.

### Responsive Design

All components use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`). Key responsive decisions:
- Event feed filters collapse to icon-only on small screens.
- Event form public/private toggle switches to `flex-col` on mobile.
- Navbar has a mobile menu that closes automatically on route change.
- Date picker uses a `useMediaQuery` hook to switch between popover (desktop) and bottom drawer (mobile).
- Invite modal adapts to screen size.
