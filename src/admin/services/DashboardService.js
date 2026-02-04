import api from './api';

const DashboardService = {
  // Get dashboard statistics
  getDashboardStats: () => {
    return api.get('/secure/admin/dashboard/stats');
  },

  // Get recent series
  getRecentSeries: (limit = 5) => {
    return api.get('/secure/admin/dashboard/recent-series', {
      params: { limit }
    });
  },

  // Get content performance data
  getContentPerformance: (period = '6months') => {
    return api.get('/secure/admin/dashboard/performance', {
      params: { period }
    });
  },

  // Get metrics
  getMetrics: () => {
    return api.get('/secure/admin/dashboard/metrics');
  }
};

export default DashboardService;