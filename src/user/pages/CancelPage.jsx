import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PayPalService from '../services/PayPalService';
import '../styles/PayPalStyles.css';

const CancelPage = () => {
  const [status, setStatus] = useState('processing'); // 'processing', 'done', 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const cancelOrder = async () => {
      const orderId = sessionStorage.getItem('pendingPaypalOrder');
      if (!orderId) {
        setStatus('done');
        return;
      }

      try {
        await PayPalService.cancelCoinPurchase(orderId);
        setStatus('done');
      } catch (err) {
        setStatus('error');
        setErrorMsg(err?.response?.data?.message || err.message || 'Failed to cancel order. Please contact support.');
      }
    };

    cancelOrder();
  }, []);

  return (
    <div className="user-page-container user-cancel-page">
      <h1>Payment Cancelled</h1>

      {status === 'processing' && (
        <p>Processing cancellation...</p>
      )}

      {status === 'done' && (
        <>
          <p>You have cancelled the payment. No charges were made.</p>
          <p>If you changed your mind, you can try again.</p>
        </>
      )}

      {status === 'error' && (
        <div className="user-error-message">
          <p>{errorMsg}</p>
          <p>Your order may still be pending. Please check your purchase history or contact support.</p>
        </div>
      )}

      <Link to="/user/buy-coins" className="user-try-again-link">Try Again</Link>
      <Link to="/user" className="user-home-link">Go to Home</Link>
    </div>
  );
};

export default CancelPage;