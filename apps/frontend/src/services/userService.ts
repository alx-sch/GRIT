import api from '@/lib/api';
import type { UserBase, UserResponse } from '@/types/user';
import {
  ResUserPublicSchema,
  ResUserPublicEventsPaginatedSchema,
  ResMyEventsPaginatedSchema,
  ResMyInvitedEventsPaginatedSchema,
  ResFriendshipStatusSchema,
  type MyEventsTab,
} from '@grit/schema';
import { useCurrentUserStore } from '@/store/currentUserStore';

interface GetUsersParams {
  limit?: string;
  cursor?: string;
  search?: string;
  signal?: AbortSignal;
}

export const userService = {
  getUsers: async (params?: GetUsersParams): Promise<UserResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit);
    if (params?.cursor) queryParams.set('cursor', params.cursor);
    if (params?.search) queryParams.set('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString ? `users?${queryString}` : '/users';
    const response = await api.get<UserResponse>(url, { signal: params?.signal });
    return response.data;
  },

  getMe: async (): Promise<UserBase> => {
    const response = await api.get<UserBase>('users/me');
    return response.data;
  },

  getMyEvents: async (params: {
    tab: Exclude<MyEventsTab, 'invited'>;
    limit?: string;
    cursor?: string;
  }) => {
    const query = new URLSearchParams({ tab: params.tab });
    if (params.limit) query.set('limit', params.limit);
    if (params.cursor) query.set('cursor', params.cursor);
    const response = await api.get(`users/me/events?${query.toString()}`);
    return ResMyEventsPaginatedSchema.parse(response.data);
  },

  getMyInvitedEvents: async (params?: { limit?: string; cursor?: string }) => {
    const query = new URLSearchParams({ tab: 'invited' });
    if (params?.limit) query.set('limit', params.limit);
    if (params?.cursor) query.set('cursor', params.cursor);
    const response = await api.get(`users/me/events?${query.toString()}`);
    return ResMyInvitedEventsPaginatedSchema.parse(response.data);
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

  getUserByName: async (username: string) => {
    const response = await api.get(`/users/${username}`);
    return ResUserPublicSchema.parse(response.data);
  },

  getUserEventsByName: async (params: { username: string; limit?: number; cursor?: string }) => {
    const { username, limit = 12, cursor } = params;
    const query = new URLSearchParams({ limit: String(limit) });
    if (cursor) query.set('cursor', cursor);
    const response = await api.get(`/users/${username}/events?${query.toString()}`);
    return ResUserPublicEventsPaginatedSchema.parse(response.data);
  },

  getFriendshipStatus: async (id: number) => {
    const response = await api.get(`/users/me/friends/status/${id}`);
    const parsed = ResFriendshipStatusSchema.parse(response.data);
    return parsed.status;
  },
};
