import api from './api';

const basePath = '/secure/user/saved-series';

const UserSavedSeriesService = {
  /**
   * Get all saved series for the current user.
   * @returns {Promise<Array>} list of saved series objects
   */
  getSavedSeries: async () => {
    const response = await api.get(basePath);
    return response.data; // array of SavedSeriesResponse
  },

  /**
   * Save a series for the current user.
   * @param {string|UUID} seriesId
   * @returns {Promise<Object>} the saved series response
   */
  saveSeries: async (seriesId) => {
    const response = await api.post(basePath, { seriesId });
    return response.data;
  },

  /**
   * Remove a saved series.
   * @param {string|UUID} seriesId
   * @returns {Promise<void>}
   */
  removeSavedSeries: async (seriesId) => {
    await api.delete(`${basePath}/${seriesId}`);
  },
};

export default UserSavedSeriesService;