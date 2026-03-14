import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicEpisodeService from '../services/PublicEpisodeService';
import { relativeDate } from '../utils/episodeHelpers';
import Footer from '../components/common/Footer';
 
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

  if (loading) return <div className="user-loading-indicator">Loading purchase history...</div>;
  if (error) return <div className="user-error-message">{error}</div>;

  return (
    <div className="user-purchase-history-page">
      <h2 className="user-section-title">My Purchased Episodes</h2>
      {purchases.length === 0 ? (
        <p className="user-muted">You haven't purchased any episodes yet.</p>
      ) : (
        <div className="user-purchases-list">
          {purchases.map((purchase) => (
            <div key={purchase.episodeId} className="user-purchase-item">
              <div className="user-purchase-info">
                <h3 className="user-purchase-title">{purchase.episodeTitle}</h3>
                <div className="user-purchase-meta user-muted small">
                   Purchased: {relativeDate(purchase.purchasedAt)} • Spent: {purchase.coinsSpent} coins
                </div>
              </div>
              <div className="user-purchase-actions">
                <button className="user-ctrl-p" onClick={() => handleViewSeries(purchase.seriesId)}>
                  View Series
                </button>
                <button className="user-ctrl-p" onClick={() => handleViewEpisode(purchase.seriesId, purchase.episodeId)}>
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