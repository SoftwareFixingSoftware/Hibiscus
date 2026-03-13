import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminEpisodePurchaseService from '../services/adminEpisodePurchaseService';
import '../styles/admin-payments.css'; // unified CSS

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
      setStatistics(data || {});
    } catch (err) {
      console.error('Failed to load purchase statistics', err);
    }
  };

  const fetchSeriesAggregates = async () => {
    try {
      const data = await AdminEpisodePurchaseService.getSeriesAggregates();
      setSeriesAggregates(data || []);
    } catch (err) {
      console.error('Failed to load series aggregates', err);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchStatistics();
    fetchSeriesAggregates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handlePreviousPage = () => { if (page > 0) setPage(page - 1); };
  const handleNextPage = () => { if (page < totalPages - 1) setPage(page + 1); };
  const formatDate = (instantStr) => instantStr ? new Date(instantStr).toLocaleString() : '-';
  const formatCurrency = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

  if (error) return <div className="adm-error">{error}</div>;

  return (
    <div className="adm-purchases-container">
      <h2>Episode Purchases</h2>

      {statistics && (
        <div className="adm-stats-cards">
          <div className="adm-stat-card">
            <span className="adm-stat-label">Total Users Purchased</span>
            <span className="adm-stat-value">{statistics.totalUsersPurchased || 0}</span>
          </div>
          <div className="adm-stat-card">
            <span className="adm-stat-label">Total Purchases</span>
            <span className="adm-stat-value">{statistics.totalEpisodePurchases || 0}</span>
          </div>
          <div className="adm-stat-card">
            <span className="adm-stat-label">Total Coins Spent</span>
            <span className="adm-stat-value">{statistics.totalCoinsSpent || 0}</span>
          </div>
          <div className="adm-stat-card">
            <span className="adm-stat-label">Status Counts</span>
            <div className="adm-stat-sub">
              {Object.entries(statistics.countsByStatus || {}).map(([status, count]) => (
                <div key={status}>{status}: {count}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {seriesAggregates && seriesAggregates.length > 0 && (
        <div className="adm-series-stats">
          <h3>Series Aggregates</h3>
          <div className="adm-table-wrapper">
            <table className="adm-series-table" role="table" aria-label="Series aggregates">
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
                    <td data-label="Series ID">{series.seriesId}</td>
                    <td data-label="Title">{series.seriesTitle}</td>
                    <td data-label="Purchase Count">{series.purchaseCount}</td>
                    <td data-label="Total Coins Spent">{series.totalCoinsSpent}</td>
                    <td data-label="Total Revenue (cents)">{formatCurrency(series.totalRevenueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {purchases.length === 0 && !loading && <div className="adm-no-data">No purchases found.</div>}

      <div className="adm-table-wrapper" aria-live="polite">
        <table className="adm-purchases-table" role="table" aria-label="Episode purchases">
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
                <td data-label="Purchase ID">{purchase.purchaseId}</td>
                <td data-label="User Email">{purchase.userEmail || purchase.userId}</td>
                <td data-label="Series ID">
                  <Link
                    to={`/user/series/${purchase.seriesId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {purchase.seriesId}
                  </Link>
                </td>
                <td data-label="Episode ID">
                  <Link
                    to={`/user/series/${purchase.seriesId}?episode=${purchase.episodeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {purchase.episodeId}
                  </Link>
                </td>
                <td data-label="Payment ID">{purchase.paymentId || '-'}</td>
                <td data-label="Amount (cents)">{purchase.amountCents}</td>
                <td data-label="Currency">{purchase.currency}</td>
                <td data-label="Coins Spent">{purchase.coinsSpent}</td>
                <td
                  data-label="Paid with Coins"
                  className={purchase.paidWithCoins ? 'paid-with-coins-yes' : 'paid-with-coins-no'}
                >
                  {purchase.paidWithCoins ? 'Yes' : 'No'}
                </td>
                <td data-label="Status" data-status={purchase.status}>{purchase.status}</td>
                <td data-label="Purchased At">{formatDate(purchase.purchasedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <div className="adm-loading">Loading...</div>}

      <div className="adm-pagination-container" role="navigation" aria-label="Pagination">
        <button onClick={handlePreviousPage} disabled={page === 0} className="adm-pagination-nav">Previous</button>
        <span className="adm-pagination-info">Page {page + 1} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={page >= totalPages - 1} className="adm-pagination-nav">Next</button>
      </div>
    </div>
  );
};

export default AdminEpisodePurchases;