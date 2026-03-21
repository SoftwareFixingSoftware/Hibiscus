import React, { useState, useEffect } from 'react';
import AdminFollowedSeriesService from '../services/adminFollowedSeriesService';

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
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await AdminFollowedSeriesService.getFollowerStatistics();
      setStats(data || []);
    } catch (err) {}
  };

  const fetchTopSeries = async () => {
    try {
      const data = await AdminFollowedSeriesService.getTopFollowedSeries(10);
      setTopSeries(data || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchFollows();
    fetchStats();
    fetchTopSeries();
  }, [page]);

  const handlePreviousPage = () => { if (page > 0) setPage(page - 1); };
  const handleNextPage = () => { if (page < totalPages - 1) setPage(page + 1); };
  const formatDate = (instantStr) => new Date(instantStr).toLocaleString();

  if (error) return <div className="adm-error">{error}</div>;

  return (
    <div>
      <h3>Followed Series</h3>

      {stats.length > 0 && (
        <div className="adm-analytics-stats-grid">
          <div className="adm-analytics-stat-card">
            <span className="adm-analytics-stat-label">Total Follows</span>
            <span className="adm-analytics-stat-value">{stats.length}</span>
          </div>
        </div>
      )}

      {topSeries.length > 0 && (
        <div className="adm-analytics-top-list">
          <h4>Top 10 Followed Series</h4>
          <table className="adm-analytics-table">
            <thead>
              <tr><th>Series Title</th><th>Follower Count</th></tr>
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
        <div className="adm-no-data">No follows found.</div>
      ) : (
        <div className="adm-table-wrapper">
          <table className="adm-analytics-table">
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

export default AdminFollowedSeries;