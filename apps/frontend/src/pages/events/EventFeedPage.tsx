import { Button } from '@/components/ui/button';
import { Combobox, ComboboxOptions } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/datepicker';
import { EmptyState } from '@/components/ui/emptyState';
import { Input } from '@/components/ui/input';
import { Heading } from '@/components/ui/typography';
import { useDebounce } from '@/hooks/useDebounce';
import { Pagination, useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { EventCard } from '@/pages/events/components/EventCard';
import { eventService } from '@/services/eventService';
import { friendService } from '@/services/friendService';
import { locationService } from '@/services/locationService';
import { useAuthStore } from '@/store/authStore';
import { EventResponse } from '@/types/event';
import { LocationBase } from '@/types/location';
import { format, parse } from 'date-fns';
import { ArrowUpDown, MapPinIcon, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { LoaderFunctionArgs, useNavigate, useSearchParams } from 'react-router-dom';

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
  const token = useAuthStore.getState().token;

  const [events, locationsResponse, friendsData] = await Promise.all([
    eventService.getEvents(query),
    locationService.getLocations(),

    //Only fetch friends list if user is logged-in
    token ? friendService.listFriends({ limit: '100' }).catch(() => null) : Promise.resolve(null),
  ]);

  const friendsIds = new Set(friendsData?.data.map((f) => f.friend.id) ?? []);

  return {
    events,
    locations: locationsResponse.data,
    locationsPagination: locationsResponse.pagination,
    friendsIds,
  };
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
  const { events, locations, locationsPagination, friendsIds } = useTypedLoaderData<{
    events: EventResponse;
    locations: LocationBase[];
    locationsPagination: Pagination;
    friendsIds: Set<number>;
  }>();

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');

  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    const urlSearch = searchParams.get('search') ?? '';
    if (urlSearch !== searchInput) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchInput(urlSearch);
    }
  }, [searchParams.get('search')]); // Only react to the specific 'search' key

  useEffect(() => {
    const urlSearch = searchParams.get('search') ?? '';

    if (debouncedSearch === urlSearch) return;

    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        if (debouncedSearch) {
          newParams.set('search', debouncedSearch);
        } else {
          newParams.delete('search');
        }
        return newParams;
      },
      { replace: true }
    );
  }, [debouncedSearch]);
  const navigate = useNavigate();

  // Events infinite scroll
  const {
    items,
    isLoading: isLoadingMore,
    sentinelRef,
  } = useInfiniteScroll(
    events.data,
    events.pagination,
    async (cursor) => {
      const res = await eventService.getEvents(buildEventQuery(searchParams, cursor));
      return { data: res.data, pagination: res.pagination };
    },
    [searchParams]
  );

  // Locations infinite scroll
  const {
    items: locationItems,
    isLoading: isLoadingLocations,
    pagination: locationPagination,
    loadMore: loadMore,
  } = useInfiniteScroll(locations, locationsPagination, async (cursor) => {
    const res = await locationService.getLocations({ cursor });
    return { data: res.data, pagination: res.pagination };
  });

  const locationOptionsCombobox: ComboboxOptions[] = locationItems.map(({ id, name }) => ({
    value: String(id),
    label: name ?? '',
  }));

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

  const handleLocationChange = (value: string) => {
    if (value) {
      searchParams.set('location_id', value);
    } else {
      searchParams.delete('location_id');
    }
    setSearchParams(searchParams);
  };

  // User scrolls in locations dropdown -> this function is called
  const handleLocationMenuScrollToBottom = () => {
    if (locationPagination.hasMore && !isLoadingLocations) {
      void loadMore();
    }
  };

  //Sorting
  const [sort, setSort] = useState(searchParams.get('sort') ?? '');
  const handleSortChange = (value: string) => {
    setSort(value);
    searchParams.set('sort', value);
    setSearchParams(searchParams);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Heading>Upcoming Events</Heading>
        <Button
          onClick={() => {
            void navigate('/create/event');
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center md:gap-2">
        <Input
          placeholder="Search events..."
          className="w-full lg:w-sm lg:shrink-0"
          value={searchInput}
          onChange={handleSearchChange}
          clearable
          onClear={() => {
            setSearchInput('');
          }}
        />

        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between lg:justify-end gap-0 lg:gap-2 lg:flex-1 min-w-0">
          <Combobox
            options={locationOptionsCombobox}
            value={selectedLocation ?? undefined}
            onChange={handleLocationChange}
            placeholder="Location"
            searchPlaceholder="Search locations..."
            emptyMessage="No locations found"
            variant="ghost"
            icon={MapPinIcon}
            onMenuScrollToBottom={handleLocationMenuScrollToBottom} // When close to reaching the end of dropdown
            isLoading={isLoadingLocations}
            className="w-auto min-w-0 md:min-w-32 md:flex-none text-xs md:text-base max-w-xs truncate font-normal md:shrink"
          />

          <div className="w-[1.5px] h-5 bg-border/60 shrink-0 dark:bg-white/20" />

          <DatePicker
            selected={selectedDateRange}
            onSelect={handleDateSelect}
            placeholder="Date"
            variant="ghost"
            className="min-w-0 md:flex-none text-xs md:text-base truncate font-normal md:shrink-0"
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
            className="w-auto min-w-0 md:flex-none text-xs md:text-base font-normal md:shrink-0"
          />
        </div>
      </div>
      {items.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((event) => (
              <EventCard key={event.id} event={event} friendsIds={friendsIds} />
            ))}
          </div>
          <div ref={sentinelRef} />
          {isLoadingMore && (
            <div className="py-8 text-center text-muted-foreground">Loading more events…</div>
          )}
        </>
      ) : (
        <EmptyState
          title="No events found"
          description={
            searchInput
              ? `No results for "${searchInput}"`
              : selectedDateRange
                ? 'Nothing scheduled for these dates'
                : 'Check back later for new events.'
          }
          action={
            searchInput || selectedDateRange || selectedLocation
              ? {
                  label: 'Clear Filters',
                  onClick: () => {
                    setSearchInput('');
                    setSort('');
                    const newParams = new URLSearchParams();
                    setSearchParams(newParams);
                  },
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
