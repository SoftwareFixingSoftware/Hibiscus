import React, { useState, useEffect } from 'react';
import AdminSeriesReviewService from '../services/adminSeriesReviewService';
 

const AdminSeriesReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [size] = useState(20);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminSeriesReviewService.getReviews({ page, size });
      if (data && data.content) {
        setReviews(data.content);
        setTotalPages(data.totalPages || 0);
      } else {
        setReviews([]);
        setTotalPages(0);
      }
    } catch (err) {
      setError('Failed to load reviews.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await AdminSeriesReviewService.getReviewStatistics();
      setStats(data || {});
    } catch (err) {
      console.error('Failed to load review statistics', err);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [page]);

  const handlePreviousPage = () => { if (page > 0) setPage(page - 1); };
  const handleNextPage = () => { if (page < totalPages - 1) setPage(page + 1); };
  const formatDate = (instantStr) => new Date(instantStr).toLocaleString();

  if (error) return <div className="adm-error">{error}</div>;

  return (
    <div className="adm-analytics-section">
      <h3>Series Reviews</h3>

      {stats && (
        <div className="adm-stats-cards">
          <div className="adm-stat-card">
            <span className="adm-stat-label">Total Reviews</span>
            <span className="adm-stat-value">{stats.totalReviews || 0}</span>
          </div>
          <div className="adm-stat-card">
            <span className="adm-stat-label">Overall Avg Rating</span>
            <span className="adm-stat-value">{(stats.overallAverageRating || 0).toFixed(2)}</span>
          </div>
        </div>
      )}

      {stats?.seriesStatistics && stats.seriesStatistics.length > 0 && (
        <div className="adm-series-stats">
          <h4>Per-Series Statistics</h4>
          <table className="adm-analytics-table">
            <thead>
              <tr>
                <th>Series</th>
                <th>Total Reviews</th>
                <th>Avg Rating</th>
                <th>Rating Distribution</th>
              </tr>
            </thead>
            <tbody>
              {stats.seriesStatistics.slice(0, 5).map(series => (
                <tr key={series.seriesId}>
                  <td>{series.seriesTitle}</td>
                  <td>{series.totalReviews}</td>
                  <td>{series.averageRating.toFixed(2)}</td>
                  <td>
                    {Object.entries(series.ratingDistribution || {}).map(([rating, count]) => (
                      <span key={rating}>{rating}:{count} </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reviews.length === 0 && !loading ? (
        <div className="adm-no-data">No reviews found.</div>
      ) : (
        <table className="adm-analytics-table">
          <thead>
            <tr>
              <th>User Email</th>
              <th>Series</th>
              <th>Rating</th>
              <th>Review Text</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(review => (
              <tr key={review.reviewId}>
                <td>{review.userEmail || review.userId}</td>
                <td>{review.seriesTitle || review.seriesId}</td>
                <td>{review.rating}</td>
                <td>{review.reviewText ? review.reviewText.substring(0, 50) + '...' : '-'}</td>
                <td>{formatDate(review.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

export default AdminSeriesReviews;