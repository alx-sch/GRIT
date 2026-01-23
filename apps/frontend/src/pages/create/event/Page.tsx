import { LoaderFunctionArgs } from 'react-router-dom';
import { locationService } from '@/services/locationService';
import { Container } from '@/components/layout/Container';
import { Heading } from '@/components/ui/typography';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import EventForm from './components/EventForm';
import { Location } from '@/types/location';

export const eventCreationLoader = async ({ request }: LoaderFunctionArgs) => {
  console.log(request); //we can use this to fitler or smth
  return locationService.getLocations();
};

export default function EventCreation() {
  const locations = useTypedLoaderData<Location[]>();
  return (
    <Container className="py-10 space-y-8 p-0 md:px-0">
      <div className="space-y-2">
        <Heading level={1} className="text-3xl md:text-4xl">
          Create Event
        </Heading>
      </div>
      <EventForm locations={locations} />
    </Container>
  );
}
