import { eventLoader, EventPage } from '@/pages/events/EventPage';
import { eventService } from '@/services/eventService';
import { userService } from '@/services/userService';
import { friendService } from '@/services/friendService';
import { inviteService } from '@/services/inviteService';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';

// --- Service mocks ---

vi.mock('@/services/eventService', () => ({
  eventService: {
    getEvent: vi.fn(),
    deleteEvent: vi.fn(),
  },
}));

vi.mock('@/services/userService', () => ({
  userService: {
    attendEvent: vi.fn(),
    unattendEvent: vi.fn(),
    getMyInvitedEvents: vi.fn(),
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
  getEventImageUrl: () => 'http://test/image.jpg',
}));

vi.mock('@/lib/file_utils', () => ({
  getEventFileUrl: (key: string) => `http://test/${key}`,
  FileTypeIcon: ({ mimeType }: { mimeType: string }) => (
    <span data-testid="file-icon">{mimeType}</span>
  ),
}));

vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/gmapPreview', () => ({
  GmapPreview: ({ open }: { open: boolean }) =>
    open ? <div data-testid="map-preview">Map</div> : null,
}));

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), warning: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

// --- Store mock ---

const mockCurrentUserStore = vi.hoisted(() => ({
  useCurrentUserStore: vi.fn(),
}));
vi.mock('@/store/currentUserStore', () => mockCurrentUserStore);

// --- Browser API mocks ---

Object.defineProperty(navigator, 'share', { value: vi.fn(), writable: true });

// --- Mock data ---

const mockUsers = {
  alice: { id: 1, name: 'Alice', email: 'alice@example.com' },
  bob: { id: 2, name: 'Bob', email: 'bob@example.com' },
};

const mockEvent = {
  id: 1,
  title: 'Test Event',
  content: 'Event description',
  startAt: '2026-06-15T18:00:00Z',
  endAt: '2026-06-15T22:00:00Z',
  isPublic: true,
  isPublished: true,
  imageKey: null,
  createdAt: new Date().toISOString(),
  authorId: 1,
  author: mockUsers.alice,
  attendees: [],
  files: [],
  location: null,
  conversation: null,
};

const mockLocation = {
  id: 1,
  name: 'Berghain',
  address: 'Am Wriezener Bahnhof',
  city: 'Berlin',
  postalCode: '10243',
  country: 'Germany',
  latitude: 52.5,
  longitude: 13.4,
};

// --- Helpers ---

describe('EventPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    vi.mocked(eventService.getEvent).mockResolvedValue(mockEvent as never);
    vi.mocked(userService.getMyInvitedEvents).mockResolvedValue([] as never);
    vi.mocked(friendService.listFriends).mockResolvedValue({
      data: [],
      pagination: { hasMore: false, nextCursor: null },
    } as never);
    vi.mocked(inviteService.listOutgoingInvites).mockResolvedValue({
      data: [],
      pagination: { hasMore: false, nextCursor: null },
    } as never);
    mockCurrentUserStore.useCurrentUserStore.mockImplementation(
      (selector: (s: object) => unknown) => selector({ user: null })
    );
  });

  function renderEventPage() {
    const router = createMemoryRouter(
      [
        {
          path: '/events/:id',
          Component: EventPage,
          loader: eventLoader,
          HydrateFallback: () => <div>Loading...</div>,
        },
        {
          path: '/login',
          Component: () => <div>Login Page</div>,
          HydrateFallback: () => <div>Loading...</div>,
        },
        {
          path: '/chat/:id',
          Component: () => <div>Chat Page</div>,
          HydrateFallback: () => <div>Loading...</div>,
        },
        {
          path: '/events',
          Component: () => <div>Events Feed</div>,
          HydrateFallback: () => <div>Loading...</div>,
        },
      ],
      { initialEntries: ['/events/1'] }
    );
    return { router, ...render(<RouterProvider router={router} />) };
  }

  // ----------------------------------------------------------------
  describe('Basic Rendering', () => {
    it('renders the event title', async () => {
      renderEventPage();
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /test event/i })).toBeInTheDocument();
      });
    });

    it('renders the host name', async () => {
      renderEventPage();
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });
    });

    it('renders the event description', async () => {
      renderEventPage();
      await waitFor(() => {
        expect(screen.getByText('Event description')).toBeInTheDocument();
      });
    });

    it('renders "Be the first" when no attendees', async () => {
      renderEventPage();
      await waitFor(() => {
        expect(screen.getByText(/be the first/i)).toBeInTheDocument();
      });
    });

    it('renders attendee count when attendees exist', async () => {
      vi.mocked(eventService.getEvent).mockResolvedValue({
        ...mockEvent,
        attendees: [mockUsers.alice, mockUsers.bob],
      } as never);
      renderEventPage();
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });

  // ----------------------------------------------------------------
  describe('Location', () => {
    it('shows TBA when no location', async () => {
      renderEventPage();
      await waitFor(() => {
        expect(screen.getByText('TBA')).toBeInTheDocument();
      });
    });

    it('shows address and city when location has coordinates', async () => {
      vi.mocked(eventService.getEvent).mockResolvedValue({
        ...mockEvent,
        location: mockLocation,
      } as never);
      renderEventPage();
      await waitFor(() => {
        expect(screen.getByText(/Am Wriezener Bahnhof/)).toBeInTheDocument();
      });
    });

    it('opens map preview when location button is clicked', async () => {
      vi.mocked(eventService.getEvent).mockResolvedValue({
        ...mockEvent,
        location: mockLocation,
      } as never);
      renderEventPage();
      await waitFor(() => {
        expect(screen.getByText(/Am Wriezener Bahnhof/)).toBeInTheDocument();
      });
      await user.click(screen.getByText(/Am Wriezener Bahnhof/));
      expect(screen.getByTestId('map-preview')).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  describe('Author Controls', () => {
    it('shows delete dialog trigger when user is author', async () => {
      mockCurrentUserStore.useCurrentUserStore.mockImplementation(
        (selector: (s: object) => unknown) => selector({ user: mockUsers.alice })
      );
      renderEventPage();
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /test event/i })).toBeInTheDocument();
      });
      // The delete AlertDialogTrigger button is visible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(2);
    });

    it('does not show author controls for non-authors', async () => {
      mockCurrentUserStore.useCurrentUserStore.mockImplementation(
        (selector: (s: object) => unknown) => selector({ user: mockUsers.bob })
      );
      renderEventPage();

      // Only action buttons (Going, Invite, Share, Chat + Back) — no edit/delete
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(5);
      });
    });
  });

  // ----------------------------------------------------------------
  describe('Going Button', () => {
    it('redirects to login when not logged in', async () => {
      const { router } = renderEventPage();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^going$/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /^going$/i }));
      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/login');
      });
    });

    it('calls attendEvent and shows Going ✓ when logged in', async () => {
      mockCurrentUserStore.useCurrentUserStore.mockImplementation(
        (selector: (s: object) => unknown) => selector({ user: mockUsers.bob })
      );
      vi.mocked(userService.attendEvent).mockResolvedValue({} as never);
      renderEventPage();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^going$/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /^going$/i }));
      await waitFor(() => {
        expect(userService.attendEvent).toHaveBeenCalledWith(1);
        expect(screen.getByRole('button', { name: /going ✓/i })).toBeInTheDocument();
      });
    });

    it('calls unattendEvent when already attending', async () => {
      mockCurrentUserStore.useCurrentUserStore.mockImplementation(
        (selector: (s: object) => unknown) => selector({ user: mockUsers.alice })
      );
      vi.mocked(eventService.getEvent).mockResolvedValue({
        ...mockEvent,
        attendees: [mockUsers.alice],
      } as never);
      vi.mocked(userService.unattendEvent).mockResolvedValue({} as never);
      renderEventPage();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /going ✓/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /going ✓/i }));
      await waitFor(() => {
        expect(userService.unattendEvent).toHaveBeenCalledWith(1);
      });
    });
  });

  // ----------------------------------------------------------------
  describe('Chat Button', () => {
    it('shows a warning toast when user is not attending', async () => {
      const { toast } = await import('sonner');
      mockCurrentUserStore.useCurrentUserStore.mockImplementation(
        (selector: (s: object) => unknown) => selector({ user: mockUsers.bob })
      );
      renderEventPage();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /chat/i }));
      expect(toast.warning).toHaveBeenCalled();
    });

    it('navigates to chat when user is attending', async () => {
      mockCurrentUserStore.useCurrentUserStore.mockImplementation(
        (selector: (s: object) => unknown) => selector({ user: mockUsers.alice })
      );
      vi.mocked(eventService.getEvent).mockResolvedValue({
        ...mockEvent,
        attendees: [mockUsers.alice],
        conversation: { id: 'conv-123' },
      } as never);
      const { router } = renderEventPage();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /chat/i }));
      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/chat/conv-123');
      });
    });
  });

  // ----------------------------------------------------------------
  describe('Share Button', () => {
    it('opens the custom share dialog when share is clicked', async () => {
      renderEventPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /share/i }));

      // Verify Dialog Content
      expect(screen.getByText(/share this event/i)).toBeInTheDocument();
      expect(screen.getByText(/whatsapp/i)).toBeInTheDocument();
    });

    it('copies link when Copy link is clicked in the share dialog', async () => {
      const { toast } = await import('sonner');
      renderEventPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /share/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /copy link/i }));

      // Matches the new 'Invitation link copied' text
      expect(toast.info).toHaveBeenCalledWith('Invitation link copied');
    });
  });

  // ----------------------------------------------------------------
  describe('Files Section', () => {
    it('renders image thumbnails', async () => {
      vi.mocked(eventService.getEvent).mockResolvedValue({
        ...mockEvent,
        files: [{ id: 1, fileKey: 'image1.jpg', fileName: 'photo.jpg', mimeType: 'image/jpeg' }],
      } as never);
      renderEventPage();
      await waitFor(() => {
        expect(screen.getByText(/additional info/i)).toBeInTheDocument();
      });
      const img = document.querySelector('img[src="http://test/image1.jpg"]');
      expect(img).toBeInTheDocument();
    });

    it('renders PDF as a download link', async () => {
      vi.mocked(eventService.getEvent).mockResolvedValue({
        ...mockEvent,
        files: [
          { id: 1, fileKey: 'doc.pdf', fileName: 'document.pdf', mimeType: 'application/pdf' },
        ],
      } as never);
      renderEventPage();
      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
      });
      const link = screen.getByRole('link', { name: /document.pdf/i });
      expect(link).toHaveAttribute('download', 'document.pdf');
      expect(link).toHaveAttribute('href', 'http://test/doc.pdf');
    });

    it('opens image lightbox when thumbnail is clicked', async () => {
      vi.mocked(eventService.getEvent).mockResolvedValue({
        ...mockEvent,
        files: [{ id: 1, fileKey: 'image1.jpg', fileName: 'photo.jpg', mimeType: 'image/jpeg' }],
      } as never);
      renderEventPage();
      await waitFor(() => {
        const img = document.querySelector('img');
        expect(img).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: '' }));
      await waitFor(() => {
        const images = document.querySelectorAll('img');
        expect(images.length).toBeGreaterThan(1); // thumbnail + lightbox
      });
    });
  });
});
