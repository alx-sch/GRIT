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
  console.log('conversations', conversations);
  console.log('id', id);
  const currentConversation = conversations.find((el) => el.id === id);

  return (
    <>
      <div className="flex">
        <div className="mr-8">
          {conversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              isActive={id === conversation.id}
            />
          ))}
        </div>
        <div className="flex-1">
          {currentConversation && <ChatBoxHeader conversation={currentConversation} />}
          <Outlet />
        </div>
      </div>
    </>
  );
};
