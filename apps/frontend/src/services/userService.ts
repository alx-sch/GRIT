import api from '@/lib/api';
import type { UserBase, UserResponse } from '@/types/user';
import { ResUserEvents } from '@grit/schema';

interface GetUsersParams {
  limit?: string;
  cursor?: string;
  search?: string;
}

export const userService = {
  getUsers: async (params?: GetUsersParams): Promise<UserResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit);
    if (params?.cursor) queryParams.set('cursor', params.cursor);
    if (params?.search) queryParams.set('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString ? `users?${queryString}` : '/users';
    const response = await api.get<UserResponse>(url);
    return response.data;
  },

  getMe: async (): Promise<UserBase> => {
    const response = await api.get<UserBase>('users/me');
    return response.data;
  },

  getMyEvents: async (): Promise<ResUserEvents> => {
    const response = await api.get<ResUserEvents>('users/me/events');
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

  removeAvatar: async (): Promise<UserBase> => {
    const response = await api.delete<UserBase>('users/me/avatar');
    return response.data;
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete('users/me');
  },
};
