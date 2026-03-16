import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useChat } from '@/features/chat/useChat';
import { ChatBubble } from '@/features/chat/ChatBubble';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { AlertCircleIcon, Trash2 } from 'lucide-react';
import { useSocket } from '@/providers/socketProvider';
import { chatStore } from '@/store/chatStore';

export const ChatBox = ({ conversationId }: { conversationId: string }) => {
  const {
    messages,
    getHistory,
    sendMessage,
    loadMore,
    deleteMessage,
    sendNewLastReadAt,
    hasMore,
    errorMessage,
    isAdmin,
  } = useChat(conversationId);
  const [input, setInput] = useState('');
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = useCurrentUserStore((s) => s.user?.id);
  const isLoadingMoreHistory = useRef(false);
  const isInitialLoad = useRef(true);
  const socket = useSocket();
  const messagesRef = useRef(messages);

  // We are creating a stable reference to the updated messages so that event listeners don't work on outdated data.
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Helper for updating the last read at
  const updateLastReadAt = () => {
    if (!conversationId) return;
    sendNewLastReadAt(conversationId);
    chatStore.getState().setLastReadAt(conversationId);
  };

  // At first mount we update that the user has read the conversation
  useEffect(() => {
    updateLastReadAt();
  }, [conversationId]);

  // Every time a new messages arrives we check if we need to scroll to the message or how to handle the ui
  useEffect(() => {
    if (!messages.length) return;
    const lastMessage = messages[messages.length - 1];

    // If this is the initial page load we want to scroll to the bottom
    if (isInitialLoad.current) {
      viewportRef.current?.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'auto',
      });
      // wait for 1 frame until scroll has settled
      requestAnimationFrame(() => (isInitialLoad.current = false));
      updateLastReadAt();
    }
    // If the messages array changed from loading more chat history, don't scroll but set the isLoadingMoreHistory flag to false
    else if (isLoadingMoreHistory.current) {
      isLoadingMoreHistory.current = false;
    }
    // Else the messages array was changed because of a new incoming message
    else {
      // If we are close to the bottom or the last message was one of our own, scroll down
      const isOwnMessage = lastMessage.author?.id === currentUserId;
      if (isOwnMessage || isNearBottom) {
        viewportRef.current?.scrollTo({
          top: viewportRef.current.scrollHeight,
          behavior: 'smooth',
        });
        requestAnimationFrame(() => {
          setHasNewMessages(false);
          updateLastReadAt();
        });
      } else {
        // otherwise we set a flag which will cause the display of a "new messages" notification but don't scroll down.
        requestAnimationFrame(() => {
          setHasNewMessages(true);
        });
      }
    }
  }, [messages]);

  // We implement a scroll position based event handling for loading more of the chat history.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    // Event handler
    const onScroll = () => {
      // Don't do anything while we are in the initial loading phase
      if (isInitialLoad.current) {
        return;
      }

      // Calcs
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      const nearBottom = distanceFromBottom < 80;
      setIsNearBottom(nearBottom);

      // If we are near the bottom we remove any new message notification that might be present
      if (nearBottom) {
        setHasNewMessages(false);
        updateLastReadAt();
      }

      // If we scroll close to the top and there are no other reasons not to, we load more chat history
      if (
        viewport.scrollTop < 100 &&
        hasMore &&
        messages.length > 0 &&
        !isLoadingMoreHistory.current
      ) {
        isLoadingMoreHistory.current = true;
        const currentMessages = messagesRef.current;
        if (!currentMessages.length) return;

        const oldest = currentMessages[0];
        loadMore({
          createdAt: oldest.createdAt,
          id: oldest.id,
        });
      }
    };
    viewport.addEventListener('scroll', onScroll);

    /**
     * Fallback case for if we are already scrolled to the top and cannot scroll anymore. In this case the
     * messages array state will still have changed. If there is still more to load, we must load more.
     * Without this we might get stuck on very fast scroll which might not fire the event
     */
    if (
      viewport.scrollTop < 100 &&
      hasMore &&
      !isInitialLoad.current &&
      !isLoadingMoreHistory.current &&
      messages.length > 0
    ) {
      isLoadingMoreHistory.current = true;
      const oldest = messages[0];
      if (oldest) {
        loadMore({
          createdAt: oldest.createdAt,
          id: oldest.id,
        });
      }
    }

    return () => {
      viewport.removeEventListener('scroll', onScroll);
    };
  }, [messages, hasMore]);

  // We request initial chat history on component mount
  useEffect(() => {
    if (!socket) return;

    if (socket.connected) {
      getHistory();
    } else {
      socket.once('connect', () => {
        getHistory();
      });
    }
  }, [socket, conversationId]);

  if (errorMessage) {
    return (
      <Alert variant={'destructive'}>
        <AlertCircleIcon />
        <AlertTitle>Error!</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="relative">
        <div
          ref={viewportRef}
          className="h-[calc(95vh-350px)] overflow-y-auto border border-input px-4 mb-4"
        >
          {messages.map((message) => (
            <div key={message.id} className="group relative">
              <ChatBubble message={message} />

              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                      title="Delete message"
                      aria-label="Delete message"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete message?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this message? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogAction
                      onClick={() => {
                        deleteMessage(message.id);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {hasNewMessages && (
          <div className="absolute bottom-4 flex justify-center w-full">
            <Button
              size="sm"
              className="shadow-lg"
              onClick={() => {
                viewportRef.current?.scrollTo({
                  top: viewportRef.current.scrollHeight,
                  behavior: 'smooth',
                });
                setHasNewMessages(false);
              }}
            >
              New messages
            </Button>
          </div>
        )}
      </div>

      <Textarea
        className="mb-2 rounded-none border h-20"
        placeholder="Type your message here."
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
            setInput('');
          }
        }}
      />
      <div className="flex justify-end">
        <Button
          onClick={() => {
            sendMessage(input);
            setInput('');
          }}
        >
          Send
        </Button>
      </div>
    </>
  );
};
