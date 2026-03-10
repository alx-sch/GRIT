import { test, expect } from '@playwright/test';

test.describe('Public Profile', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        json: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          avatarKey: null,
        },
      });
    });

    // Mock events list
    await page.route('**/api/events*', async (route) => {
      await route.fulfill({
        json: {
          data: [],
          pagination: { nextCursor: null, hasMore: false },
        },
      });
    });
  });

  test('should display public profile with user info', async ({ page }) => {
    // Mock user profile with bio and location
    await page.route(/\/api\/users\/2$/, async (route) => {
      await route.fulfill({
        json: {
          id: 2,
          name: 'Alice Johnson',
          avatarKey: null,
          bio: 'Event organizer',
          city: 'New York',
          country: 'USA',
          createdAt: '2024-01-15T00:00:00Z',
        },
      });
    });

    await page.route(/\/api\/users\/2\/events/, async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route(/\/api\/users\/me\/friends\/status\/2/, async (route) => {
      await route.fulfill({ json: { status: 'none' } });
    });

    await page.goto('/people/2');
    await page.waitForLoadState('networkidle');

    // Verify user info is displayed
    await expect(page.locator('h2:has-text("Alice Johnson")')).toBeVisible();
    await expect(page.getByText('New York, USA')).toBeVisible();
    await expect(page.getByText('Member since January 2024')).toBeVisible();

    // Verify tabs exist
    await expect(page.getByRole('tab', { name: 'Info' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Events/ })).toBeVisible();
  });

  test('should show empty bio message when no bio', async ({ page }) => {
    await page.route(/\/api\/users\/3$/, async (route) => {
      await route.fulfill({
        json: {
          id: 3,
          name: 'Bob Smith',
          avatarKey: null,
          bio: null,
          city: null,
          country: null,
          createdAt: '2024-02-01T00:00:00Z',
        },
      });
    });

    await page.route(/\/api\/users\/3\/events/, async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route(/\/api\/users\/me\/friends\/status\/3/, async (route) => {
      await route.fulfill({ json: { status: 'none' } });
    });

    await page.goto('/people/3');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h2:has-text("Bob Smith")')).toBeVisible();

    // Click on Info tab to see bio
    await page.getByRole('tab', { name: 'Info' }).click();
    await expect(page.getByText("This user hasn't added a bio yet.")).toBeVisible();
  });

  test('should show hosted events', async ({ page }) => {
    await page.route(/\/api\/users\/4$/, async (route) => {
      await route.fulfill({
        json: {
          id: 4,
          name: 'Charlie Day',
          avatarKey: null,
          bio: 'Party host',
          city: 'Chicago',
          country: 'USA',
          createdAt: '2024-01-01T00:00:00Z',
        },
      });
    });

    await page.route(/\/api\/users\/4\/events/, async (route) => {
      await route.fulfill({
        json: [
          {
            id: 10,
            title: 'New Year Party',
            slug: 'new-year-party',
            startAt: '2026-12-31T21:00:00Z',
            imageKey: null,
            location: {
              id: 10,
              authorId: 4,
              name: 'My House',
              address: '123 Main St',
              city: 'Chicago',
              country: 'USA',
              postalCode: '60601',
              isPublic: true,
              longitude: -87.6298,
              latitude: 41.8781,
            },
          },
        ],
      });
    });

    await page.route(/\/api\/users\/me\/friends\/status\/4/, async (route) => {
      await route.fulfill({ json: { status: 'none' } });
    });

    await page.goto('/people/4');
    await page.waitForLoadState('networkidle');

    // Click on Events tab
    await page.getByRole('tab', { name: /Events/ }).click();

    // Verify event is displayed
    await expect(page.getByText('New Year Party')).toBeVisible();
  });
});
