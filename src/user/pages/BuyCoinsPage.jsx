import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';
import {
  FaShoppingBag,
  FaHistory,
  FaPaypal,
  FaCreditCard,
  FaBitcoin,
  FaGoogle,
  FaCoins,
  FaHashtag,
  FaHeadset,
  FaTimes
} from 'react-icons/fa';
import PayPalService from '../services/PayPalService';
import SupportService from '../services/SupportService';
import CoinPackages from '../components/CoinPackages';
import Footer from '../components/common/Footer';
import '../styles/PayPalStyles.css';

const SupportModal = ({ transaction, onClose, onSubmit }) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!transaction) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Please describe your issue.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(transaction, message.trim());
      setSubmitting(false);
      onClose();
    } catch (err) {
       setSubmitting(false);
      alert(err?.response?.data?.message || err?.message || 'Failed to submit support request. Try again later.');
    }
  };

  return (
    <div className="user-modal-overlay" onClick={onClose}>
      <div className="user-support-modal" onClick={(e) => e.stopPropagation()}>
        <button className="user-modal-close" onClick={onClose}><FaTimes /></button>
        <h3>Request Support</h3>

        <div className="user-transaction-ref">
          <FaHashtag /> Transaction ID:&nbsp;
          <span className="user-tx-id">
            {transaction.coinPurchaseId || transaction.paymentId || transaction.txId || '—'}
          </span>
        </div>

        <div className="user-transaction-summary">
          {(transaction.coinsAmount != null) ? `${transaction.coinsAmount} coins • ` : ''}
          {transaction.amountCents != null ? `$${(transaction.amountCents / 100).toFixed(2)}` : '—'}
          {transaction.currency ? ` ${transaction.currency}` : ''}
          &nbsp;•&nbsp;{formatStatus(transaction.status)}
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="user-support-message">Describe your issue:</label>
          <textarea
            id="user-support-message"
            rows="5"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please provide details (what happened, when, any screenshots or order ids)..."
            required
          />
          <div className="user-modal-actions">
            <button type="button" className="user-cancel-btn" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="user-submit-btn" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const formatStatus = (status) => {
  const statusMap = {
    PENDING: { label: 'Pending', class: 'user-status-pending' },
    COMPLETED: { label: 'Completed', class: 'user-status-completed' },
    FAILED: { label: 'Failed', class: 'user-status-failed' },
    REFUNDED: { label: 'Refunded', class: 'user-status-refunded' },
  };
  const s = statusMap[status] || { label: status || 'Unknown', class: '' };
  return <span className={`user-status-badge ${s.class}`}>{s.label}</span>;
};

const BuyCoinsPage = () => {
  const [activeTab, setActiveTab] = useState('buy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('paypal');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await PayPalService.getUserCoinPurchaseHistory();
      const normalized = (Array.isArray(data) ? data : data || []).map(tx => ({
        coinPurchaseId: tx.coinPurchaseId || tx.coin_purchase_id || tx.coin_purchase_uuid,
        paymentId: tx.paymentId || tx.payment_id || tx.payment_uuid,
        coinsAmount: tx.coinsAmount != null ? tx.coinsAmount : tx.coins_amount,
        amountCents: tx.amountCents != null ? tx.amountCents : tx.amount_cents,
        currency: tx.currency || tx.currency_code || 'USD',
        status: tx.status || 'PENDING',
        purchasedAt: tx.purchasedAt || tx.purchased_at || tx.createdAt || tx.created_at
      }));
      setHistory(normalized);
    } catch (err) {
       setError('Failed to load purchase history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleBuy = async (selectedPackage) => {
    setLoading(true);
    setError(null);
    const idempotencyKey = uuidv4();

    try {
      const { approvalUrl, paypalOrderId } = await PayPalService.createCoinPurchase(
        selectedPackage.packageId,
        idempotencyKey
      );
       window.location.href = approvalUrl;
    } catch (err) {
      setError(err.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const formatPaymentId = (id) => {
    if (!id) return '—';
    const s = String(id);
    return s.length > 10 ? `${s.substring(0, 8)}...` : s;
  };

  const handleSupportClick = (transaction) => {
    setSelectedTransaction(transaction);
    setModalOpen(true);
  };

  const handleSupportSubmit = async (transaction, message) => {
    try {
      await SupportService.createTicket({ transaction, message });
      alert('Support request submitted. Our team will contact you soon.');
      await loadHistory();
    } catch (err) {
       throw err;
    }
  };

  return (
    <div className="user-buy-coins-page">
      <div className="user-tabs-header">
        <button
          className={`user-tab-btn ${activeTab === 'buy' ? 'active' : ''}`}
          onClick={() => setActiveTab('buy')}
        >
          <FaShoppingBag /> Buy Coins
        </button>
        <button
          className={`user-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FaHistory /> Transaction History
        </button>
      </div>

      <div className="user-tab-content">
        {activeTab === 'buy' && (
          <div className="user-buy-tab">
            <div className="user-payment-methods">
              <h3>Select Payment Method</h3>
              <div className="user-payment-methods-grid">
                {[
                  { id: 'paypal', name: 'PayPal', icon: <FaPaypal />, active: true },
                  { id: 'card', name: 'Credit Card', icon: <FaCreditCard />, active: false },
                  { id: 'crypto', name: 'Crypto', icon: <FaBitcoin />, active: false },
                  { id: 'googlepay', name: 'Google Pay', icon: <FaGoogle />, active: false },
                ].map(method => (
                  <button
                    key={method.id}
                    className={`user-payment-method-btn ${selectedPaymentMethod === method.id ? 'active' : ''} ${!method.active ? 'disabled' : ''}`}
                    onClick={() => method.active && setSelectedPaymentMethod(method.id)}
                    disabled={!method.active}
                    title={!method.active ? 'Coming soon' : ''}
                  >
                    <span className="user-payment-icon">{method.icon}</span>
                    <span className="user-payment-name">{method.name}</span>
                    {!method.active && <span className="user-coming-soon">Soon</span>}
                  </button>
                ))}
              </div>
            </div>

            <CoinPackages onBuy={handleBuy} />
            {loading && <div className="user-loading-indicator">Processing purchase...</div>}
            {error && <div className="user-error-message">{error}</div>}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="user-history-tab">
            <h2>Your Coin Purchase History</h2>

            {historyLoading ? (
              <div className="user-loading-indicator">Loading history...</div>
            ) : history.length === 0 ? (
              <p className="user-no-history">No transactions yet.</p>
            ) : (
              <div className="user-transactions-list">
                {history.map((tx) => (
                  <div key={tx.coinPurchaseId || tx.paymentId || tx.txId || Math.random()} className="user-transaction-item">
                    <div className="user-tx-icon"><FaCoins /></div>

                    <div className="user-tx-details">
                      <div className="user-tx-title">
                        {tx.coinsAmount != null ? `${tx.coinsAmount} Coins` : 'Coins'}
                      </div>
                      <div className="user-tx-meta">
                        {formatStatus(tx.status)} • {formatDate(tx.purchasedAt)}
                      </div>
                      <div className="user-tx-payment-id">
                        <FaHashtag className="user-payment-id-icon" />
                        Payment ID: {formatPaymentId(tx.paymentId)}
                      </div>
                    </div>

                    <div className="user-tx-amount">
                      {tx.amountCents != null ? `$${(tx.amountCents / 100).toFixed(2)}` : '—'} {tx.currency || ''}
                    </div>

                    <button
                      className="user-support-btn"
                      onClick={() => handleSupportClick(tx)}
                      title="Request support for this transaction"
                    >
                      <FaHeadset />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />

      {modalOpen && (
        <SupportModal
          transaction={selectedTransaction}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSupportSubmit}
        />
      )}
    </div>
  );
};

export default BuyCoinsPage;