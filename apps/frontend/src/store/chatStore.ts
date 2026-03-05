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
  resetConversations: () => void;
  setLastReadAt: (conversationId: string) => void;
  hasUnread: () => boolean;
}

export const chatStore = create<ChatStore>((set, get) => ({
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

  resetConversations: () => set({ conversations: {} }),

  // The initial load of last messages we receive on socket connect
  setInitialConversations: (lastMessages: ResConversationsLastMessages) => {
    console.log('setting last messages', lastMessages);
    const newConversation: Conversation = {};

    for (const id in lastMessages) {
      newConversation[id] = {
        lastMessage: lastMessages[id].lastMessage,
        lastReadAt: lastMessages[id].lastReadAt,
      };
    }

    set({ conversations: newConversation });
    console.log('after setting store is now', chatStore.getState().conversations);
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

  hasUnread: () => {
    const conversations = get().conversations;
    return Object.values(conversations).some((conv) => {
      if (!conv.lastReadAt || !conv.lastMessage?.createdAt) return false;
      return new Date(conv.lastReadAt) < new Date(conv.lastMessage.createdAt);
    });
  },
}));
