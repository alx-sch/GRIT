import type { ResMyEvents } from '@grit/schema';
import { Check } from 'lucide-react';

type ResMyEvent = ResMyEvents[number];

export interface EventBadge {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  show: boolean;
  icon?: React.ReactNode;
}

export function getEventBadges(
  event: ResMyEvent,
  isPublished: boolean,
  isPublic: boolean
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
      label: isUpcoming ? 'Going' : 'Attended',
      variant: isUpcoming ? ('success' as const) : ('secondary' as const),
      show: !event.isOrganizer,
      icon: isUpcoming ? <Check className="w-3 h-3 mr-1" /> : undefined,
    },
    {
      label: 'Private',
      variant: 'outline' as const,
      show: !isPublic,
    },
  ].filter((badge) => badge.show);
}
