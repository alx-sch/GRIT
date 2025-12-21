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
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized! Redirecting to login...');
      // TODO: here we could add logic to redirect to login page
    }
    // TODO: Add another global error handling logic if needed
    return Promise.reject(error);
  }
);

export default api;
