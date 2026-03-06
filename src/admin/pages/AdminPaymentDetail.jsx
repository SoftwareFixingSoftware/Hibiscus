import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminPaymentService from '../services/adminPaymentService';
import './AdminPurchases.css';

const AdminPaymentDetail = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayment = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await AdminPaymentService.getPayment(paymentId);
        setPayment(data);
      } catch (err) {
        console.error('Failed to load payment', err);
        setError('Failed to load payment details.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayment();
  }, [paymentId]);

  const formatDate = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    return new Date(dateTimeStr).toLocaleString();
  };

  const formatCurrency = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) return <div className="loading">Loading payment details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!payment) return <div className="error">Payment not found.</div>;

  return (
    <div className="admin-payment-detail">
      <h2>Payment Details</h2>
      <button onClick={() => navigate(-1)} className="back-button">← Back</button>
      <div className="payment-detail-card">
        <div className="detail-row">
          <span className="detail-label">Payment ID:</span>
          <span className="detail-value">{payment.paymentId}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">User:</span>
          <span className="detail-value">
            {payment.userEmail ? (
              <Link to={`/admin/users/${payment.userId}`}>{payment.userEmail}</Link>
            ) : (
              payment.userId
            )}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Provider:</span>
          <span className="detail-value">{payment.provider}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">PayPal Order ID:</span>
          <span className="detail-value">{payment.paypalOrderId || '-'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">PayPal Capture ID:</span>
          <span className="detail-value">{payment.paypalCaptureId || '-'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Amount:</span>
          <span className="detail-value">{formatCurrency(payment.amountCents)} {payment.currency}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className="detail-value">{payment.status}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Created At:</span>
          <span className="detail-value">{formatDate(payment.createdAt)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Updated At:</span>
          <span className="detail-value">{formatDate(payment.updatedAt)}</span>
        </div>
        {payment.completedAt && (
          <div className="detail-row">
            <span className="detail-label">Completed At:</span>
            <span className="detail-value">{formatDate(payment.completedAt)}</span>
          </div>
        )}
        {payment.metadata && (
          <div className="detail-row">
            <span className="detail-label">Metadata:</span>
            <pre className="detail-value metadata">{JSON.stringify(payment.metadata, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentDetail;