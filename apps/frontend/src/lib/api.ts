import axios from 'axios';

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

// To do: remove this temp auth interceptor once the proper auth is in place
const DEV_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlcjFAZXhhbXBsZS5jb20iLCJpYXQiOjE3NjkxNjE3MDksImV4cCI6MTc2OTc2NjUwOX0.StP5DYtkd1BaehXyT-uvQqGAXSAjOAdme7C7vuqUyBs'

api.interceptors.request.use(
    (config) => {
      if (DEV_TOKEN) {
        config.headers.Authorization = `Bearer ${DEV_TOKEN}`;
      }
      return config;
    }

)

// Response Interceptor
api.interceptors.response.use((response) => response, (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      console.warn('Unauthorized! Redirecting to login...');
    }
    return Promise.reject(error);
  }

  const finalError = error instanceof Error ? error : new Error(String(error));
  return Promise.reject(finalError);
});

export default api;
