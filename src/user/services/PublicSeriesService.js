// src/services/PublicSeriesService.js
import api from './api';
import { isAuthenticatedByPath } from './authHelper';

const SECURE_BASE = '/secure/public/series';
const PUBLIC_BASE = '/public/series';

const getBasePath = () => (isAuthenticatedByPath() ? SECURE_BASE : PUBLIC_BASE);

const PublicSeriesService = {
  getAllSeries: async ({ page = 0, size = 12, sortBy = 'createdAt', sortDirection = 'desc' } = {}) => {
    const params = { page, size, sortBy, sortDirection };
    const res = await api.get(getBasePath(), { params });
    return res.data;
  },

  getSeriesById: async (id) => {
    if (!id) throw new Error('Series ID is required');
    const res = await api.get(`${getBasePath()}/${id}`);
    return res.data;
  },

  searchSeries: async (keyword, { page = 0, size = 20 } = {}) => {
    if (!keyword || typeof keyword !== 'string') {
      throw new Error('A valid keyword is required for search');
    }
    const params = { keyword, page, size };
    const res = await api.get(`${getBasePath()}/search`, { params });
    return res.data;
  },
};

export default PublicSeriesService;