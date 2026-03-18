import { Page } from '@/pages/my-events/Page';
import { userService } from '@/services/userService';
import { eventService } from '@/services/eventService';
import { friendService } from '@/services/friendService';
import { inviteService } from '@/services/inviteService';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';
import type { ResMyEvents } from '@grit/schema';

vi.mock('@/services/userService', () => ({
  userService: {
    getMyEvents: vi.fn(),
    getMyInvitedEvents: vi.fn(),
  },
}));

vi.mock('@/services/eventService', () => ({
  eventService: {
    patchEvent: vi.fn(),
  },
}));

vi.mock('@/services/friendService', () => ({
  friendService: {
    listFriends: vi.fn(),
  },
}));

vi.mock('@/services/inviteService', () => ({
  inviteService: {
    listOutgoingInvites: vi.fn(),
  },
}));

vi.mock('@/lib/image_utils', () => ({
  getEventImageUrl: (event: { imageKey?: string | null }) =>
    event.imageKey ? `http://test-minio/${event.imageKey}` : 'placeholder.svg',
}));

vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Map: () => <div>Map</div>,
  AdvancedMarker: () => <div>Marker</div>,
}));

describe('My Events Page', () => {
  const user = userEvent.setup();

  const mockDraftEvent: ResMyEvents[number] = {
    id: 1,
    slug: 'draft-event',
    title: 'Draft Event',
    startAt: new Date('2026-12-01T18:00:00Z').toISOString(),
    endAt: new Date('2026-12-01T20:00:00Z').toISOString(),
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
    conversationId: undefined,
  };

  const mockPublishedEvent: ResMyEvents[number] = {
    ...mockDraftEvent,
    id: 2,
    slug: 'published-event',
    title: 'Published Event',
    isPublished: true,
  };

  const mockAttendingEvent: ResMyEvents[number] = {
    ...mockDraftEvent,
    id: 3,
    slug: 'attending-event',
    title: "Event I'm Attending",
    isOrganizer: false,
    isPublished: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.getMyInvitedEvents).mockResolvedValue({
      data: [],
      pagination: { nextCursor: null, hasMore: false, total: 0 },
    } as never);
    vi.mocked(friendService.listFriends).mockResolvedValue({ data: [] } as never);
    vi.mocked(inviteService.listOutgoingInvites).mockResolvedValue([] as never);
  });

  const renderPage = async (events: ResMyEvents = []) => {
    const paginatedResponse = {
      data: events,
      pagination: {
        nextCursor: null,
        hasMore: false,
        total: events.length,
        totalUpcoming: events.filter((e) => new Date(e.startAt) >= new Date()).length,
        totalPast: events.filter((e) => new Date(e.startAt) < new Date()).length,
        totalOrganizing: events.filter((e) => e.isOrganizer).length,
      },
    };

    vi.mocked(userService.getMyEvents).mockResolvedValue(paginatedResponse as never);

    const router = createMemoryRouter(
      [
        {
          path: '/my-events',
          element: <Page />,
          loader: () =>
            Promise.resolve({
              myEvents: events,
              myEventsPagination: {
                nextCursor: null,
                hasMore: false,
                total: events.length,
                totalUpcoming: events.filter((e) => new Date(e.startAt) >= new Date()).length,
                totalPast: events.filter((e) => new Date(e.startAt) < new Date()).length,
                totalOrganizing: events.filter((e) => e.isOrganizer).length,
              },
              invitedEvents: [],
              invitedEventsPagination: { nextCursor: null, hasMore: false, total: 0 },
            }),
          HydrateFallback: () => <div>Loading...</div>,
        },
      ],
      {
        initialEntries: ['/my-events'],
      }
    );

    const result = render(<RouterProvider router={router} />);

    // Wait for the page header to be visible
    await waitFor(
      () => {
        expect(screen.getByText('My Events')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    return result;
  };

  describe('Event Display', () => {
    it('should display draft events with Draft badge', async () => {
      await renderPage([mockDraftEvent]);

      // Click on Organizing tab to see the draft event
      const organizingTab = screen.getByRole('tab', { name: /organizing/i });
      await user.click(organizingTab);

      await waitFor(() => {
        expect(screen.getByText('Draft Event')).toBeInTheDocument();
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });
    });

    it('should display published events with Organizer badge', async () => {
      await renderPage([mockPublishedEvent]);

      // Published event should be in Organizing tab
      const organizingTab = screen.getByRole('tab', { name: /organizing/i });
      await user.click(organizingTab);

      await waitFor(() => {
        expect(screen.getByText('Published Event')).toBeInTheDocument();
        expect(screen.getByText('Organizer')).toBeInTheDocument();
      });
    });

    it('should display attending events with Going badge', async () => {
      await renderPage([mockAttendingEvent]);

      // Attending event should be in Upcoming tab (default)
      await waitFor(() => {
        expect(screen.getByText("Event I'm Attending")).toBeInTheDocument();
        expect(screen.getByText('Going')).toBeInTheDocument();
      });
    });

    it('should display Private badge for private events', async () => {
      const privateEvent = { ...mockPublishedEvent, isPublic: false };
      await renderPage([privateEvent]);

      // Click on Organizing tab
      const organizingTab = screen.getByRole('tab', { name: /organizing/i });
      await user.click(organizingTab);

      await waitFor(() => {
        expect(screen.getByText('Private')).toBeInTheDocument();
      });
    });

    it('should display event location', async () => {
      await renderPage([mockDraftEvent]);

      expect(screen.getByText('Test Venue')).toBeInTheDocument();
    });

    it('should display empty state when no events', async () => {
      await renderPage([]);

      expect(screen.getByText(/no events yet/i)).toBeInTheDocument();
    });
  });

  describe('Event Actions', () => {
    it('should show Publish button for draft events', async () => {
      await renderPage([mockDraftEvent]);

      const publishButtons = screen.getAllByRole('button', { name: /publish/i });
      expect(publishButtons.length).toBeGreaterThan(0);
    });

    it('should show Unpublish button for published events', async () => {
      await renderPage([mockPublishedEvent]);

      const unpublishButtons = screen.getAllByRole('button', { name: /unpublish/i });
      expect(unpublishButtons.length).toBeGreaterThan(0);
    });

    it('should show Edit button for organizer events', async () => {
      await renderPage([mockDraftEvent]);

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('should make entire card clickable for viewing details', async () => {
      await renderPage([mockDraftEvent]);

      // The card itself should be clickable (has cursor-pointer and onClick)
      const card = screen.getByText('Draft Event').closest('[class*="cursor-pointer"]');
      expect(card).toBeInTheDocument();
    });

    it('should not show Edit button for non-organizer events', async () => {
      await renderPage([mockAttendingEvent]);

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });
  });

  describe('Publish Dialog', () => {
    it('should open publish confirmation dialog when Publish is clicked', async () => {
      await renderPage([mockDraftEvent]);

      const publishButton = screen.getByRole('button', { name: /publish/i });
      await user.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText('Publish Event?')).toBeInTheDocument();
      });
      expect(screen.getByText(/make your event visible to everyone/i)).toBeInTheDocument();
    });

    it('should close dialog when Cancel is clicked', async () => {
      await renderPage([mockDraftEvent]);

      const publishButton = screen.getByRole('button', { name: /publish/i });
      await user.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText('Publish Event?')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Publish Event?')).not.toBeInTheDocument();
      });
    });

    it.skip('should call patchEvent when publish is confirmed', async () => {
      vi.mocked(eventService.patchEvent).mockResolvedValue({ success: true } as never);
      await renderPage([mockDraftEvent]);

      const publishButton = screen.getByRole('button', { name: /publish/i });
      await user.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText('Publish Event?')).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole('button', { name: /publish/i });
      const confirmButton = confirmButtons.find((btn) => btn.textContent === 'Publish');
      if (confirmButton) {
        await user.click(confirmButton);
      }

      await waitFor(() => {
        expect(eventService.patchEvent).toHaveBeenCalledWith('1', { isPublished: true });
      });
    });
  });

  describe('Unpublish Dialog', () => {
    it('should open unpublish confirmation dialog when Unpublish is clicked', async () => {
      await renderPage([mockPublishedEvent]);

      const unpublishButton = screen.getByRole('button', { name: /unpublish/i });
      await user.click(unpublishButton);

      await waitFor(() => {
        expect(screen.getByText('Unpublish Event?')).toBeInTheDocument();
      });
      expect(screen.getByText(/hide your event from the public/i)).toBeInTheDocument();
    });

    it('should call patchEvent when unpublish is confirmed', async () => {
      vi.mocked(eventService.patchEvent).mockResolvedValue({ success: true } as never);
      await renderPage([mockPublishedEvent]);

      const unpublishButton = screen.getByRole('button', { name: /unpublish/i });
      await user.click(unpublishButton);

      await waitFor(() => {
        expect(screen.getByText('Unpublish Event?')).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole('button', { name: /unpublish/i });
      const confirmButton = confirmButtons.find((btn) => btn.textContent === 'Unpublish');
      if (confirmButton) {
        await user.click(confirmButton);
      }

      await waitFor(() => {
        expect(eventService.patchEvent).toHaveBeenCalledWith('2', { isPublished: false });
      });
    });
  });

  describe('Sort Functionality', () => {
    it.skip('should display sort dropdown', async () => {
      await renderPage([mockDraftEvent, mockPublishedEvent]);

      // The sort dropdown should be visible
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument();
      });
    });

    it.skip('should sort drafts first by default', async () => {
      await renderPage([mockPublishedEvent, mockDraftEvent]);

      // Click on Organizing tab to see both events
      const organizingTab = screen.getByRole('tab', { name: /organizing/i });
      await user.click(organizingTab);

      await waitFor(() => {
        // Find the event cards by their titles
        const draftCard = screen.getByText('Draft Event');
        const publishedCard = screen.getByText('Published Event');

        // Both should exist
        expect(draftCard).toBeInTheDocument();
        expect(publishedCard).toBeInTheDocument();

        // Check the order by comparing their positions in the DOM
        const cards = screen.getAllByRole('article');
        const draftIndex = cards.findIndex((card) => card.textContent?.includes('Draft Event'));
        const publishedIndex = cards.findIndex((card) =>
          card.textContent?.includes('Published Event')
        );

        // Draft should come before published
        expect(draftIndex).toBeLessThan(publishedIndex);
      });
    });
  });

  describe('Clickable Elements', () => {
    it('should make entire card clickable for navigation', async () => {
      await renderPage([mockDraftEvent]);

      // Click on Organizing tab to see the draft event
      const organizingTab = screen.getByRole('tab', { name: /organizing/i });
      await user.click(organizingTab);

      await waitFor(() => {
        expect(screen.getByText('Draft Event')).toBeInTheDocument();
      });

      // Find the card by locating the title and going up to the clickable card
      const card = screen.getByText('Draft Event').closest('[class*="cursor-pointer"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('cursor-pointer');
    });

    it('should have clickable event image as part of the card', async () => {
      await renderPage([mockDraftEvent]);

      // Click on Organizing tab to see the draft event
      const organizingTab = screen.getByRole('tab', { name: /organizing/i });
      await user.click(organizingTab);

      await waitFor(() => {
        expect(screen.getByText('Draft Event')).toBeInTheDocument();
      });

      const images = screen.getAllByAltText('Draft Event');
      expect(images.length).toBeGreaterThan(0);

      // The image is now part of the clickable card, not a separate button
      const card = images[0]?.closest('[class*="cursor-pointer"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Location Button', () => {
    it('should display location with coordinates as clickable', async () => {
      await renderPage([mockDraftEvent]);

      const locationButton = screen.getByText('Test Venue').closest('button');
      expect(locationButton).toBeInTheDocument();
    });

    it('should open map dialog when location is clicked', async () => {
      await renderPage([mockDraftEvent]);

      const locationButton = screen.getByText('Test Venue').closest('button');
      if (locationButton) {
        await user.click(locationButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Copy address')).toBeInTheDocument();
        expect(screen.getByText('Get directions')).toBeInTheDocument();
      });
    });

    it('should display location without coordinates as static text', async () => {
      const eventWithoutCoords = {
        ...mockDraftEvent,
        location: null,
      };
      await renderPage([eventWithoutCoords]);

      const locationText = screen.queryByText('Test Venue');
      expect(locationText).not.toBeInTheDocument();
    });
  });
});
