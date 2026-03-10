import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getEventImageUrl } from '@/lib/image_utils';
import type { ResUserPublicEvents } from '@grit/schema';
import { format } from 'date-fns';

export function PublicEventCard({ event }: { event: ResUserPublicEvents[number] }) {
  const imageUrl = getEventImageUrl({ id: event.id, title: event.title, imageKey: event.imageKey });

  return (
    <a href={`/events/${event.slug}`}>
      <Card className="w-full h-full flex flex-col rounded border-3 mx-auto hover:-translate-y-1 transition-transform duration-200 max-w-100">
        <CardHeader>
          <img src={imageUrl} alt={event.title} className="w-full aspect-square object-cover" />
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0 space-y-3 overflow-hidden">
          <CardTitle className="font-bold text-xl md:text-3xl line-clamp-2" title={event.title}>
            {event.title}
          </CardTitle>
          <CardDescription
            className="font-heading font-medium text-base md:text-xl line-clamp-2 min-w-0"
            title={`${format(event.startAt, 'EEE, MMM d')} @ ${event.location?.name ?? event.location?.city ?? 'TBA'}`}
          >
            {format(event.startAt, 'EEE, MMM d')} @{' '}
            {event.location?.name ?? event.location?.city ?? 'TBA'}
          </CardDescription>
        </CardContent>
      </Card>
    </a>
  );
}
