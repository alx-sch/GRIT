import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxOptions } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/datepicker';
import { Input } from '@/components/ui/input';
import { Heading, Text } from '@/components/ui/typography';
import { useDebounce } from '@/hooks/useDebounce';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { EventCard } from '@/pages/events/components/EventCard';
import { eventService } from '@/services/eventService';
import { locationService } from '@/services/locationService';
import { EventResponse } from '@/types/event';
import { LocationBase } from '@/types/location';
import { format, parse } from 'date-fns';
import { ArrowUpDown, MapPinIcon } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { DateRange } from 'react-day-picker';
import { LoaderFunctionArgs, useSearchParams } from 'react-router-dom';

const buildEventQuery = (searchParams: URLSearchParams, cursor?: string | null) => ({
  search: searchParams.get('search') ?? undefined,
  startFrom: searchParams.get('start_from') ?? format(new Date(), 'yyyy-MM-dd'),
  startUntil: searchParams.get('start_until') ?? undefined,
  locationId: searchParams.get('location_id') ?? undefined,
  limit: searchParams.get('limit') ?? undefined,
  authorId: searchParams.get('authorId') ?? undefined,
  cursor: cursor ?? undefined,
  sort: searchParams.get('sort') ?? 'date-asc',
});

export const eventsLoader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const query = buildEventQuery(url.searchParams);

  const [events, locationsResponse] = await Promise.all([
    eventService.getEvents(query),
    locationService.getLocations(),
  ]);
  return { events, locations: locationsResponse.data };
};

//Sorting Options
const sortOptions: ComboboxOptions[] = [
  { value: 'date-asc', label: 'Soonest' },
  { value: 'date-dsc', label: 'Furthest' },
  { value: 'alpha-asc', label: 'Name (A-Z)' },
  { value: 'alpha-dsc', label: 'Name (Z-A)' },
  { value: 'popularity', label: 'Most popular' },
];

export default function EventFeedPage() {
  const { events, locations } = useTypedLoaderData<{
    events: EventResponse;
    locations: LocationBase[];
  }>();

  const locationOptionsCombobox: ComboboxOptions[] = locations.map(({ id, name }) => ({
    value: String(id),
    label: name ?? '',
  }));

  const locationMap = new Map(locations.map((l) => [l.id, l]));

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');

  const debouncedSearch = useDebounce(searchInput, 500);

  // Infinite scroll state (only gets called once on first render).
  const [items, setItems] = useState(() => events.data); // Displayed events (initial + loaded)
  const [nextCursor, setNextCursor] = useState<string | null>(() => events.pagination.nextCursor); // Pointer to next page
  const [hasMoreClient, setHasMoreClient] = useState<boolean>(() => events.pagination.hasMore); // Are there more events to load?
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Avoid duplicate requests if one request is currently happening
  const sentinelRef = useRef<HTMLDivElement | null>(null); // Reference to invisible div at bottom (IntersectionObserver watches this)

  // Reset on filter change (if filter changes, the events displayed go back to initial state with only first [limit] amount loaded.)
  useEffect(() => {
    setItems(events.data);
    setNextCursor(events.pagination.nextCursor);
    setHasMoreClient(events.pagination.hasMore);
  }, [events]); // Only runs when events changes

  // Main function for loading more events -> takes whichever events were already there, and appends the next ones to also be displayed.
  const loadMore = async () => {
    if (!hasMoreClient || isLoadingMore || !nextCursor) return;
    setIsLoadingMore(true);
    try {
      const query = buildEventQuery(searchParams, nextCursor);
      const res = await eventService.getEvents(query);
      setItems((prev) => {
        const existing = new Set(prev.map((e) => e.id)); // Already displayed events (e is ONE event object).
        const appended = res.data.filter((e) => !existing.has(e.id)); // Making sure already displayed events are not displayed again.
        return [...prev, ...appended];
      });
      setNextCursor(res.pagination.nextCursor);
      setHasMoreClient(res.pagination.hasMore);
    } catch (err) {
      console.error('Failed to load more events', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Observes sentinel (an invisible div element) -> when scrolling and getting close
  // to sentinel -> call loadMore.
  useEffect(() => {
    const el = sentinelRef.current; // Store the sentinel (if it exists)
    if (!el) return;

    const io = new IntersectionObserver( // Create an observer that watches elements
      (entries) => {
        // Entries -> watched elements.
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadMore();
          }
        });
      },
      { rootMargin: '400px', threshold: 0.1 } // Two options: Trigger 400 px BEFORE sentinel reaches viewport, and when 10% of sentinel is visible.
    );
    io.observe(el); // Set observer to watch sentinel.
    return () => io.disconnect();
  }, [nextCursor, hasMoreClient, searchParams]); // Whenever one of these changes, this function gets called again.

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

  const selectedLocation = searchParams.get('location_id');

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

  const handleLocationChange = (locationId: string) => {
    if (locationId) {
      searchParams.set('location_id', locationId);
    } else {
      searchParams.delete('location_id');
    }
    setSearchParams(searchParams);
  };

  //Sorting
  const [sort, setSort] = useState(searchParams.get('sort') ?? '');
  const handleSortChange = (value: string) => {
    setSort(value);
    searchParams.set('sort', value);
    setSearchParams(searchParams);
  };

  return (
    <Container className="py-10 space-y-8 p-0 md:px-0">
      <div className="space-y-2">
        <Heading level={1} className="text-3xl md:text-4xl">
          Upcoming events
        </Heading>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
        <Input
          placeholder="Search events..."
          className="w-full md:w-sm md:shrink-0"
          value={searchInput}
          onChange={handleSearchChange}
        />

        <div className="flex items-center justify-between md:justify-end gap-1 md:gap-2 md:flex-1 min-w-0">
          <Combobox
            options={locationOptionsCombobox}
            value={selectedLocation ?? undefined}
            onChange={handleLocationChange}
            placeholder="Location"
            searchPlaceholder="Search"
            emptyMessage="No location found"
            variant="ghost"
            icon={MapPinIcon}
            className="w-auto min-w-0 md:min-w-32 md:flex-none text-xs md:text-base max-w-xs truncate font-normal max-w-[33%] md:shrink"
          />

          <div className="w-[1.5px] h-5 bg-border/60 shrink-0 dark:bg-white/20" />

          <DatePicker
            selected={selectedDateRange}
            onSelect={handleDateSelect}
            placeholder="Date"
            variant="ghost"
            className="min-w-0 md:flex-none text-xs md:text-base truncate font-normal max-w-[33%] md:shrink-0"
          ></DatePicker>

          <div className="w-[1.5px] h-5 bg-border/60 shrink-0 dark:bg-white/20" />

          <Combobox
            options={sortOptions}
            value={sort}
            onChange={handleSortChange}
            placeholder="Sort"
            variant="ghost"
            icon={ArrowUpDown}
            showSearch={false}
            className="w-auto min-w-0 md:flex-none text-xs md:text-base font-normal max-w-[33%] md:shrink-0"
          />
        </div>
      </div>
      {items.length > 0 ? (
        <>
          <div className="grid gap-6 justify-start md:grid-cols-2 lg:grid-cols-3">
            {items.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                location={event.location?.id ? locationMap.get(event.location.id) : undefined}
              />
            ))}
          </div>
          <div ref={sentinelRef} />
          {isLoadingMore && (
            <div className="py-8 text-center text-muted-foreground">Loading more events…</div>
          )}
        </>
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

          {searchInput || selectedDateRange || selectedLocation ? (
            <Button
              variant="destructive"
              onClick={() => {
                setSearchInput('');
                setSort('');
                const newParams = new URLSearchParams();
                setSearchParams(newParams);
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          ) : null}
        </div>
      )}
    </Container>
  );
}
