import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  token: string | null;
  setAuthenticated: (token: string) => void;
  clearAuthenticated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: !!localStorage.getItem('token'),
  token: localStorage.getItem('token'),
  setAuthenticated: (token) => {
    localStorage.setItem('token', token);
    set({ token: token, isLoggedIn: true });
  },
  clearAuthenticated: () => {
    localStorage.removeItem('token');
    set({ token: null, isLoggedIn: false });
  },
}));
