import React, { useState, useEffect } from 'react';
import AdminFollowedSeriesService from '../services/adminFollowedSeriesService';
import './AdminAnalytics.css';

const AdminFollowedSeries = () => {
  const [follows, setFollows] = useState([]);
  const [stats, setStats] = useState([]);
  const [topSeries, setTopSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [size] = useState(20);

  const fetchFollows = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminFollowedSeriesService.getFollowedSeries({ page, size });
      if (data && data.content) {
        setFollows(data.content);
        setTotalPages(data.totalPages || 0);
      } else {
        setFollows([]);
        setTotalPages(0);
      }
    } catch (err) {
      setError('Failed to load followed series.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await AdminFollowedSeriesService.getFollowerStatistics();
      setStats(data || []);
    } catch (err) {
      console.error('Failed to load follower statistics', err);
    }
  };

  const fetchTopSeries = async () => {
    try {
      const data = await AdminFollowedSeriesService.getTopFollowedSeries(10);
      setTopSeries(data || []);
    } catch (err) {
      console.error('Failed to load top followed series', err);
    }
  };

  useEffect(() => {
    fetchFollows();
    fetchStats();
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

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="analytics-section">
      <h3>Followed Series</h3>

      {stats.length > 0 && (
        <div className="stats-cards">
          <div className="stat-card">
            <span className="stat-label">Total Follows</span>
            <span className="stat-value">{stats.length}</span>
          </div>
          {/* Add more stats if available */}
        </div>
      )}

      {topSeries.length > 0 && (
        <div className="top-list">
          <h4>Top 10 Followed Series</h4>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Series Title</th>
                <th>Follower Count</th>
              </tr>
            </thead>
            <tbody>
              {topSeries.map(series => (
                <tr key={series.seriesId}>
                  <td>{series.seriesTitle}</td>
                  <td>{series.followerCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {follows.length === 0 && !loading ? (
        <div className="no-data">No follows found.</div>
      ) : (
        <table className="analytics-table">
          <thead>
            <tr>
              <th>User Email</th>
              <th>Series</th>
              <th>Notifications</th>
              <th>Followed At</th>
            </tr>
          </thead>
          <tbody>
            {follows.map(follow => (
              <tr key={follow.followId}>
                <td>{follow.userEmail || follow.userId}</td>
                <td>{follow.seriesTitle || follow.seriesId}</td>
                <td>{follow.notificationsEnabled ? 'Yes' : 'No'}</td>
                <td>{formatDate(follow.followedAt)}</td>
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

export default AdminFollowedSeries;