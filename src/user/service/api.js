// src/services/api.js
import axios from 'axios';

const baseURL = ' http://localhost:9019/api';  

const api = axios.create({
  baseURL,
  withCredentials: true, // important: send cookies on requests
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
  timeout: 25000
});

api.interceptors.request.use((cfg) => {
  // you can add auth headers here if needed (not required for cookie-auth)
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    // Optional centralized logging
    console.error('API error', err?.response?.status, err?.response?.data || err.message);
    return Promise.reject(err);
  }
);

export default api;
