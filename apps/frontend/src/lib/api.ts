import axios from 'axios';

const api = axios.create({
  baseURL: '/api-user',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
