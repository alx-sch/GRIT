import api from '@/lib/api';
import { type ConversationRes } from '@grit/schema';

interface GetConversationParam {
  type: string;
  eventId?: number;
  directId?: number;
  groupIds?: number[];
}

export const conversationService = {
  getConversation: async (data: GetConversationParam): Promise<ConversationRes> => {
    const conversation = await api.post<ConversationRes>('/conversation', data);
    return conversation.data;
  },
};
