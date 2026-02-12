import { Container } from '@/components/layout/Container';
import { Heading } from '@/components/ui/typography';
import EventForm from '@/features/event/EventForm';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { eventService } from '@/services/eventService';
import { locationService } from '@/services/locationService';
import { EventBase } from '@/types/event';
import { LocationBase } from '@/types/location';
import { LoaderFunctionArgs } from 'react-router-dom';

export const editEventLoader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.id) throw new Response('Not Found', { status: 404 });
  const event = await eventService.getEvent(params.id);
  const locations = await locationService.getLocations();
  return { event, locations: locations.data };
};

export default function EditEventPage() {
  const { event, locations } = useTypedLoaderData<{
    event: EventBase;
    locations: LocationBase[];
  }>();
  return (
    <Container className="py-10 space-y-8 p-0 md:px-0">
      <div className="space-y-2">
        <Heading level={1} className="text-3xl md:text-4xl">
          Edit Event
        </Heading>
      </div>
      <EventForm initialData={event} locations={locations} />
    </Container>
  );
}
