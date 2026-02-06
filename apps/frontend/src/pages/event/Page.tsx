import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { Heading } from '@/components/ui/typography';
import { Container } from '@/components/layout/Container';
import { Chat } from '@/features/chat/Chat';
import { useCurrentUserStore } from '@/store/currentUserStore';
import type { CurrentUser } from '@/types/user';

export const eventLoader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.id) throw new Response('Not Found', { status: 404 });
  const event = await eventService.getEvent(params.id);
  return event;
};

export const Event = () => {
  const event = useLoaderData<typeof eventLoader>();
  const currentUser: CurrentUser | null = useCurrentUserStore((s) => s.user);
  const currentUserAttending =
    currentUser && event.attending.some((el) => el.id === currentUser.id);
  console.log(currentUserAttending);
  return (
    <>
      <Container>
        <Heading level={1}>{event.title}</Heading>
        {currentUserAttending && <Chat event={event} />}
      </Container>
    </>
  );
};
