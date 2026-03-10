import { describe, it, expect } from 'vitest';
import { getEventBadges } from '@/pages/my-events/utils/eventBadges';
import type { ResMyEvents } from '@grit/schema';

describe('getEventBadges', () => {
  const baseEvent: ResMyEvents[number] = {
    id: 1,
    slug: 'test-event',
    title: 'Test Event',
    startAt: new Date('2026-12-01T18:00:00Z').toISOString(),
    endAt: new Date('2026-12-01T20:00:00Z').toISOString(),
    imageKey: null,
    location: null,
    isOrganizer: true,
    isPublished: false,
    isPublic: true,
    conversationId: undefined,
  };

  describe('Draft Badge', () => {
    it('should show Draft badge for unpublished organizer events', () => {
      const badges = getEventBadges(baseEvent, false, true);
      const draftBadge = badges.find((b) => b.label === 'Draft');

      expect(draftBadge).toBeDefined();
      expect(draftBadge?.variant).toBe('destructive');
    });

    it('should not show Draft badge for published events', () => {
      const badges = getEventBadges(baseEvent, true, true);
      const draftBadge = badges.find((b) => b.label === 'Draft');

      expect(draftBadge).toBeUndefined();
    });

    it('should not show Draft badge for non-organizer events', () => {
      const nonOrganizerEvent = { ...baseEvent, isOrganizer: false };
      const badges = getEventBadges(nonOrganizerEvent, false, true);
      const draftBadge = badges.find((b) => b.label === 'Draft');

      expect(draftBadge).toBeUndefined();
    });
  });

  describe('Organizer Badge', () => {
    it('should show Organizer badge for published organizer events', () => {
      const badges = getEventBadges(baseEvent, true, true);
      const organizerBadge = badges.find((b) => b.label === 'Organizer');

      expect(organizerBadge).toBeDefined();
      expect(organizerBadge?.variant).toBe('default');
    });

    it('should not show Organizer badge for draft events', () => {
      const badges = getEventBadges(baseEvent, false, true);
      const organizerBadge = badges.find((b) => b.label === 'Organizer');

      expect(organizerBadge).toBeUndefined();
    });

    it('should not show Organizer badge for non-organizer events', () => {
      const nonOrganizerEvent = { ...baseEvent, isOrganizer: false };
      const badges = getEventBadges(nonOrganizerEvent, true, true);
      const organizerBadge = badges.find((b) => b.label === 'Organizer');

      expect(organizerBadge).toBeUndefined();
    });
  });

  describe('Going/Attended Badge', () => {
    it('should show Going badge with success variant for upcoming non-organizer events', () => {
      const futureEvent = {
        ...baseEvent,
        isOrganizer: false,
        startAt: new Date('2026-12-01T18:00:00Z').toISOString(),
      };
      const badges = getEventBadges(futureEvent, true, true);
      const goingBadge = badges.find((b) => b.label === 'Going');

      expect(goingBadge).toBeDefined();
      expect(goingBadge?.variant).toBe('success');
      expect(goingBadge?.icon).toBeDefined();
    });

    it('should show Attended badge with secondary variant for past non-organizer events', () => {
      const pastEvent = {
        ...baseEvent,
        isOrganizer: false,
        startAt: new Date('2020-01-01T18:00:00Z').toISOString(),
      };
      const badges = getEventBadges(pastEvent, true, true);
      const attendedBadge = badges.find((b) => b.label === 'Attended');

      expect(attendedBadge).toBeDefined();
      expect(attendedBadge?.variant).toBe('secondary');
      expect(attendedBadge?.icon).toBeUndefined();
    });

    it('should not show Going/Attended badge for organizer events', () => {
      const badges = getEventBadges(baseEvent, true, true);
      const goingBadge = badges.find((b) => b.label === 'Going');
      const attendedBadge = badges.find((b) => b.label === 'Attended');

      expect(goingBadge).toBeUndefined();
      expect(attendedBadge).toBeUndefined();
    });
  });

  describe('Private Badge', () => {
    it('should show Private badge for private events', () => {
      const badges = getEventBadges(baseEvent, true, false);
      const privateBadge = badges.find((b) => b.label === 'Private');

      expect(privateBadge).toBeDefined();
      expect(privateBadge?.variant).toBe('outline');
    });

    it('should not show Private badge for public events', () => {
      const badges = getEventBadges(baseEvent, true, true);
      const privateBadge = badges.find((b) => b.label === 'Private');

      expect(privateBadge).toBeUndefined();
    });

    it('should show Private badge even for draft events', () => {
      const badges = getEventBadges(baseEvent, false, false);
      const privateBadge = badges.find((b) => b.label === 'Private');

      expect(privateBadge).toBeDefined();
    });
  });

  describe('Multiple Badges', () => {
    it('should show both Draft and Private badges', () => {
      const badges = getEventBadges(baseEvent, false, false);

      expect(badges.find((b) => b.label === 'Draft')).toBeDefined();
      expect(badges.find((b) => b.label === 'Private')).toBeDefined();
      expect(badges).toHaveLength(2);
    });

    it('should show both Organizer and Private badges', () => {
      const badges = getEventBadges(baseEvent, true, false);

      expect(badges.find((b) => b.label === 'Organizer')).toBeDefined();
      expect(badges.find((b) => b.label === 'Private')).toBeDefined();
      expect(badges).toHaveLength(2);
    });

    it('should show both Going and Private badges', () => {
      const nonOrganizerEvent = { ...baseEvent, isOrganizer: false };
      const badges = getEventBadges(nonOrganizerEvent, true, false);

      expect(badges.find((b) => b.label === 'Going')).toBeDefined();
      expect(badges.find((b) => b.label === 'Private')).toBeDefined();
      expect(badges).toHaveLength(2);
    });

    it('should show only one status badge at a time', () => {
      // Draft organizer event
      let badges = getEventBadges(baseEvent, false, true);
      let statusBadges = badges.filter((b) =>
        ['Draft', 'Organizer', 'Going', 'Attended'].includes(b.label)
      );
      expect(statusBadges).toHaveLength(1);

      // Published organizer event
      badges = getEventBadges(baseEvent, true, true);
      statusBadges = badges.filter((b) =>
        ['Draft', 'Organizer', 'Going', 'Attended'].includes(b.label)
      );
      expect(statusBadges).toHaveLength(1);

      // Non-organizer event
      const nonOrganizerEvent = { ...baseEvent, isOrganizer: false };
      badges = getEventBadges(nonOrganizerEvent, true, true);
      statusBadges = badges.filter((b) =>
        ['Draft', 'Organizer', 'Going', 'Attended'].includes(b.label)
      );
      expect(statusBadges).toHaveLength(1);
    });
  });
});
