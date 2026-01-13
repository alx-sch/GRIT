import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { EventCard } from '@/pages/events/components/EventCard';
import { Event } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoaderFunctionArgs, useSearchParams } from 'react-router';
import { eventService } from '@/services/eventService';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { DatePicker } from '@/components/ui/datepicker';
import { DateRange } from 'react-day-picker';
import { format, parse } from 'date-fns';

export const eventsLoader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || undefined;
  const startFrom = url.searchParams.get('start_from') || undefined;
  const startUntil = url.searchParams.get('start_until') || undefined;

  return eventService.getEvents({ search, startFrom, startUntil });
};

export default function EventFeed() {
  const events = useTypedLoaderData<Event[]>();

  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = searchParams.get('search') || '';
  const startFromParam = searchParams.get('start_from');
  const startUntilParam = searchParams.get('start_until');

  const selectedDateRange: DateRange | undefined = startFromParam
    ? {
        from: parse(startFromParam, 'yyyy-MM-dd', new Date()),
        to: startUntilParam ? parse(startUntilParam, 'yyyy-MM-dd', new Date()) : undefined,
      }
    : undefined;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      searchParams.set('search', e.target.value);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      searchParams.set('start_from', format(range.from, 'yyyy-MM-dd'));
      if (range.to) {
        searchParams.set('start_until', format(range.to, 'yyyy-MM-dd'));
      } else {
        searchParams.delete('start_until');
      }
    } else {
      searchParams.delete('start_from');
      searchParams.delete('start_until');
    }
    setSearchParams(searchParams);
  };

  return (
    <Container className="py-10 space-y-8 p-0 md:px-0">
      <div className="space-y-2">
        <Heading level={1}>Upcoming events</Heading>
      </div>

      <div className="flex justify-between items-center gap-4">
        <Input
          placeholder="Search events..."
          className="max-w-sm"
          value={searchTerm}
          onChange={handleSearchChange}
        />

        <DatePicker
          selected={selectedDateRange}
          onSelect={handleDateSelect}
          placeholder="Date"
        ></DatePicker>
      </div>
      {events.length > 0 ? (
        <div className="grid gap-6 justify-start md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
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
                searchParams.delete('search');
                setSearchParams(searchParams);
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
