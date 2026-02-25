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
import CoinPackages from '../components/CoinPackages';
import Footer from '../components/common/Footer';
import '../styles/PayPalStyles.css';

const PAYMENT_METHODS = [
  { id: 'paypal', name: 'PayPal', icon: <FaPaypal />, active: true },
  { id: 'card', name: 'Credit Card', icon: <FaCreditCard />, active: false },
  { id: 'crypto', name: 'Crypto', icon: <FaBitcoin />, active: false },
  { id: 'googlepay', name: 'Google Pay', icon: <FaGoogle />, active: false },
];

// Support Modal Component
const SupportModal = ({ transaction, onClose, onSubmit }) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      onSubmit(transaction, message);
      setSubmitting(false);
      onClose();
    }, 1000);
  };

  if (!transaction) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="support-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><FaTimes /></button>
        <h3>Request Support</h3>
        <div className="transaction-ref">
          <FaHashtag /> Transaction ID: <span className="tx-id">{transaction.coinPurchaseId}</span>
        </div>
        <div className="transaction-summary">
          {transaction.coinsAmount} coins • ${(transaction.amountCents/100).toFixed(2)} {transaction.currency} • {formatStatus(transaction.status)}
        </div>
        <form onSubmit={handleSubmit}>
          <label htmlFor="support-message">Describe your issue:</label>
          <textarea
            id="support-message"
            rows="4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please provide details about your problem..."
            required
          />
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper for status (same as before)
const formatStatus = (status) => {
  const statusMap = {
    PENDING: { label: 'Pending', class: 'status-pending' },
    COMPLETED: { label: 'Completed', class: 'status-completed' },
    FAILED: { label: 'Failed', class: 'status-failed' },
    REFUNDED: { label: 'Refunded', class: 'status-refunded' },
  };
  const s = statusMap[status] || { label: status, class: '' };
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
  }, [activeTab]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await PayPalService.getUserCoinPurchaseHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load purchase history', err);
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
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const formatPaymentId = (id) => {
    if (!id) return '—';
    return id.substring(0, 8) + '...';
  };

  const handleSupportClick = (transaction) => {
    setSelectedTransaction(transaction);
    setModalOpen(true);
  };

  const handleSupportSubmit = (transaction, message) => {
    // Here you would send to your support API
    console.log('Support request for transaction:', transaction.coinPurchaseId, 'Message:', message);
    alert('Support request submitted. Our team will contact you soon.');
    // Could also refresh history or show a notification
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

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'buy' && (
          <div className="buy-tab">
            {/* Payment Method Selection */}
            <div className="payment-methods">
              <h3>Select Payment Method</h3>
              <div className="payment-methods-grid">
                {PAYMENT_METHODS.map(method => (
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

            {/* Coin Packages */}
            <CoinPackages onBuy={handleBuy} />
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
                  <div key={tx.coinPurchaseId} className="transaction-item">
                    <div className="tx-icon"><FaCoins /></div>
                    <div className="tx-details">
                      <div className="tx-title">
                        {tx.coinsAmount} Coins
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
                      ${(tx.amountCents / 100).toFixed(2)} {tx.currency}
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