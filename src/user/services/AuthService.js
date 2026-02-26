import api from './api';

const AuthService = {
  /**
   * Log out the current user – clears the httpOnly cookie on the server.
   * @returns {Promise<Object>} server response
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

export default AuthService;