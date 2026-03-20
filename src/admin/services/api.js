// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'https://api.breachpen.co.ke/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 25000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (cfg) => cfg,
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    try {
      const status = error?.response?.status;
      const requestUrl = error?.config?.url || '';

      // If 401, and we're not already on login page, save redirect and send user to login
      if (status === 401) {
        const currentPath = window.location.pathname + window.location.search;

        // Avoid redirect loop when already on login page
        if (!window.location.pathname.startsWith('/login')) {
          // Avoid redirecting for auth endpoints themselves (adjust endpoints as needed)
          if (!requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/refresh') && !requestUrl.includes('/auth/verify')) {
            sessionStorage.setItem('redirectAfterLogin', currentPath);
            const encoded = encodeURIComponent(currentPath);
            window.location.href = `/login?redirect=${encoded}`;
          }
        }
      } 
    } catch (ex) {
     }

    return Promise.reject(error);
  }
);

export default api;