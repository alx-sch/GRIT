import api from '@/lib/api';
import type { UserBase, UserResponse } from '@/types/user';
import {
  ResMyEvents,
  ResMyInvitedEvents,
  ResUserPublicSchema,
  ResUserPublicEventsSchema,
  ResFriendshipStatusSchema,
} from '@grit/schema';
import { useCurrentUserStore } from '@/store/currentUserStore';

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

  getMyEvents: async (): Promise<ResMyEvents> => {
    const response = await api.get<ResMyEvents>('users/me/events');
    return response.data;
  },

  getMyInvitedEvents: async (): Promise<ResMyInvitedEvents> => {
    const response = await api.get<ResMyInvitedEvents>('users/me/events/invited');
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

  updateMe: async (data: {
    name?: string;
    bio?: string | null;
    city?: string | null;
    country?: string | null;
    isProfilePublic?: boolean;
  }): Promise<UserBase> => {
    const response = await api.patch<UserBase>('users/me', data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<UserBase> => {
    useCurrentUserStore.getState().setAvatarTransitioning(true);
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.patch<UserBase>('users/me/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Keep transitioning state for 500ms to allow avatar to load smoothly
    setTimeout(() => {
      useCurrentUserStore.getState().setAvatarTransitioning(false);
    }, 500);

    return response.data;
  },

  removeAvatar: async (): Promise<UserBase> => {
    useCurrentUserStore.getState().setAvatarTransitioning(true);
    const response = await api.delete<UserBase>('users/me/avatar');

    // Keep transitioning state for 500ms to allow avatar to load smoothly
    setTimeout(() => {
      useCurrentUserStore.getState().setAvatarTransitioning(false);
    }, 500);

    return response.data;
  },

  setRandomAvatar: async (): Promise<UserBase> => {
    useCurrentUserStore.getState().setAvatarTransitioning(true);
    const response = await api.post<UserBase>('users/me/random-avatar');

    // Keep transitioning state for 500ms to allow avatar to load smoothly
    setTimeout(() => {
      useCurrentUserStore.getState().setAvatarTransitioning(false);
    }, 500);

    return response.data;
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete('users/me');
  },

  getUserById: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return ResUserPublicSchema.parse(response.data);
  },

  getUserEvents: async (id: number) => {
    const response = await api.get(`/users/${id}/events`);
    return ResUserPublicEventsSchema.parse(response.data);
  },

  getFriendshipStatus: async (id: number) => {
    const response = await api.get(`/users/me/friends/status/${id}`);
    const parsed = ResFriendshipStatusSchema.parse(response.data);
    return parsed.status;
  },
};
