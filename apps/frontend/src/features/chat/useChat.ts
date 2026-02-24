import { io, type Socket } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';
import { type ResChatMessage } from '@grit/schema';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/providers/socketProvider';
import { chatStore } from '@/store/chatStore';

export function useChat(conversationId: string) {
  const conversation = chatStore((s) => s.conversations[conversationId]);
  const messages = conversation?.messages ?? [];
  const hasMore = conversation?.hasMore ?? true;
  const socket = useSocket();
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

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
