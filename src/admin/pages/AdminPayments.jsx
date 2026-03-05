import React, { useState, useEffect } from 'react';
import AdminPaymentService from '../services/adminPaymentService';
import './AdminPurchases.css';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [size] = useState(20);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminPaymentService.getPayments({ page, size });
      console.log('Payments data:', data);
      if (data && data.content) {
        setPayments(data.content);
        setTotalPages(data.totalPages || 0);
      } else if (Array.isArray(data)) {
        setPayments(data);
        setTotalPages(1);
      } else {
        setPayments([]);
        setTotalPages(0);
      }
    } catch (err) {
      setError('Failed to load payments.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await AdminPaymentService.getPaymentStatistics();
      console.log('Payment statistics data:', data);
      setStatistics(data || {});
    } catch (err) {
      console.error('Failed to load payment statistics', err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStatistics();
  }, [page]);

  const handlePreviousPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) setPage(page + 1);
  };

  const formatDate = (dateTimeStr) => {
    return new Date(dateTimeStr).toLocaleString();
  };

  const formatCurrency = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  console.log('Rendering with payments:', payments);
  console.log('Rendering with statistics:', statistics);

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-purchases-container">
      <h2>Payments</h2>
      {statistics && (
        <div className="stats-cards">
          <div className="stat-card">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">{formatCurrency(statistics.totalCompletedRevenueCents || 0)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Unique Paying Users</span>
            <span className="stat-value">{statistics.distinctUsersWithCompletedPayments || 0}</span>
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

      {payments.length === 0 && !loading && (
        <div className="no-data">No payments found.</div>
      )}

      <table className="purchases-table">
        <thead>
          <tr>
            <th>Payment ID</th>
            <th>User Email</th>
            <th>Provider</th>
            <th>Order ID</th>
            <th>Capture ID</th>
            <th>Amount</th>
            <th>Currency</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(payment => (
            <tr key={payment.paymentId}>
              <td>{payment.paymentId}</td>
              <td>{payment.userEmail || payment.userId}</td>
              <td>{payment.provider}</td>
              <td>{payment.paypalOrderId || '-'}</td>
              <td>{payment.paypalCaptureId || '-'}</td>
              <td>{formatCurrency(payment.amountCents)}</td>
              <td>{payment.currency}</td>
              <td>{payment.status}</td>
              <td>{formatDate(payment.createdAt)}</td>
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

export default AdminPayments;