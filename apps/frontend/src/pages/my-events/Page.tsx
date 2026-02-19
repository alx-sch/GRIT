import { useEffect, useState } from 'react';
import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Plus } from 'lucide-react';
import { userService } from '@/services/userService';
import { useNavigate } from 'react-router-dom';

export function Page() {
  const [events, setEvents] = useState<Array<{ title: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const data = await userService.getMyEvents();
        setEvents(data);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const renderEventsList = (filteredEvents: Array<{ title: string }>) => (
    <div className="grid gap-4">
      {filteredEvents.map((event, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10">
                <CalendarDays className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <Text className="font-semibold text-lg">{event.title}</Text>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Attending</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/events')}>
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

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
          <Button onClick={() => navigate('/create/event')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
          <Button variant="outline" onClick={() => navigate('/events')}>
            Browse Events
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Container className="py-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Heading>My Events</Heading>
            <Text className="text-muted-foreground">
              Events you're attending {events.length > 0 && `(${events.length})`}
            </Text>
          </div>
          <Button onClick={() => navigate('/create/event')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Events List with Tabs */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Text className="text-destructive">{error}</Text>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : events.length === 0 ? (
          renderEmptyState()
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Events ({events.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {renderEventsList(events)}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-6">
              {renderEventsList(events)}
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarDays className="w-12 h-12 text-muted-foreground mb-3" />
                  <Text className="text-muted-foreground">No past events</Text>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Container>
  );
}
