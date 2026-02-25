import api from './api';

const BASE_PATH = '/secure/users';

const UserService = {

  /**
   * Get currently authenticated user
   * GET /api/secure/users/me
   * No params required (cookie handles identity)
   */
  getProfile: async () => {
    const response = await api.get(`${BASE_PATH}/me`);
    return response.data;
  },

  /**
   * Update currently authenticated user
   * PUT /api/secure/users/me
   * Accepts partial update payload
   */
  updateProfile: async (payload) => {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Profile update payload is required');
    }

    const response = await api.put(`${BASE_PATH}/me`, payload);
    return response.data;
  }

};

export default UserService;