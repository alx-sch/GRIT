import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { Heading } from '@/components/ui/typography';
import { Container } from '@/components/layout/Container';
import { ChatBox } from '@/features/chat/ChatBox';
import { useCurrentUserStore } from '@/store/currentUserStore';

export const eventLoader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.id) throw new Response('Not Found', { status: 404 });
  const event = await eventService.getEvent(params.id);
  return event;
};

export const EventPage = () => {
  const event = useLoaderData<typeof eventLoader>();
  const currentUser = useCurrentUserStore((s) => s.user);
  const userAttending = event.attendees.some((el) => el.id === currentUser?.id);

  return (
    <>
      <Container>
        <Heading level={1}>{event.title}</Heading>
        {event.conversation?.id && userAttending && (
          <ChatBox conversationId={event.conversation?.id} />
        )}
      </Container>
    </>
  );
};
