import { conversationService } from '@/services/conversationService';
import { ResConversationOverview } from '@grit/schema';
import { Outlet, useLoaderData, useParams, useRevalidator } from 'react-router-dom';
import { ConversationCard } from './ConversationCard';
import { ChatBoxHeader } from './ChatBoxHeader';
import { useEffect } from 'react';

export const ChatFeedLoader = async () => {
  const data = await conversationService.getMany();
  return data;
};

export const ChatFeedLayout = () => {
  const { id } = useParams();
  const conversations: ResConversationOverview = useLoaderData();
  const currentConversation = conversations.find((el) => el.id === id);
  const { revalidate } = useRevalidator();

  // This listens to an event we fire in the socketProvider if the list of chats changes to be able to refetch the list in the chat.
  useEffect(() => {
    const handler = () => revalidate();
    window.addEventListener('chat:conversationsChanged', handler);
    return () => {
      window.removeEventListener('chat:conversationsChanged', handler);
    };
  }, [revalidate]);

  return (
    <>
      <div className="flex">
        <div className={`md:mr-8 overflow-auto max-h-[80vh] ${id ? 'hidden md:block' : 'block'}`}>
          {conversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              isActive={id === conversation.id}
            />
          ))}
        </div>
        <div className={`flex-1 ${!id ? 'hidden md:block' : 'block'}`}>
          {currentConversation && (
            <ChatBoxHeader key={currentConversation.id} conversation={currentConversation} />
          )}
          <Outlet />
        </div>
      </div>
    </>
  );
};
