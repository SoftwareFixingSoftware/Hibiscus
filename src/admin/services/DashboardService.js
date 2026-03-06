// services/DashboardService.js
import SeriesService from './SeriesService';
import EpisodeService from './EpisodeService';
import UserService from './UserService';
import AdminPaymentService from './adminPaymentService';
import AdminSupportService from './AdminSupportService';
import AdminListeningHistoryService from './adminListeningHistoryService';

// Helper to fetch all pages from a paginated endpoint
const fetchAllPages = async (fetcher, params = {}) => {
  let page = 0;
  const size = params.size || 100;
  let allItems = [];
  let totalPages = 1;

  while (page < totalPages) {
    const response = await fetcher({ ...params, page, size });
    const content = response.content || response;
    allItems = allItems.concat(content);
    totalPages = response.totalPages || 1;
    page++;
  }
  return allItems;
};

class DashboardService {
  // Main method: get all stats for the dashboard
  async getDashboardStats() {
    // 1. Quick single‑endpoint stats
    const [
      seriesPageResult,
      usersPageResult,
      paymentStatsResult,
      openTicketsResult,
      listeningStatsResult,
    ] = await Promise.allSettled([
      SeriesService.getAllSeries({ page: 0, size: 1 }),          // just to get totalElements
      UserService.listUsers({ page: 0, size: 1 }),              // just to get totalElements
      AdminPaymentService.getPaymentStatistics(),
      AdminSupportService.listTickets('OPEN'),
      AdminListeningHistoryService.getStatistics(),
    ]);

    // Extract values with fallbacks
    const totalSeries = seriesPageResult.status === 'fulfilled'
      ? seriesPageResult.value.totalElements || 0
      : null;

    const totalUsers = usersPageResult.status === 'fulfilled'
      ? usersPageResult.value.totalElements || 0
      : null;

    let totalRevenue = null;
    if (paymentStatsResult.status === 'fulfilled') {
      const cents = paymentStatsResult.value.totalCompletedRevenueCents;
      totalRevenue = cents != null ? cents / 100 : null;
    }

    const openTickets = openTicketsResult.status === 'fulfilled'
      ? (Array.isArray(openTicketsResult.value) ? openTicketsResult.value.length : 0)
      : null;

    // Listening statistics
    let totalPlays = null;
    let uniqueUsers = null;
    let totalMinutesListened = null;
    let avgProgress = null;
    if (listeningStatsResult.status === 'fulfilled') {
      const s = listeningStatsResult.value;
      totalPlays = s.totalEvents || 0;
      uniqueUsers = s.uniqueUsers || 0;
      totalMinutesListened = Math.round((s.totalSecondsListened || 0) / 60);
      avgProgress = Math.round(s.averageProgressIncomplete || 0);
    }

    // 2. Aggregated stats that need to fetch all series and episodes
    let totalEpisodes = null;
    let publishedEpisodes = null;

    try {
      // Fetch all series (with pagination)
      const allSeries = await fetchAllPages(SeriesService.getAllSeries, { size: 100 });

      // Sum episodeCount from series (fast, no extra calls)
      totalEpisodes = allSeries.reduce((sum, s) => sum + (s.episodeCount || 0), 0);

      // For published episodes we need episodes for each series
      let publishedCount = 0;

      // Process series in chunks to avoid too many concurrent requests
      const chunkSize = 5;
      for (let i = 0; i < allSeries.length; i += chunkSize) {
        const chunk = allSeries.slice(i, i + chunkSize);
        const episodesArrays = await Promise.all(
          chunk.map(async (series) => {
            try {
              return await fetchAllPages(
                (params) => EpisodeService.getEpisodesBySeries(series.id, params),
                { size: 100 }
              );
            } catch {
              return [];
            }
          })
        );

        for (const episodes of episodesArrays) {
          publishedCount += episodes.filter(ep => ep.isPublished).length;
        }
      }

      publishedEpisodes = publishedCount;
    } catch (error) {
      console.error('Failed to aggregate episodes:', error);
      // Keep them null – will show '—' in UI
    }

    return {
      totalSeries,
      totalEpisodes,
      publishedEpisodes,
      totalUsers,
      totalRevenue,
      openTickets,
      totalPlays,
      uniqueUsers,
      totalMinutesListened,
      avgProgress,
    };
  }

  async getRecentSeries(limit = 5) {
    try {
      const response = await SeriesService.getAllSeries({
        page: 0,
        size: limit,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      });
      return response.content || response;
    } catch {
      return null;
    }
  }

  async getTopEpisodes(limit = 10) {
    try {
      return await AdminListeningHistoryService.getTopEpisodes(limit);
    } catch {
      return null;
    }
  }
}

export default new DashboardService();