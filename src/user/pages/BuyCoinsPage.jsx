import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import PayPalService from '../services/PayPalService';
import CoinPackages from '../components/CoinPackages';
import '../styles/PayPalStyles.css';

const BuyCoinsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className="page-container">
      <h1>Buy Coins</h1>
      {error && <div className="error-message">Error: {error}</div>}
      {loading ? (
        <div className="loading-indicator">Processing...</div>
      ) : (
        <CoinPackages onBuy={handleBuy} />
      )}
    </div>
  );
};

export default BuyCoinsPage;