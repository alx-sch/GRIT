import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentUser } from '@/types/user';

interface CurrentUserState {
  user: CurrentUser | null;
  isAvatarTransitioning: boolean;
  setUser: (user: CurrentUser) => void;
  clearUser: () => void;
  setAvatarTransitioning: (value: boolean) => void;
}

export const useCurrentUserStore = create<CurrentUserState>()(
  persist(
    (set) => ({
      user: null,
      isAvatarTransitioning: false,
      setUser: (user) => {
        set({ user });
      },
      clearUser: () => {
        set({ user: null });
      },
      setAvatarTransitioning: (value: boolean) => {
        set({ isAvatarTransitioning: value });
      },
    }),
    {
      name: 'current-user',
    }
  )
);
