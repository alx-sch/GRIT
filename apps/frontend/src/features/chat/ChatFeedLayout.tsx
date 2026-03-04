import { conversationService } from '@/services/conversationService';
import { ResConversationOverview } from '@grit/schema';
import { Outlet, useLoaderData, useParams } from 'react-router-dom';
import { ConversationCard } from './ConversationCard';
import { ChatBoxHeader } from './ChatBoxHeader';

export const ChatFeedLoader = async () => {
  const data = await conversationService.getMany();
  return data;
};

export const ChatFeedLayout = () => {
  const { id } = useParams();
  const conversations: ResConversationOverview = useLoaderData();
  const currentConversation = conversations.find((el) => el.id === id);

  return (
    <>
      <div className="flex">
        <div
          className={`md:mr-8 overflow-auto max-h-[80vh] ${id ? 'hidden md:block' : 'w-full block'}`}
        >
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
