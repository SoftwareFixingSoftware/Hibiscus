import axios from 'axios';

const API_BASE_URL = 'https://api.breachpen.co.ke/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// No request logger (removed per request)

api.interceptors.response.use(
  (response) => response.data, // unwrap response body
  (error) => {
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;