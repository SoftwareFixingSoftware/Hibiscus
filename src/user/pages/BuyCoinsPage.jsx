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
  FaTimes,
  FaMobileAlt,
  FaCheckCircle,
  FaSpinner
} from 'react-icons/fa';
import PayPalService from '../services/PayPalService';
import MpesaService from '../services/MpesaService';
import SupportService from '../services/SupportService';
import CoinPackages from '../components/CoinPackages';
import Footer from '../components/common/Footer';
import '../styles/PayPalStyles.css';

// ------------------ Loading Overlay ------------------
const LoadingOverlay = () => (
  <div className="user-loading-overlay">
    <div className="user-loading-content">
      <FaSpinner className="user-loading-spinner" />
      <p>Processing purchase...</p>
    </div>
  </div>
);

// ------------------ M-Pesa Success Modal ------------------
const MpesaSuccessModal = ({ checkoutRequestId, onClose }) => {
  return (
    <div className="user-modal-overlay" onClick={onClose}>
      <div className="user-success-modal" onClick={(e) => e.stopPropagation()}>
        <button className="user-modal-close" onClick={onClose}><FaTimes /></button>
        <div className="user-success-icon">
          <FaCheckCircle />
        </div>
        <h3>STK Push Sent!</h3>
        <p>Please check your phone and enter your M‑Pesa PIN to complete the payment.</p>
        <p className="user-checkout-id">
          <strong>Checkout Request ID:</strong> {checkoutRequestId}
        </p>
        <p className="user-info-note">
          The transaction will be updated automatically. You can view its status in your Transaction history.
        </p>
        <button className="user-ok-btn" onClick={onClose}>OK, Got It</button>
      </div>
    </div>
  );
};

// ------------------ Support Modal ------------------
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
            placeholder="Please provide details (what happened?..)"
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

// ------------------ Status badge helper ------------------
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

// ------------------ Main Page Component ------------------
const BuyCoinsPage = () => {
  const [activeTab, setActiveTab] = useState('buy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('paypal');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // M‑Pesa specific state
  const [phoneNumberRest, setPhoneNumberRest] = useState('');
  const [mpesaSuccess, setMpesaSuccess] = useState(null); // { checkoutRequestId }

  // Load transaction history when switching to the history tab
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

  // Helper to get payment method name
  const getPaymentMethodName = () => {
    const methods = {
      paypal: 'PayPal',
      mpesa: 'M‑Pesa',
      card: 'Credit Card',
      crypto: 'Crypto',
      googlepay: 'Google Pay'
    };
    return methods[selectedPaymentMethod] || 'selected method';
  };

  const buyButtonText = `Pay with ${getPaymentMethodName()}`;

  // ------------------ Handle Buy Button ------------------
  const handleBuy = async (selectedPackage) => {
    setLoading(true);
    setError(null);
    setMpesaSuccess(null);
    const idempotencyKey = uuidv4();

    try {
      if (selectedPaymentMethod === 'paypal') {
        const { approvalUrl } = await PayPalService.createCoinPurchase(
          selectedPackage.packageId,
          idempotencyKey
        );
        window.location.href = approvalUrl;
      } else if (selectedPaymentMethod === 'mpesa') {
        // Validate phone number
        if (!phoneNumberRest || phoneNumberRest.length < 9) {
          throw new Error('Please enter a valid phone number after +254 (9 digits)');
        }
        const fullPhone = '254' + phoneNumberRest;
        const response = await MpesaService.initiateCoinPurchase(
          selectedPackage.packageId,
          idempotencyKey,
          fullPhone
        );
        // Show success modal
        setMpesaSuccess({
          checkoutRequestId: response.checkoutRequestId
        });
        setLoading(false);
      } else {
        alert('This payment method is coming soon.');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate payment');
      setLoading(false);
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
                  { id: 'mpesa', name: 'M‑Pesa', icon: <FaMobileAlt />, active: true },
                  { id: 'card', name: 'Credit Card', icon: <FaCreditCard />, active: false },
                  { id: 'crypto', name: 'Crypto', icon: <FaBitcoin />, active: false },
                  { id: 'googlepay', name: 'Google Pay', icon: <FaGoogle />, active: false },
                ].map(method => (
                  <button
                    key={method.id}
                    className={`user-payment-method-btn ${selectedPaymentMethod === method.id ? 'active' : ''} ${!method.active ? 'disabled' : ''} ${method.id === 'mpesa' && selectedPaymentMethod === 'mpesa' ? 'mpesa-active' : ''}`}
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

            {/* M‑Pesa phone number input with fixed +254 prefix */}
            {selectedPaymentMethod === 'mpesa' && (
              <div className="user-mpesa-input">
                <label htmlFor="phoneNumber">M‑Pesa Phone Number:</label>
                <div className="user-phone-input-wrapper">
                  <span className="user-phone-prefix">+254</span>
                  <input
                    type="tel"
                    id="phoneNumber"
                    placeholder="7XXXXXXXX"
                    value={phoneNumberRest}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPhoneNumberRest(val);
                    }}
                    disabled={loading}
                    maxLength={9}
                  />
                </div>
                <p className="user-input-hint">Enter the remaining 9 digits (e.g., 712345678)</p>
              </div>
            )}

            {/* CoinPackages with dynamic button text */}
            <CoinPackages onBuy={handleBuy} buttonText={buyButtonText} />

            {/* Error message */}
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
                      Support
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />

      {/* Loading Overlay */}
      {loading && <LoadingOverlay />}

      {/* M-Pesa Success Modal */}
      {mpesaSuccess && (
        <MpesaSuccessModal
          checkoutRequestId={mpesaSuccess.checkoutRequestId}
          onClose={() => setMpesaSuccess(null)}
        />
      )}

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