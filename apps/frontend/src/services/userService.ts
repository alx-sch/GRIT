import api from '@/lib/api';
import type { User } from '@/types/user';

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },
};
