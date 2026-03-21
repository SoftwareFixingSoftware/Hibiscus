import React, { useState, useEffect } from 'react';
import AdminListeningHistoryService from '../services/adminListeningHistoryService';

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
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await AdminListeningHistoryService.getStatistics();
      setStats(data || {});
    } catch (err) {}
  };

  const fetchTopEpisodes = async () => {
    try {
      const data = await AdminListeningHistoryService.getTopEpisodes(10);
      setTopEpisodes(data || []);
    } catch (err) {}
  };

  const fetchTopSeries = async () => {
    try {
      const data = await AdminListeningHistoryService.getTopSeries(10);
      setTopSeries(data || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchHistory();
    fetchStats();
    fetchTopEpisodes();
    fetchTopSeries();
  }, [page]);

  const handlePreviousPage = () => { if (page > 0) setPage(page - 1); };
  const handleNextPage = () => { if (page < totalPages - 1) setPage(page + 1); };
  const formatDate = (instantStr) => new Date(instantStr).toLocaleString();
  const formatSeconds = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  if (error) return <div className="adm-error">{error}</div>;

  return (
    <div>
      <h3>Listening History</h3>

      {stats && (
        <div className="adm-analytics-stats-grid">
          <div className="adm-analytics-stat-card">
            <span className="adm-analytics-stat-label">Total Events</span>
            <span className="adm-analytics-stat-value">{stats.totalEvents || 0}</span>
          </div>
          <div className="adm-analytics-stat-card">
            <span className="adm-analytics-stat-label">Unique Users</span>
            <span className="adm-analytics-stat-value">{stats.uniqueUsers || 0}</span>
          </div>
          <div className="adm-analytics-stat-card">
            <span className="adm-analytics-stat-label">Total Minutes Listened</span>
            <span className="adm-analytics-stat-value">{Math.round((stats.totalSecondsListened || 0) / 60)}</span>
          </div>
          <div className="adm-analytics-stat-card">
            <span className="adm-analytics-stat-label">Avg Progress (Incomplete)</span>
            <span className="adm-analytics-stat-value">{Math.round(stats.averageProgressIncomplete || 0)}s</span>
          </div>
        </div>
      )}

      <div className="adm-analytics-top-lists">
        <div className="adm-analytics-top-list">
          <h4>Top 10 Episodes</h4>
          <table className="adm-analytics-table">
            <thead><tr><th>Episode</th><th>Listen Count</th></tr></thead>
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
        <div className="adm-analytics-top-list">
          <h4>Top 10 Series</h4>
          <table className="adm-analytics-table">
            <thead><tr><th>Series</th><th>Listen Count</th></tr></thead>
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
        <div className="adm-no-data">No history entries found.</div>
      ) : (
        <div className="adm-table-wrapper">
          <table className="adm-analytics-table">
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
        </div>
      )}

      {loading && <div className="adm-loading">Loading...</div>}
      <div className="adm-pagination-container">
        <button onClick={handlePreviousPage} disabled={page === 0} className="adm-pagination-nav">Previous</button>
        <span className="adm-pagination-info">Page {page + 1} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={page >= totalPages - 1} className="adm-pagination-nav">Next</button>
      </div>
    </div>
  );
};

export default AdminListeningHistory;