import { Heading } from '@/components/ui/typography';
import EventForm from '@/features/event/EventForm';
import { Pagination, useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { eventService } from '@/services/eventService';
import { locationService } from '@/services/locationService';
import { EventBase } from '@/types/event';
import { LocationBase } from '@/types/location';
import { useMemo } from 'react';
import { LoaderFunctionArgs, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const editEventLoader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.id) throw new Response('Not Found', { status: 404 });
  const event = await eventService.getEvent(params.id);
  const locations = await locationService.getLocations();
  return { event, locations: { data: locations.data, pagination: locations.pagination } };
};

export default function EditEventPage() {
  const {
    event,
    locations: { data: initialLocations, pagination: initialPagination },
  } = useTypedLoaderData<{
    event: EventBase;
    locations: { data: LocationBase[]; pagination: Pagination };
  }>();

  const navigate = useNavigate();

  const eventLocation = event.location;
  const locationsWithSelected = useMemo(
    () =>
      eventLocation && !initialLocations.some((l) => l.id === eventLocation.id)
        ? [eventLocation, ...initialLocations]
        : initialLocations,
    [eventLocation, initialLocations]
  );

  const {
    items: locationItems,
    isLoading: isLoadingLocations,
    pagination: locationPagination,
    loadMore,
    addItem: addLocation,
  } = useInfiniteScroll(locationsWithSelected, initialPagination, async (cursor) => {
    const res = await locationService.getLocations({ cursor });
    return { data: res.data, pagination: res.pagination };
  });

  const handleLocationMenuScrollToBottom = () => {
    if (locationPagination.hasMore && !isLoadingLocations) {
      void loadMore();
    }
  };

  return (
    <div className="space-y-8">
      <button
        onClick={() => {
          void navigate(-1);
        }}
        className="flex items-center gap-1 uppercase text-primary font-heading text-lg hover:text-foreground transition-color w-fit"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Event
      </button>
      <div className="space-y-2">
        <Heading level={1} className="text-3xl md:text-4xl">
          Edit Event
        </Heading>
      </div>
      <EventForm
        initialData={event}
        locations={locationItems}
        onLocationMenuScrollToBottom={handleLocationMenuScrollToBottom}
        isLoadingLocations={isLoadingLocations}
        onLocationCreated={addLocation}
      />
    </div>
  );
}
