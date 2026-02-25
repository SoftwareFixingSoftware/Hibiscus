import api from './api';

const basePath = '/secure/public/episodes';

const normalizeAccessResponse = (data) => {
  if (data === true) return true;
  if (data === false) return false;
  if (typeof data === 'object' && data !== null) {
    if (data.hasAccess === true) return true;
    if (data.purchased === true) return true;
  }
  return false;
};

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

  getEpisodesBySeries: async (
    seriesId,
    { page = 0, size = 20, sortBy = 'episodeNumber', sortDirection = 'asc' } = {}
  ) => {
    if (!seriesId) throw new Error('seriesId required');
    const params = { page, size, sortBy, sortDirection };
    const res = await api.get(`${basePath}/series/${seriesId}`, { params });
    return res.data;
  },

        getStreamUrl: async (id) => {
        if (!id) throw new Error('id required');

        const res = await api.get(`${basePath}/${id}/stream-url`);

        return res.data;
        },

  checkAccess: async (episodeId) => {
    if (!episodeId) throw new Error('episodeId required');
    try {
      const res = await api.get(`${basePath}/${episodeId}/access`);
      return normalizeAccessResponse(res.data);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        return false;
      }
      throw err;
    }
  },

  purchaseEpisodeWithCoins: async (episodeId, idempotencyKey = null) => {
    if (!episodeId) throw new Error('episodeId required');
    const body = idempotencyKey ? { idempotencyKey } : {};
    try {
      const res = await api.post(`${basePath}/${episodeId}/purchase`, body);
      if (res?.data?.purchased === true) {
        return res.data;
      }
      if (res?.data === true) {
        return { purchased: true, episodeId };
      }
      return res.data;
    } catch (err) {
      try {
        const access = await PublicEpisodeService.checkAccess(episodeId);
        if (access === true) {
          return { purchased: true, episodeId };
        }
      } catch (_) {}
      throw err;
    }
  },

  createOrderForEpisode: async (episodeId) => {
    if (!episodeId) throw new Error('episodeId required');
    const res = await api.post(`${basePath}/${episodeId}/purchase/paypal`);
    return res.data;
  },
  // In PublicEpisodeService.js, add:
  getUserPurchasedEpisodes: async () => {
    const res = await api.get(`${basePath}/purchased`);
    return res.data;
  }
};

export default PublicEpisodeService;