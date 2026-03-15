import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminPaymentService from '../services/adminPaymentService';
import '../styles/admin-payments.css';

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
        setError('Failed to load payment details.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayment();
  }, [paymentId]);

  const formatDate = (dateTimeStr) => (dateTimeStr ? new Date(dateTimeStr).toLocaleString() : '-');
  const formatCurrency = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

  if (loading) return <div className="adm-loading">Loading payment details...</div>;
  if (error) return <div className="adm-error">{error}</div>;
  if (!payment) return <div className="adm-error">Payment not found.</div>;

  return (
    <div className="adm-purchases-container">
      <h2>Payment Details</h2>
      <button onClick={() => navigate(-1)} className="adm-back-button">← Back</button>
      <div className="adm-payment-detail-card">
        <div className="adm-detail-row">
          <span className="adm-detail-label">Payment ID:</span>
          <span className="adm-detail-value">{payment.paymentId}</span>
        </div>
        <div className="adm-detail-row">
          <span className="adm-detail-label">User:</span>
          <span className="adm-detail-value">
            {payment.userEmail ? <Link to={`/admin/users/${payment.userId}`}>{payment.userEmail}</Link> : payment.userId}
          </span>
        </div>
        <div className="adm-detail-row">
          <span className="adm-detail-label">Provider:</span>
          <span className="adm-detail-value">{payment.provider}</span>
        </div>
        <div className="adm-detail-row">
          <span className="adm-detail-label">PayPal Order ID:</span>
          <span className="adm-detail-value">{payment.paypalOrderId || '-'}</span>
        </div>
        <div className="adm-detail-row">
          <span className="adm-detail-label">PayPal Capture ID:</span>
          <span className="adm-detail-value">{payment.paypalCaptureId || '-'}</span>
        </div>
        <div className="adm-detail-row">
          <span className="adm-detail-label">Amount:</span>
          <span className="adm-detail-value">{formatCurrency(payment.amountCents)} {payment.currency}</span>
        </div>
        <div className="adm-detail-row">
          <span className="adm-detail-label">Status:</span>
          <span className="adm-detail-value">{payment.status}</span>
        </div>
        <div className="adm-detail-row">
          <span className="adm-detail-label">Created At:</span>
          <span className="adm-detail-value">{formatDate(payment.createdAt)}</span>
        </div>
        <div className="adm-detail-row">
          <span className="adm-detail-label">Updated At:</span>
          <span className="adm-detail-value">{formatDate(payment.updatedAt)}</span>
        </div>
        {payment.completedAt && (
          <div className="adm-detail-row">
            <span className="adm-detail-label">Completed At:</span>
            <span className="adm-detail-value">{formatDate(payment.completedAt)}</span>
          </div>
        )}
        {payment.metadata && (
          <div className="adm-detail-row">
            <span className="adm-detail-label">Metadata:</span>
            <pre className="adm-detail-value adm-metadata">{JSON.stringify(payment.metadata, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentDetail;