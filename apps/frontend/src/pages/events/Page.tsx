import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { EventCard } from '@/pages/events/components/EventCard';
import { Event } from '@/types/event';
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
import { Combobox, ComboboxOptions } from '@/components/ui/combobox';
import { locationService } from '@/services/locationService';
import { Location } from '@/types/location';

export const eventsLoader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') ?? undefined;
  const startFrom = url.searchParams.get('start_from') ?? undefined;
  const startUntil = url.searchParams.get('start_until') ?? undefined;
  const locationId = url.searchParams.get('location_id') ?? undefined;

  const [events, locations] = await Promise.all([
    eventService.getEvents({ search, startFrom, startUntil, locationId }),
    locationService.getLocations(),
  ]);
  return { events, locations };
};

export default function EventFeed() {
  const { events, locations } = useTypedLoaderData<{ events: Event[]; locations: Location[] }>();

  const locationOptionsCombobox: ComboboxOptions[] = locations.map(({ id, name }) => ({
    value: String(id),
    label: name!,
  }));

  const locationMap = new Map(locations.map(l => [l.id, l]));

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

  return (
    <Container className="py-10 space-y-8 p-0 md:px-0">
      <div className="space-y-2">
        <Heading level={1} className="text-3xl md:text-4xl">Upcoming events</Heading>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <Input
          placeholder="Search events..."
          className="max-w-sm"
          value={searchInput}
          onChange={handleSearchChange}
        />

        <div className="flex md:w-auto gap-2 w-full">
          <Combobox
            options={locationOptionsCombobox}
            value={selectedLocation ?? undefined}
            onChange={handleLocationChange}
            placeholder="Location"
            searchPlaceholder="Search"
            emptyMessage="No location found"
            className="flex-1 min-w-0 md:flex-none text-sm md:text-base"
          />

          <DatePicker
            selected={selectedDateRange}
            onSelect={handleDateSelect}
            placeholder="Date"
            className="flex-1 min-w-0 md:flex-none text-sm md:text-base px-7"
          ></DatePicker>
        </div>
      </div>
      {events.length > 0 ? (
        <div className="grid gap-6 justify-start md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} location={event.locationId ? locationMap.get(event.locationId) : undefined} />
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

          {(searchInput || selectedDateRange || selectedLocation) && (
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
