import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { EventCard } from '@/pages/events/components/EventCard';
import { Event } from '@/types/event';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoaderFunctionArgs } from 'react-router';
import { eventService } from '@/services/eventService';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';

export const eventsLoader = async ({ request }: LoaderFunctionArgs) => {
	return eventService.getEvents();
}

export default function EventFeed() {
  const events = useTypedLoaderData<Event[]>();

  const [searchTerm, setSearchTerm] = useState('');
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const result = events.filter((event) => {
      if (!event.startAt) return false;
      return (
        new Date(event.startAt) > now &&
        (event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.author.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
    return result.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [events, searchTerm]);

  return (
    <Container className="py-10 space-y-8 p-0 md:px-0">
      <div className="space-y-2">
        <Heading level={1}>Upcoming events</Heading>
      </div>

      <Input
        placeholder="Search events..."
        className="max-w-sm"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
        }}
      />

      {filteredEvents.length > 0 ? (
        <div className="grid gap-6 justify-start md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border text-center bg-card">
          <Heading level={3} className="uppercase tracking-tight">
            No events found
          </Heading>

          <Text size="base" className="text-muted-foreground mt-2">
            {searchTerm ? `No results for "${searchTerm}"` : 'Check back later for new events.'}
          </Text>

          {searchTerm && (
            <Button
              variant="destructive"
              onClick={() => {
                setSearchTerm('');
              }}
              className="mt-4"
            >
              Clear Search
            </Button>
          )}
        </div>
      )}
    </Container>
  );
}
