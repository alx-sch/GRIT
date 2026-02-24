import { ResChatMessage } from '@grit/schema';
import { create } from 'zustand';

/**
 * The chatStore will store in messages a Record where the key is the conversation's id
 * and the messages is an array of chat messages.
 * Each time a new message comes in we need to expand first the conversations, then expand
 * the messages, add the message on existing conversation or create a new conversation and
 * finally set everything.
 */

type Conversation = Record<
  string,
  {
    messages: ResChatMessage[];
    hasMore: boolean;
  }
>;

interface ChatStore {
  conversations: Conversation;
  addMessage: (message: ResChatMessage) => void;
  setInitialConversations: (messages: Conversation) => void;
}

export const chatStore = create<ChatStore>((set) => ({
  conversations: {},

  // For adding a single message
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

  // Conditionally loading initial messages if we have not loaded the conversation yet
  setInitialConversations: (incoming) => {
    set((state) => {
      const merged = { ...state.conversations };

      // For all incoming messages we check...
      for (const conversationId in incoming) {
        // if we already have the conversation
        const existing = state.conversations[conversationId];

        if (!existing) {
          // if not simply add it
          merged[conversationId] = incoming[conversationId];
        } else {
          merged[conversationId] = {
            // if yes we spread the existing messages
            ...existing,
            // keep original hasMore state
            hasMore: existing.hasMore,
            // If we already have messages, keep those, otherwise store incoming
            messages: existing.messages.length
              ? existing.messages
              : incoming[conversationId].messages,
          };
        }
      }

      return { conversations: merged };
    });
  },
}));
