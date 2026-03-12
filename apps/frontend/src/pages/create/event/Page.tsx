import { BackButton } from '@/components/ui/backButton';
import { Heading } from '@/components/ui/typography';
import EventForm from '@/features/event/EventForm';
import { Pagination, useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { locationService } from '@/services/locationService';
import { LocationBase } from '@/types/location';
import { toast } from 'sonner';

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
  } = useInfiniteScroll(
    initialLocations,
    initialPagination,
    async (cursor) => {
      const res = await locationService.getLocations({ cursor });
      return { data: res.data, pagination: res.pagination };
    },
    [],
    () => {
      toast.error('Failed to load more locations. Please try again.');
    }
  );

  const handleLocationMenuScrollToBottom = () => {
    if (locationPagination.hasMore && !isLoadingLocations) {
      void loadMore();
    }
  };

  return (
    <div className="space-y-8">
      <BackButton />
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
    </div>
  );
}
