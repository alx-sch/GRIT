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

  listIncomingInvites: async (params?: {
    limit?: string;
    cursor?: string;
  }): Promise<ResListInvites> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit);
    if (params?.cursor) queryParams.set('cursor', params.cursor);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/users/me/invites/incoming?${queryString}`
      : '/users/me/invites/incoming';
    const response = await api.get<ResListInvites>(url);
    return response.data;
  },

  listOutgoingInvites: async (eventId: number): Promise<ResListInvites> => {
    const response = await api.get<ResListInvites>(`/users/me/invites/outgoing?eventId=${eventId}`);
    return response.data;
  },
};
