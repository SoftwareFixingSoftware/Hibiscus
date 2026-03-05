import api from './api';

const AdminListeningHistoryService = {
  /**
   * Get paginated list of all listening history entries (admin only)
   * @param {Object} params - { page, size, completed, from, to }
   * @returns {Promise}
   */
  getHistory: (params = {}) => {
    return api.get('/secure/admin/listening-history', { params });
  },

  /**
   * Get listening statistics
   * @param {Object} params - { from, to } optional date range
   * @returns {Promise}
   */
  getStatistics: (params = {}) => {
    return api.get('/secure/admin/listening-history/statistics', { params });
  },

  /**
   * Get top episodes by listen count
   * @param {number} limit
   * @returns {Promise}
   */
  getTopEpisodes: (limit = 10) => {
    return api.get('/secure/admin/listening-history/top/episodes', { params: { limit } });
  },

  /**
   * Get top series by listen count
   * @param {number} limit
   * @returns {Promise}
   */
  getTopSeries: (limit = 10) => {
    return api.get('/secure/admin/listening-history/top/series', { params: { limit } });
  }
};

export default AdminListeningHistoryService;