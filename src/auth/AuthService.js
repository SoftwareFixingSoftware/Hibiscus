// src/admin/services/AuthService.js
import api from '../admin/services/api';

const AuthService = {
  // Login - returns response.data from api
  login: (email, password) => api.post('/auth/signin', { email, password }),

  // Logout
  logout: () => api.post('/auth/logout'),

  // Verify auth status - THIS SHOULD WORK WITH COOKIES
  verify: () => api.get('/auth/verify'),

  // Get current user from localStorage
  getCurrentUser: () => {
    return {
      username: localStorage.getItem('username'),
      email: localStorage.getItem('userEmail'),
      role: localStorage.getItem('userRole'),
      isAdmin: localStorage.getItem('isAdmin') === 'true'
    };
  },

  // Clear local storage (but NOT cookies - those are handled by backend)
  clearAuthData: () => {
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAdmin');
  }
};

export default AuthService;