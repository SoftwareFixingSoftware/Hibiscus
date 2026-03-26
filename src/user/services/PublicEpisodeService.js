// src/services/PublicEpisodeService.js
import api from './api';
import { isAuthenticatedByPath } from './authHelper';

const SECURE_BASE = '/secure/public/episodes';
const PUBLIC_BASE = '/public/episodes';

const getBasePath = () => (isAuthenticatedByPath() ? SECURE_BASE : PUBLIC_BASE);

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
    const res = await api.get(`${getBasePath()}/latest`, { params });
    return res.data;
  },

  getEpisodeById: async (id) => {
    if (!id) throw new Error('id required');
    const res = await api.get(`${getBasePath()}/${id}`);
    return res.data;
  },

  getEpisodesBySeries: async (
    seriesId,
    { page = 0, size = 20, sortBy = 'episodeNumber', sortDirection = 'asc' } = {}
  ) => {
    if (!seriesId) throw new Error('seriesId required');
    const params = { page, size, sortBy, sortDirection };
    const res = await api.get(`${getBasePath()}/series/${seriesId}`, { params });
    return res.data;
  },

  /**
   * Returns the streaming endpoint URL for an episode.
   * The frontend will use this URL to play the audio; the backend will handle streaming and access control.
   * 
   * Note: We build an absolute URL using api.defaults.baseURL so the browser sends the request
   * directly to the backend, including cookies (withCredentials is set on the axios instance,
   * but the audio element itself relies on the browser's native cookie handling).
   */
  getStreamUrl: async (id) => {
    if (!id) throw new Error('id required');
    const baseURL = api.defaults.baseURL;  
    return `${baseURL}${getBasePath()}/${id}/stream`;
  },

  checkAccess: async (episodeId) => {
    if (!episodeId) throw new Error('episodeId required');
    try {
      const res = await api.get(`${getBasePath()}/${episodeId}/access`);
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
      const res = await api.post(`${getBasePath()}/${episodeId}/purchase`, body);
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
    const res = await api.post(`${getBasePath()}/${episodeId}/purchase/paypal`);
    return res.data;
  },

  getUserPurchasedEpisodes: async () => {
    const res = await api.get(`${getBasePath()}/purchased`);
    return res.data;
  },
};

export default PublicEpisodeService;