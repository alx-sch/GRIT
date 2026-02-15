import { create } from 'zustand';
import { userService } from '@/services/userService';
import axios from 'axios';
import { ResUserPublic } from '@grit/schema';

interface UsersState {
  users: ResUserPublic[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  loading: false,
  error: null,
  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await userService.getUsers();
      set({ users: response.data, loading: false });
    } catch (err: unknown) {
      console.error(err);

      let message = 'Failed to load users';

      if (axios.isAxiosError(err)) {
        const axiosData = err.response?.data as { message?: string } | undefined;
        message = axiosData?.message ?? err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      set({ error: message, loading: false });
    }
  },
}));
