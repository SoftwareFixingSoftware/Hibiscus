import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminPaymentService from '../services/adminPaymentService';
import '../styles/admin-payments.css';

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

    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await AdminPaymentService.getPaymentStatistics();
      setStatistics(data || {});
    } catch (err) {
     }
  };

  useEffect(() => {
    fetchPayments();
    fetchStatistics();
  }, [page]);

  const handlePreviousPage = () => { if (page > 0) setPage(page - 1); };
  const handleNextPage = () => { if (page < totalPages - 1) setPage(page + 1); };
  const formatDate = (dateTimeStr) => new Date(dateTimeStr).toLocaleString();
  const formatCurrency = (cents) => `$${(cents / 100).toFixed(2)}`;

  if (error) return <div className="adm-error">{error}</div>;

  return (
    <div className="adm-purchases-container">
      <h2>Payments</h2>
      {statistics && (
        <div className="adm-stats-cards">
          <div className="adm-stat-card">
            <span className="adm-stat-label">Total Revenue</span>
            <span className="adm-stat-value">{formatCurrency(statistics.totalCompletedRevenueCents || 0)}</span>
          </div>
          <div className="adm-stat-card">
            <span className="adm-stat-label">Unique Paying Users</span>
            <span className="adm-stat-value">{statistics.distinctUsersWithCompletedPayments || 0}</span>
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

      {payments.length === 0 && !loading && <div className="adm-no-data">No payments found.</div>}

      <div className="adm-table-wrapper">
        <table className="adm-purchases-table">
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
                <td><Link to={`/admin/payments/${payment.paymentId}`}>{payment.paymentId}</Link></td>
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
      </div>

      {loading && <div className="adm-loading">Loading...</div>}
      <div className="adm-pagination-container">
        <button onClick={handlePreviousPage} disabled={page === 0} className="adm-pagination-nav">Previous</button>
        <span className="adm-pagination-info">Page {page + 1} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={page >= totalPages - 1} className="adm-pagination-nav">Next</button>
      </div>
    </div>
  );
};

export default AdminPayments;