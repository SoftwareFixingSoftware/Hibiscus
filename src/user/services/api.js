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

// NOTE: when we get a 401 we capture the current browser URL and redirect to /login?redirect=...
api.interceptors.response.use(
  res => res,
  err => {
    try {
      const status = err?.response?.status;
      // if not an HTTP 401, just reject
      if (status !== 401) {
         return Promise.reject(err);
      }

      // Avoid redirect loop: if already on /login, do nothing special
      const pathname = window.location.pathname || '/';
      const search = window.location.search || '';
      if (pathname.startsWith('/login')) {
        return Promise.reject(err);
      }

      // Avoid redirecting for auth endpoints (adjust if needed)
      const requestUrl = err?.config?.url || '';
      if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh') || requestUrl.includes('/auth/verify')) {
        return Promise.reject(err);
      }

      const redirectTo = pathname + search;
      sessionStorage.setItem('redirectAfterLogin', redirectTo);

      // Redirect to the login page with the redirect param
      const encoded = encodeURIComponent(redirectTo);
      window.location.href = `/login?redirect=${encoded}`;
    } catch (ex) {

    }
    return Promise.reject(err);
  }
);

export default api;