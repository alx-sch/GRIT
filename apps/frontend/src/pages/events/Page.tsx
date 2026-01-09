import { Container } from '@/components/layout/Container';
import { Heading } from '@/components/ui/typography';
import { EventCard } from './components/EventCard';
import { Event } from '@/types/event';

//Mock Data for testing purposes - to be replaced with real data fetching logic
const mockEvents: Event[] = [
  {
    id: 1,
    authorId: 1,
    author: 'Not Berghain',
    content:
      'A night of unforgettable techno beats, in Not Berghain. Join us for an immersive experience with top DJs and a vibrant crowd.',
    createdAt: '2026-01-02T10:00:00Z',
    endAt: 'Mon, Mar 30, 2026',
    isPublished: true,
    isPublic: true,
    startAt: 'Sat, Mar 28, 2026',
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
    imageURL: 'https://placehold.co/400x300/ff6b35/000000?text=Berghain+Party',
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
    endAt: 'Fri, Jan 3, 2026',
    isPublished: true,
    isPublic: true,
    startAt: 'Fri, Jan 3, 2026',
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
    endAt: 'Thur, Jan 15, 2026',
    isPublished: true,
    isPublic: false,
    startAt: 'Thur, Jan 15, 2026',
    title: 'House Party',
    interestedCount: 0,
    location: "Audrey's Place",
  },
];

export default function EventFeed() {
  return (
    <Container className="py-10 space-y-8">
      <div className="space-y-2">
        <Heading level={1}>Upcoming events</Heading>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </Container>
  );
}
