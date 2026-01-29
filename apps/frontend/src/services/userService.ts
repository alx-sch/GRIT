import api from '@/lib/api';
import type { UserResponse } from '@/types/user';

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
};
