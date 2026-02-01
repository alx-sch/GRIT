import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { EventBase } from '@/types/event';
import { useChat } from '@/hooks/useChat';
import { ChatBubble } from '@/components/ui/chatBubble';
import { useCurrentUserStore } from '@/store/currentUserStore';

export const Chat = ({ event }: { event: EventBase }) => {
  const { messages, sendMessage } = useChat(event.id);
  const [input, setInput] = useState('');
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = useCurrentUserStore((s) => s.user?.id);

  /**
   * We track if the the scroll position of the chat box is near the bottom. If that is the case we set a flag
   * isNearBottom to false which we can use in case a new message comes in to 1. not auto-scroll 2. show a
   * notification that a new message was received.
   */
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onScroll = () => {
      console.log('run');
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      const nearBottom = distanceFromBottom < 80;
      setIsNearBottom(nearBottom);
      if (nearBottom) setHasNewMessages(false);
      console.log('nearbottom', nearBottom);
    };

    viewport.addEventListener('scroll', onScroll);
    return () => viewport.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage.author.id === currentUserId;

    if (isOwnMessage || isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasNewMessages(false);
    } else {
      setHasNewMessages(true);
    }
  }, [messages]);

  return (
    <>
      <div className="relative">
        <div ref={viewportRef} className="h-75 overflow-y-auto border border-input px-4 mt-4 mb-4">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          <div ref={bottomRef} />
        </div>
        {hasNewMessages && (
          <div className="absolute bottom-4 flex justify-center w-full">
            <Button
              size="sm"
              className="shadow-lg"
              onClick={() => {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                setHasNewMessages(false);
              }}
            >
              New messages
            </Button>
          </div>
        )}
      </div>

      <Textarea
        className="mb-2 rounded-none"
        placeholder="Type your message here."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <Button
        onClick={() => {
          sendMessage(input);
          setInput('');
        }}
      >
        Send
      </Button>
    </>
  );
};
