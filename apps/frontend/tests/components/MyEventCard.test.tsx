import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyEventCard } from '@/pages/my-events/components/MyEventCard';
import type { ResMyEvents } from '@grit/schema';

vi.mock('@/lib/image_utils', () => ({
  getEventImageUrl: (event: { imageKey?: string | null }) =>
    event.imageKey ? `http://test-minio/${event.imageKey}` : 'placeholder.svg',
}));

vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Map: () => <div>Map</div>,
  AdvancedMarker: () => <div>Marker</div>,
}));

describe('MyEventCard', () => {
  const user = userEvent.setup();

  const mockEvent: ResMyEvents[number] = {
    id: 1,
    slug: 'test-event',
    title: 'Test Event',
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

  const mockHandlers = {
    onPublish: vi.fn().mockResolvedValue(true),
    onUnpublish: vi.fn().mockResolvedValue(true),
    onEdit: vi.fn(),
    onViewDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Badge Display', () => {
    it('should show Draft badge for unpublished organizer events', () => {
      render(<MyEventCard event={mockEvent} {...mockHandlers} />);
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('should show Organizer badge for published organizer events', () => {
      const publishedEvent = { ...mockEvent, isPublished: true };
      render(<MyEventCard event={publishedEvent} {...mockHandlers} />);
      expect(screen.getByText('Organizer')).toBeInTheDocument();
    });

    it('should show Going badge with checkmark for upcoming non-organizer events', () => {
      const attendingEvent = { ...mockEvent, isOrganizer: false, isPublished: true };
      render(<MyEventCard event={attendingEvent} {...mockHandlers} />);
      expect(screen.getByText('Going')).toBeInTheDocument();
    });

    it('should show Attended badge for past non-organizer events', () => {
      const pastEvent = {
        ...mockEvent,
        isOrganizer: false,
        isPublished: true,
        startAt: new Date('2020-01-01T18:00:00Z').toISOString(),
      };
      render(<MyEventCard event={pastEvent} {...mockHandlers} />);
      expect(screen.getByText('Attended')).toBeInTheDocument();
    });

    it('should show Private badge for private events', () => {
      const privateEvent = { ...mockEvent, isPublic: false, isPublished: true };
      render(<MyEventCard event={privateEvent} {...mockHandlers} />);
      expect(screen.getByText('Private')).toBeInTheDocument();
    });
  });

  describe('Button Visibility', () => {
    it('should show Publish button for draft events', () => {
      render(<MyEventCard event={mockEvent} {...mockHandlers} />);
      expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument();
    });

    it('should show Unpublish button for published organizer events', () => {
      const publishedEvent = { ...mockEvent, isPublished: true };
      render(<MyEventCard event={publishedEvent} {...mockHandlers} />);
      expect(screen.getByRole('button', { name: /unpublish/i })).toBeInTheDocument();
    });

    it('should show Edit button for organizer events', () => {
      render(<MyEventCard event={mockEvent} {...mockHandlers} />);
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('should make whole card clickable for viewing details', () => {
      const { container } = render(<MyEventCard event={mockEvent} {...mockHandlers} />);
      const card = container.querySelector('.cursor-pointer');
      expect(card).toBeInTheDocument();
    });

    it('should not show Edit button for non-organizer events', () => {
      const attendingEvent = { ...mockEvent, isOrganizer: false, isPublished: true };
      render(<MyEventCard event={attendingEvent} {...mockHandlers} />);
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });
  });

  describe('Publish Dialog', () => {
    it('should open dialog when Publish button is clicked', async () => {
      render(<MyEventCard event={mockEvent} {...mockHandlers} />);

      const publishButton = screen.getByRole('button', { name: /^publish$/i });
      await user.click(publishButton);

      expect(screen.getByText('Publish Event?')).toBeInTheDocument();
      expect(screen.getByText(/make your event visible to everyone/i)).toBeInTheDocument();
    });

    it('should close dialog when Cancel is clicked', async () => {
      render(<MyEventCard event={mockEvent} {...mockHandlers} />);

      const publishButton = screen.getByRole('button', { name: /^publish$/i });
      await user.click(publishButton);
      expect(screen.getByText('Publish Event?')).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByText('Publish Event?')).not.toBeInTheDocument();
    });

    it('should call onPublish when confirmed', async () => {
      render(<MyEventCard event={mockEvent} {...mockHandlers} />);

      const publishButton = screen.getByRole('button', { name: /^publish$/i });
      await user.click(publishButton);

      const confirmButton = screen
        .getAllByRole('button', { name: /publish/i })
        .find((btn) => btn.textContent === 'Publish');
      if (confirmButton) {
        await user.click(confirmButton);
      }

      expect(mockHandlers.onPublish).toHaveBeenCalledWith(1, 'test-event');
    });
  });

  describe('Unpublish Dialog', () => {
    it('should open dialog when Unpublish button is clicked', async () => {
      const publishedEvent = { ...mockEvent, isPublished: true };
      render(<MyEventCard event={publishedEvent} {...mockHandlers} />);

      const unpublishButton = screen.getByRole('button', { name: /unpublish/i });
      await user.click(unpublishButton);

      expect(screen.getByText('Unpublish Event?')).toBeInTheDocument();
      expect(screen.getByText(/hide your event from the public/i)).toBeInTheDocument();
    });

    it('should call onUnpublish when confirmed', async () => {
      const publishedEvent = { ...mockEvent, isPublished: true };
      render(<MyEventCard event={publishedEvent} {...mockHandlers} />);

      const unpublishButton = screen.getByRole('button', { name: /unpublish/i });
      await user.click(unpublishButton);

      const confirmButton = screen
        .getAllByRole('button', { name: /unpublish/i })
        .find((btn) => btn.textContent === 'Unpublish');
      if (confirmButton) {
        await user.click(confirmButton);
      }

      expect(mockHandlers.onUnpublish).toHaveBeenCalledWith(1);
    });
  });

  describe('Clickable Elements', () => {
    it('should call onEdit when Edit button is clicked', async () => {
      render(<MyEventCard event={mockEvent} {...mockHandlers} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(mockHandlers.onEdit).toHaveBeenCalledWith('test-event');
    });

    it('should call onViewDetails when card is clicked', async () => {
      const { container } = render(<MyEventCard event={mockEvent} {...mockHandlers} />);

      const card = container.querySelector('.cursor-pointer');
      if (card) {
        await user.click(card as HTMLElement);
      }

      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith('test-event');
    });

    it('should call onViewDetails when title text is clicked', async () => {
      render(<MyEventCard event={mockEvent} {...mockHandlers} />);

      const title = screen.getByText('Test Event');
      await user.click(title);

      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith('test-event');
    });

    it('should call onViewDetails when image is clicked', async () => {
      render(<MyEventCard event={mockEvent} {...mockHandlers} />);

      const image = screen.getByAltText('Test Event');
      await user.click(image);

      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith('test-event');
    });
  });

  describe('Optimistic Updates', () => {
    it('should display optimistic published state', () => {
      render(
        <MyEventCard event={mockEvent} optimisticState={{ isPublished: true }} {...mockHandlers} />
      );

      expect(screen.getByText('Organizer')).toBeInTheDocument();
      expect(screen.queryByText('Draft')).not.toBeInTheDocument();
    });

    it('should display optimistic public state', () => {
      const privateEvent = { ...mockEvent, isPublic: false, isPublished: true };
      render(
        <MyEventCard event={privateEvent} optimisticState={{ isPublic: true }} {...mockHandlers} />
      );

      expect(screen.queryByText('Private')).not.toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should have dashed border for draft events', () => {
      const { container } = render(<MyEventCard event={mockEvent} {...mockHandlers} />);
      const card = container.querySelector('[class*="border-dashed"]');
      expect(card).toBeInTheDocument();
    });

    it('should not have dashed border for published events', () => {
      const publishedEvent = { ...mockEvent, isPublished: true };
      const { container } = render(<MyEventCard event={publishedEvent} {...mockHandlers} />);
      const dashedCard = container.querySelector('[class*="border-dashed"]');
      expect(dashedCard).not.toBeInTheDocument();
    });
  });

  describe('Event Information Display', () => {
    it('should display event title', () => {
      render(<MyEventCard event={mockEvent} {...mockHandlers} />);
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    it('should display event location', () => {
      render(<MyEventCard event={mockEvent} {...mockHandlers} />);
      expect(screen.getByText('Test Venue')).toBeInTheDocument();
    });

    it('should display formatted event date', () => {
      render(<MyEventCard event={mockEvent} {...mockHandlers} />);
      expect(screen.getByText(/Dec/i)).toBeInTheDocument();
    });

    it('should handle long event titles with word break', () => {
      const longTitleEvent = {
        ...mockEvent,
        title: 'This is a very long event title that should wrap properly without overflowing',
      };
      render(<MyEventCard event={longTitleEvent} {...mockHandlers} />);
      expect(screen.getByText(/very long event title/i)).toBeInTheDocument();
    });
  });
});
