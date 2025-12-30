import axios from 'axios';

/**
 * The global Axios instance for making HTTP requests.
 * * Pre-configured with the backend base URL and standard headers.
 * Use this instance instead of `axios` directly to ensure consistent behavior.
 */
const api = axios.create({
  baseURL: '/api', //NOTE: make sure it matches whatever caddyfile sets
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, //timeout after 10 seconds
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Use Type Guard to safely access .response
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        console.warn('Unauthorized! Redirecting to login...');
      }
      // Rejecting with an AxiosError is allowed because it extends Error
      return Promise.reject(error);
    }

    // Fallback for non-Axios errors to satisfy rejection rule
    const finalError = error instanceof Error ? error : new Error(String(error));
    return Promise.reject(finalError);
  }
);

export default api;
