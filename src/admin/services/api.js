// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:9019/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This sends cookies automatically
});

// NO NEED for request interceptor with token from localStorage
// since we're using HTTP-only cookies

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear any stored user info
      localStorage.removeItem('username');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('isAdmin');

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error.message || error);
  }
);

export default api;