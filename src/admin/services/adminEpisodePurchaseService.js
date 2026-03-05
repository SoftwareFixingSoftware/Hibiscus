import api from './api';

const AdminEpisodePurchaseService = {
  /**
   * Get paginated list of all episode purchases (admin only)
   * @param {Object} params - { page, size, start, end }
   * @returns {Promise}
   */
  getPurchases: (params = {}) => {
    return api.get('/secure/admin/episode-purchases', { params });
  },

  /**
   * Get purchase statistics (admin only)
   * @returns {Promise}
   */
  getPurchaseStatistics: () => {
    return api.get('/secure/admin/episode-purchases/statistics');
  },

  /**
   * Get series aggregates (admin only)
   * @returns {Promise}
   */
  getSeriesAggregates: () => {
    return api.get('/secure/admin/episode-purchases/series-aggregates');
  }
};

export default AdminEpisodePurchaseService;