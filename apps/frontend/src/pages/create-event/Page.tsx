import { LoaderFunctionArgs } from 'react-router-dom';
import { locationService } from '@/services/locationService';
import { Container } from '@/components/layout/Container';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';

export const eventCreationLoader = async ({ request }: LoaderFunctionArgs) => {
  console.log(request); //we can use this to fitler or smth
  return locationService.getLocations();
};

export default function EventCreation() {
  const { locations } = useTypedLoaderData<{ Location: Location[] }>();
  return (
    <Container>
      <Heading level={1}>Create Event</Heading>
    </Container>
  );
}
