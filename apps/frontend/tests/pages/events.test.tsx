import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import EventFeed, { eventsLoader } from '@/pages/events/Page';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { eventService } from '@/services/eventService';

//Mock event service
vi.mock('@/services/eventService', () => ({
  eventService: {
    getEvents: vi.fn(),
  },
}));

describe('Event Feed Page', () => {
  const user = userEvent.setup();

  //MOCK DATA
  const mockEvents = [
    {
      id: 1,
      authorId: 32893829,
      content:
        'A night of unforgettable techno beats, in Not Berghain. Join us for an immersive experience with top DJs and a vibrant crowd.',
      title:
        'MEGA SUPER DUPER COOL PARTY super hyper long title super hyper long title super hyper long titlesuper hyper long title super hyper long title super hyper long titlesuper hyper long title super hyper long title super hyper long titlesuper hyper long title super hyper long title super hyper long title super hyper long title super hyper long title super hyper long title',
      startAt: '2026-03-02T10:00:00Z',
      endAt: '2026-03-02T10:00:00Z',
      isPublished: true,
      isPublic: true,
    },
    {
      id: 2,
      authorId: 29839283,
      content:
        'A session of beer-yoga at Lotus. Unwind with a refreshing beer in hand while stretching and strengthening your body in a fun and social environment.',
      createdAt: '2026-01-03T10:00:00Z',
      endAt: '2026-01-03T10:00:00Z',
      isPublished: true,
      isPublic: true,
      startAt: '2026-01-03T10:00:00Z',
      title: 'Beer-Yoga Session',
    },
    {
      id: 3,
      authorId: 299389283,
      content: 'Come to my awesome event!',
      createdAt: '2026-01-03T10:00:00Z',
      endAt: '2026-01-15T10:00:00Z',
      isPublished: true,
      isPublic: false,
      startAt: '2026-01-15T10:00:00Z',
      title: 'Fireplace Gathering',
    },
  ];

  //Reset and setup mock before each test
  beforeEach(() => {
    vi.clearAllMocks();

    (eventService.getEvents as any).mockImplementation((params: any) => {
      let filtered = [...mockEvents];

      // Filter by search
      if (params?.search) {
        filtered = filtered.filter((event) =>
          event.title.toLowerCase().includes(params.search.toLowerCase())
        );
      }

      // Filter by date (simple check)
      if (params?.startFrom) {
        filtered = filtered.filter((event) => event.startAt >= params.startFrom);
      }

      return Promise.resolve(filtered);
    });
  });

  //Create a router
  function renderEventFeed(loaderData = mockEvents) {
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

  it('renders event cards when loader returns data', async () => {
    renderEventFeed(mockEvents);

    //Wait for events to appear
    await waitFor(() => {
      expect(screen.getByText(/Beer-Yoga Session/)).toBeInTheDocument();
    });
    expect(screen.getByText(/MEGA SUPER/)).toBeInTheDocument();
    expect(screen.getByText(/Fireplace Gathering/)).toBeInTheDocument();
  });

  it('show empty state when no events', async () => {
    (eventService.getEvents as any).mockResolvedValue([]);
    renderEventFeed([]);

    await waitFor(() => {
      expect(screen.getByText(/No events found/i)).toBeInTheDocument();
    });
  });

  it('update url and calls service with search param when user types', async () => {
    const { router } = renderEventFeed(mockEvents);

    await waitFor(() => {
      expect(screen.getByText(/Upcoming events/i)).toBeInTheDocument();
    });

    //Verify initial call (no search param)
    expect(eventService.getEvents).toHaveBeenCalledWith({
      search: undefined,
      startFrom: undefined,
      startUntil: undefined,
    });

    //Type in Search
    const searchInput = screen.getByPlaceholderText('Search events...');
    await user.type(searchInput, 'beer');

    //Verify URL update
    await waitFor(() => {
      expect(router.state.location.search).toBe('?search=beer');
    });

    //Verify service was called with search param
    expect(eventService.getEvents).toHaveBeenCalledWith({
      search: 'beer',
      startFrom: undefined,
      startUntil: undefined,
    });
  });

  it('update service call when URL date params change', async () => {
    const { router } = renderEventFeed(mockEvents);

    await waitFor(() => {
      expect(screen.getByText(/Upcoming events/i)).toBeInTheDocument();
    });

    //Verify initial call (no search param)
    expect(eventService.getEvents).toHaveBeenCalledWith({
      search: undefined,
      startFrom: undefined,
      startUntil: undefined,
    });

    // Clear the initial call
    vi.clearAllMocks();

    // Navigate to URL with date params
    router.navigate('/events?start_from=2026-01-15&start_until=2026-01-20');

    // Wait for navigation to complete
    await waitFor(() => {
      expect(router.state.location.search).toBe('?start_from=2026-01-15&start_until=2026-01-20');
    });

    // Verify service was called with new params
    expect(eventService.getEvents).toHaveBeenCalledWith({
      search: undefined,
      startFrom: '2026-01-15',
      startUntil: '2026-01-20',
    });
  });

  it('show and clears filters when Clear Filters button is clicked', async () => {
    const { router } = renderEventFeed();

    await waitFor(() => {
      expect(screen.getByText(/Upcoming events/i)).toBeInTheDocument();
    });

    //Navigate with filters
    router.navigate('/events?search=nonexistent&start_from=2027-01-28');

    await waitFor(() => {
      expect(router.state.location.search).toContain('search=nonexistent');
    });

    await waitFor(() => {
      expect(screen.getByText(/No events found/i)).toBeInTheDocument();
    });

    //Find and click Clear Filters button
    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    await userEvent.click(clearButton);

    //Verify URL is cleared
    await waitFor(() => {
      expect(router.state.location.search).toBe('');
    });
  });

  it('populates search input from URL on initial load', async () => {
    const router = createMemoryRouter(
      [{ path: '/events', Component: EventFeed, loader: eventsLoader }],
      { initialEntries: ['/events?search=beer'] }
    );

    render(<RouterProvider router={router} />);

    const searchInput = (await screen.findByPlaceholderText(
      'Search events...'
    )) as HTMLInputElement;
    expect(searchInput.value).toBe('beer');
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
