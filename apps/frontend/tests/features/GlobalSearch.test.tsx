import { GlobalSearch, GlobalSearchTrigger } from '@/features/search/GlobalSearch';
import { eventService } from '@/services/eventService';
import { userService } from '@/services/userService';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';

// --- Service mocks ---

vi.mock('@/services/eventService', () => ({
  eventService: {
    getEvents: vi.fn(),
  },
}));

vi.mock('@/services/userService', () => ({
  userService: {
    getUsers: vi.fn(),
  },
}));

vi.mock('@/lib/image_utils', () => ({
  getAvatarImageUrl: () => 'http://test/avatar.jpg',
  getEventImageUrl: () => 'http://test/event.jpg',
}));

// --- Mock data ---

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

const emptyEventsResponse = { data: [], pagination: { nextCursor: null, hasMore: false } };
const emptyUsersResponse = { data: [], pagination: { nextCursor: null, hasMore: false } };
const eventsResponse = { data: mockEvents, pagination: { nextCursor: null, hasMore: false } };
const usersResponse = { data: mockUsers, pagination: { nextCursor: null, hasMore: false } };

// --- Helpers ---

function renderGlobalSearch() {
  function Wrapper() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <GlobalSearchTrigger
          onClick={() => {
            setOpen(true);
          }}
        />
        <GlobalSearch open={open} onOpenChange={setOpen} />
      </>
    );
  }
  const router = createMemoryRouter(
    [
      { path: '/', Component: Wrapper },
      { path: '/events/:id', Component: () => <div>Event Page</div> },
      { path: '/users/:username', Component: () => <div>User Page</div> },
    ],
    { initialEntries: ['/'] }
  );
  return { router, ...render(<RouterProvider router={router} />) };
}

// --- Tests ---

describe('GlobalSearch', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    vi.mocked(eventService.getEvents).mockResolvedValue(emptyEventsResponse as never);
    vi.mocked(userService.getUsers).mockResolvedValue(emptyUsersResponse as never);
  });

  // ----------------------------------------------------------------
  describe('Trigger', () => {
    it('renders the search icon button', () => {
      renderGlobalSearch();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('opens the dialog when the search button is clicked', async () => {
      renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('opens the dialog with Ctrl+K', async () => {
      renderGlobalSearch();
      await user.keyboard('{Control>}k{/Control}');
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('closes the dialog when Escape is pressed', async () => {
      renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      });
    });
  });

  // ----------------------------------------------------------------
  describe('Empty states', () => {
    it('shows "Start typing" prompt when dialog opens with empty input', async () => {
      renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => {
        expect(screen.getByText(/start typing to search/i)).toBeInTheDocument();
      });
    });

    it('shows "Keep typing" when query is 1 character (below minimum)', async () => {
      renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
      await user.type(screen.getByRole('combobox'), 'a');
      await waitFor(() => {
        expect(screen.getByText(/keep typing to search/i)).toBeInTheDocument();
      });
    });

    it('shows "No results found" when query returns nothing', async () => {
      renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
      await user.type(screen.getByRole('combobox'), 'xyzxyz');
      await waitFor(
        () => {
          expect(screen.getByText(/no results found/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  // ----------------------------------------------------------------
  describe('Search results', () => {
    beforeEach(() => {
      vi.mocked(eventService.getEvents).mockResolvedValue(eventsResponse as never);
      vi.mocked(userService.getUsers).mockResolvedValue(usersResponse as never);
    });

    it('calls both services after debounce when query is at least 2 chars', async () => {
      renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
      await user.type(screen.getByRole('combobox'), 'berlin');
      await waitFor(
        () => {
          expect(eventService.getEvents).toHaveBeenCalledWith(
            expect.objectContaining({ search: 'berlin' })
          );
          expect(userService.getUsers).toHaveBeenCalledWith(
            expect.objectContaining({ search: 'berlin' })
          );
        },
        { timeout: 2000 }
      );
    });

    it('does NOT call services when query is only 1 character', async () => {
      renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
      await user.type(screen.getByRole('combobox'), 'b');
      // Wait for debounce to fire (300ms) then assert services were NOT called
      await new Promise((r) => setTimeout(r, 500));
      expect(eventService.getEvents).not.toHaveBeenCalled();
      expect(userService.getUsers).not.toHaveBeenCalled();
    });

    it('renders event results under the Events group', async () => {
      renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
      await user.type(screen.getByRole('combobox'), 'berlin');
      await waitFor(
        () => {
          expect(screen.getByText('Berlin Techno Night')).toBeInTheDocument();
          expect(screen.getByText('Jazz Festival')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('renders user results under the People group', async () => {
      renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
      await user.type(screen.getByRole('combobox'), 'alice');
      await waitFor(
        () => {
          expect(screen.getByText('Alice Müller')).toBeInTheDocument();
          expect(screen.getByText('Bob Smith')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('shows user location when city and country are available', async () => {
      renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
      await user.type(screen.getByRole('combobox'), 'alice');
      await waitFor(
        () => {
          expect(screen.getByText('Berlin, Germany')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('shows only Events group when users returns empty', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(emptyUsersResponse as never);
      renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
      await user.type(screen.getByRole('combobox'), 'berlin');
      await waitFor(
        () => {
          expect(screen.getByText('Berlin Techno Night')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
      expect(screen.queryByText('Alice Müller')).not.toBeInTheDocument();
    });

    it('shows only People group when events returns empty', async () => {
      vi.mocked(eventService.getEvents).mockResolvedValue(emptyEventsResponse as never);
      renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
      await user.type(screen.getByRole('combobox'), 'alice');
      await waitFor(
        () => {
          expect(screen.getByText('Alice Müller')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
      expect(screen.queryByText('Berlin Techno Night')).not.toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  describe('Navigation', () => {
    beforeEach(() => {
      vi.mocked(eventService.getEvents).mockResolvedValue(eventsResponse as never);
      vi.mocked(userService.getUsers).mockResolvedValue(usersResponse as never);
    });

    it('navigates to the event page and closes dialog when an event is selected', async () => {
      const { router } = renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
      await user.type(screen.getByRole('combobox'), 'berlin');
      await waitFor(() => expect(screen.getByText('Berlin Techno Night')).toBeInTheDocument(), {
        timeout: 2000,
      });
      await user.click(screen.getByText('Berlin Techno Night'));
      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/events/berlin-techno-night-abc123');
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      });
    });

    it('navigates to the user page and closes dialog when a user is selected', async () => {
      const { router } = renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
      await user.type(screen.getByRole('combobox'), 'alice');
      await waitFor(() => expect(screen.getByText('Alice Müller')).toBeInTheDocument(), {
        timeout: 2000,
      });
      await user.click(screen.getByText('Alice Müller'));
      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/users/alice-abc');
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      });
    });
  });

  // ----------------------------------------------------------------
  describe('State reset on close', () => {
    it('clears the query when the dialog is closed and reopened', async () => {
      vi.mocked(eventService.getEvents).mockResolvedValue(eventsResponse as never);
      vi.mocked(userService.getUsers).mockResolvedValue(usersResponse as never);

      renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
      await user.type(screen.getByRole('combobox'), 'berlin');
      await waitFor(() => expect(screen.getByText('Berlin Techno Night')).toBeInTheDocument(), {
        timeout: 2000,
      });

      // Close via Escape
      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('combobox')).not.toBeInTheDocument());

      // Reopen — input should be empty and results gone
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => {
        const input = screen.getByRole('combobox');
        expect(input).toHaveValue('');
        expect(screen.queryByText('Berlin Techno Night')).not.toBeInTheDocument();
      });
    });
  });

  // ----------------------------------------------------------------
  describe('Request limit', () => {
    it('calls services with limit of 5', async () => {
      renderGlobalSearch();
      await user.click(screen.getByRole('button', { name: /search/i }));
      await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
      await user.type(screen.getByRole('combobox'), 'test');
      await waitFor(
        () => {
          expect(eventService.getEvents).toHaveBeenCalledWith(
            expect.objectContaining({ limit: '5' })
          );
          expect(userService.getUsers).toHaveBeenCalledWith(
            expect.objectContaining({ limit: '5' })
          );
        },
        { timeout: 2000 }
      );
    });
  });
});
