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
      setAuthenticated: (token) => set({ token }),
      clearAuthenticated: () => set({ token: null }),
    }),
    {
      name: 'auth',
    }
  )
);
