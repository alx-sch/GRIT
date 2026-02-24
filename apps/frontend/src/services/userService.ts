import api from '@/lib/api';
import type { UserBase, UserResponse } from '@/types/user';

interface GetUsersParams {
  limit?: string;
  cursor?: string;
}

export const userService = {
  getUsers: async (params?: GetUsersParams): Promise<UserResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit);
    if (params?.cursor) queryParams.set('cursor', params.cursor);

    const queryString = queryParams.toString();
    const url = queryString ? `users?${queryString}` : '/users';
    const response = await api.get<UserResponse>(url);
    return response.data;
  },
  getMe: async (): Promise<UserBase> => {
    const response = await api.get<UserBase>('/users/me');
    return response.data;
  },

  attendEvent: async (eventId: number): Promise<UserBase> => {
    const response = await api.patch<UserBase>('users/me', { attending: { connect: [eventId] } });
    return response.data;
  },

  unattendEvent: async (eventId: number): Promise<UserBase> => {
    const response = await api.patch<UserBase>('users/me', {
      attending: { disconnect: [eventId] },
    });
    return response.data;
  },

  updateMe: async (data: { name?: string }): Promise<UserBase> => {
    const response = await api.patch<UserBase>('users/me', data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<UserBase> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.patch<UserBase>('users/me/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getMyEvents: async (): Promise<{ title: string }[]> => {
    const response = await api.get<{ title: string }[]>('/users/me/events');
    return response.data;
  },
};
