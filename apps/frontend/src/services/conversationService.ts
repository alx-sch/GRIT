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

  getMany: async (params?: {
    limit?: string;
    cursor?: string;
  }): Promise<ResConversationOverview> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit);
    if (params?.cursor) queryParams.set('cursor', params.cursor);

    const queryString = queryParams.toString();
    const url = queryString ? `/conversation?${queryString}` : '/conversation';
    const conversations = await api.get<ResConversationOverview>(url);
    return conversations.data;
  },
};
