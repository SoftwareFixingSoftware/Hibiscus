import axios from 'axios';

const baseURL = 'http://localhost:9019/api';  

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
  timeout: 25000
});

api.interceptors.request.use((cfg) => {
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    console.error('API error', err?.response?.status, err?.response?.data || err.message);
    return Promise.reject(err);
  }
);

export default api;