import EventFeed, { eventsLoader } from '@/pages/events/Page';
import { eventService } from '@/services/eventService';
import { locationService } from '@/services/locationService';
import { userService } from '@/services/userService';
import { EventBase, EventResponse } from '@/types/event';
import { UserBase } from '@/types/user';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';

/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */

// Mock event service
vi.mock('@/services/eventService', () => ({
  eventService: {
    getEvents: vi.fn(),
  },
}));

vi.mock('@/services/locationService', () => ({
  locationService: {
    getLocations: vi.fn(),
  },
}));

vi.mock('@/services/userService', () => ({
  userService: {
    attendEvent: vi.fn(),
  },
}));

// Mock image utils to avoid MinIO URL issues in tests
vi.mock('@/lib/image_utils', () => ({
  getEventImageUrl: (event: EventBase) =>
    event.imageKey ? `http://test-minio/${event.imageKey}` : 'placeholder.svg',
}));

describe('Event Feed Page', () => {
  const user = userEvent.setup();

  // Mock users
  const mockUsers = {
    alice: {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password',
      events: [],
      attending: [],
      location: [],
      isConfirmed: true,
    },
    bob: {
      id: 2,
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password',
      events: [],
      attending: [],
      location: [],
      isConfirmed: true,
    },
    cindy: {
      id: 3,
      name: 'Cindy',
      email: 'cindy@example.com',
      password: 'password',
      events: [],
      attending: [],
      location: [],
      isConfirmed: true,
    },
  };

  // Mock locations
  const mockLocations = {
    gritHq: {
      id: 1,
      author: mockUsers.alice,
      authorId: 1,
      name: 'Berghain',
      city: 'Berlin',
      country: 'Germany',
      longitude: 13.4,
      latitude: 52.5,
      isPublic: true,
      events: [],
    },
  };

  // Mock events
  const mockEvents: EventResponse['data'] = [
    {
      id: 1,
      createdAt: Date.parse('2026-03-01T10:00:00Z'),
      content: 'A night of unforgettable techno beats.',
      endAt: '2026-03-02T10:00:00Z',
      isPublic: true,
      isPublished: true,
      startAt: '2026-03-02T10:00:00Z',
      title: 'MEGA SUPER DUPER COOL PARTY',
      imageKey: 'party-image.jpg',
      author: mockUsers.alice,
      authorId: 1,
      attending: [mockUsers.bob, mockUsers.cindy],
      locationId: 1,
    },
    {
      id: 2,
      createdAt: Date.parse('2026-01-01T10:00:00Z'),
      content: 'A session of beer-yoga at Lotus.',
      endAt: '2026-01-03T12:00:00Z',
      isPublic: true,
      isPublished: true,
      startAt: '2026-01-03T10:00:00Z',
      title: 'Beer-Yoga Session',
      imageKey: '',
      author: mockUsers.bob,
      authorId: 2,
      attending: [],
    },
    {
      id: 3,
      createdAt: Date.parse('2026-01-10T10:00:00Z'),
      content: 'Come to my awesome event!',
      endAt: '2026-01-15T12:00:00Z',
      isPublic: false,
      isPublished: true,
      startAt: '2026-01-15T10:00:00Z',
      title: 'Fireplace Gathering',
      imageKey: 'fireplace.jpg',
      author: mockUsers.cindy,
      authorId: 3,
      attending: [mockUsers.cindy],
    },
  ];

  // Reset and setup mock before each test
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(locationService.getLocations).mockResolvedValue({
      data: Object.values(mockLocations),
      pagination: { hasMore: false, nextCursor: null },
    });

    vi.mocked(eventService.getEvents).mockImplementation((params) => {
      let filtered = [...mockEvents];

      // Filter by search
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter((event) => event.title.toLowerCase().includes(search));
      }

      // Filter by date
      if (params?.startFrom) {
        const startFrom = params.startFrom;
        filtered = filtered.filter((event) => event.startAt >= startFrom);
      }

      //Filter by location
      if (params?.locationId) {
        const locationId = parseInt(params.locationId, 10);
        filtered = filtered.filter((event) => event.locationId === locationId);
      }

      return Promise.resolve({
        data: filtered,
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      });
    });
  });

  // Create a router
  function renderEventFeed() {
    const router = createMemoryRouter(
      [
        {
          path: '/events',
          Component: EventFeed,
          loader: eventsLoader,
        },
      ],
      {
        initialEntries: ['/events'],
      }
    );
    return { router, ...render(<RouterProvider router={router} />) };
  }

  describe('Basic Rendering', () => {
    it('renders event cards when loader returns data', async () => {
      renderEventFeed();

      await waitFor(() => {
        expect(screen.getByText(/Beer-Yoga Session/)).toBeInTheDocument();
      });
      expect(screen.getByText(/MEGA SUPER/)).toBeInTheDocument();
      expect(screen.getByText(/Fireplace Gathering/)).toBeInTheDocument();
    });

    it('shows empty state when no events', async () => {
      vi.mocked(eventService.getEvents).mockResolvedValue({
        data: [],
        pagination: { hasMore: false, nextCursor: null },
      });
      renderEventFeed();

      await waitFor(() => {
        expect(screen.getByText(/No events found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Location Display', () => {
    it('displays TBA when event has no location', async () => {
      renderEventFeed();

      await waitFor(() => {
        expect(screen.getByText(/Beer-Yoga Session/)).toBeInTheDocument();
      });

      // Beer-Yoga Session has no location, should show TBA
      const tbas = screen.getAllByText(/TBA/);
      expect(tbas.length).toBeGreaterThan(0);
    });

    it('filters by location when a location is selected', async () => {
      const { router } = renderEventFeed();

      await waitFor(() => {
        expect(screen.getByText(/Upcoming events/i)).toBeInTheDocument();
      });

      vi.mocked(eventService.getEvents).mockClear();

      await router.navigate('/events?location_id=1');

      await waitFor(() => {
        expect(router.state.location.search).toBe('?location_id=1');
      });

      await waitFor(() => {
        expect(eventService.getEvents).toHaveBeenCalledWith({
          search: undefined,
          startFrom: undefined,
          startUntil: undefined,
          locationId: '1',
          authorId: undefined,
          cursor: undefined,
          limit: undefined,
          sort: 'date-asc',
        });
      });
    });
  });

  describe('Attendees Display', () => {
    it('displays attendee count when event has attendees', async () => {
      renderEventFeed();

      await waitFor(() => {
        expect(screen.getByText(/MEGA SUPER/)).toBeInTheDocument();
      });

      // MEGA SUPER party has 2 attendees
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays "Be the first" when no attendees', async () => {
      renderEventFeed();

      await waitFor(() => {
        expect(screen.getByText(/Beer-Yoga Session/)).toBeInTheDocument();
      });

      // Beer-Yoga has no attendees
      expect(screen.getByText(/Be the first/)).toBeInTheDocument();
    });
  });

  describe('Image Display', () => {
    it('renders event image when imageKey exists', async () => {
      renderEventFeed();

      await waitFor(() => {
        expect(screen.getByText(/MEGA SUPER/)).toBeInTheDocument();
      });

      const images = screen.getAllByRole('img');
      const partyImage = images.find(
        (img) => img.getAttribute('alt') === 'MEGA SUPER DUPER COOL PARTY'
      );
      expect(partyImage).toHaveAttribute('src', 'http://test-minio/party-image.jpg');
    });

    it('renders placeholder when imageKey is empty', async () => {
      renderEventFeed();

      await waitFor(() => {
        expect(screen.getByText(/Beer-Yoga Session/)).toBeInTheDocument();
      });

      const images = screen.getAllByRole('img');
      const yogaImage = images.find((img) => img.getAttribute('alt') === 'Beer-Yoga Session');
      expect(yogaImage).toHaveAttribute('src', 'placeholder.svg');
    });
  });

  describe('Search Functionality', () => {
    it('updates URL and calls service with search param when user types', async () => {
      const { router } = renderEventFeed();

      await waitFor(() => {
        expect(screen.getByText(/Upcoming events/i)).toBeInTheDocument();
      });

      // Verify initial call (no search param)
      expect(eventService.getEvents).toHaveBeenCalledWith({
        search: undefined,
        startFrom: undefined,
        startUntil: undefined,
        locationId: undefined,
        authorId: undefined,
        cursor: undefined,
        limit: undefined,
        sort: 'date-asc',
      });

      // Type in Search
      const searchInput = screen.getByPlaceholderText('Search events...');
      await user.type(searchInput, 'beer');

      // Verify URL update
      await waitFor(() => {
        expect(router.state.location.search).toBe('?search=beer');
      });

      // Verify service was called with search param
      expect(eventService.getEvents).toHaveBeenCalledWith({
        search: 'beer',
        startFrom: undefined,
        startUntil: undefined,
        locationId: undefined,
        authorId: undefined,
        cursor: undefined,
        limit: undefined,
        sort: 'date-asc',
      });
    });

    it('populates search input from URL on initial load', async () => {
      const router = createMemoryRouter(
        [{ path: '/events', Component: EventFeed, loader: eventsLoader }],
        { initialEntries: ['/events?search=beer'] }
      );

      render(<RouterProvider router={router} />);

      const searchInput = await screen.findByPlaceholderText('Search events...');
      expect(searchInput).toHaveValue('beer');
    });
  });

  describe('Date Filtering', () => {
    it('updates service call when URL date params change', async () => {
      const { router } = renderEventFeed();

      await waitFor(() => {
        expect(screen.getByText(/Upcoming events/i)).toBeInTheDocument();
      });

      // Verify initial call (no search param)
      expect(eventService.getEvents).toHaveBeenCalledWith({
        search: undefined,
        startFrom: undefined,
        startUntil: undefined,
        locationId: undefined,
        authorId: undefined,
        cursor: undefined,
        limit: undefined,
        sort: 'date-asc',
      });

      // Clear the initial call
      vi.clearAllMocks();

      // Navigate to URL with date params
      await router.navigate('/events?start_from=2026-01-15&start_until=2026-01-20');

      // Wait for navigation to complete
      await waitFor(() => {
        expect(router.state.location.search).toBe('?start_from=2026-01-15&start_until=2026-01-20');
      });

      // Verify service was called with new params
      expect(eventService.getEvents).toHaveBeenCalledWith({
        search: undefined,
        startFrom: '2026-01-15',
        startUntil: '2026-01-20',
        locationId: undefined,
        authorId: undefined,
        cursor: undefined,
        limit: undefined,
        sort: 'date-asc',
      });
    });

    it('displays selected date range from URL params', async () => {
      const router = createMemoryRouter(
        [{ path: '/events', Component: EventFeed, loader: eventsLoader }],
        { initialEntries: ['/events?start_from=2026-01-15&start_until=2026-01-20'] }
      );

      render(<RouterProvider router={router} />);

      // Look for the formatted date text in the date picker button
      await waitFor(() => {
        expect(screen.getByText(/Jan 15.*Jan 20/i)).toBeInTheDocument();
      });
    });
  });

  describe('Clear Filters', () => {
    it('shows and clears filters when Clear Filters button is clicked', async () => {
      const { router } = renderEventFeed();

      await waitFor(() => {
        expect(screen.getByText(/Upcoming events/i)).toBeInTheDocument();
      });

      // Navigate with filters
      await router.navigate('/events?search=nonexistent&start_from=2027-01-28');

      await waitFor(() => {
        expect(router.state.location.search).toContain('search=nonexistent');
      });

      await waitFor(() => {
        expect(screen.getByText(/No events found/i)).toBeInTheDocument();
      });

      // Find and click Clear Filters button
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      // Verify URL is cleared
      await waitFor(() => {
        expect(router.state.location.search).toBe('');
      });
    });
  });

  describe('User click on Going', () => {
    //Mock the stores
    const mockCurrentUserStore = vi.hoisted(() => ({
      useCurrentUserStore: vi.fn(),
    }));

    beforeEach(() => {
      vi.mock('@/store/currentUserStore', () => mockCurrentUserStore);
    });

    it('Redirect to login when user is not logged in', async () => {
      //Mock logged out state
      mockCurrentUserStore.useCurrentUserStore.mockImplementation((selector) =>
        selector({ user: null })
      );
      const { router } = renderEventFeed();

      await waitFor(() => {
        expect(screen.getByText(/Beer-Yoga Session/)).toBeInTheDocument();
      });

      //Find Going button
      const goingButton = screen.getAllByRole('button', { name: /going/i });
      await user.click(goingButton[1]);

      //Should redirect to  login
      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/login');
      });
    });

    it('marks user as attending when logged in and click Going', async () => {
      //Mock logged out state
      mockCurrentUserStore.useCurrentUserStore.mockImplementation((selector) =>
        selector({ user: mockUsers.alice })
      );

      vi.mocked(userService.attendEvent).mockResolvedValue({} as UserBase);
      renderEventFeed();

      await waitFor(() => {
        expect(screen.getByText(/Beer-Yoga Session/)).toBeInTheDocument();
      });

      //Find Going button
      const goingButton = screen.getAllByRole('button', { name: /going/i });
      await user.click(goingButton[1]);

      //Should call attendEvent
      await waitFor(() => {
        expect(userService.attendEvent).toHaveBeenCalledWith(2);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /going ✓/i })).toBeInTheDocument();
      });
    });

    it('disable Going button and shows Going ✓ is user already atending', async () => {
      //Mock logged out state
      mockCurrentUserStore.useCurrentUserStore.mockImplementation((selector) =>
        selector({ user: mockUsers.bob })
      );

      vi.mocked(userService.attendEvent).mockResolvedValue({} as UserBase);
      renderEventFeed();

      await waitFor(() => {
        expect(screen.getByText(/MEGA SUPER/)).toBeInTheDocument();
      });

      //Find Going button
      const goingCheckButton = screen.getAllByRole('button', { name: /going ✓/i });
      expect(goingCheckButton.length).toBeGreaterThan(0);
      expect(goingCheckButton[0]).toBeDisabled();
    });
  });
});
