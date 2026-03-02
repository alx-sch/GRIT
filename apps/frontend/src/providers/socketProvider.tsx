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

    // We store the new socket in state to cause a rerender
    setSocket(newSocket);

    // On connect, the backend will send the last messages for all conversations the client is in
    newSocket.on('initialLastMessages', (messages: ResConversationsLastMessages) => {
      chatStore.getState().setInitialConversations(messages);
    });

    // Listen for incoming messages
    newSocket.on('message', (message: ResChatMessage) => {
      chatStore.getState().storeLastMessage(message);
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
