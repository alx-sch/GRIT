import api from '@/lib/api';
import type {
  ConversationBase,
  ReqConversationCreate,
  ResConversationOverview,
} from '@grit/schema';

export const conversationService = {
  getConversation: async (data: ReqConversationCreate): Promise<ConversationBase> => {
    const conversation = await api.post<ConversationBase>('/conversation', data);
    return conversation.data;
  },

  getMany: async (): Promise<ResConversationOverview> => {
    const conversations = await api.get<ResConversationOverview>('/conversation');
    return conversations.data;
  },
};
