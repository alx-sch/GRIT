import { io, type Socket } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';
import { type ResChatMessage } from '@grit/schema';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/providers/socketProvider';

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<ResChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('message', (msg: ResChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('history', (msgs: ResChatMessage[]) => {
      setMessages((prev) => [...msgs, ...prev]);
    });

    socket.on('history_end', () => {
      setHasMore(false);
    });

    socket.on('error', (err: { message: string }) => {
      setMessages(() => []);
      setErrorMessage(err.message ?? 'Error');
    });
  }, [conversationId]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    socket?.emit('message', {
      text,
      conversationId,
    });
  };

  const loadMore = (cursor: { createdAt: Date; id: string }) => {
    if (!hasMore) return;
    socket?.emit('load_more', {
      cursorSentAt: cursor.createdAt,
      cursorId: cursor.id,
    });
  };

  return { messages, sendMessage, loadMore, hasMore, errorMessage };
}
