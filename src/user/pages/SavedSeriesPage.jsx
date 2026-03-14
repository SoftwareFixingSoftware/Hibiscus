import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserSavedSeriesService from '../services/UserSavedSeriesService';
import PublicSeriesService from '../services/PublicSeriesService';
import UserFollowedSeriesService from '../services/UserFollowedSeriesService';
import SavedSeriesCard from '../components/cards/SavedSeriesCard';
import '../styles/user-saved-series.css'; // use the new CSS file
import Footer from '../components/common/Footer';

const SavedSeriesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedSeries, setSavedSeries] = useState([]);

  const toBool = (v) => {
    if (v === undefined || v === null) return false;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
      const lower = v.trim().toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on';
    }
    if (typeof v === 'number') return v === 1;
    return Boolean(v);
  };

  useEffect(() => {
    loadSavedSeries();
  }, []);

  const loadSavedSeries = async () => {
    setLoading(true);
    setError(null);
    try {
      const savedList = await UserSavedSeriesService.getSavedSeries();

      if (!Array.isArray(savedList) || savedList.length === 0) {
        setSavedSeries([]);
        setLoading(false);
        return;
      }

      const fetches = savedList.map(async (item) => {
        const seriesId = item.seriesId || item.id;
        try {
          const detail = await PublicSeriesService.getSeriesById(seriesId);
          let isFollowing = false;
          let notificationEnabled = false;

          try {
            const status = await UserFollowedSeriesService.getFollowStatus(seriesId);
            isFollowing = true;
            notificationEnabled = toBool(
              status?.notificationEnabled ??
                status?.notificationsEnabled ??
                status?.enabled ??
                status?.notifications_on ??
                status?.notificationsOn
            );
          } catch (followErr) {
            if (followErr?.response?.status && followErr.response.status !== 404) {
              console.warn(`Failed to get follow status for ${seriesId}`, followErr);
            }
          }

          // Normalize fields for SavedSeriesCard
          const canonical = {
            id: detail.id || detail.seriesId || seriesId,
            title: detail.title || 'Untitled',
            coverImageUrl: detail.coverImageUrl || detail.cover_image_url || detail.coverImage,
            author: detail.authorName || detail.author || detail.creator || 'Unknown',
            isFollowing,
            notificationEnabled,
            _savedRecord: item,
          };
          return canonical;
        } catch (err) {
          console.warn(`Failed to fetch full series for ${seriesId}`, err);
          return null;
        }
      });

      const results = await Promise.all(fetches);
      const valid = results.filter(Boolean);
      setSavedSeries(valid);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
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
      setSavedSeries(prev => prev.filter(s => (s.id || s.seriesId) !== seriesId));
    } catch (err) {
      console.error('Failed to remove saved series', err);
      alert('Failed to remove series. Please try again.');
    }
  };

  const handleToggleNotification = async (seriesId, currentState) => {
    setSavedSeries(prev =>
      prev.map(s =>
        (s.id || s.seriesId) === seriesId ? { ...s, notificationEnabled: !currentState } : s
      )
    );

    try {
      const local = savedSeries.find(s => (s.id || s.seriesId) === seriesId);
      const currentlyFollowing = local?.isFollowing === true;

      if (!currentlyFollowing) {
        const followed = await UserFollowedSeriesService.followSeries(seriesId);
        const serverFollowEnabled = toBool(
          followed?.notificationEnabled ??
            followed?.notificationsEnabled ??
            followed?.enabled ??
            followed?.notifications_on ??
            followed?.notificationsOn
        );

        if (!serverFollowEnabled) {
          const updated = await UserFollowedSeriesService.updateNotification(seriesId, true);
          const serverEnabled = toBool(
            updated?.notificationEnabled ??
              updated?.notificationsEnabled ??
              updated?.enabled ??
              updated?.notifications_on ??
              updated?.notificationsOn
          );
          setSavedSeries(prev =>
            prev.map(s =>
              (s.id || s.seriesId) === seriesId ? { ...s, isFollowing: true, notificationEnabled: serverEnabled } : s
            )
          );
        } else {
          setSavedSeries(prev =>
            prev.map(s =>
              (s.id || s.seriesId) === seriesId ? { ...s, isFollowing: true, notificationEnabled: serverFollowEnabled } : s
            )
          );
        }
      } else {
        const newState = !currentState;
        const updated = await UserFollowedSeriesService.updateNotification(seriesId, newState);
        const serverEnabled = toBool(
          updated?.notificationEnabled ??
            updated?.notificationsEnabled ??
            updated?.enabled ??
            updated?.notifications_on ??
            updated?.notificationsOn
        );
        setSavedSeries(prev =>
          prev.map(s =>
            (s.id || s.seriesId) === seriesId ? { ...s, notificationEnabled: serverEnabled } : s
          )
        );
      }
    } catch (err) {
      console.error('Failed to update notification for', seriesId, err);
      alert('Could not update notification preference.');
      setSavedSeries(prev =>
        prev.map(s =>
          (s.id || s.seriesId) === seriesId ? { ...s, notificationEnabled: currentState } : s
        )
      );
    }
  };

  const goBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="user-saved-series-page">
        <div className="user-loading">Loading your favorites...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-saved-series-page">
        <div className="user-error">{error}</div>
        <button className="user-back-button" onClick={goBack}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="user-saved-series-page">
      <header className="user-page-header">
        <h1>My Favorite Series</h1>
        <p className="user-subtitle">{savedSeries.length} saved series</p>
      </header>

      {savedSeries.length === 0 ? (
        <div className="user-empty-state">
          <p>You haven't saved any series yet.</p>
          <button className="user-browse-button" onClick={() => navigate('/user')}>
            Browse Series
          </button>
        </div>
      ) : (
        <div className="user-series-grid">
          {savedSeries.map(series => (
            <SavedSeriesCard
              key={series.id || series.seriesId}
              series={series}
              onUnfollow={handleRemove}
              onToggleNotification={handleToggleNotification}
            />
          ))}
        </div>
      )}
      <Footer/>
    </div>
  );
};

export default SavedSeriesPage;