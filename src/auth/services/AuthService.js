// src/auth/services/AuthService.js
import api from './api';

const AuthService = {
  login: (email, password) => api.post('/auth/signin', { email, password }),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),

  verifyTurnstile: (token) =>
    api.post('/auth/cloudflare-verify', { token }),
};

export default AuthService;