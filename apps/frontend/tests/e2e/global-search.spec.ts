import { test, expect, type Page } from '@playwright/test';

/** The search dialog input — uses cmdk's data-slot attribute to avoid colliding with other comboboxes */
const searchInput = (page: Page) => page.locator('[data-slot="command-input"]');

const mockEvents = [
  {
    id: 1,
    title: 'Berlin Techno Night',
    slug: 'berlin-techno-night-abc123',
    startAt: '2026-08-15T22:00:00Z',
    endAt: '2026-08-16T06:00:00Z',
    isPublic: true,
    isPublished: true,
    imageKey: null,
    createdAt: new Date().toISOString(),
    authorId: 1,
    author: { id: 1, name: 'Alice' },
    attendees: [],
    files: [],
    location: null,
    content: null,
    conversation: null,
  },
  {
    id: 2,
    title: 'Jazz Festival',
    slug: 'jazz-festival-def456',
    startAt: '2026-09-01T18:00:00Z',
    endAt: '2026-09-01T23:00:00Z',
    isPublic: true,
    isPublished: true,
    imageKey: null,
    createdAt: new Date().toISOString(),
    authorId: 2,
    author: { id: 2, name: 'Bob' },
    attendees: [],
    files: [],
    location: null,
    content: null,
    conversation: null,
  },
];

const mockUsers = [
  {
    id: 10,
    name: 'alice-abc',
    displayName: 'Alice Müller',
    avatarKey: null,
    bio: null,
    city: 'Berlin',
    country: 'Germany',
    createdAt: new Date().toISOString(),
    isProfilePublic: true,
  },
  {
    id: 11,
    name: 'bob-xyz',
    displayName: 'Bob Smith',
    avatarKey: null,
    bio: null,
    city: null,
    country: null,
    createdAt: new Date().toISOString(),
    isProfilePublic: true,
  },
];

const emptyPaginated = { data: [], pagination: { nextCursor: null, hasMore: false } };

test.describe('Global Search', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth (unauthenticated — search is public)
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    });

    // Default: empty results for all search queries
    await page.route('**/api/events*', async (route) => {
      await route.fulfill({ json: emptyPaginated });
    });
    await page.route('**/api/users*', async (route) => {
      await route.fulfill({ json: emptyPaginated });
    });
    await page.route('**/api/locations*', async (route) => {
      await route.fulfill({ json: emptyPaginated });
    });
  });

  // ----------------------------------------------------------------
  test.describe('Trigger', () => {
    test('search button is visible in navbar', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('button', { name: /search/i }).first()).toBeVisible();
    });

    test('opens search dialog when search button is clicked', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await page
        .getByRole('button', { name: /search/i })
        .first()
        .click();
      await expect(searchInput(page)).toBeVisible();
    });

    test('opens search dialog with Ctrl+K shortcut', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await page.keyboard.press('Control+k');
      await expect(searchInput(page)).toBeVisible();
    });

    test('closes dialog when Escape is pressed', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await page
        .getByRole('button', { name: /search/i })
        .first()
        .click();
      await expect(searchInput(page)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(searchInput(page)).not.toBeVisible();
    });
  });

  // ----------------------------------------------------------------
  test.describe('Empty states', () => {
    test('shows "Start typing" when dialog opens with empty input', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await page
        .getByRole('button', { name: /search/i })
        .first()
        .click();
      await expect(page.getByText(/start typing to search/i)).toBeVisible();
    });

    test('shows "Keep typing" when query is 1 character', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await page
        .getByRole('button', { name: /search/i })
        .first()
        .click();
      await searchInput(page).fill('a');
      await expect(page.getByText(/keep typing to search/i)).toBeVisible();
    });

    test('shows "No results found" when search returns nothing', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await page
        .getByRole('button', { name: /search/i })
        .first()
        .click();
      await searchInput(page).fill('xyzxyz');
      await expect(page.getByText(/no results found/i)).toBeVisible({ timeout: 2000 });
    });
  });

  // ----------------------------------------------------------------
  test.describe('Search results', () => {
    test.beforeEach(async ({ page }) => {
      // Override with results for search queries
      await page.route('**/api/events*', async (route) => {
        const url = route.request().url();
        if (url.includes('search=')) {
          await route.fulfill({
            json: { data: mockEvents, pagination: { nextCursor: null, hasMore: false } },
          });
        } else {
          await route.fulfill({ json: emptyPaginated });
        }
      });
      await page.route('**/api/users*', async (route) => {
        const url = route.request().url();
        if (url.includes('search=')) {
          await route.fulfill({
            json: { data: mockUsers, pagination: { nextCursor: null, hasMore: false } },
          });
        } else {
          await route.fulfill({ json: emptyPaginated });
        }
      });
    });

    test('displays event results after typing a query', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await page
        .getByRole('button', { name: /search/i })
        .first()
        .click();
      await searchInput(page).fill('berlin');
      await expect(page.getByText('Berlin Techno Night')).toBeVisible({ timeout: 2000 });
      await expect(page.getByText('Jazz Festival')).toBeVisible({ timeout: 2000 });
    });

    test('displays user results after typing a query', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await page
        .getByRole('button', { name: /search/i })
        .first()
        .click();
      await searchInput(page).fill('alice');
      await expect(page.getByText('Alice Müller')).toBeVisible({ timeout: 2000 });
      await expect(page.getByText('Bob Smith')).toBeVisible({ timeout: 2000 });
    });

    test('shows location for users that have city and country', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await page
        .getByRole('button', { name: /search/i })
        .first()
        .click();
      await searchInput(page).fill('alice');
      await expect(page.getByText('Berlin, Germany')).toBeVisible({ timeout: 2000 });
    });
  });

  // ----------------------------------------------------------------
  test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/events*', async (route) => {
        const url = route.request().url();
        if (url.includes('search=')) {
          await route.fulfill({
            json: { data: mockEvents, pagination: { nextCursor: null, hasMore: false } },
          });
        } else {
          await route.fulfill({ json: emptyPaginated });
        }
      });
      await page.route('**/api/users*', async (route) => {
        const url = route.request().url();
        if (url.includes('search=')) {
          await route.fulfill({
            json: { data: mockUsers, pagination: { nextCursor: null, hasMore: false } },
          });
        } else {
          await route.fulfill({ json: emptyPaginated });
        }
      });

      // Mock individual event and user pages so navigation succeeds
      await page.route('**/api/events/berlin-techno-night-abc123', async (route) => {
        await route.fulfill({ json: mockEvents[0] });
      });
      await page.route('**/api/users/10', async (route) => {
        await route.fulfill({ json: mockUsers[0] });
      });
      await page.route('**/api/users/10/events', async (route) => {
        await route.fulfill({ json: [] });
      });
      await page.route('**/api/users/me/friends/status/10', async (route) => {
        await route.fulfill({ json: { status: 'none' } });
      });
    });

    test('navigates to event page when event result is clicked', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await page
        .getByRole('button', { name: /search/i })
        .first()
        .click();
      await searchInput(page).fill('berlin');
      await expect(page.getByText('Berlin Techno Night')).toBeVisible({ timeout: 2000 });
      await page.getByText('Berlin Techno Night').click();
      await expect(page).toHaveURL('/events/berlin-techno-night-abc123');
    });

    test('closes dialog after navigating to event page', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await page
        .getByRole('button', { name: /search/i })
        .first()
        .click();
      await searchInput(page).fill('berlin');
      await expect(page.getByText('Berlin Techno Night')).toBeVisible({ timeout: 2000 });
      await page.getByText('Berlin Techno Night').click();
      await expect(searchInput(page)).not.toBeVisible();
    });

    test('navigates to user page when user result is clicked', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await page
        .getByRole('button', { name: /search/i })
        .first()
        .click();
      await searchInput(page).fill('alice');
      await expect(page.getByText('Alice Müller')).toBeVisible({ timeout: 2000 });
      await page.getByText('Alice Müller').click();
      await expect(page).toHaveURL('/users/alice-abc');
    });
  });

  // ----------------------------------------------------------------
  test.describe('State reset on close', () => {
    test('clears query when dialog is closed and reopened', async ({ page }) => {
      await page.route('**/api/events*', async (route) => {
        const url = route.request().url();
        if (url.includes('search=')) {
          await route.fulfill({
            json: { data: mockEvents, pagination: { nextCursor: null, hasMore: false } },
          });
        } else {
          await route.fulfill({ json: emptyPaginated });
        }
      });
      await page.route('**/api/users*', async (route) => {
        await route.fulfill({ json: emptyPaginated });
      });

      await page.goto('/events');
      await page.waitForLoadState('networkidle');

      // Open, type, see results
      await page
        .getByRole('button', { name: /search/i })
        .first()
        .click();
      await searchInput(page).fill('berlin');
      await expect(page.getByText('Berlin Techno Night')).toBeVisible({ timeout: 2000 });

      // Close
      await page.keyboard.press('Escape');
      await expect(searchInput(page)).not.toBeVisible();

      // Reopen — input should be empty
      await page
        .getByRole('button', { name: /search/i })
        .first()
        .click();
      await expect(searchInput(page)).toHaveValue('');
      await expect(page.getByText('Berlin Techno Night')).not.toBeVisible();
    });
  });
});
