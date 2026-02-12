import { Container } from '@/components/layout/Container';
import { Heading } from '@/components/ui/typography';
import { Chat } from '@/features/chat/Chat';
import { eventService } from '@/services/eventService';
import { useCurrentUserStore } from '@/store/currentUserStore';
import type { CurrentUser } from '@/types/user';
import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { Link } from 'react-router-dom';

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
  const isAuthor = event.authorId === currentUser?.id;

  console.log(currentUserAttending);
  return (
    <>
      <Container>
        <div className="flex flex-row justify-between">
          <Heading level={1}>{event.title}</Heading>
          {isAuthor && <Link to="edit">Edit</Link>}
        </div>
        {currentUserAttending && <Chat event={event} />}
      </Container>
    </>
  );
};
