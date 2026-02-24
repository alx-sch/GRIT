import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MyEventsProps {
  events: { title: string }[];
}

export function MyEvents({ events }: MyEventsProps) {
  const navigate = useNavigate();

  // Show only first 5 events for summary view
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
            <Button
              size="sm"
              onClick={() => {
                void navigate('/create/event');
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
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
              {displayedEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-5 h-5 text-muted-foreground" />
                    <Text className="font-medium">{event.title}</Text>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
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
