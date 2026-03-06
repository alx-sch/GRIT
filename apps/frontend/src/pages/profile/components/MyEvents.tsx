import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getEventImageUrl } from '@/lib/image_utils';

interface MyEventsProps {
  events: {
    id: number;
    title: string;
    startAt: string;
    isOrganizer: boolean;
    imageKey?: string | null;
    location?: { name?: string | null; city?: string | null } | null;
  }[];
}

export function MyEvents({ events }: MyEventsProps) {
  const navigate = useNavigate();

  const displayedEvents = events.slice(0, 5);
  const hasMore = events.length > 5;

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
                  void navigate('/my-events');
                }}
              >
                View All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                <div
                  key={event.id}
                  onClick={() => void navigate(`/events/${String(event.id)}`)}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {/* Event Mini Image */}
                    <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden bg-muted">
                      <img
                        src={getEventImageUrl(event)}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Text className="font-medium line-clamp-1">{event.title}</Text>
                        {event.isOrganizer && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1">
                            Organizer
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Text className="text-xs">
                          {new Date(event.startAt).toLocaleDateString()}
                        </Text>

                        {event.location && (
                          <>
                            <span>•</span>
                            <div className="flex items-center max-w-30">
                              <MapPin className="w-3 h-3 mr-1 shrink-0" />
                              <span className="truncate">
                                {event.location.name ?? event.location.city}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  void navigate('/my-events');
                }}
              >
                View all {events.length} events
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
