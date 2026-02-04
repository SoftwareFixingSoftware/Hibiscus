import api from './api';

const SeriesService = {
  // Create new series
  createSeries: (seriesData) => {
    return api.post('/secure/admin/series', seriesData);
  },

  // Get all series with pagination
  getAllSeries: (params = {}) => {
    const { page = 0, size = 20, sortBy = 'createdAt', sortDirection = 'desc', activeOnly } = params;
    return api.get('/secure/admin/series', {
      params: {
        page,
        size,
        sortBy,
        sortDirection,
        ...(activeOnly !== undefined && { activeOnly }),
      },
    });
  },

  // Search series
  searchSeries: (keyword, params = {}) => {
    const { page = 0, size = 20 } = params;
    return api.get('/secure/admin/series/search', {
      params: {
        keyword,
        page,
        size,
      },
    });
  },

  // Get series by ID
  getSeriesById: (id) => {
    return api.get(`/secure/admin/series/${id}`);
  },

  // Update series
  updateSeries: (id, seriesData) => {
    return api.put(`/secure/admin/series/${id}`, seriesData);
  },

  // Delete series (soft delete)
  deleteSeries: (id) => {
    return api.delete(`/secure/admin/series/${id}`);
  },

  // Upload cover image for series
  uploadSeriesCover: (id, imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    return api.post(`/secure/admin/series/${id}/upload-cover`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

export default SeriesService;