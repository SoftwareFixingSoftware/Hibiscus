import React, { useState, useEffect } from 'react';
import { FaCoins } from 'react-icons/fa';
import PayPalService from '../services/PayPalService';
import '../styles/PayPalStyles.css';

const CoinPackages = ({ onBuy }) => {
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [packagesError, setPackagesError] = useState(null);

  const [userCoins, setUserCoins] = useState(null);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [coinsError, setCoinsError] = useState(null);

  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadPackages = async () => {
      try {
        setLoadingPackages(true);
        const data = await PayPalService.getCoinPackages();
        if (!mounted) return;
        setPackages(data);
      } catch (err) {
        if (!mounted) return;
        setPackagesError('Failed to load coin packages');
      } finally {
        if (!mounted) return;
        setLoadingPackages(false);
      }
    };
    loadPackages();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadCoins = async () => {
      try {
        setLoadingCoins(true);
        const data = await PayPalService.getUserCoins();
        if (!mounted) return;
        setUserCoins(data);
      } catch (err) {
        if (!mounted) return;
        setCoinsError('Failed to load your coin balance');
      } finally {
        if (!mounted) return;
        setLoadingCoins(false);
      }
    };
    loadCoins();
    return () => { mounted = false; };
  }, []);

  const refreshBalance = async () => {
    try {
      setLoadingCoins(true);
      const data = await PayPalService.getUserCoins();
      setUserCoins(data);
      setCoinsError(null);
    } catch (err) {
      setCoinsError('Failed to refresh coin balance');
    } finally {
      setLoadingCoins(false);
    }
  };

  const handleBuy = async () => {
    if (!selectedPackage) return;
    try {
      const result = onBuy(selectedPackage);
      if (result && typeof result.then === 'function') {
        await result;
        await refreshBalance();
      }
    } catch (err) {
      console.error('Purchase failed or was cancelled', err);
    }
  };

  if (loadingPackages && loadingCoins) return <div className="loading-indicator">Loading...</div>;
  if (packagesError) return <div className="error-message">{packagesError}</div>;

  return (
    <div className="coin-packages-container">
      {/* Classic Balance Card with React Icon */}
      <div className="balance-card">
        <div className="balance-icon"><FaCoins /></div>
        <div className="balance-details">
          <span className="balance-label">Your Balance</span>
          {loadingCoins ? (
            <span className="balance-value loading">Loading...</span>
          ) : coinsError ? (
            <span className="balance-value error">{coinsError}</span>
          ) : userCoins ? (
            <div className="balance-value">
              <strong>{userCoins.coins.toLocaleString()}</strong> coins
              <button className="refresh-btn" onClick={refreshBalance} title="Refresh balance">
                ↻
              </button>
            </div>
          ) : (
            <span className="balance-value">—</span>
          )}
        </div>
      </div>

      <h2 className="packages-title">Choose a Coin Package</h2>

      <div className="packages-grid">
        {packages.map((pkg) => (
          <div
            key={pkg.packageId}
            className={`package-card ${selectedPackage?.packageId === pkg.packageId ? 'selected' : ''}`}
            onClick={() => setSelectedPackage(pkg)}
          >
            <h3>{pkg.name}</h3>
            <p className="price">${(pkg.priceCents / 100).toFixed(2)}</p>
            <p className="coins">{pkg.coinsAmount} coins</p>
          </div>
        ))}
      </div>

      <div className="actions-row">
        <button
          className="buy-button"
          onClick={handleBuy}
          disabled={!selectedPackage}
        >
          Buy with PayPal
        </button>
      </div>
    </div>
  );
};

export default CoinPackages;