import { useEffect, useState } from 'react';
import { type ResChatMessage } from '@grit/schema';
import { useSocket } from '@/providers/socketProvider';
import { chatStore } from '@/store/chatStore';

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<ResChatMessage[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleUserInfo = (data: { isAdmin: boolean }) => {
      setIsAdmin(data.isAdmin);
    };

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

    const handleMessageDeleted = (data: { messageId: string }) => {
      setMessages((prev) => {
        const updated = prev.filter((msg) => msg.id !== data.messageId);

        // Defer chatStore updates to avoid React warning
        setTimeout(() => {
          if (updated.length === 0) {
            chatStore.getState().clearLastMessage(conversationId);
          } else {
            const newLastMessage = updated[updated.length - 1];
            chatStore.getState().setLastMessage(conversationId, newLastMessage);
          }
        }, 0);

        return updated;
      });
    };

    socket.on('message', handleMessage);
    socket.on('initialHistory', handleInitialHistory);
    socket.on('moreHistory', handleMoreHistory);
    socket.on('historyEnd', handleHistoryEnd);
    socket.on('error', handleError);
    socket.on('user_info', handleUserInfo);
    socket.on('message_deleted', handleMessageDeleted);

    socket.emit('requestUserInfo');

    // Deregister handlers once component dismounts
    return () => {
      socket.off('message', handleMessage);
      socket.off('initialHistory', handleInitialHistory);
      socket.off('moreHistory', handleMoreHistory);
      socket.off('historyEnd', handleHistoryEnd);
      socket.off('error', handleError);
      socket.off('user_info', handleUserInfo);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, conversationId]);

  const getHistory = () => {
    socket?.emit('getInitialHistory', { conversationId });
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    socket?.emit('message', {
      text,
      conversationId,
    });
  };

  const deleteMessage = (messageId: string) => {
    socket?.emit('delete_message', { messageId, conversationId });
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

  return {
    messages,
    getHistory,
    sendMessage,
    deleteMessage,
    loadMore,
    sendNewLastReadAt,
    hasMore,
    errorMessage,
    isAdmin,
  };
}
