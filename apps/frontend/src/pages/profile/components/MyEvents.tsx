import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getEventImageUrl } from '@/lib/image_utils';

interface MyEventsProps {
  events: {
    id: number;
    slug: string;
    title: string;
    startAt: string;
    isOrganizer: boolean;
    imageKey?: string | null;
    location?: { name?: string | null; city?: string | null } | null;
  }[];
  variant?: 'card' | 'standalone';
}

export function MyEvents({ events, variant = 'card' }: MyEventsProps) {
  const navigate = useNavigate();

  const displayedEvents = events.slice(0, 5);
  const hasMore = events.length > 5;

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const content = (
    <>
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground mb-4" />
          <Text className="text-muted-foreground mb-2">No events yet</Text>
          <Text className="text-sm text-muted-foreground mb-4">
            Start by creating or joining an event
          </Text>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                void navigate('/create/event');
              }}
            >
              Create Event
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void navigate('/events');
              }}
            >
              Browse Events
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            {displayedEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-3">
                    {/* Event Image */}
                    <button
                      onClick={() => {
                        void navigate(`/events/${event.slug}`);
                      }}
                      className="w-16 h-16 shrink-0 rounded overflow-hidden bg-muted hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <img
                        src={getEventImageUrl(event)}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </button>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {event.isOrganizer && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1 shrink-0">
                            Organizer
                          </Badge>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          void navigate(`/events/${event.slug}`);
                        }}
                        className="text-left hover:underline mb-1 block w-full cursor-pointer"
                      >
                        <Text className="font-semibold line-clamp-1">{event.title}</Text>
                      </button>

                      <Text className="text-xs text-muted-foreground line-clamp-1">
                        {formatEventDate(event.startAt)}
                      </Text>

                      {event.location && (
                        <Text className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {event.location.name ?? event.location.city}
                        </Text>
                      )}
                    </div>

                    {/* View Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => {
                        void navigate(`/events/${event.slug}`);
                      }}
                      title="View event details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => {
                void navigate('/profile/my-events');
              }}
            >
              View all {events.length} events
            </Button>
          )}
        </div>
      )}
    </>
  );

  if (variant === 'standalone') {
    return <div className="space-y-3">{content}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Events</CardTitle>
            <CardDescription>
              {events.length > 0
                ? `${String(events.length)} event${events.length === 1 ? '' : 's'}`
                : "Events you're attending"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {events.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigate('/profile/my-events');
                }}
              >
                View All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
