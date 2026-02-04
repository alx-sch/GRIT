import { io, type Socket } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';
import type { ResChatMessage } from '@grit/schema';
import { useAuthStore } from '@/store/authStore';

export function useChat(eventId: number) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ResChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    // The url for websockets should be part of the .env?
    const socket = io('http://localhost:3000', {
      transports: ['websocket'],
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', { eventId });
    });

    socket.on('message', (msg: ResChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('history', (msgs: ResChatMessage[]) => {
      setMessages((prev) => [...msgs, ...prev]);
    });

    socket.on('history_end', () => {
      setHasMore(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [eventId]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    socketRef.current?.emit('message', {
      text,
    });
  };

  const loadMore = (cursor: { createdAt: Date; id: string }) => {
    if (!hasMore) return;
    socketRef.current?.emit('load_more', {
      cursorSentAt: cursor.createdAt,
      cursorId: cursor.id,
    });
  };

  return { messages, sendMessage, loadMore, hasMore };
}
