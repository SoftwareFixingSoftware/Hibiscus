import api from './api';

const basePath = '/secure/user/followed-series';

const UserFollowedSeriesService = {
  getFollowedSeries: async () => {
    const response = await api.get(basePath);
    return response.data;
  },

  followSeries: async (seriesId) => {
    const response = await api.post(basePath, { seriesId });
    return response.data;
  },

  unfollowSeries: async (seriesId) => {
    await api.delete(`${basePath}/${seriesId}`);
  },

  /**
   * MUST send enabled as query param
   * because backend expects @RequestParam boolean enabled
   */
  updateNotification: async (seriesId, enabled) => {
    const response = await api.put(
      `${basePath}/${seriesId}/notifications`,
      null, // no body
      {
        params: { enabled } // <-- this becomes ?enabled=true
      }
    );
    return response.data;
  },

  getFollowStatus: async (seriesId) => {
    const response = await api.get(`${basePath}/${seriesId}`);
    return response.data;
  }
};

export default UserFollowedSeriesService;