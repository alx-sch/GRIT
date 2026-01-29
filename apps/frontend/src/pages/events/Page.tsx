import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { EventCard } from '@/pages/events/components/EventCard';
import { EventResponse } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoaderFunctionArgs, useSearchParams } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { DatePicker } from '@/components/ui/datepicker';
import { DateRange } from 'react-day-picker';
import { format, parse } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import { useState, useEffect } from 'react';

export const eventsLoader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') ?? undefined;
  const startFrom = url.searchParams.get('start_from') ?? undefined;
  const startUntil = url.searchParams.get('start_until') ?? undefined;
  const limit = url.searchParams.get('limit') ?? undefined;
  const authorId = url.searchParams.get('authorId') ?? undefined;
  const cursor = url.searchParams.get('cursor') ?? undefined;

  return eventService.getEvents({ search, startFrom, startUntil, limit, authorId, cursor });
};

export default function EventFeed() {
  const events = useTypedLoaderData<EventResponse>();

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');

  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    if (!searchInput && debouncedSearch) {
      return;
    }
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        const currentSearch = newParams.get('search');
        if (debouncedSearch && debouncedSearch !== currentSearch) {
          newParams.set('search', debouncedSearch);
          return newParams;
        } else if (!debouncedSearch && currentSearch) {
          newParams.delete('search');
          return newParams;
        }
        return prev;
      },
      { replace: true }
    );
  }, [debouncedSearch, searchInput, setSearchParams]);

  const startFromParam = searchParams.get('start_from');
  const startUntilParam = searchParams.get('start_until');

  const selectedDateRange: DateRange | undefined = startFromParam
    ? {
        from: parse(startFromParam, 'yyyy-MM-dd', new Date()),
        to: startUntilParam ? parse(startUntilParam, 'yyyy-MM-dd', new Date()) : undefined,
      }
    : undefined;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
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
          value={searchInput}
          onChange={handleSearchChange}
        />

        <DatePicker
          selected={selectedDateRange}
          onSelect={handleDateSelect}
          placeholder="Date"
        ></DatePicker>
      </div>
      {events.data.length > 0 ? (
        <div className="grid gap-6 justify-start md:grid-cols-2 lg:grid-cols-3">
          {events.data.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-border text-center bg-card">
          <Heading level={3} className="uppercase tracking-tight">
            No events found
          </Heading>

          <Text size="base" className="text-muted-foreground mt-2">
            {searchInput
              ? `No results for "${searchInput}"`
              : selectedDateRange
                ? 'Nothing scheduled for these dates'
                : 'Check back later for new events.'}
          </Text>

          {(searchInput || selectedDateRange) && (
            <Button
              variant="destructive"
              onClick={() => {
                setSearchInput('');
                const newParams = new URLSearchParams();
                setSearchParams(newParams);
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </Container>
  );
}
