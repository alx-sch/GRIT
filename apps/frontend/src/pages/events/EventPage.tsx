import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { Heading } from '@/components/ui/typography';
import { Container } from '@/components/layout/Container';
import { ChatBox } from '@/features/chat/ChatBox';
import { conversationService } from '@/services/conversationService';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { useState, useEffect } from 'react';

export const eventLoader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.id) throw new Response('Not Found', { status: 404 });
  const event = await eventService.getEvent(params.id);
  return event;
};

export const EventPage = () => {
  const event = useLoaderData<typeof eventLoader>();

  // Load Conversation for chat
  const user = useCurrentUserStore((s) => s.user);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function loadConversation() {
      try {
        const convo = await conversationService.getConversation({
          type: 'EVENT',
          eventId: event.id,
        });
        setConversationId(convo.id);
        console.log(convo.id);
      } catch (err: any) {
        // On error we do nothing since this means the user is not attending
        return;
      }
    }
    loadConversation();
  }, [user, event.id]);

  return (
    <>
      <Container>
        <Heading level={1}>{event.title}</Heading>
        {conversationId && <ChatBox conversationId={conversationId} />}
      </Container>
    </>
  );
};
