import api from '@/lib/api';
import type { User } from '@/types/user';

export const userService = {
  getUsers: async () => {
    const response = await api.get<User[]>('/list');
    return response.data;
  },
};
