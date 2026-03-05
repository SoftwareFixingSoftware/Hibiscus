import api from './api';

const AdminFollowedSeriesService = {
  /**
   * Get paginated list of all followed series (admin only)
   * @param {Object} params - { page, size }
   * @returns {Promise}
   */
  getFollowedSeries: (params = {}) => {
    return api.get('/secure/admin/followed-series', { params });
  },

  /**
   * Get follower statistics per series
   * @returns {Promise}
   */
  getFollowerStatistics: () => {
    return api.get('/secure/admin/followed-series/statistics');
  },

  /**
   * Get top followed series
   * @param {number} limit
   * @returns {Promise}
   */
  getTopFollowedSeries: (limit = 10) => {
    return api.get('/secure/admin/followed-series/top', { params: { limit } });
  }
};

export default AdminFollowedSeriesService;