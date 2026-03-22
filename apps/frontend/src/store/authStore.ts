import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  setAuthenticated: (token: string) => void;
  clearAuthenticated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setAuthenticated: (token) => {
        set({ token });
      },
      clearAuthenticated: () => {
        set({ token: null });
      },
    }),
    {
      name: 'auth',

      // FIX: Prevent "The Vanishing Token" Race Condition (for e2e tests)
      // Standard merge prefers localStorage over memory. If a user logs in
      // extremely fast, the async hydration from disk can finish AFTER the
      // login, overwriting the new token with 'null' from the old session.
      // We only use the stored token if our current memory is empty.

      partialize: (state) => ({ token: state.token }),
      merge: (persistedState, currentState) => {
        const p = (persistedState ?? {}) as { token?: string | null };
        return {
          ...currentState,
          ...p,
          token:
            currentState.token != null && currentState.token !== ''
              ? currentState.token
              : (p.token ?? null),
        };
      },
    }
  )
);
