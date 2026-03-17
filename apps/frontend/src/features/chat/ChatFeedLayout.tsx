import { conversationService } from '@/services/conversationService';
import type { ResConversationOverview, ResConversationSingle } from '@grit/schema';
import { Outlet, useLoaderData, useParams, useRevalidator } from 'react-router-dom';
import { ConversationCard } from './ConversationCard';
import { ChatBoxHeader } from './ChatBoxHeader';
import { useEffect } from 'react';

interface PaginatedResponse {
  data: ResConversationSingle[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export const ChatFeedLoader = async (): Promise<ResConversationOverview> => {
  // Fetch all conversations with pagination
  const allConversations: ResConversationSingle[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const response = (await conversationService.getMany({
      limit: '50',
      cursor: cursor ?? undefined,
    })) as PaginatedResponse | ResConversationOverview;

    // Handle both old format (array) and new format (paginated)
    if (Array.isArray(response)) {
      // Old format - just return as is
      return response;
    }

    // New format with pagination
    allConversations.push(...response.data);
    hasMore = response.pagination.hasMore;
    cursor = response.pagination.nextCursor;
  }

  return allConversations;
};

export const ChatFeedLayout = () => {
  const { id } = useParams();
  const conversations: ResConversationOverview = useLoaderData();
  const currentConversation = conversations.find((el) => el.id === id);
  const { revalidate } = useRevalidator();

  // This listens to an event we fire in the socketProvider if the list of chats changes to be able to refetch the list in the chat.
  useEffect(() => {
    const handler = () => {
      void revalidate();
    };
    window.addEventListener('chat:conversationsChanged', handler);
    return () => {
      window.removeEventListener('chat:conversationsChanged', handler);
    };
  }, [revalidate]);

  return (
    <>
      <div className="flex">
        <div
          className={`md:mr-8 overflow-auto max-h-[80vh] w-full md:w-auto ${id ? 'hidden md:block' : 'block'}`}
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
