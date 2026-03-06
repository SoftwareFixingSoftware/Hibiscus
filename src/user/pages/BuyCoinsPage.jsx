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

/**
 * Support Modal Component (integrated with backend via onSubmit prop)
 */
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
      console.error('Support request failed', err);
      setSubmitting(false);
      alert(err?.response?.data?.message || err?.message || 'Failed to submit support request. Try again later.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="support-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><FaTimes /></button>
        <h3>Request Support</h3>

        <div className="transaction-ref">
          <FaHashtag /> Transaction ID:&nbsp;
          <span className="tx-id">
            {transaction.coinPurchaseId || transaction.paymentId || transaction.txId || '—'}
          </span>
        </div>

        <div className="transaction-summary">
          {(transaction.coinsAmount != null) ? `${transaction.coinsAmount} coins • ` : ''}
          {transaction.amountCents != null ? `$${(transaction.amountCents / 100).toFixed(2)}` : '—'}
          {transaction.currency ? ` ${transaction.currency}` : ''}
          &nbsp;•&nbsp;{formatStatus(transaction.status)}
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="support-message">Describe your issue:</label>
          <textarea
            id="support-message"
            rows="5"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please provide details (what happened, when, any screenshots or order ids)..."
            required
          />
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper for status rendering
const formatStatus = (status) => {
  const statusMap = {
    PENDING: { label: 'Pending', class: 'status-pending' },
    COMPLETED: { label: 'Completed', class: 'status-completed' },
    FAILED: { label: 'Failed', class: 'status-failed' },
    REFUNDED: { label: 'Refunded', class: 'status-refunded' },
  };
  const s = statusMap[status] || { label: status || 'Unknown', class: '' };
  return <span className={`status-badge ${s.class}`}>{s.label}</span>;
};

const BuyCoinsPage = () => {
  const [activeTab, setActiveTab] = useState('buy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('paypal');

  // Support modal state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await PayPalService.getUserCoinPurchaseHistory();
      // normalize expected fields if needed
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
      console.error('Failed to load purchase history', err);
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
      console.log('PayPal order created:', paypalOrderId);
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

  // wired to backend
  const handleSupportSubmit = async (transaction, message) => {
    try {
      await SupportService.createTicket({ transaction, message });
      // success UX
      // Consider using toasts for a smoother UX; simple alert for demonstration
      alert('Support request submitted. Our team will contact you soon.');
      // refresh history in case anything changed
      await loadHistory();
    } catch (err) {
      console.error('Failed to submit support request', err);
      throw err; // let modal handle the error
    }
  };

  return (
    <div className="buy-coins-page">
      {/* Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'buy' ? 'active' : ''}`}
          onClick={() => setActiveTab('buy')}
        >
          <FaShoppingBag /> Buy Coins
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FaHistory /> Transaction History
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'buy' && (
          <div className="buy-tab">
            <div className="payment-methods">
              <h3>Select Payment Method</h3>
              <div className="payment-methods-grid">
                {[
                  { id: 'paypal', name: 'PayPal', icon: <FaPaypal />, active: true },
                  { id: 'card', name: 'Credit Card', icon: <FaCreditCard />, active: false },
                  { id: 'crypto', name: 'Crypto', icon: <FaBitcoin />, active: false },
                  { id: 'googlepay', name: 'Google Pay', icon: <FaGoogle />, active: false },
                ].map(method => (
                  <button
                    key={method.id}
                    className={`payment-method-btn ${selectedPaymentMethod === method.id ? 'active' : ''} ${!method.active ? 'disabled' : ''}`}
                    onClick={() => method.active && setSelectedPaymentMethod(method.id)}
                    disabled={!method.active}
                    title={!method.active ? 'Coming soon' : ''}
                  >
                    <span className="payment-icon">{method.icon}</span>
                    <span className="payment-name">{method.name}</span>
                    {!method.active && <span className="coming-soon">Soon</span>}
                  </button>
                ))}
              </div>
            </div>

            <CoinPackages onBuy={handleBuy} />
            {loading && <div className="loading-indicator">Processing purchase...</div>}
            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-tab">
            <h2>Your Coin Purchase History</h2>

            {historyLoading ? (
              <div className="loading-indicator">Loading history...</div>
            ) : history.length === 0 ? (
              <p className="no-history">No transactions yet.</p>
            ) : (
              <div className="transactions-list">
                {history.map((tx) => (
                  <div key={tx.coinPurchaseId || tx.paymentId || tx.txId || Math.random()} className="transaction-item">
                    <div className="tx-icon"><FaCoins /></div>

                    <div className="tx-details">
                      <div className="tx-title">
                        {tx.coinsAmount != null ? `${tx.coinsAmount} Coins` : 'Coins'}
                      </div>
                      <div className="tx-meta">
                        {formatStatus(tx.status)} • {formatDate(tx.purchasedAt)}
                      </div>
                      <div className="tx-payment-id">
                        <FaHashtag className="payment-id-icon" />
                        Payment ID: {formatPaymentId(tx.paymentId)}
                      </div>
                    </div>

                    <div className="tx-amount">
                      {tx.amountCents != null ? `$${(tx.amountCents / 100).toFixed(2)}` : '—'} {tx.currency || ''}
                    </div>

                    <button
                      className="support-btn"
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

      {/* Support Modal */}
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