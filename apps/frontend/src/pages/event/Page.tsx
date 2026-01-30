import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { Heading } from '@/components/ui/typography';
import { Container } from '@/components/layout/Container';
import { Chat } from '@/features/chat/Chat';

export const eventLoader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.id) throw new Response('Not Found', { status: 404 });
  const event = await eventService.getEvent(params.id);
  return event;
};

export const Event = () => {
  const event = useLoaderData<typeof eventLoader>();
  return (
    <>
      <Container>
        <Heading level={1}>{event.title}</Heading>
        <Chat event={event} />
      </Container>
    </>
  );
};
