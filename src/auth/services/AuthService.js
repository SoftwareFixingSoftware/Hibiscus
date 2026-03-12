// src/auth/services/AuthService.js
import api from './api'; 
const AuthService = {
  // Login - returns response.data from api
  login: (email, password) => api.post('/auth/signin', { email, password }),

  // Logout
  logout: () => api.post('/auth/logout'),

  // Verify auth status - works with cookies
  verify: () => api.get('/auth/verify'),

};

export default AuthService;