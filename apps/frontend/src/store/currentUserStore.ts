import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CurrentUser {
  id: number;
  email?: string;
  avatarKey?: string;
  name?: string;
}

interface CurrentUserState {
  user: CurrentUser | null;
  setUser: (user: CurrentUser) => void;
  clearUser: () => void;
}

export const useCurrentUserStore = create<CurrentUserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'current-user',
    }
  )
);
