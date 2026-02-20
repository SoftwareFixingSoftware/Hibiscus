// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:9019/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// request logger (optional but useful)
api.interceptors.request.use((cfg) => {
  console.log('➡️ HTTP', cfg.method?.toUpperCase(), cfg.baseURL + cfg.url, cfg.params || '');
  return cfg;
}, (err) => Promise.reject(err));

api.interceptors.response.use(
  (response) => response.data, // keep unwrapping body (your UserService.request expects this)
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('username');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('isAdmin');

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // RETURN THE FULL ERROR OBJECT so callers can inspect .code, .name, .response, etc.
    return Promise.reject(error);
  }
);

export default api;