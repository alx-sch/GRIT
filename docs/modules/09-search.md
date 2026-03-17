# Module 09 — Implement Advanced Search Functionality

| Attribute | Value |
|---|---|
| **Category** | IV.1 |
| **Type** | Minor |
| **Points** | 1 |
| **Status** | Done |
| **Notes** | Filters, sorting, pagination |
| **Developers** | AudreyBil (event feed filters/sorting), Busedame (cursor-based pagination, infinite scroll), dovy-mus (global search) |

---

## Description

A multi-layered search and discovery system: keyword search, date and location filters, multiple sorting options, cursor-based pagination with infinite scroll, and a command-palette global search (⌘K) accessible from anywhere in the app.

---

## Justification

As the number of events grows, a flat list becomes unusable. Users need to find relevant events quickly — by date, location, keyword, or through their social network. Advanced search transforms the event feed from a simple list into a discovery engine.

---

## Implementation

### Backend Search API

**Endpoint:** `GET /events?search=<query>&start_from=<date>&start_until=<date>&locationId=<id>&sortBy=<field>&sortOrder=<asc|desc>&limit=<n>&cursor=<cursor>`

All query parameters are validated by Zod in `ReqEventGetPublishedDto`. Zod also transforms values — for example, date strings are converted to `Date` objects with time-of-day adjustments:

```ts
start_until: z.string().datetime()
  .transform(s => new Date(s.replace('T00:00:00', 'T23:59:59')))
  .optional()
```

#### Keyword Search

Case-insensitive `contains` search across `title` and `content`:

```ts
where: {
  OR: [
    { title: { contains: search, mode: 'insensitive' } },
    { content: { contains: search, mode: 'insensitive' } },
  ]
}
```

#### Date Filtering

- `start_from` — Only return events starting on or after this date (default: today, so past events are hidden by default).
- `start_until` — Only return events starting before this date.

#### Sorting Options

| `sortBy` | `sortOrder` | Description |
|---|---|---|
| `date` | `asc` | Earliest events first (default) |
| `date` | `desc` | Latest events first |
| `name` | `asc` | A → Z by title |
| `name` | `desc` | Z → A by title |
| `popularity` | — | Most attendees first |

#### Location Filter

Filter events by a specific `locationId`.

### Cursor-Based Pagination

Standard offset pagination (`SKIP n, TAKE m`) breaks when rows are inserted or deleted concurrently — the user may see duplicates or skip entries. Cursor-based pagination avoids this entirely.

**Cursor encoding** — The cursor encodes `(startAt, id)` of the last item seen as a base64 string:

```ts
const cursorValue = `${event.startAt.toISOString()}|${event.id}`;
const nextCursor = Buffer.from(cursorValue).toString('base64');
```

**Next page query** — Uses a compound `WHERE` clause after the cursor position:

```ts
where: {
  OR: [
    { startAt: { gt: cursorDate } },
    { startAt: cursorDate, id: { gt: cursorId } },
  ]
}
```

**Response shape:**

```json
{
  "data": [ /* events */ ],
  "pagination": {
    "nextCursor": "MjAyNi0wMS0yNFQxMjowMDowMC4wMDBafDQ=",
    "hasMore": true
  }
}
```

The cursor is opaque (base64-encoded) to discourage manual modification.

### Infinite Scroll (Frontend)

**Event feed:** Uses `IntersectionObserver` to watch a sentinel `<div>` at the bottom of the event grid. When the sentinel enters the viewport (within 400px), the next page is fetched and appended.

**Location combobox:** Uses a `scroll` event listener on the dropdown list. When the user scrolls within 100px of the bottom, the next page is loaded.

**Custom `useInfiniteScroll` hook** manages:
- The accumulated items array
- Loading state and `hasMore` flag
- A `loadMore` function
- An `addItem` callback for immediate insertion of newly created items (e.g., new location appearing in the dropdown without a reload)

### Global Search — Command Palette (⌘K)

A command-palette style search dialog accessible from anywhere via `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) or by clicking the search icon in the navbar.

**Behavior:**
1. Opens a `CommandDialog` (cmdk-based, styled to match the app design system).
2. User types — input is debounced (300ms) before firing API calls.
3. Events and users are searched **in parallel** (`Promise.all`).
4. Shows up to 5 events and 5 users.
5. Each result is clickable and navigates to the event or user page.
6. A "See all results" link navigates to the full feed with `?search=` pre-filled.
7. Dialog state resets on close.
8. `AbortSignal` cancels in-flight requests when a new keystroke fires or the component unmounts.

**URL state sync:** Navigating to `/events?search=yoga` pre-populates the search input and triggers a server-side loader fetch with that parameter. Search results are bookmarkable and shareable.

**Rendered once globally** in `DefaultLayout` to avoid duplicate keyboard listeners regardless of which page the user is on.
