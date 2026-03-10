import { Heading } from '@/components/ui/typography';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { locationService } from '@/services/locationService';
import { LocationBase } from '@/types/location';
import EventForm from '@/features/event/EventForm';
import { useInfiniteScroll, Pagination } from '@/hooks/useInfiniteScroll';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

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

  const navigate = useNavigate();

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
    <div className="space-y-8">
      <button
        onClick={() => {
          void navigate(-1);
        }}
        className="flex items-center gap-1 uppercase text-primary font-heading text-lg hover:text-foreground transition-color w-fit"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>
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
