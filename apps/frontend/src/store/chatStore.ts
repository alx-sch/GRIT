import { ResChatMessage } from '@grit/schema';
import { create } from 'zustand';

/**
 * The chatStore will store in conversations a Record where the key is the conversation's id.
 * Then we store only the last chat message for that conversation as well as an unread count
 * Chat history is only stored in each chat components local storage
 */

type Conversation = Record<
  string,
  {
    lastMessage: ResChatMessage | null;
    unreadCount: number;
  }
>;

interface ChatStore {
  conversations: Conversation;
  storeLastMessage: (message: ResChatMessage) => void;
  setInitialConversations: (messages: Record<string, ResChatMessage | null>) => void;
}

export const chatStore = create<ChatStore>((set) => ({
  conversations: {},

  // For storing a new last message
  storeLastMessage: (message) => {
    set((state) => {
      const id = message.conversationId;
      const targetConversation = state.conversations[id];
      return {
        conversations: {
          ...state.conversations,
          [id]: {
            lastMessage: message,
            unreadCount: targetConversation ? targetConversation.unreadCount + 1 : 1,
          },
        },
      };
    });
  },

  // The initial load of last messages we receive on socket connect
  setInitialConversations: (lastMessages) => {
    set(() => {
      // Need to transform the incoming Record of last messages into conversations Records
      const newConversation: Conversation = {};
      for (const id in lastMessages) {
        newConversation[id] = {
          lastMessage: lastMessages[id],
          unreadCount: 0,
        };
      }
      return { conversations: newConversation };
    });
  },
}));
