import api from './api';

const SeriesReviewService = {
  /**
   * Get all reviews for a specific series
   * @param {string} seriesId
   * @returns {Promise<Array>}
   */
  getReviewsForSeries: (seriesId) =>
    api.get(`/secure/series/${seriesId}/reviews`),

  /**
   * Get the current user's review for a specific series
   * @param {string} seriesId
   * @returns {Promise<Object>} 200 with review, 404 if none
   */
  getMyReviewForSeries: (seriesId) =>
    api.get(`/secure/series/${seriesId}/reviews/me`),

  /**
   * Create a review for a series
   * @param {string} seriesId
   * @param {Object} reviewData { rating: number, reviewText: string }
   * @returns {Promise<Object>}
   */
  createReview: (seriesId, reviewData) =>
    api.post(`/secure/series/${seriesId}/reviews`, reviewData),

  /**
   * Update the current user's review for a series
   * @param {string} seriesId
   * @param {Object} reviewData { rating: number, reviewText: string }
   * @returns {Promise<Object>}
   */
  updateMyReview: (seriesId, reviewData) =>
    api.put(`/secure/series/${seriesId}/reviews/me`, reviewData),

  /**
   * Delete the current user's review for a series
   * @param {string} seriesId
   * @returns {Promise}
   */
  deleteMyReview: (seriesId) =>
    api.delete(`/secure/series/${seriesId}/reviews/me`),

  /**
   * Get all reviews written by the current user (across series)
   * @returns {Promise<Array>}
   */
  getUserReviews: () =>
    api.get('/secure/series/user/reviews'),
};

export default SeriesReviewService;