import api from '@/lib/api';
import { ResInvite, ResListInvites } from '@/types/invite';

export const inviteService = {
  sendInvite: async (reqBody: { receiverId: number; eventId: number }): Promise<ResInvite> => {
    const response = await api.post<ResInvite>('/users/me/invites', reqBody);
    return response.data;
  },

  updateInvite: async (inviteId: string, reqBody: { status: string }): Promise<ResInvite> => {
    const response = await api.post<ResInvite>(`/users/me/invites/${inviteId}`, reqBody);
    return response.data;
  },

  deleteInvite: async (inviteId: string): Promise<ResInvite> => {
    const response = await api.delete<ResInvite>(`/users/me/invites/${inviteId}`);
    return response.data;
  },

  listIncoming: async (): Promise<ResListInvites> => {
    const response = await api.get<ResListInvites>('/users/me/invites/incoming');
    return response.data;
  },

  listOutgoing: async (): Promise<ResListInvites> => {
    const response = await api.get<ResListInvites>('/users/me/invites/outgoing');
    return response.data;
  },
};
