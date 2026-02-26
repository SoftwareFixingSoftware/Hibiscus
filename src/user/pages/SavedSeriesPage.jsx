import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserSavedSeriesService from '../services/UserSavedSeriesService';
import PublicSeriesService from '../services/PublicSeriesService';
import SavedSeriesCard from '../components/cards/SavedSeriesCard';
 
const SavedSeriesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedSeries, setSavedSeries] = useState([]);  

  useEffect(() => {
    loadSavedSeries();
  }, []);

  const loadSavedSeries = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get list of saved series IDs
      const savedList = await UserSavedSeriesService.getSavedSeries();
      
      if (savedList.length === 0) {
        setSavedSeries([]);
        setLoading(false);
        return;
      }

      // 2. Fetch details for each series in parallel
      const seriesPromises = savedList.map(item => 
        PublicSeriesService.getSeriesById(item.seriesId)
          .catch(err => {
            console.warn(`Failed to fetch series ${item.seriesId}`, err);
            return null; // skip failed ones
          })
      );

      const seriesResults = await Promise.all(seriesPromises);
      // Filter out any nulls (failed fetches)
      const validSeries = seriesResults.filter(s => s !== null);
      setSavedSeries(validSeries);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        // Not logged in – redirect to login or show message
        alert('Please log in to view your saved series.');
        navigate('/login');
      } else {
        console.error('Failed to load saved series', err);
        setError('Failed to load saved series. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (seriesId) => {
    try {
      await UserSavedSeriesService.removeSavedSeries(seriesId);
      // Remove from local state
      setSavedSeries(prev => prev.filter(s => s.id !== seriesId));
    } catch (err) {
      console.error('Failed to remove series', err);
      alert('Failed to remove series. Please try again.');
    }
  };

  const goBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="saved-series-page">
        <div className="loading">Loading your favorites...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="saved-series-page">
        <div className="error">{error}</div>
        <button className="back-button" onClick={goBack}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="saved-series-page">
      <header className="page-header">
        <h1>My Favorite Series</h1>
        <p className="subtitle">{savedSeries.length} saved series</p>
      </header>

      {savedSeries.length === 0 ? (
        <div className="empty-state">
          <p>You haven't saved any series yet.</p>
          <button className="browse-button" onClick={() => navigate('/user')}>
            Browse Series
          </button>
        </div>
      ) : (
        <div className="series-grid">
          {savedSeries.map(series => (
            <SavedSeriesCard
              key={series.id}
              series={series}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedSeriesPage;