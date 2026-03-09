import api from './api';

const SeasonService = {
  // Get seasons by series ID (paginated)
  getSeasonsBySeries: (seriesId, params = {}) => {
    const { page = 0, size = 20, sortBy = 'seasonNumber', sortDirection = 'asc' } = params;
    return api.get(`/secure/admin/seasons/series/${seriesId}`, {
      params: { page, size, sortBy, sortDirection }
    });
  },

  // Get single season by ID
  getSeasonById: (id) => api.get(`/secure/admin/seasons/${id}`),

  // Create a new season
  createSeason: (seriesId, seasonData) =>
    api.post(`/secure/admin/seasons/series/${seriesId}`, seasonData),

  // Update a season
  updateSeason: (id, seasonData) => api.put(`/secure/admin/seasons/${id}`, seasonData),

  // Delete a season
  deleteSeason: (id) => api.delete(`/secure/admin/seasons/${id}`)
};

export default SeasonService;