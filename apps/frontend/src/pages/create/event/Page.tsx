import { Container } from '@/components/layout/Container';
import { Heading } from '@/components/ui/typography';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { locationService } from '@/services/locationService';
import { LocationBase } from '@/types/location';
import EventForm from './components/EventForm';

export const eventCreationLoader = async () => {
  const response = await locationService.getLocations();
  return response.data;
};

export default function CreateEventPage() {
  const locations = useTypedLoaderData<LocationBase[]>();
  return (
    <Container className="py-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <Heading level={1} className="text-3xl md:text-4xl">
            Create Event
          </Heading>
        </div>
        <EventForm locations={locations} />
      </div>
    </Container>
  );
}
