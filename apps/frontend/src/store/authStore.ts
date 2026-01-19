import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  token: string | null;
  storeToken: (token: string) => void;
  removeToken: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: !!localStorage.getItem('token'),
  token: localStorage.getItem('token'),
  storeToken: (token) => {
    localStorage.setItem('token', token);
    set({ token: token, isLoggedIn: true });
  },
  removeToken: () => {
    localStorage.removeItem('token');
    set({ token: null, isLoggedIn: false });
  },
}));
