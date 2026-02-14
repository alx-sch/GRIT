import api from '@/lib/api';

interface GetConversationParam {
  type: string;
  eventId?: number;
  directId?: number;
  groupIds?: number[];
}

export const conversationService = {
  getConversation: async (data: GetConversationParam) => {
    const conversation = await api.post('/conversation', data);
    return conversation.data;
  },
};
