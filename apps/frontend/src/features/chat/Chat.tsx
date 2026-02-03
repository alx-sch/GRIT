import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { EventBase } from '@/types/event';
import { useChat } from '@/features/chat/useChat';
import { ChatBubble } from '@/features/chat/ChatBubble';
import { useCurrentUserStore } from '@/store/currentUserStore';

export const Chat = ({ event }: { event: EventBase }) => {
  const { messages, sendMessage, loadMore, hasMore } = useChat(event.id);
  const [input, setInput] = useState('');
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = useCurrentUserStore((s) => s.user?.id);
  const isLoadingMoreHistory = useRef(false);
  const isInitialLoad = useRef(true);

  /**
   * We track if the the scroll position of the chat box is near the bottom. If that is the case we set a flag
   * isNearBottom to false which we can use in case a new message comes in to 1. not auto-scroll 2. show a
   * notification that a new message was received.
   */
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onScroll = () => {
      // Don't do anything while we are in the initial loading phase
      if (isInitialLoad.current === true) return;
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      const nearBottom = distanceFromBottom < 80;
      setIsNearBottom(nearBottom);
      if (nearBottom) setHasNewMessages(false);
      if (
        viewport.scrollTop < 100 &&
        hasMore &&
        messages.length > 0 &&
        !isLoadingMoreHistory.current
      ) {
        isLoadingMoreHistory.current = true;
        console.log('looking for more');
        const oldest = messages[0];
        loadMore({
          sentAt: oldest.sentAt,
          id: oldest.id,
        });
      }
    };

    viewport.addEventListener('scroll', onScroll);
    return () => viewport.removeEventListener('scroll', onScroll);
  }, [messages, hasMore, loadMore]);

  /***
   * every time a new message arrives we check if we are either near the bottom or if it
   * is from us and in that case scroll down
   */
  useEffect(() => {
    if (!messages.length) return;
    const lastMessage = messages[messages.length - 1];

    // If this is the initial page load we want to scroll to the bottom
    if (isInitialLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      // wait for 1 frame until scroll has settled
      requestAnimationFrame(() => (isInitialLoad.current = false));
    }
    // If messages changed from loading more history, don't scroll but set the isLoadingMoreHistory flag to false
    else if (isLoadingMoreHistory.current) {
      isLoadingMoreHistory.current = false;
    }
    // Else messages changed because of a new incoming message
    else {
      const isOwnMessage = lastMessage.author.id === currentUserId;
      if (isOwnMessage || isNearBottom) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        setHasNewMessages(false);
      } else {
        setHasNewMessages(true);
      }
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
