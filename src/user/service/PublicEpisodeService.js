// src/services/PublicEpisodeService.js
import api from './api';

const basePath = '/secure/public/episodes';

const PublicEpisodeService = {
  getLatestEpisodes: async ({ page = 0, size = 12, freeOnly } = {}) => {
    const params = { page, size };
    if (freeOnly !== undefined) params.freeOnly = freeOnly;
    const res = await api.get(`${basePath}/latest`, { params });
    return res.data;
  },

  getEpisodeById: async (id) => {
    if (!id) throw new Error('id required');
    const res = await api.get(`${basePath}/${id}`);
    return res.data;
  },

  getEpisodesBySeries: async (seriesId, { page = 0, size = 20, sortBy = 'episodeNumber', sortDirection = 'asc' } = {}) => {
    const params = { page, size, sortBy, sortDirection };
    const res = await api.get(`${basePath}/series/${seriesId}`, { params });
    return res.data;
  },

  getStreamUrl: async (id) => {
    if (!id) throw new Error('id required');
    const res = await api.get(`${basePath}/${id}/stream-url`);
    return res.data; // expects a string (URL)
  }
};

export default PublicEpisodeService;
