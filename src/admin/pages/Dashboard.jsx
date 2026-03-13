import React, { useState, useEffect } from 'react';
import { FiVideo, FiMusic, FiUsers, FiPlayCircle, FiDollarSign, FiHelpCircle } from 'react-icons/fi';
import DashboardService from '../services/DashboardService';
import '../styles/admin-dashboard.css'; // will use global classes


const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSeries: null, totalEpisodes: null, publishedEpisodes: null,
    totalUsers: null, totalRevenue: null, openTickets: null,
    totalPlays: null, uniqueUsers: null, totalMinutesListened: null, avgProgress: null
  });
  const [topEpisodes, setTopEpisodes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [statsData, topEpData] = await Promise.allSettled([
          DashboardService.getDashboardStats(),
          DashboardService.getTopEpisodes(5)
        ]);
        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (topEpData.status === 'fulfilled') setTopEpisodes(topEpData.value);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="adm-loading-container"><div className="adm-loading-spinner"></div><p>Loading dashboard...</p></div>;
  if (error) return <div className="adm-error-container"><p className="adm-error-message">{error}</p><button className="adm-btn-primary" onClick={() => window.location.reload()}>Retry</button></div>;

  const formatValue = (v, f = v => v) => v != null ? f(v) : '—';
  const formatCurrency = (v) => v != null ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(v) : '—';

  const statCards = [
    { title: 'Total Series', value: stats.totalSeries, icon: FiVideo },
    { title: 'Total Episodes', value: stats.totalEpisodes, icon: FiMusic },
    { title: 'Published Episodes', value: stats.publishedEpisodes, icon: FiPlayCircle },
    { title: 'Total Users', value: stats.totalUsers, icon: FiUsers },
    { title: 'Total Revenue', value: stats.totalRevenue, icon: FiDollarSign, formatter: formatCurrency },
    { title: 'Open Tickets', value: stats.openTickets, icon: FiHelpCircle },
  ];

  const listeningCards = [
    { title: 'Total Plays', value: stats.totalPlays },
    { title: 'Unique Users', value: stats.uniqueUsers },
    { title: 'Minutes Listened', value: stats.totalMinutesListened },
    { title: 'Avg Progress (s)', value: stats.avgProgress },
  ];

  return (
    <div className="adm-dashboard">
      <div className="adm-dashboard-header">
        <h2 className="adm-dashboard-title">Dashboard</h2>
        <p className="adm-dashboard-subtitle">Real‑time overview of your platform.</p>
      </div>

      <div className="adm-stats-grid">
        {statCards.map((card, idx) => (
          <div key={idx} className="adm-stat-card">
            <div className="adm-stat-icon-container"><card.icon className="adm-stat-icon" /></div>
            <div className="adm-stat-content">
              <p className="adm-stat-title">{card.title}</p>
              <h3 className="adm-stat-value">{formatValue(card.value, card.formatter)}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="adm-metrics-section">
        <h3 className="adm-section-title">Listening Activity</h3>
        <div className="adm-metrics-grid">
          {listeningCards.map((card, idx) => (
            <div key={idx} className="adm-metric-card">
              <p className="adm-metric-label">{card.title}</p>
              <p className="adm-metric-value">{formatValue(card.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {topEpisodes && topEpisodes.length > 0 && (
        <div className="adm-top-list-card">
          <h4>Top 5 Episodes</h4>
          <table className="adm-top-table">
            <thead><tr><th>Episode</th><th>Listens</th></tr></thead>
            <tbody>
              {topEpisodes.map(ep => (
                <tr key={ep.id}><td>{ep.title}</td><td>{ep.listenCount}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;