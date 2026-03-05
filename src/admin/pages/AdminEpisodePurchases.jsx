import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminEpisodePurchaseService from '../services/adminEpisodePurchaseService';
import './AdminPurchases.css';

const AdminEpisodePurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [seriesAggregates, setSeriesAggregates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [size] = useState(20);

  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminEpisodePurchaseService.getPurchases({ page, size });
      console.log('Purchases data:', data);
      if (data && data.content) {
        setPurchases(data.content);
        setTotalPages(data.totalPages || 0);
      } else if (Array.isArray(data)) {
        setPurchases(data);
        setTotalPages(1);
      } else {
        setPurchases([]);
        setTotalPages(0);
      }
    } catch (err) {
      setError('Failed to load episode purchases.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await AdminEpisodePurchaseService.getPurchaseStatistics();
      console.log('Statistics data:', data);
      setStatistics(data || {});
    } catch (err) {
      console.error('Failed to load purchase statistics', err);
    }
  };

  const fetchSeriesAggregates = async () => {
    try {
      const data = await AdminEpisodePurchaseService.getSeriesAggregates();
      console.log('Series aggregates data:', data);
      setSeriesAggregates(data || []);
    } catch (err) {
      console.error('Failed to load series aggregates', err);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchStatistics();
    fetchSeriesAggregates();
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

  const formatCurrency = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  console.log('Rendering with purchases:', purchases);
  console.log('Rendering with statistics:', statistics);
  console.log('Rendering with seriesAggregates:', seriesAggregates);

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-purchases-container">
      <h2>Episode Purchases</h2>
      {statistics && (
        <div className="stats-cards">
          <div className="stat-card">
            <span className="stat-label">Total Users Purchased</span>
            <span className="stat-value">{statistics.totalUsersPurchased || 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Purchases</span>
            <span className="stat-value">{statistics.totalEpisodePurchases || 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Coins Spent</span>
            <span className="stat-value">{statistics.totalCoinsSpent || 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Status Counts</span>
            <div className="stat-sub">
              {Object.entries(statistics.countsByStatus || {}).map(([status, count]) => (
                <div key={status}>{status}: {count}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {seriesAggregates && seriesAggregates.length > 0 && (
        <div className="series-stats">
          <h3>Series Aggregates</h3>
          <table className="series-table">
            <thead>
              <tr>
                <th>Series ID</th>
                <th>Title</th>
                <th>Purchase Count</th>
                <th>Total Coins Spent</th>
                <th>Total Revenue (cents)</th>
              </tr>
            </thead>
            <tbody>
              {seriesAggregates.map(series => (
                <tr key={series.seriesId}>
                  <td>{series.seriesId}</td>
                  <td>{series.seriesTitle}</td>
                  <td>{series.purchaseCount}</td>
                  <td>{series.totalCoinsSpent}</td>
                  <td>{formatCurrency(series.totalRevenueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {purchases.length === 0 && !loading && (
        <div className="no-data">No purchases found.</div>
      )}

      <table className="purchases-table">
        <thead>
          <tr>
            <th>Purchase ID</th>
            <th>User Email</th>
            <th>Series ID</th>
            <th>Episode ID</th>
            <th>Payment ID</th>
            <th>Amount (cents)</th>
            <th>Currency</th>
            <th>Coins Spent</th>
            <th>Paid with Coins</th>
            <th>Status</th>
            <th>Purchased At</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map(purchase => (
            <tr key={purchase.purchaseId}>
              <td>{purchase.purchaseId}</td>
              <td>{purchase.userEmail || purchase.userId}</td>
              <td>
                <Link to={`/user/series/${purchase.seriesId}`} target="_blank" rel="noopener noreferrer">
                  {purchase.seriesId}
                </Link>
              </td>
              <td>
                <Link to={`/user/series/${purchase.seriesId}?episode=${purchase.episodeId}`} target="_blank" rel="noopener noreferrer">
                  {purchase.episodeId}
                </Link>
              </td>
              <td>{purchase.paymentId || '-'}</td>
              <td>{purchase.amountCents}</td>
              <td>{purchase.currency}</td>
              <td>{purchase.coinsSpent}</td>
              <td>{purchase.paidWithCoins ? 'Yes' : 'No'}</td>
              <td>{purchase.status}</td>
              <td>{formatDate(purchase.purchasedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <div className="loading">Loading...</div>}
      <div className="pagination">
        <button onClick={handlePreviousPage} disabled={page === 0}>Previous</button>
        <span>Page {page + 1} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={page >= totalPages - 1}>Next</button>
      </div>
    </div>
  );
};

export default AdminEpisodePurchases;