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

    }
  };

  if (loadingPackages && loadingCoins) return <div className="user-loading-indicator">Loading...</div>;
  if (packagesError) return <div className="user-error-message">{packagesError}</div>;

  return (
    <div className="user-coin-packages-container">
      <div className="user-balance-card">
        <div className="user-balance-icon"><FaCoins /></div>
        <div className="user-balance-details">
          <span className="user-balance-label">Your Balance</span>
          {loadingCoins ? (
            <span className="user-balance-value loading">Loading...</span>
          ) : coinsError ? (
            <span className="user-balance-value error">{coinsError}</span>
          ) : userCoins ? (
            <div className="user-balance-value">
              <strong>{userCoins.coins.toLocaleString()}</strong> coins
              <button className="user-refresh-btn" onClick={refreshBalance} title="Refresh balance">
                ↻
              </button>
            </div>
          ) : (
            <span className="user-balance-value">—</span>
          )}
        </div>
      </div>

      <h2 className="user-packages-title">Choose a Coin Package</h2>

      <div className="user-packages-grid">
        {packages.map((pkg) => (
          <div
            key={pkg.packageId}
            className={`user-package-card ${selectedPackage?.packageId === pkg.packageId ? 'selected' : ''}`}
            onClick={() => setSelectedPackage(pkg)}
          >
            <h3>{pkg.name}</h3>
            <p className="user-price">${(pkg.priceCents / 100).toFixed(2)}</p>
            <p className="user-coins">{pkg.coinsAmount} coins</p>
          </div>
        ))}
      </div>

      <div className="user-actions-row">
        <button
          className="user-buy-button"
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