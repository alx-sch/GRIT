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

      // Prevent "The Vanishing User" Race Condition (seen in e2e tests)
      // Standard merge prefers localStorage over memory. If a user logs in
      // extremely fast, the async hydration from disk can finish AFTER the
      // login, overwriting the fresh user data with 'null' from the old session.
      // We only use the stored user if our current memory is empty.

      partialize: (state) => ({ user: state.user }),
      merge: (persistedState, currentState) => {
        const p = (persistedState ?? {}) as { user?: CurrentUser | null };
        return {
          ...currentState,
          ...p,
          user: currentState.user ?? p.user ?? null,
        };
      },
    }
  )
);
