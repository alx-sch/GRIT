import { create } from 'zustand';
import { userService } from '@/services/userService';
import type { User } from '@/types/user';

interface UserState {
  users: User[];
  loading: boolean;
  error: boolean;
  fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,
  error: false,

  fetchUsers: async () => {
    set({ loading: true, error: false });
    try {
      const data = await userService.getUsers();
      set({ users: data, loading: false });
    } catch (err) {
      console.error(err);
      set({ error: true, loading: false });
    }
  },
}));
