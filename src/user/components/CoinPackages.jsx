import React, { useState, useEffect } from 'react';
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

  // load packages
  useEffect(() => {
    let mounted = true;
    const loadPackages = async () => {
      try {
        setLoadingPackages(true);
        const data = await PayPalService.getCoinPackages();
        if (!mounted) return;
        setPackages(data);
      } catch (err) {
        console.error(err);
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

  // load user coins
  useEffect(() => {
    let mounted = true;
    const loadCoins = async () => {
      try {
        setLoadingCoins(true);
        const data = await PayPalService.getUserCoins();
        if (!mounted) return;
        setUserCoins(data);
      } catch (err) {
        console.error(err);
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

  // helper to refresh balance manually (or after buy completes)
  const refreshBalance = async () => {
    try {
      setLoadingCoins(true);
      const data = await PayPalService.getUserCoins();
      setUserCoins(data);
      setCoinsError(null);
    } catch (err) {
      console.error(err);
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
      <div className="balance-row">
        <h2>Choose a Coin Package</h2>
        <div className="user-balance">
          {loadingCoins ? (
            <span className="small-loading">Loading balance…</span>
          ) : coinsError ? (
            <span className="error-message small">{coinsError}</span>
          ) : userCoins ? (
            <div>
              <strong>{userCoins.coins}</strong> coins
              <div className="balance-updated">Updated: {userCoins.updatedAt ? new Date(userCoins.updatedAt).toLocaleString() : '—'}</div>
            </div>
          ) : (
            <span className="small-muted">No balance info</span>
          )}
        </div>
      </div>

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

        <button
          className="secondary-button"
          onClick={refreshBalance}
          title="Refresh balance"
        >
          Refresh Balance
        </button>
      </div>
    </div>
  );
};

export default CoinPackages;