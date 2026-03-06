// pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  FiVideo,
  FiMusic,
  FiUsers,
  FiPlayCircle,
  FiDollarSign,
  FiHelpCircle,
} from 'react-icons/fi';
import DashboardService from '../services/DashboardService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSeries: null,
    totalEpisodes: null,
    publishedEpisodes: null,
    totalUsers: null,
    totalRevenue: null,
    openTickets: null,
    totalPlays: null,
    uniqueUsers: null,
    totalMinutesListened: null,
    avgProgress: null,
  });
  const [topEpisodes, setTopEpisodes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsData, topEpData] = await Promise.allSettled([
          DashboardService.getDashboardStats(),
          DashboardService.getTopEpisodes(5), // 👈 changed from 10 to 5
        ]);

        if (statsData.status === 'fulfilled') {
          setStats(statsData.value);
        } else {
          console.error('Stats failed', statsData.reason);
        }

        if (topEpData.status === 'fulfilled') {
          setTopEpisodes(topEpData.value);
        } else {
          setTopEpisodes(null);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data.');
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const formatValue = (value, formatter = (v) => v) => {
    return value != null ? formatter(value) : '—';
  };

  const formatCurrency = (value) => {
    if (value == null) return '—';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
  };

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
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Dashboard</h2>
        <p className="dashboard-subtitle">Real‑time overview of your platform.</p>
      </div>

      {/* Main stats grid */}
      <div className="stats-grid">
        {statCards.map((card, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-icon-container">
              <card.icon className="stat-icon" />
            </div>
            <div className="stat-content">
              <p className="stat-title">{card.title}</p>
              <h3 className="stat-value">
                {formatValue(card.value, card.formatter)}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Listening metrics */}
      <div className="metrics-section">
        <h3 className="section-title">Listening Activity</h3>
        <div className="metrics-grid">
          {listeningCards.map((card, idx) => (
            <div key={idx} className="metric-card">
              <p className="metric-label">{card.title}</p>
              <p className="metric-value">{formatValue(card.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Episodes */}
      {topEpisodes && topEpisodes.length > 0 && (
        <div className="top-list-card">
          <h4>Top 5 Episodes</h4>
          <table className="top-table">
            <thead>
              <tr>
                <th>Episode</th>
                <th>Listens</th>
              </tr>
            </thead>
            <tbody>
              {topEpisodes.map(ep => (
                <tr key={ep.id}>
                  <td>{ep.title}</td>
                  <td>{ep.listenCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;