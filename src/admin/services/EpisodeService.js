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

    console.log('🎬 EpisodeService - single episode details:');
    console.log(`- Episode ID: ${ep.id}`);
    console.log(`  Title: ${ep.title}`);
    console.log(`  Audio URL: ${ep.audioUrl || ep.audioStorageKey || 'N/A'}`);
    console.log(`  Has Audio: ${ep.hasAudio || 'N/A'}`);
    console.log(`  Duration: ${ep.durationSeconds ?? ep.duration ?? 'N/A'} sec`);
    console.log(`  Published: ${ep.isPublished}`);
    console.log('-------------------------------');

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
    console.log(`Updating episode ${id}:`, episodeData);
    return api.put(`/secure/admin/episodes/${id}`, episodeData);
  },

  // Delete episode
  deleteEpisode: (id) => {
    console.log(`Deleting episode ${id}`);
    return api.delete(`/secure/admin/episodes/${id}`);
  },

  // Upload audio for episode (overwrites existing)
  uploadEpisodeAudio: (id, audioFile) => {
    const formData = new FormData();
    formData.append('file', audioFile);

    console.log(`Uploading audio for episode ${id}:`, audioFile.name, audioFile.size);
    return api.post(`/secure/admin/episodes/${id}/upload-audio`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Delete audio from episode
  deleteEpisodeAudio: (id) => {
    console.log(`Deleting audio for episode ${id}`);
    return api.delete(`/secure/admin/episodes/${id}/audio`);
  },

  // Publish episode
  publishEpisode: (id) => {
    console.log(`Publishing episode ${id}`);
    return api.put(`/secure/admin/episodes/${id}/publish`);
  },

  // Unpublish episode
  unpublishEpisode: (id) => {
    console.log(`Unpublishing episode ${id}`);
    return api.put(`/secure/admin/episodes/${id}/unpublish`);
  },

  // Get audio URL info for debugging
  getAudioInfo: (episodeId) => {
    return api.get(`/secure/admin/episodes/${episodeId}/audio-info`);
  }
};

export default EpisodeService;