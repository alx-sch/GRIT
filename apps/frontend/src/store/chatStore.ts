import { ResChatMessage, ResConversationsLastMessages } from '@grit/schema';
import { create } from 'zustand';

/**
 * The chatStore will store in conversations a Record where the key is the conversation's id.
 * Then we store only the last chat message for that conversation as well as an unread count
 * Complete chat history is only stored in each chat components local storage
 */

type Conversation = Record<
  string,
  {
    lastMessage: ResChatMessage | null;
    lastReadAt: string | null;
  }
>;

interface ChatStore {
  conversations: Conversation;
  storeLastMessage: (message: ResChatMessage) => void;
  setInitialConversations: (messages: ResConversationsLastMessages) => void;
  setLastReadAt: (conversationId: string) => void;
}

export const chatStore = create<ChatStore>((set) => ({
  conversations: {},

  // For storing a new last message
  storeLastMessage: (message) => {
    set((state) => {
      const id = message.conversationId;
      const existing = state.conversations[id];

      return {
        conversations: {
          ...state.conversations,
          [id]: {
            lastMessage: message,
            lastReadAt: existing?.lastReadAt ?? null,
          },
        },
      };
    });
  },

  // The initial load of last messages we receive on socket connect
  setInitialConversations: (lastMessages: ResConversationsLastMessages) => {
    set(() => {
      // Need to transform the incoming Record of last messages into conversations Records
      const newConversation: Conversation = {};
      for (const id in lastMessages) {
        newConversation[id] = {
          lastMessage: lastMessages[id].lastMessage,
          lastReadAt: lastMessages[id].lastReadAt,
        };
      }
      return { conversations: newConversation };
    });
  },

  setLastReadAt: (conversationId: string) => {
    set((state) => {
      const existing = state.conversations[conversationId];

      return {
        conversations: {
          ...state.conversations,
          [conversationId]: {
            lastMessage: existing?.lastMessage,
            lastReadAt: existing?.lastMessage?.createdAt ?? null,
          },
        },
      };
    });
  },
}));
