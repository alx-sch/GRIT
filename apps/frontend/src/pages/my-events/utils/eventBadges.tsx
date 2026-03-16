import { Check } from 'lucide-react';
import type { ResMyEvents, ResMyInvitedEvents } from '@grit/schema';

type ResMyEvent = ResMyEvents[number];
type ResMyInvitedEvent = ResMyInvitedEvents[number];
type EventType = ResMyEvent | ResMyInvitedEvent;

export interface EventBadge {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  show: boolean;
  icon?: React.ReactNode;
}

export function getEventBadges(
  event: EventType,
  isPublished: boolean,
  isPublic: boolean,
  isInvited?: boolean
): EventBadge[] {
  const now = new Date();
  const isDraft = event.isOrganizer && !isPublished;
  const isUpcoming = new Date(event.startAt) >= now;

  return [
    {
      label: 'Draft',
      variant: 'destructive' as const,
      show: isDraft,
    },
    {
      label: 'Organizer',
      variant: 'default' as const,
      show: event.isOrganizer && isPublished,
    },
    {
      label: 'Invited',
      variant: 'default' as const,
      show: isInvited ?? false,
    },
    {
      label: isUpcoming ? 'Going' : 'Attended',
      variant: isUpcoming ? ('success' as const) : ('secondary' as const),
      show: !event.isOrganizer && !isInvited,
      icon: isUpcoming ? <Check className="w-3 h-3 mr-1" /> : undefined,
    },
    {
      label: 'Private',
      variant: 'outline' as const,
      show: !isPublic,
    },
  ].filter((badge) => badge.show);
}
