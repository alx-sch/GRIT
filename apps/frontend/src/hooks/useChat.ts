import { io, type Socket } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';
import { useCurrentUserStore } from '@/store/currentUserStore';
import type { ChatMessage } from '@grit/schema';
import { useAuthStore } from '@/store/authStore';

export function useChat(eventId: number) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const user = useCurrentUserStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    // TODO the url needs to be changed, no CORS necessary though
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

    socket.on('message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
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

  return { messages, sendMessage };
}
