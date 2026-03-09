import api from '@/lib/api';
import type {
  FriendBase,
  FriendRequestBase,
  FriendRequestResponse,
  FriendResponse,
} from '@/types/friends';

interface getFriendsParams {
  limit?: string;
  cursor?: string;
}

interface getFriendRequestsParams {
  limit?: string;
  cursor?: string;
}

export const friendService = {
  sendRequest: async (receiverId: number): Promise<FriendRequestBase> => {
    const response = await api.post<FriendRequestBase>('/users/me/friends/requests', {
      receiverId,
    });
    return response.data;
  },

  acceptRequest: async (requestId: string): Promise<FriendRequestBase> => {
    const response = await api.post<FriendRequestBase>(
      `/users/me/friends/requests/${requestId}/accept`
    );
    return response.data;
  },

  declineRequest: async (requestId: string): Promise<FriendRequestBase> => {
    const response = await api.post<FriendRequestBase>(
      `/users/me/friends/requests/${requestId}/decline`
    );
    return response.data;
  },

  removeFriend: async (friendId: number): Promise<FriendBase> => {
    const response = await api.delete<FriendBase>(`/users/me/friends/${String(friendId)}`);
    return response.data;
  },

  listFriends: async (params?: getFriendsParams): Promise<FriendResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit);
    if (params?.cursor) queryParams.set('cursor', params.cursor);

    const queryString = queryParams.toString();
    const url = queryString ? `/users/me/friends?${queryString}` : '/users/me/friends';
    const response = await api.get<FriendResponse>(url);
    return response.data;
  },

  listIncomingRequests: async (
    params?: getFriendRequestsParams
  ): Promise<FriendRequestResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit);
    if (params?.cursor) queryParams.set('cursor', params.cursor);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/users/me/friends/requests/incoming?${queryString}`
      : '/users/me/friends/requests/incoming';
    const response = await api.get<FriendRequestResponse>(url);
    return response.data;
  },

  listOutgoingRequests: async (
    params?: getFriendRequestsParams
  ): Promise<FriendRequestResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit);
    if (params?.cursor) queryParams.set('cursor', params.cursor);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/users/me/friends/requests/outgoing?${queryString}`
      : '/users/me/friends/requests/outgoing';
    const response = await api.get<FriendRequestResponse>(url);
    return response.data;
  },
};
