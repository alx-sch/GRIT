import { useEffect } from 'react';
import { useNavigate, useRouteLoaderData } from 'react-router-dom';
import type { ResConversationOverview } from '@grit/schema';

export const ChatFeedPage = () => {
  const navigate = useNavigate();
  const conversations = useRouteLoaderData<ResConversationOverview>('chat-feed');

  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  useEffect(() => {
    if (isDesktop && conversations?.length) {
      void navigate(`/chat/${conversations[0].id}`, { replace: true });
    }
  }, [conversations, navigate]);

  return 'There are no chat messages yet. Join an event or message a friend.';
};
