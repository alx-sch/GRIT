import { ResChatMessage } from '@grit/schema';
import { create } from 'zustand';

/**
 * The chatStore will store in messages a Record where the key is the conversation's id
 * and the messages is an array of chat messages.
 * Each time a new message comes in we need to expand first the conversations, then expand
 * the messages, add the message on existing conversation or create a new conversation and
 * finally set everything.
 */

interface ChatStore {
  conversations: Record<
    string,
    {
      messages: ResChatMessage[];
      hasMore: boolean;
    }
  >;
  addMessage: (message: ResChatMessage) => void;
}

export const chatStore = create<ChatStore>((set) => ({
  conversations: {},
  addMessage: (message) => {
    set((state) => {
      const conversationId = message.conversationId;

      // Either get an existing conversation to store the message OR create a new one
      const conversation = state.conversations[conversationId] ?? {
        messages: [],
        hasMore: true,
      };

      // This is what we actually set in the store
      return {
        conversations: {
          // Keep all other conversations
          ...state.conversations,
          // Override the conversation we selected above
          [conversationId]: {
            // Expand original content of conversation
            ...conversation,
            // append message
            messages: [...conversation.messages, message],
          },
        },
      };
    });
  },
}));
