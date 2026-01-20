import { create } from 'zustand';

export type CurrentUser = {
  id: number;
  email: string;
  avatar?: string;
  name?: string;
};

type CurrentUserState = {
  user: CurrentUser | null;
  setUser: (user: CurrentUser) => void;
  clearUser: () => void;
};

export const useCurrentUserStore = create<CurrentUserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
