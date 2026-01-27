import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

/**
 * The global Axios instance for making HTTP requests.
 * * Pre-configured with the backend base URL and standard headers.
 * Use this instance instead of `axios` directly to ensure consistent behavior.
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Request interceptor → attach token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        console.warn('Unauthorized! Redirecting to login...');
      }
      return Promise.reject(error);
    }

    const finalError = error instanceof Error ? error : new Error(String(error));
    return Promise.reject(finalError);
  }
);

export default api;
