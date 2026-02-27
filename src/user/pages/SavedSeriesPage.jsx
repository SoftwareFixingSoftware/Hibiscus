// src/pages/SavedSeriesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserSavedSeriesService from '../services/UserSavedSeriesService';
import PublicSeriesService from '../services/PublicSeriesService';
import UserFollowedSeriesService from '../services/UserFollowedSeriesService';
import SavedSeriesCard from '../components/cards/SavedSeriesCard';

/**
 * SavedSeriesPage
 * - Shows saved series (full details)
 * - For each saved series we also check follow status to display notification state
 */
const SavedSeriesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // savedSeries: array of objects returned by PublicSeriesService.getSeriesById
  // augmented with: { isFollowing: boolean, notificationEnabled: boolean }
  const [savedSeries, setSavedSeries] = useState([]);

  // Helper to coerce many server shapes into boolean
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSavedSeries = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Get list of saved series references (likely contains seriesId)
      const savedList = await UserSavedSeriesService.getSavedSeries();

      if (!Array.isArray(savedList) || savedList.length === 0) {
        setSavedSeries([]);
        setLoading(false);
        return;
      }

      // 2) For each saved item, fetch full series details and follow status in parallel
      const fetches = savedList.map(async (item) => {
        const seriesId = item.seriesId || item.id;
        try {
          const detail = await PublicSeriesService.getSeriesById(seriesId);
          // default follow values
          let isFollowing = false;
          let notificationEnabled = false;

          try {
            // getFollowStatus returns 200 + FollowedSeriesResponse if followed
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
            // If not followed we expect 404 — ignore and leave flags false
            if (followErr?.response?.status && followErr.response.status !== 404) {
              // log unexpected errors but continue
              console.warn(`Failed to get follow status for ${seriesId}`, followErr);
            }
          }

          // Attach canonical id (some series objects use id, some use seriesId)
          const canonical = {
            ...detail,
            id: detail.id || detail.seriesId || seriesId,
            isFollowing,
            notificationEnabled,
            // keep original raw if needed
            _savedRecord: item,
          };
          return canonical;
        } catch (err) {
          console.warn(`Failed to fetch full series for ${seriesId}`, err);
          return null; // skip on failure
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

  // Remove (unsave) handler — called by SavedSeriesCard (prop onUnfollow)
  const handleRemove = async (seriesId) => {
    try {
      await UserSavedSeriesService.removeSavedSeries(seriesId);
      setSavedSeries(prev => prev.filter(s => (s.id || s.seriesId) !== seriesId));
    } catch (err) {
      console.error('Failed to remove saved series', err);
      alert('Failed to remove series. Please try again.');
    }
  };

  /**
   * Toggle notification for a saved series (called by SavedSeriesCard)
   * Behavior:
   *  - If not followed: follow the series, then enable notifications (if server doesn't enable by default)
   *  - If already following: toggle notifications
   *
   * Uses optimistic UI update and reverts if the network call fails.
   */
  const handleToggleNotification = async (seriesId, currentState) => {
    // optimistic update
    setSavedSeries(prev =>
      prev.map(s =>
        (s.id || s.seriesId) === seriesId ? { ...s, notificationEnabled: !currentState } : s
      )
    );

    try {
      // First check if followed (we may have stale local flag)
      const local = savedSeries.find(s => (s.id || s.seriesId) === seriesId);
      const currentlyFollowing = local?.isFollowing === true;

      if (!currentlyFollowing) {
        // attempt to follow
        const followed = await UserFollowedSeriesService.followSeries(seriesId);
        const serverFollowEnabled = toBool(
          followed?.notificationEnabled ??
            followed?.notificationsEnabled ??
            followed?.enabled ??
            followed?.notifications_on ??
            followed?.notificationsOn
        );

        // If server did not enable notifications by default, explicitly enable them
        if (!serverFollowEnabled) {
          const updated = await UserFollowedSeriesService.updateNotification(seriesId, true);
          const serverEnabled = toBool(
            updated?.notificationEnabled ??
              updated?.notificationsEnabled ??
              updated?.enabled ??
              updated?.notifications_on ??
              updated?.notificationsOn
          );
          // update local state with follow + true/false from server
          setSavedSeries(prev =>
            prev.map(s =>
              (s.id || s.seriesId) === seriesId ? { ...s, isFollowing: true, notificationEnabled: serverEnabled } : s
            )
          );
        } else {
          // server already enabled notifications on follow
          setSavedSeries(prev =>
            prev.map(s =>
              (s.id || s.seriesId) === seriesId ? { ...s, isFollowing: true, notificationEnabled: serverFollowEnabled } : s
            )
          );
        }
      } else {
        // Already following: toggle notification
        const newState = !currentState;
        // Use the service that expects query param ?enabled=true/false
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

      // revert optimistic update
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
              key={series.id || series.seriesId}
              series={series}
              onUnfollow={handleRemove} // SavedSeriesCard expects onUnfollow for the remove button
              onToggleNotification={handleToggleNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedSeriesPage;