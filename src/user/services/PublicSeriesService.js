import api from './api';

const basePath = '/secure/public/series';

const PublicSeriesService = {
  getAllSeries: async ({ page = 0, size = 12, sortBy = 'createdAt', sortDirection = 'desc' } = {}) => {
    const params = { page, size, sortBy, sortDirection };
    const res = await api.get(basePath, { params });
    return res.data;
  },

  getSeriesById: async (id) => {
    if (!id) throw new Error('Series ID is required');
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  },

  searchSeries: async (keyword, { page = 0, size = 20 } = {}) => {
    if (!keyword || typeof keyword !== 'string') {
      throw new Error('A valid keyword is required for search');
    }
    const params = { keyword, page, size };
    const res = await api.get(`${basePath}/search`, { params });
    return res.data;
  }
};

export default PublicSeriesService;