// src/services/CsrfService.js
import api from './api';

const CsrfService = {
  // Fetch CSRF token from backend
  fetchCsrfToken: () => {
    return api.get('/csrf-token');
  },

  // Set CSRF token in axios default headers
  setCsrfToken: (token) => {
    api.defaults.headers.common['X-CSRF-TOKEN'] = token;
  },

  // Get CSRF token from cookie
  getCsrfCookie: () => {
    const name = 'XSRF-TOKEN';
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  }
};

export default CsrfService;