import { test, expect } from '@playwright/test';

test.describe('My Events Page', () => {
  // Set auth state
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({ state: { token: 'fake-token' }, version: 0 }));
    });

    // Mock auth
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        json: { id: 1, name: 'Test User', email: 'test@example.com', avatarKey: null },
      });
    });

    // Mock the general /events route
    await page.route('**/api/events*', async (route) => {
      await route.fulfill({
        json: { data: [], pagination: { nextCursor: null, hasMore: false, total: 0 } },
      });
    });

    // Mock My Events endpoint (organizing/attending)
    await page.route('**/api/users/me/events?*', async (route) => {
      await route.fulfill({
        json: {
          data: [
            {
              id: 1,
              slug: 'draft-event',
              title: 'My Draft Event',
              startAt: '2026-12-01T18:00:00Z',
              endAt: '2026-12-01T20:00:00Z',
              imageKey: null,
              location: {
                id: 1,
                authorId: 1,
                name: 'Test Venue',
                address: '123 Test St',
                city: 'Test City',
                postalCode: '12345',
                country: 'Test Country',
                latitude: 40.7128,
                longitude: -74.006,
                isPublic: true,
              },
              isOrganizer: true,
              isPublished: false,
              isPublic: true,
            },
            {
              id: 2,
              slug: 'published-event',
              title: 'My Published Event',
              startAt: '2026-12-15T18:00:00Z',
              endAt: '2026-12-15T20:00:00Z',
              imageKey: null,
              location: {
                id: 2,
                authorId: 1,
                name: 'Another Venue',
                address: '456 Another St',
                city: 'Another City',
                postalCode: '67890',
                country: 'Test Country',
                latitude: 40.7589,
                longitude: -73.9851,
                isPublic: false,
              },
              isOrganizer: true,
              isPublished: true,
              isPublic: false,
              conversationId: '123',
            },
          ],
          pagination: {
            nextCursor: null,
            hasMore: false,
            total: 2,
            totalUpcoming: 2,
            totalPast: 0,
            totalOrganizing: 2,
          },
        },
      });
    });

    // Mock Invited Events endpoint
    await page.route('**/api/users/me/events/invited?*', async (route) => {
      await route.fulfill({
        json: {
          data: [
            {
              id: 3,
              slug: 'attending-event',
              title: "Event I'm Attending",
              startAt: '2026-11-20T18:00:00Z',
              endAt: '2026-11-20T20:00:00Z',
              imageKey: null,
              location: {
                id: 3,
                authorId: 2,
                name: 'Third Venue',
                address: '789 Third St',
                city: 'Third City',
                postalCode: '11111',
                country: 'Test Country',
                latitude: 40.7489,
                longitude: -73.968,
                isPublic: true,
              },
              isOrganizer: false,
              isPublished: true,
              isPublic: true,
              conversationId: '456',
            },
          ],
          pagination: {
            nextCursor: null,
            hasMore: false,
            total: 1,
          },
        },
      });
    });
  });

  test('should display all events with correct badges', async ({ page }) => {
    await page.goto('/profile/my-events');

    // Switch to Invitations tab to see invited events
    await page.getByRole('tab', { name: /invitations/i }).click();

    // Check invited event
    await expect(page.getByText("Event I'm Attending")).toBeVisible();

    // Switch to Organizing tab to see organizer events
    await page.getByRole('tab', { name: /organizing/i }).click();

    // Wait for organizer events to load
    await expect(page.getByText('My Draft Event')).toBeVisible();
    await expect(page.getByText('My Published Event')).toBeVisible();

    // Check badges
    const draftBadge = page.locator('.bg-destructive').getByText('Draft').first();
    await expect(draftBadge).toBeVisible();
    await expect(page.getByText('Organizer')).toBeVisible();
    await expect(page.getByText('Private')).toBeVisible();
  });

  test('should open publish dialog when Publish button is clicked', async ({ page }) => {
    await page.goto('/profile/my-events');

    // Switch to Organizing tab to see draft events
    await page.getByRole('tab', { name: /organizing/i }).click();

    // Wait for draft event
    await expect(page.getByText('My Draft Event')).toBeVisible();

    // Click Publish button (there should be only one for the draft event)
    await page.getByRole('button', { name: 'Publish' }).first().click();

    // Check dialog appears
    await expect(page.getByText('Publish Event?')).toBeVisible();
    await expect(page.getByText(/make your event visible to everyone/i)).toBeVisible();

    // Check dialog buttons
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Publish' }).last()).toBeVisible();
  });

  test('should close publish dialog when Cancel is clicked', async ({ page }) => {
    await page.goto('/profile/my-events');

    // Switch to Organizing tab
    await page.getByRole('tab', { name: /organizing/i }).click();

    await expect(page.getByText('My Draft Event')).toBeVisible();
    await page.getByRole('button', { name: 'Publish' }).first().click();
    await expect(page.getByText('Publish Event?')).toBeVisible();

    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Dialog should be closed
    await expect(page.getByText('Publish Event?')).not.toBeVisible();
  });

  test('should publish event when confirmed', async ({ page }) => {
    // Mock getEvent endpoint for validation
    await page.route(/.*\/api\/events\/draft-event$/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          json: {
            id: 1,
            slug: 'draft-event',
            title: 'My Draft Event',
            content: 'Event content',
            startAt: '2026-12-01T18:00:00Z',
            endAt: '2026-12-01T20:00:00Z',
            imageKey: null,
            location: {
              id: 1,
              authorId: 1,
              name: 'Test Venue',
              address: '123 Test St',
              city: 'Test City',
              postalCode: '12345',
              country: 'Test Country',
              latitude: 40.7128,
              longitude: -74.006,
              isPublic: true,
            },
            attendees: [],
            files: [],
            isPublished: false,
            isPublic: true,
            author: {
              id: 1,
              name: 'Test User',
            },
          },
        });
      } else {
        await route.fallback();
      }
    });

    // Mock the patch event endpoint
    await page.route(/.*\/api\/events\/\d+$/, async (route) => {
      if (route.request().method() === 'PATCH') {
        const postData = route.request().postData();
        const requestBody: unknown = postData ? JSON.parse(postData) : {};
        expect(requestBody).toEqual({ isPublished: true });

        await route.fulfill({
          json: { success: true },
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/profile/my-events');

    // Switch to Organizing tab
    await page.getByRole('tab', { name: /organizing/i }).click();

    await expect(page.getByText('My Draft Event')).toBeVisible();
    await page.getByRole('button', { name: 'Publish' }).first().click();
    await expect(page.getByText('Publish Event?')).toBeVisible();

    // Click confirm Publish button (the one in the dialog) and wait for the request
    const publishButtons = page.getByRole('button', { name: 'Publish' });
    const requestPromise = page.waitForRequest(
      (request) => request.url().includes('/api/events/') && request.method() === 'PATCH'
    );
    await publishButtons.last().click();
    await requestPromise;
  });

  test('should open unpublish dialog when Unpublish button is clicked', async ({ page }) => {
    await page.goto('/profile/my-events');

    // Switch to Organizing tab
    await page.getByRole('tab', { name: /organizing/i }).click();

    await expect(page.getByText('My Published Event')).toBeVisible();

    // Click Unpublish button
    await page.getByRole('button', { name: 'Unpublish' }).click();

    // Check dialog appears
    await expect(page.getByText('Unpublish Event?')).toBeVisible();
    await expect(page.getByText(/hide your event from the public/i)).toBeVisible();
  });

  test('should unpublish event when confirmed', async ({ page }) => {
    await page.route(/.*\/api\/events\/\d+$/, async (route) => {
      if (route.request().method() === 'PATCH') {
        const postData = route.request().postData();
        const requestBody: unknown = postData ? JSON.parse(postData) : {};
        expect(requestBody).toEqual({ isPublished: false });

        await route.fulfill({
          json: { success: true },
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/profile/my-events');

    // Switch to Organizing tab
    await page.getByRole('tab', { name: /organizing/i }).click();

    await expect(page.getByText('My Published Event')).toBeVisible();
    await page.getByRole('button', { name: 'Unpublish' }).click();
    await expect(page.getByText('Unpublish Event?')).toBeVisible();

    // Confirm unpublish and wait for the request
    const unpublishButtons = page.getByRole('button', { name: 'Unpublish' });
    const requestPromise = page.waitForRequest(
      (request) => request.url().includes('/api/events/') && request.method() === 'PATCH'
    );
    await unpublishButtons.last().click();
    await requestPromise;
  });

  test('should show Edit button only for organizer events', async ({ page }) => {
    await page.goto('/profile/my-events');

    // Switch to Invitations tab to check invited event (should NOT have Edit button)
    await page.getByRole('tab', { name: /invitations/i }).click();
    await expect(page.getByText("Event I'm Attending")).toBeVisible();

    // Invited events should not have Edit buttons
    const invitedEditButtons = page.getByRole('button', { name: /edit/i });
    expect(await invitedEditButtons.count()).toBe(0);

    // Switch to Organizing tab to see organizer events
    await page.getByRole('tab', { name: /organizing/i }).click();

    await expect(page.getByText('My Draft Event')).toBeVisible();

    // Draft event should have Edit button (organizer)
    const editButtons = page.getByRole('button', { name: /edit/i });
    await expect(editButtons.first()).toBeVisible();

    // Should have 2 Edit buttons (one for draft, one for published organizer event)
    expect(await editButtons.count()).toBe(2);
  });

  test('should open map dialog when location is clicked', async ({ page }) => {
    // Mock Google Maps API
    await page.addInitScript(() => {
      window.google = {
        maps: {},
      } as never;
    });

    await page.goto('/profile/my-events');

    // Switch to Organizing tab
    await page.getByRole('tab', { name: /organizing/i }).click();

    await expect(page.getByText('My Draft Event')).toBeVisible();

    // Click on location
    const locationButton = page.locator('button', { hasText: 'Test Venue' });
    await locationButton.click();

    // Map dialog should open
    await expect(page.getByText('Copy address')).toBeVisible();
    await expect(page.getByText('Get directions')).toBeVisible();
  });

  test('should sort events with drafts first by default', async ({ page }) => {
    await page.goto('/profile/my-events');

    // Switch to Organizing tab
    await page.getByRole('tab', { name: /organizing/i }).click();

    // Wait for events to load
    await expect(page.getByText('My Draft Event')).toBeVisible();

    // Check that the sort dropdown shows "Drafts First"
    await expect(page.getByText('Drafts First')).toBeVisible();

    // Draft event should appear before published event
    const allText = await page.locator('body').textContent();
    const draftIndex = allText?.indexOf('My Draft Event') ?? -1;
    const publishedIndex = allText?.indexOf('My Published Event') ?? -1;
    expect(draftIndex).toBeLessThan(publishedIndex);
  });

  test('should display empty state when no events', async ({ page }) => {
    // Override the mocks to return empty paginated responses
    await page.route('**/api/users/me/events?*', async (route) => {
      await route.fulfill({
        json: {
          data: [],
          pagination: {
            nextCursor: null,
            hasMore: false,
            total: 0,
            totalUpcoming: 0,
            totalPast: 0,
            totalOrganizing: 0,
          },
        },
      });
    });

    await page.route('**/api/users/me/events/invited?*', async (route) => {
      await route.fulfill({
        json: {
          data: [],
          pagination: { nextCursor: null, hasMore: false, total: 0 },
        },
      });
    });

    await page.goto('/profile/my-events');

    // Should show empty state
    await expect(page.getByText(/no events yet/i)).toBeVisible();
  });

  test('should show dashed border for draft events', async ({ page }) => {
    await page.goto('/profile/my-events');

    // Switch to Organizing tab to see draft events
    await page.getByRole('tab', { name: /organizing/i }).click();

    await expect(page.getByText('My Draft Event')).toBeVisible();

    // Check that draft event card has dashed border class
    const draftCard = page.locator('div[class*="border-dashed"]').first();
    await expect(draftCard).toBeVisible();
  });

  test('should display event date and location', async ({ page }) => {
    await page.goto('/profile/my-events');

    // Switch to Organizing tab to see draft events
    await page.getByRole('tab', { name: /organizing/i }).click();

    await expect(page.getByText('My Draft Event')).toBeVisible();

    // Location should be visible
    await expect(page.getByText('Test Venue')).toBeVisible();

    // Date should be formatted (checking for month name)
    await expect(page.locator('text=/Dec/i').first()).toBeVisible();
  });
});
