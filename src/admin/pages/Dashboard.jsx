import React, { useState, useEffect } from 'react';
import { 
  FiVideo, 
  FiMusic, 
  FiUsers, 
  FiPlayCircle,
  FiTrendingUp,
  FiDownload,
  FiEye,
  FiBarChart2
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardService from '../services/DashboardService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSeries: 0,
    totalEpisodes: 0,
    publishedEpisodes: 0,
    totalUsers: 0,
    totalPlays: 0,
    totalDownloads: 0
  });

  const [recentSeries, setRecentSeries] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalPlays: 0,
    totalDownloads: 0,
    avgListenTime: '00:00',
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [statsData, seriesData, performanceData, metricsData] = await Promise.allSettled([
        DashboardService.getDashboardStats(),
        DashboardService.getRecentSeries(5),
        DashboardService.getContentPerformance('6months'),
        DashboardService.getMetrics()
      ]);

      // Handle stats
      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }

      // Handle recent series
      if (seriesData.status === 'fulfilled') {
        setRecentSeries(seriesData.value);
      }

      // Handle chart data
      if (performanceData.status === 'fulfilled') {
        setChartData(performanceData.value);
      }

      // Handle metrics
      if (metricsData.status === 'fulfilled') {
        setMetrics(metricsData.value);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data if API fails
      setFallbackData();
      setLoading(false);
    }
  };

  const setFallbackData = () => {
    setStats({
      totalSeries: 0,
      totalEpisodes: 0,
      publishedEpisodes: 0,
      totalUsers: 0,
      totalPlays: 0,
      totalDownloads: 0
    });

    setRecentSeries([]);
    
    setChartData([
      { month: 'Jan', episodes: 45, listens: 1250 },
      { month: 'Feb', episodes: 52, listens: 1420 },
      { month: 'Mar', episodes: 48, listens: 1380 },
      { month: 'Apr', episodes: 60, listens: 1650 },
      { month: 'May', episodes: 55, listens: 1580 },
      { month: 'Jun', episodes: 65, listens: 1820 }
    ]);

    setMetrics({
      totalPlays: 12500,
      totalDownloads: 8900,
      avgListenTime: '24:36',
      completionRate: 78
    });
  };

  const statCards = [
    {
      title: 'Total Series',
      value: stats.totalSeries,
      icon: FiVideo,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Episodes',
      value: stats.totalEpisodes,
      icon: FiMusic,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Published',
      value: stats.publishedEpisodes,
      icon: FiPlayCircle,
      color: 'bg-purple-500',
      change: '+15%'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: FiUsers,
      color: 'bg-yellow-500',
      change: '+5%'
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Dashboard Overview</h2>
        <p className="dashboard-subtitle">Welcome back! Here's what's happening with your content.</p>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon-container">
              <stat.icon className="stat-icon" />
            </div>
            <div className="stat-content">
              <p className="stat-title">{stat.title}</p>
              <h3 className="stat-value">{stat.value.toLocaleString()}</h3>
              <div className="stat-change">
                <FiTrendingUp className="trend-icon" />
                <span className="change-text">{stat.change}</span>
                <span className="change-period">from last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Content Performance</h3>
            <p className="card-subtitle">Last 6 months</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="episodes" fill="#8B5CF6" name="Episodes" radius={[4, 4, 0, 0]} />
                <Bar dataKey="listens" fill="#10B981" name="Listens" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="recent-series-card">
          <div className="card-header">
            <h3 className="card-title">Recent Series</h3>
            <a href="/admin/series" className="view-all-link">View All</a>
          </div>
          <div className="series-list">
            {recentSeries.map((series) => (
              <div key={series.id} className="series-item">
                <div className="series-info">
                  <h4 className="series-name">{series.title}</h4>
                  <p className="series-meta">
                    {series.episodeCount} episodes • {series.isPublished ? 'Published' : 'Draft'}
                  </p>
                </div>
                <div className="series-stats">
                  <div className="stat">
                    <FiEye className="stat-icon" />
                    <span>{series.viewCount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="stat">
                    <FiDownload className="stat-icon" />
                    <span>{series.downloadCount?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-actions-card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="actions-list">
            <a href="/admin/series/create" className="action-btn primary">
              <FiVideo />
              <span>Create New Series</span>
            </a>
            <a href="/admin/episodes/create" className="action-btn secondary">
              <FiMusic />
              <span>Add Episode</span>
            </a>
            <a href="/admin/users" className="action-btn tertiary">
              <FiUsers />
              <span>Manage Users</span>
            </a>
          </div>
        </div>

        <div className="metrics-card">
          <div className="card-header">
            <h3 className="card-title">Performance Metrics</h3>
          </div>
          <div className="metrics-list">
            <div className="metric-item">
              <div className="metric-label">Total Plays</div>
              <div className="metric-value">{metrics.totalPlays.toLocaleString()}</div>
              <div className="metric-change positive">+24%</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Total Downloads</div>
              <div className="metric-value">{metrics.totalDownloads.toLocaleString()}</div>
              <div className="metric-change positive">+18%</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Avg. Listen Time</div>
              <div className="metric-value">{metrics.avgListenTime}</div>
              <div className="metric-change positive">+12%</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Completion Rate</div>
              <div className="metric-value">{metrics.completionRate}%</div>
              <div className="metric-change negative">-3%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;