import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { EventCard } from '@/pages/events/components/EventCard';
import { Event } from '@/types/event';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

//Mock Data for testing purposes - to be replaced with real data fetching logic
const events: Event[] = [
  {
    id: 1,
    authorId: 1,
    author: 'Not Berghain',
    content:
      'A night of unforgettable techno beats, in Not Berghain. Join us for an immersive experience with top DJs and a vibrant crowd.',
    createdAt: '2026-01-02T10:00:00Z',
    endAt: '2026-03-02T10:00:00Z',
    isPublished: true,
    isPublic: true,
    startAt: '2026-03-02T10:00:00Z',
    title:
      'MEGA SUPER DUPER COOL PARTY super hyper long title super hyper long title super hyper long titlesuper hyper long title super hyper long title super hyper long titlesuper hyper long title super hyper long title super hyper long titlesuper hyper long title super hyper long title super hyper long title super hyper long title super hyper long title super hyper long title',
    interestedFriends: [
      'Anna',
      'Alice',
      'Bob',
      'Jemma',
      'Alex',
      'Anna',
      'Alice',
      'Bob',
      'Jemma',
      'Alex',
      'Anna',
      'Alice',
      'Bob',
      'Jemma',
      'Alex',
      'Anna',
      'Alice',
      'Bob',
      'Jemma',
      'Alex',
    ],
    imageURL: 'https://placehold.co/300x400/ff6b35/000000?text=Berghain+Party',
    interestedCount: 350,
    location: 'Not Berghain',
  },
  {
    id: 2,
    authorId: 2,
    author: 'Lotus',
    content:
      'A session of beer-yoga at Lotus. Unwind with a refreshing beer in hand while stretching and strengthening your body in a fun and social environment.',
    createdAt: '2026-01-03T10:00:00Z',
    endAt: '2026-01-03T10:00:00Z',
    isPublished: true,
    isPublic: true,
    startAt: '2026-01-03T10:00:00Z',
    title: 'Beer-Yoga Session',
    imageURL: 'https://placehold.co/400x300/ff6b35/000000?text=Beer+Yoga',
    interestedCount: 30,
    location: 'Lotus Brewery',
  },
  {
    id: 3,
    authorId: 3,
    author: 'Audrey',
    content: 'Come to my awesome event!',
    createdAt: '2026-01-03T10:00:00Z',
    endAt: '2026-01-15T10:00:00Z',
    isPublished: true,
    isPublic: false,
    startAt: '2026-01-15T10:00:00Z',
    title: 'Fireplace Gathering',
    interestedCount: 0,
    location: "Audrey's Place",
  },
  {
    id: 4,
    authorId: 4,
    author: 'Audrey',
    content: 'Come to my awesome event',
    createdAt: '2026-01-03T10:00:00Z',
    endAt: '2026-02-23T10:00:00Z',
    isPublished: true,
    isPublic: false,
    startAt: '2026-02-23T10:00:00Z',
    title: 'House Party',
    interestedCount: 43,
    location: "Audrey's Place",
  },
];

export default function EventFeed() {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const result = events.filter((event) => {
      if (!event.startAt) return false;
      return (
        new Date(event.startAt) > now &&
        (event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.author.toLowerCase().includes(searchTerm.toLowerCase()))
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
