import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicEpisodeService from '../services/PublicEpisodeService';
import { relativeDate } from '../utils/episodeHelpers';
import Footer from '../components/common/Footer';
import '../styles/user.css';

const PurchaseHistoryPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const data = await PublicEpisodeService.getUserPurchasedEpisodes();
      setPurchases(data);
    } catch (err) {
      setError(err.message || 'Failed to load purchase history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSeries = (seriesId) => {
    navigate(`/user/series/${seriesId}`);
  };

  const handleViewEpisode = (seriesId, episodeId) => {
    navigate(`/user/series/${seriesId}?episode=${episodeId}`);
  };

  if (loading) return <div className="loading-indicator">Loading purchase history...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="purchase-history-page">
      <h2 className="section-title">My Purchased Episodes</h2>
      {purchases.length === 0 ? (
        <p className="muted">You haven't purchased any episodes yet.</p>
      ) : (
        <div className="purchases-list">
          {purchases.map((purchase) => (
            <div key={purchase.episodeId} className="purchase-item">
              <div className="purchase-info">
                <h3 className="purchase-title">{purchase.episodeTitle}</h3>
                <div className="purchase-meta muted small">
                  Series: {purchase.seriesTitle || 'Unknown'} • Purchased: {relativeDate(purchase.purchasedAt)} • Spent: {purchase.coinsSpent} coins
                </div>
              </div>
              <div className="purchase-actions">
                <button className="ctrl" onClick={() => handleViewSeries(purchase.seriesId)}>
                  View Series
                </button>
                <button className="ctrl" onClick={() => handleViewEpisode(purchase.seriesId, purchase.episodeId)}>
                  View Episode
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Footer />
    </div>
  );
};

export default PurchaseHistoryPage;