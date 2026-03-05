import api from './api';

const AdminSeriesReviewService = {
  /**
   * Get paginated list of all series reviews (admin only)
   * @param {Object} params - { page, size }
   * @returns {Promise}
   */
  getReviews: (params = {}) => {
    return api.get('/secure/admin/series-reviews', { params });
  },

  /**
   * Get overall review statistics
   * @returns {Promise}
   */
  getReviewStatistics: () => {
    return api.get('/secure/admin/series-reviews/statistics');
  },

  /**
   * Get statistics for a specific series
   * @param {string} seriesId
   * @returns {Promise}
   */
  getSeriesReviewStats: (seriesId) => {
    return api.get(`/secure/admin/series-reviews/series/${seriesId}/statistics`);
  }
};

export default AdminSeriesReviewService;