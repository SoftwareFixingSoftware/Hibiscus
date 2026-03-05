import React, { useState, useEffect } from 'react';
import AdminListeningHistoryService from '../services/adminListeningHistoryService';
import './AdminAnalytics.css';

const AdminListeningHistory = () => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [topEpisodes, setTopEpisodes] = useState([]);
  const [topSeries, setTopSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [size] = useState(20);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminListeningHistoryService.getHistory({ page, size });
      if (data && data.content) {
        setHistory(data.content);
        setTotalPages(data.totalPages || 0);
      } else {
        setHistory([]);
        setTotalPages(0);
      }
    } catch (err) {
      setError('Failed to load listening history.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await AdminListeningHistoryService.getStatistics();
      setStats(data || {});
    } catch (err) {
      console.error('Failed to load listening statistics', err);
    }
  };

  const fetchTopEpisodes = async () => {
    try {
      const data = await AdminListeningHistoryService.getTopEpisodes(10);
      setTopEpisodes(data || []);
    } catch (err) {
      console.error('Failed to load top episodes', err);
    }
  };

  const fetchTopSeries = async () => {
    try {
      const data = await AdminListeningHistoryService.getTopSeries(10);
      setTopSeries(data || []);
    } catch (err) {
      console.error('Failed to load top series', err);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchStats();
    fetchTopEpisodes();
    fetchTopSeries();
  }, [page]);

  const handlePreviousPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) setPage(page + 1);
  };

  const formatDate = (instantStr) => {
    return new Date(instantStr).toLocaleString();
  };

  const formatSeconds = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="analytics-section">
      <h3>Listening History</h3>

      {stats && (
        <div className="stats-cards">
          <div className="stat-card">
            <span className="stat-label">Total Events</span>
            <span className="stat-value">{stats.totalEvents || 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Unique Users</span>
            <span className="stat-value">{stats.uniqueUsers || 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Minutes Listened</span>
            <span className="stat-value">{Math.round((stats.totalSecondsListened || 0) / 60)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Avg Progress (Incomplete)</span>
            <span className="stat-value">{Math.round(stats.averageProgressIncomplete || 0)}s</span>
          </div>
        </div>
      )}

      <div className="top-lists">
        <div className="top-list">
          <h4>Top 10 Episodes</h4>
          <table className="analytics-table">
            <thead>
              <tr><th>Episode</th><th>Listen Count</th></tr>
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

        <div className="top-list">
          <h4>Top 10 Series</h4>
          <table className="analytics-table">
            <thead>
              <tr><th>Series</th><th>Listen Count</th></tr>
            </thead>
            <tbody>
              {topSeries.map(s => (
                <tr key={s.id}>
                  <td>{s.title}</td>
                  <td>{s.listenCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {history.length === 0 && !loading ? (
        <div className="no-data">No history entries found.</div>
      ) : (
        <table className="analytics-table">
          <thead>
            <tr>
              <th>User Email</th>
              <th>Series</th>
              <th>Episode</th>
              <th>Progress</th>
              <th>Completed</th>
              <th>Last Listened</th>
            </tr>
          </thead>
          <tbody>
            {history.map(entry => (
              <tr key={entry.historyId}>
                <td>{entry.userEmail || entry.userId}</td>
                <td>{entry.seriesTitle || entry.seriesId}</td>
                <td>{entry.episodeTitle || entry.episodeId}</td>
                <td>{formatSeconds(entry.progressSeconds)}</td>
                <td>{entry.completed ? 'Yes' : 'No'}</td>
                <td>{formatDate(entry.lastListenedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {loading && <div className="loading">Loading...</div>}
      <div className="pagination">
        <button onClick={handlePreviousPage} disabled={page === 0}>Previous</button>
        <span>Page {page + 1} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={page >= totalPages - 1}>Next</button>
      </div>
    </div>
  );
};

export default AdminListeningHistory;