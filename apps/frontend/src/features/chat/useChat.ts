import { useEffect, useState } from 'react';
import { type ResChatMessage } from '@grit/schema';
import { useSocket } from '@/providers/socketProvider';

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<ResChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: ResChatMessage) => {
      // TODO This conversationId check should be implemented for all message types to prevent mixed messages on fast navigation
      if (msg.conversationId !== conversationId) return;
      setMessages((prev) => [...prev, msg]);
    };

    const handleInitialHistory = (msgs: ResChatMessage[]) => {
      setMessages([...msgs]);
    };

    const handleMoreHistory = (msgs: ResChatMessage[]) => {
      setMessages((prev) => [...msgs, ...prev]);
    };

    const handleHistoryEnd = () => {
      setHasMore(false);
    };

    const handleError = (err: { message: string }) => {
      setMessages([]);
      setErrorMessage(err.message ?? 'Error');
    };

    socket.on('message', handleMessage);
    socket.on('initialHistory', handleInitialHistory);
    socket.on('moreHistory', handleMoreHistory);
    socket.on('historyEnd', handleHistoryEnd);
    socket.on('error', handleError);

    // Deregister handlers once component dismounts
    return () => {
      socket.off('message', handleMessage);
      socket.off('initialHistory', handleInitialHistory);
      socket.off('moreHistory', handleMoreHistory);
      socket.off('historyEnd', handleHistoryEnd);
      socket.off('error', handleError);
    };
  }, [socket, conversationId]);

  const getHistory = () => {
    socket?.emit('getInitialHistory', { conversationId });
  };

  const sendMessage = (text: string) => {
    console.log('Sending message');
    if (!text.trim()) return;
    console.log('Sending message 2 for conversationId', conversationId);
    socket?.emit('message', {
      text,
      conversationId,
    });
  };

  // This is for updating when a user last read a conversation
  const sendNewLastReadAt = (conversationId: string) => {
    socket?.emit('conversationRead', { conversationId });
  };

  const loadMore = (cursor: { createdAt: string; id: string }) => {
    if (!hasMore) {
      return;
    }
    socket?.emit('loadMoreHistory', {
      cursorSentAt: cursor.createdAt,
      cursorId: cursor.id,
      conversationId,
    });
  };

  return { messages, getHistory, sendMessage, loadMore, sendNewLastReadAt, hasMore, errorMessage };
}
