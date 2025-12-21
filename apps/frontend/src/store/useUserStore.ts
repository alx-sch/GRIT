import { create } from 'zustand';
import { userService } from '@/services/userService';
import { User } from '@/types/user';
import axios from 'axios';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,
  error: null,
  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const users = await userService.getUsers();
      set({ users, loading: false });
    } catch (err: unknown) {
      console.error(err);

      let message = 'Failed to load users';

      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || err.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      set({ error: message, loading: false });
    }
  },
}));
