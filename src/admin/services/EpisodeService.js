import api from './api';

const EpisodeService = {
  // Create episode in series
  createEpisodeInSeries: (seriesId, episodeData) => {
    return api.post(`/secure/admin/episodes/series/${seriesId}`, episodeData);
  },

  // Create episode in season
  createEpisodeInSeason: (seasonId, episodeData) => {
    return api.post(`/secure/admin/episodes/seasons/${seasonId}`, episodeData);
  },

  // Get episode by ID
  getEpisodeById: (id) => {
    return api.get(`/secure/admin/episodes/${id}`);
  },

  /**
   * Get episodes (flexible):
   * - If seriesId provided (and no seasonId) => uses /secure/admin/episodes/series/{seriesId}
   * - Otherwise uses /secure/admin/episodes with optional seasonId, publishedOnly, freeOnly
   *
   * Kept function name `getEpisodesBySeries` so existing callers don't change.
   */
  getEpisodesBySeries: (seriesId, params = {}) => {
    const {
      page = 0,
      size = 20,
      sortBy = 'episodeNumber',
      sortDirection = 'asc', // kept for API compatibility on client side; will be mapped to sortDir below
      publishedOnly,
      freeOnly,
      seasonId
    } = params;

    // backend expects parameter `sortDir` (controller uses sortDir)
    const queryParams = {
      page,
      size,
      sortBy,
      sortDir: sortDirection,
      ...(publishedOnly !== undefined && { publishedOnly }),
      ...(freeOnly !== undefined && { freeOnly }),
      ...(seasonId && { seasonId })
    };

    // If seriesId is provided and no seasonId, use series-specific endpoint for efficiency
    if (seriesId && !seasonId) {
      return api.get(`/secure/admin/episodes/series/${seriesId}`, {
        params: queryParams,
      });
    }

    // Otherwise fetch from the global listing endpoint (supports seasonId, freeOnly, etc.)
    return api.get('/secure/admin/episodes', {
      params: queryParams,
    });
  },

  // Update episode
  updateEpisode: (id, episodeData) => {
    return api.put(`/secure/admin/episodes/${id}`, episodeData);
  },

  // Delete episode
  deleteEpisode: (id) => {
    return api.delete(`/secure/admin/episodes/${id}`);
  },

  // Upload audio for episode - do not force Content-Type (browser will set boundary)
  uploadEpisodeAudio: (id, audioFile) => {
    const formData = new FormData();
    formData.append('file', audioFile);

    return api.post(`/secure/admin/episodes/${id}/upload-audio`, formData, {
      // NOTE: do not set 'Content-Type' manually for multipart/form-data
      // let the browser/axios set the correct headers (including boundary).
    });
  },

  // Publish episode
  publishEpisode: (id) => {
    return api.put(`/secure/admin/episodes/${id}/publish`);
  },

  // Unpublish episode
  unpublishEpisode: (id) => {
    return api.put(`/secure/admin/episodes/${id}/unpublish`);
  }
};

export default EpisodeService;
