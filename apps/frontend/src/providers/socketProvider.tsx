import { useAuthStore } from '@/store/authStore';
import { chatStore } from '@/store/chatStore';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  // Do something fancy here
  const token = useAuthStore((s) => s.token);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
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

    // Listen for incoming messages
    newSocket.on('message', (message) => {
      chatStore.getState().addMessage(message);
      console.log(message);
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

// NEEDS INTRODUCTION

//     socket.on('history', (msgs: ResChatMessage[]) => {
//       setMessages((prev) => [...msgs, ...prev]);
//     });

//         socket.on('history_end', () => {
//           setHasMore(false);
//         });

//             socket.on('error', (err: { message: string }) => {
//       setMessages(() => []);
//       setErrorMessage(err.message ?? 'Error');
//     });

//         Your store will need:

// prependMessages(...)
// setHasMore(...)
