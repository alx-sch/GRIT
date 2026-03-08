import { Container } from '@/components/layout/Container';
import { Heading } from '@/components/ui/typography';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { locationService } from '@/services/locationService';
import { LocationBase } from '@/types/location';
import EventForm from '@/features/event/EventForm';
import { useInfiniteScroll, Pagination } from '@/hooks/useInfiniteScroll';

export const eventCreationLoader = async () => {
  const response = await locationService.getLocations();
  return {
    data: response.data,
    pagination: response.pagination,
  };
};

export default function CreateEventPage() {
  const { data: initialLocations, pagination: initialPagination } = useTypedLoaderData<{
    data: LocationBase[];
    pagination: Pagination;
  }>();

  const {
    items: locationItems,
    isLoading: isLoadingLocations,
    pagination: locationPagination,
    loadMore,
    addItem: addLocation,
  } = useInfiniteScroll(initialLocations, initialPagination, async (cursor) => {
    const res = await locationService.getLocations({ cursor });
    return { data: res.data, pagination: res.pagination };
  });

  const handleLocationMenuScrollToBottom = () => {
    if (locationPagination.hasMore && !isLoadingLocations) {
      void loadMore();
    }
  };

  return (
    <Container className="py-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <Heading level={1} className="text-3xl md:text-4xl">
            Create Event
          </Heading>
        </div>
      </div>
      <EventForm
        locations={locationItems}
        onLocationMenuScrollToBottom={handleLocationMenuScrollToBottom}
        isLoadingLocations={isLoadingLocations}
        onLocationCreated={addLocation}
      />
    </Container>
  );
}
