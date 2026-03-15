// src/services/EpisodeService.js
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
  getEpisodeById: async (id) => {
    const res = await api.get(`/secure/admin/episodes/${id}`);
    const ep = res.data;


    return res;
  },

  /**
   * Get episodes (flexible)
   */
  getEpisodesBySeries: async (seriesId, params = {}) => {
    const {
      page = 0,
      size = 20,
      sortBy = 'episodeNumber',
      sortDirection = 'asc',
      publishedOnly,
      freeOnly,
      seasonId
    } = params;

    const queryParams = {
      page,
      size,
      sortBy,
      sortDir: sortDirection,
      ...(publishedOnly !== undefined && { publishedOnly }),
      ...(freeOnly !== undefined && { freeOnly }),
      ...(seasonId && { seasonId })
    };

    let response;
    if (seriesId && !seasonId) {
      response = await api.get(`/secure/admin/episodes/series/${seriesId}`, { params: queryParams });
    } else {
      response = await api.get('/secure/admin/episodes', { params: queryParams });
    }

    return response;
  },

  // Update episode
  updateEpisode: (id, episodeData) => {

    return api.put(`/secure/admin/episodes/${id}`, episodeData);
  },

  // Delete episode
  deleteEpisode: (id) => {

    return api.delete(`/secure/admin/episodes/${id}`);
  },

  // Upload audio for episode (overwrites existing)
  uploadEpisodeAudio: (id, audioFile) => {
    const formData = new FormData();
    formData.append('file', audioFile);


    return api.post(`/secure/admin/episodes/${id}/upload-audio`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Delete audio from episode
  deleteEpisodeAudio: (id) => {

    return api.delete(`/secure/admin/episodes/${id}/audio`);
  },

  // Publish episode
  publishEpisode: (id) => {

    return api.put(`/secure/admin/episodes/${id}/publish`);
  },

  // Unpublish episode
  unpublishEpisode: (id) => {

    return api.put(`/secure/admin/episodes/${id}/unpublish`);
  },

  // Get audio URL info for debugging
  getAudioInfo: (episodeId) => {
    return api.get(`/secure/admin/episodes/${episodeId}/audio-info`);
  }
};

export default EpisodeService;