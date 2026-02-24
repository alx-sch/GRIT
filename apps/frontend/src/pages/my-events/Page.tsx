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

export const myEventsLoader = async () => {
  return userService.getMyEvents();
};

export function Page() {
  const events = useTypedLoaderData<{ title: string }[]>();
  const navigate = useNavigate();

  const renderEventsList = (filteredEvents: { title: string }[]) => (
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void navigate('/events');
                }}
              >
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Heading>My Events</Heading>
            <Text className="text-muted-foreground">
              Events you're attending {events.length > 0 && `(${String(events.length)})`}
            </Text>
          </div>
          <Button
            onClick={() => {
              void navigate('/create/event');
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Events List with Tabs */}
        {events.length === 0 ? (
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
