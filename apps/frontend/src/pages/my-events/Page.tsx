import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Plus } from 'lucide-react';
import { userService } from '@/services/userService';
import { useNavigate } from 'react-router-dom';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import type { ResUserEvents } from '@grit/schema';
import { getEventImageUrl } from '@/lib/image_utils';

export const myEventsLoader = async () => {
  return userService.getMyEvents();
};

export function Page() {
  const events = useTypedLoaderData<ResUserEvents>();
  const navigate = useNavigate();

  const now = new Date();
  const upcomingEvents = events.filter((event) => new Date(event.startAt) >= now);
  const pastEvents = events.filter((event) => new Date(event.startAt) < now);
  const organizingEvents = events.filter((event) => event.isOrganizer);

  const renderEventsList = (filteredEvents: ResUserEvents) => {
    if (filteredEvents.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="w-12 h-12 text-muted-foreground mb-3" />
            <Text className="text-muted-foreground">No events found in this category.</Text>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center shrink-0 w-16 h-16 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-muted border">
                  <img
                    // We cast as any because getEventImageUrl expects an EventBase,
                    // but it only actually uses id, title, and imageKey internally which we have.
                    src={getEventImageUrl(event)}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1">
                  <Text className="font-semibold text-lg line-clamp-1">{event.title}</Text>

                  {/* Event Location */}
                  {event.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-1 shrink-0" />
                      <span className="line-clamp-1">
                        {event.location.name || event.location.city || 'Location TBD'}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant={event.isOrganizer ? 'default' : 'secondary'}>
                      {event.isOrganizer
                        ? 'Organizing'
                        : new Date(event.startAt) >= now
                          ? 'Attending'
                          : 'Attended'}
                    </Badge>
                    <Text className="text-sm text-muted-foreground">
                      {new Date(event.startAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </Text>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto shrink-0"
                onClick={() => {
                  void navigate(`/events/${event.id}`);
                }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderEmptyState = () => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <CalendarDays className="w-16 h-16 text-muted-foreground mb-4" />
        <Heading className="mb-2">No events yet</Heading>
        <Text className="text-muted-foreground mb-6 max-w-md">
          You haven't joined any events yet. Start by creating your own event or browse existing
          events to attend.
        </Text>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              void navigate('/create/event');
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void navigate('/events');
            }}
          >
            Browse Events
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Container className="py-10">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Heading>My Events</Heading>
          {events.length > 0 && (
            <Button
              onClick={() => {
                void navigate('/create/event');
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          )}
        </div>

        {events.length === 0 ? (
          renderEmptyState()
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full sm:w-auto flex overflow-x-auto">
              <TabsTrigger value="all">All ({events.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcomingEvents.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({pastEvents.length})</TabsTrigger>
              <TabsTrigger value="organizing">Organizing ({organizingEvents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {renderEventsList(events)}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-6">
              {renderEventsList(upcomingEvents)}
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              {renderEventsList(pastEvents)}
            </TabsContent>

            <TabsContent value="organizing" className="mt-6">
              {renderEventsList(organizingEvents)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Container>
  );
}
