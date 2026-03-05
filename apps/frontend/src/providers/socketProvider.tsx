import { useAuthStore } from '@/store/authStore';
import { chatStore } from '@/store/chatStore';
import { ResChatMessage, ResConversationsLastMessages } from '@grit/schema';
import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((s) => s.token);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        // eslint-disable-next-line
        setSocket(null);
      }
      return; // bail early since we don't want to try and create a socket for unauthenticated users
    }

    // Create new socket connection
    const newSocket = io({
      path: '/api/socket.io',
      auth: { token },
    });

    console.log('Socket created', newSocket);

    // We store the new socket in state to cause a rerender
    setSocket(newSocket);

    // On connect, the backend will send the last messages for all conversations the client is in
    newSocket.on('initialLastMessages', (messages: ResConversationsLastMessages) => {
      console.log('Received last messages', messages);
      const store = chatStore.getState();
      store.resetConversations();
      store.setInitialConversations(messages);

      /**
       * Via the window event we can trigger the loader in ChatFeedLayout to run again to be able to render a potential new card in the chat
       * which is particularly important if the user currently is looking at the chat
       */

      window.dispatchEvent(new Event('chat:conversationsChanged'));
    });

    // Listen for incoming messages
    newSocket.on('message', (message: ResChatMessage) => {
      console.log('Should have stored', message.text);
      const conversations = chatStore.getState().conversations;
      chatStore.getState().storeLastMessage(message);
      console.log('after storing', chatStore.getState().conversations);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token]); // token in dependency array also takes care of removing the socket on logout

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = (): Socket | null => {
  return useContext(SocketContext);
};
