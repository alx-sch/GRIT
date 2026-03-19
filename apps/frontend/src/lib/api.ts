import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useCurrentUserStore } from '@/store/currentUserStore';

const AUTH_401_TRIGGERS = /^\/(auth\/me|users\/me|users\/me\/)/;

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        const url = error.config?.url ?? '';
        if (AUTH_401_TRIGGERS.test(url)) {
          useAuthStore.getState().clearAuthenticated();
          useCurrentUserStore.getState().clearUser();
        }
      }
      return Promise.reject(error);
    }

    const finalError = error instanceof Error ? error : new Error(String(error));
    return Promise.reject(finalError);
  }
);

export default api;
