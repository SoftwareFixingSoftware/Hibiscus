import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';
import PublicSeriesService from '../services/PublicSeriesService';
import PublicEpisodeService from '../services/PublicEpisodeService';
import UserFollowedSeriesService from '../services/UserFollowedSeriesService';
import UserSavedSeriesService from '../services/UserSavedSeriesService';
import SeriesReviewService from '../services/SeriesReviewService';
import { mapSeries, mapEpisode, formatDuration, relativeDate, formatMoneyFromCents } from '../utils/episodeHelpers';
import EpisodeCard from '../components/cards/EpisodeCard';
import ReviewCard from '../components/cards/ReviewCard';
import RatingInput from '../components/cards/RatingInput';
import RippleButton from '../components/common/RippleButton';
import { 
  FaBell, 
  FaBellSlash, 
  FaHeart, 
  FaRegHeart, 
  FaCheckCircle,
  FaPlay,
  FaTimes
} from 'react-icons/fa';
import '../styles/user-series-detail.css';

const SeriesDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { player, play } = useAudio();

  const isLoggedIn = location.pathname.startsWith('/user');

  const [series, setSeries] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [purchasingEpisodeId, setPurchasingEpisodeId] = useState(null);
  const [purchasedEpisodes, setPurchasedEpisodes] = useState(new Set());

  // Follow/notification state
  const [isFollowing, setIsFollowing] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [followActionLoading, setFollowActionLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Save (favorites) state
  const [isSaved, setIsSaved] = useState(false);
  const [saveActionLoading, setSaveActionLoading] = useState(false);

  // Reviews tab state
  const [activeTab, setActiveTab] = useState('episodes');
  const [reviews, setReviews] = useState([]);        // only other users' reviews
  const [myReview, setMyReview] = useState(null);    // current user's review
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const overlayRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const extractReviewsArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      if (Array.isArray(data.content)) return data.content;
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.results)) return data.results;
    }
    return [];
  };

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

  const requireLogin = () => {
    localStorage.setItem('redirectAfterLogin', location.pathname);
    navigate('/login');
  };

  useEffect(() => {
    if (!id) return;
    loadSeriesAndEpisodes(id);
  }, [id]);

  useEffect(() => {
    if (!series || !series.id) return;
    let cancelled = false;

    if (isLoggedIn) {
      const fetchSavedStatus = async () => {
        try {
          const savedList = await UserSavedSeriesService.getSavedSeries();
          if (cancelled) return;
          const found = (Array.isArray(savedList) && savedList.some(s =>
            s.seriesId === series.id || s.seriesId === series.seriesId || s.id === series.id
          ));
          setIsSaved(Boolean(found));
        } catch (err) {
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            setIsSaved(false);
          } else {
            console.warn('Failed to check saved status', err);
          }
        }
      };

      const fetchFollowStatus = async () => {
        try {
          const status = await UserFollowedSeriesService.getFollowStatus(series.id);
          const serverEnabled = toBool(
            status?.notificationEnabled ??
            status?.notificationsEnabled ??
            status?.enabled ??
            status?.notifications_on ??
            status?.notificationsOn
          );
          setIsFollowing(true);
          setNotificationEnabled(serverEnabled);
        } catch (err) {
          if (err.response?.status === 404) {
            setIsFollowing(false);
            setNotificationEnabled(false);
          } else if (err.response?.status === 401 || err.response?.status === 403) {
            setIsFollowing(false);
            setNotificationEnabled(false);
          } else {
            console.warn('Failed to fetch follow status', err);
          }
        } finally {
          if (!cancelled) setAuthChecked(true);
        }
      };

      fetchSavedStatus();
      fetchFollowStatus();
    } else {
      setIsFollowing(false);
      setNotificationEnabled(false);
      setIsSaved(false);
      setAuthChecked(true);
    }

    return () => { cancelled = true; };
  }, [series, isLoggedIn]);

  useEffect(() => {
    if (!episodes.length) return;
    const params = new URLSearchParams(location.search);
    const episodeId = params.get('episode');
    if (episodeId) {
      const foundRaw = episodes.find(e =>
        (e.id === episodeId) || (e.episodeId === episodeId) || (e.uuid === episodeId)
      );
      if (foundRaw) {
        const index = episodes.findIndex(e =>
          (e.id === episodeId) || (e.episodeId === episodeId) || (e.uuid === episodeId)
        );
        setSelectedEpisode(mapEpisode(foundRaw, index));
      }
    }
  }, [episodes, location.search]);

  useEffect(() => {
    if (activeTab === 'reviews' && series?.id) {
      loadReviews();
    }
  }, [activeTab, series?.id]);

  const loadReviews = async () => {
    setLoadingReviews(true);
    setReviewError(null);
    try {
      const [allReviews, myReviewRes] = await Promise.allSettled([
        SeriesReviewService.getReviewsForSeries(series.id),
        isLoggedIn ? SeriesReviewService.getMyReviewForSeries(series.id) : Promise.reject({ status: 401 })
      ]);

      // Normalize all reviews
      let allNormalized = [];
      if (allReviews.status === 'fulfilled') {
        const rawReviews = extractReviewsArray(allReviews.value);
        allNormalized = rawReviews.map(r => ({
          reviewId: r.reviewId || r.id,
          userName: r.userName || r.user?.name || r.user?.email || 'Anonymous',
          rating: r.rating || 0,
          reviewText: r.reviewText || r.text || r.comment || '',
          createdAt: r.createdAt || r.created_at || r.date,
        }));
      } else {
        if (allReviews.reason?.response?.status === 401) {
          setReviewError('Please log in to see reviews.');
        } else {
          console.warn('Failed to fetch all reviews', allReviews.reason);
        }
      }

      // Normalize my review – handle possible wrapping
      let myNormalized = null;
      if (myReviewRes.status === 'fulfilled') {
        const r = myReviewRes.value;
        const reviewData = r.data || r;
        myNormalized = {
          reviewId: reviewData.reviewId || reviewData.id,
          userName: reviewData.userName || reviewData.user?.name || reviewData.user?.email || 'You',
          rating: reviewData.rating || 0,
          reviewText: reviewData.reviewText || reviewData.text || reviewData.comment || '',
          createdAt: reviewData.createdAt || reviewData.created_at || reviewData.date,
        };
        setMyReview(myNormalized);
      } else {
        if (myReviewRes.reason?.response?.status === 404) {
          setMyReview(null);
        } else if (myReviewRes.reason?.response?.status === 401) {
          setMyReview(null);
        } else {
          console.warn('Failed to fetch my review', myReviewRes.reason);
        }
      }

      // Filter out my review from all reviews (if it exists)
      if (myNormalized) {
        setReviews(allNormalized.filter(r => r.reviewId !== myNormalized.reviewId));
      } else {
        setReviews(allNormalized);
      }
    } catch (err) {
      setReviewError('Failed to load reviews.');
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    updateOverlayFade();
    const el = overlayRef.current;
    if (!el) return;
    const onScroll = () => updateOverlayFade();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateOverlayFade);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateOverlayFade);
    };
  }, [series, episodes]);

  const loadSeriesAndEpisodes = async (seriesId) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await PublicSeriesService.getSeriesById(seriesId);
      setSeries(detail ? mapSeries(detail) : null);

      const eps = await PublicEpisodeService.getEpisodesBySeries(seriesId, {
        page: 0,
        size: 1000,
        sortBy: 'episodeNumber',
        sortDirection: 'asc',
      });
      const list = Array.isArray(eps) ? eps : eps?.content || eps?.items || [];
      setEpisodes(list);

      if (isLoggedIn) {
        const accessChecks = await Promise.allSettled(
          list.map(async (ep) => {
            const id = ep.id || ep.episodeId || ep.uuid;
            if (!id) return false;
            const hasAccess = await PublicEpisodeService.checkAccess(id);
            return { id, hasAccess };
          })
        );
        const purchased = new Set();
        accessChecks.forEach(result => {
          if (result.status === 'fulfilled' && result.value.hasAccess) {
            purchased.add(result.value.id);
          }
        });
        setPurchasedEpisodes(purchased);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateOverlayFade = () => {
    const el = overlayRef.current;
    if (!el) {
      setShowTopFade(false);
      setShowBottomFade(false);
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = el;
    setShowTopFade(scrollTop > 6);
    setShowBottomFade(scrollTop + clientHeight < scrollHeight - 6);
  };

  // Interactive handlers
  const toggleFollow = async () => {
    if (!isLoggedIn) return requireLogin();
    if (!series || !series.id) return;
    setFollowActionLoading(true);
    try {
      if (isFollowing) {
        await UserFollowedSeriesService.unfollowSeries(series.id);
        setIsFollowing(false);
        setNotificationEnabled(false);
      } else {
        const followed = await UserFollowedSeriesService.followSeries(series.id);
        const serverEnabled = toBool(
          followed?.notificationEnabled ??
          followed?.notificationsEnabled ??
          followed?.enabled ??
          followed?.notifications_on
        );
        setIsFollowing(true);
        setNotificationEnabled(serverEnabled);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        requireLogin();
      } else {
        console.error('Toggle follow failed', err);
        alert('Failed to update follow status. Please try again.');
      }
    } finally {
      setFollowActionLoading(false);
    }
  };

  const toggleNotification = async () => {
    if (!isLoggedIn) return requireLogin();
    if (!series || !series.id) return;
    const previousFollowing = isFollowing;
    const previousEnabled = notificationEnabled;

    if (!isFollowing) {
      setFollowActionLoading(true);
      setIsFollowing(true);
      setNotificationEnabled(true);
      try {
        const followed = await UserFollowedSeriesService.followSeries(series.id);
        const serverFollowEnabled = toBool(
          followed?.notificationEnabled ??
          followed?.notificationsEnabled ??
          followed?.enabled ??
          followed?.notifications_on
        );
        if (!serverFollowEnabled) {
          const updated = await UserFollowedSeriesService.updateNotification(series.id, true);
          const serverEnabled = toBool(
            updated?.notificationEnabled ??
            updated?.notificationsEnabled ??
            updated?.enabled ??
            updated?.notifications_on
          );
          setNotificationEnabled(serverEnabled);
        } else {
          setNotificationEnabled(serverFollowEnabled);
        }
      } catch (err) {
        console.error('Failed to follow+enable notifications', err);
        alert('Could not enable notifications. Please try again.');
        setIsFollowing(previousFollowing);
        setNotificationEnabled(previousEnabled);
      } finally {
        setFollowActionLoading(false);
      }
      return;
    }

    const newState = !notificationEnabled;
    setNotificationEnabled(newState);
    setFollowActionLoading(true);
    try {
      const updated = await UserFollowedSeriesService.updateNotification(series.id, newState);
      const serverEnabled = toBool(
        updated?.notificationEnabled ??
        updated?.notificationsEnabled ??
        updated?.enabled ??
        updated?.notifications_on
      );
      setNotificationEnabled(serverEnabled);
    } catch (err) {
      console.error('Failed to update notification', err);
      alert('Could not update notification preference.');
      setNotificationEnabled(previousEnabled);
    } finally {
      setFollowActionLoading(false);
    }
  };

  const toggleSave = async () => {
    if (!isLoggedIn) return requireLogin();
    if (!series || !series.id) return;
    const previous = isSaved;
    setIsSaved(!previous);
    setSaveActionLoading(true);
    try {
      if (previous) {
        await UserSavedSeriesService.removeSavedSeries(series.id);
        setIsSaved(false);
      } else {
        await UserSavedSeriesService.saveSeries(series.id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle save', err);
      alert('Could not update your favorites. Please try again.');
      setIsSaved(previous);
    } finally {
      setSaveActionLoading(false);
    }
  };

  const handleOpenReviewForm = () => {
    if (!isLoggedIn) return requireLogin();
    if (myReview) {
      setFormRating(myReview.rating);
      setFormText(myReview.reviewText || '');
    } else {
      setFormRating(5);
      setFormText('');
    }
    setShowReviewForm(true);
  };

  const handleCloseReviewForm = () => {
    setShowReviewForm(false);
    setFormRating(5);
    setFormText('');
  };

  const handleSubmitReview = async () => {
    if (!isLoggedIn) return requireLogin();
    if (!formRating) {
      alert('Please select a rating');
      return;
    }
    setSubmittingReview(true);
    try {
      const reviewData = {
        rating: formRating,
        reviewText: formText.trim() || undefined,
      };
      let updated;
      if (myReview) {
        updated = await SeriesReviewService.updateMyReview(series.id, reviewData);
      } else {
        updated = await SeriesReviewService.createReview(series.id, reviewData);
      }
      // Normalize updated review
      const normalizedUpdated = {
        reviewId: updated.reviewId || updated.id,
        userName: updated.userName || updated.user?.name || updated.user?.email || 'You',
        rating: updated.rating || 0,
        reviewText: updated.reviewText || updated.text || updated.comment || '',
        createdAt: updated.createdAt || updated.created_at || updated.date,
      };
      setMyReview(normalizedUpdated);

      // Refresh all reviews and filter out own
      const allReviews = await SeriesReviewService.getReviewsForSeries(series.id);
      const rawReviews = extractReviewsArray(allReviews);
      const normalizedAll = rawReviews.map(r => ({
        reviewId: r.reviewId || r.id,
        userName: r.userName || r.user?.name || r.user?.email || 'Anonymous',
        rating: r.rating || 0,
        reviewText: r.reviewText || r.text || r.comment || '',
        createdAt: r.createdAt || r.created_at || r.date,
      }));
      setReviews(normalizedAll.filter(r => r.reviewId !== normalizedUpdated.reviewId));
      handleCloseReviewForm();
      await loadSeriesAndEpisodes(series.id);
    } catch (err) {
      console.error('Failed to save review', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        requireLogin();
      } else {
        alert('Could not save review. Please try again.');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!isLoggedIn) return requireLogin();
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await SeriesReviewService.deleteMyReview(series.id);
      setMyReview(null);

      // Refresh all reviews (now without mine)
      const allReviews = await SeriesReviewService.getReviewsForSeries(series.id);
      const rawReviews = extractReviewsArray(allReviews);
      const normalizedAll = rawReviews.map(r => ({
        reviewId: r.reviewId || r.id,
        userName: r.userName || r.user?.name || r.user?.email || 'Anonymous',
        rating: r.rating || 0,
        reviewText: r.reviewText || r.text || r.comment || '',
        createdAt: r.createdAt || r.created_at || r.date,
      }));
      setReviews(normalizedAll);
      await loadSeriesAndEpisodes(series.id);
    } catch (err) {
      console.error('Failed to delete review', err);
      alert('Could not delete review.');
    }
  };

  const checkAccess = async (epRaw) => {
    if (!isLoggedIn) return false;
    try {
      const id = epRaw.id || epRaw.episodeId || epRaw.uuid;
      if (!id) return false;
      const res = await PublicEpisodeService.checkAccess(id);
      if (typeof res === 'boolean') return res;
      if (res && typeof res.hasAccess === 'boolean') return res.hasAccess;
      return false;
    } catch (err) {
      console.warn('checkAccess error', err);
      return false;
    }
  };

  const purchaseWithCoins = async (epRaw) => {
    if (!isLoggedIn) { requireLogin(); return false; }
    try {
      const id = epRaw.id || epRaw.episodeId || epRaw.uuid;
      if (!id) throw new Error('episode id missing');
      let idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `ikey_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const stored = localStorage.getItem(`purchase:${id}`);
      if (stored) idempotencyKey = stored;
      localStorage.setItem(`purchase:${id}`, idempotencyKey);
      setPurchasingEpisodeId(id);
      const resp = await PublicEpisodeService.purchaseEpisodeWithCoins(id, idempotencyKey);
      localStorage.removeItem(`purchase:${id}`);
      const purchased = resp && (resp.purchased === true || resp.success === true || resp.purchased === 'true');
      if (purchased) {
        setPurchasedEpisodes(prev => new Set(prev).add(id));
        const hasAccess = await PublicEpisodeService.checkAccess(id);
        return hasAccess;
      } else {
        const msg = resp && (resp.message || resp.error) ? (resp.message || resp.error) : 'Coin purchase failed';
        alert(msg);
        return false;
      }
    } catch (err) {
      console.error('purchaseWithCoins', err);
      const errMsg = err?.response?.data || err.message || 'unknown error';
      alert('Coin purchase failed: ' + (typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)));
      return false;
    } finally {
      setPurchasingEpisodeId(null);
    }
  };

  const purchaseWithMoney = async (epRaw) => {
    if (!isLoggedIn) { requireLogin(); return false; }
    try {
      const id = epRaw.id || epRaw.episodeId || epRaw.uuid;
      if (!id) throw new Error('episode id missing');
      const resp = await PublicEpisodeService.createOrderForEpisode(id);
      const approvalUrl = resp?.approvalUrl || resp?.approval_url || resp?.redirect_url;
      if (approvalUrl) {
        window.open(approvalUrl, '_blank');
        alert('A new window was opened for payment. After approval the episode will be available.');
        return true;
      } else {
        alert('Failed to create payment order.');
        return false;
      }
    } catch (err) {
      console.error('purchaseWithMoney', err);
      alert('Payment initiation failed: ' + (err.message || 'unknown error'));
      return false;
    }
  };

  const playEpisode = async (epRaw) => {
    if (!isLoggedIn) { requireLogin(); return; }
    try {
      const id = epRaw.id || epRaw.episodeId || epRaw.uuid;
      if (!id) throw new Error('episode id missing');
      const mapped = mapEpisode(epRaw, 0);

      if (!mapped.isFree && !purchasedEpisodes.has(id)) {
        const wantsToBuy = window.confirm(
          mapped.priceInCoins
            ? `This episode costs ${mapped.priceInCoins} coins. Would you like to buy it with your coins now?`
            : mapped.priceCents
            ? `This episode costs ${(mapped.priceCents/100).toFixed(2)} ${mapped.currency}. Click OK to buy with PayPal.`
            : `This episode is paid. Would you like to purchase it?`
        );
        if (!wantsToBuy) return;
        if (mapped.priceInCoins) {
          const coinSuccess = await purchaseWithCoins(epRaw);
          if (!coinSuccess) return;
        } else if (mapped.priceCents && mapped.priceCents > 0) {
          const moneyStarted = await purchaseWithMoney(epRaw);
          if (!moneyStarted) return;
          return;
        } else {
          alert('Unable to determine pricing for this episode.');
          return;
        }
      }

      const url = await PublicEpisodeService.getStreamUrl(id);
      if (!url) throw new Error('No playable url');

      await play(url, {
        episodeId: id,
        title: epRaw.title || epRaw.name || epRaw.episodeTitle || 'Untitled',
        author: series?.title || series?.name || '',
      });

      setSelectedEpisode(mapped);
    } catch (err) {
      console.error('playEpisode', err);
      alert('Could not play episode — check console.');
    }
  };

  const selectEpisodeWithoutPlay = (epRaw, idx) => {
    setSelectedEpisode(mapEpisode(epRaw, idx));
  };

  const handleBuyClick = async (epRaw) => {
    if (!isLoggedIn) { requireLogin(); return; }
    const id = epRaw.id || epRaw.episodeId || epRaw.uuid;
    const mapped = mapEpisode(epRaw);
    if (mapped.priceInCoins) {
      const ok = await purchaseWithCoins(epRaw);
      if (ok) {
        await playEpisode(epRaw);
      }
    } else if (mapped.priceCents) {
      await purchaseWithMoney(epRaw);
    } else {
      alert('No pricing available.');
    }
  };

  const goHome = () => navigate(isLoggedIn ? '/user' : '/');

  if (error) return <div className="user-error-message">Error: {error?.message ?? String(error)}</div>;
  if (!series) return <div className="user-loading-indicator">Loading series...</div>;

  return (
    <section className="user-series-detail">
      <div className="user-series-left">
        <div className="user-series-cover user-artwork-area">
          <img src={series.coverImageUrl || series.cover} alt={series.title} />
        </div>
        <div ref={overlayRef} className="user-series-info-overlay user-warm-overlay user-no-scrollbars">
          <div className={`user-desc-fade user-fade-top ${showTopFade ? 'visible' : ''}`} />
          <div className={`user-desc-fade user-fade-bottom ${showBottomFade ? 'visible' : ''}`} />

          {selectedEpisode && (
            <div className="user-now-playing-badge">
              <span className="user-now-playing-icon">▶</span>{' '}
              {player.playing && player.episodeId === selectedEpisode.id ? 'Now Playing:' : 'Selected:'}{' '}
              {selectedEpisode.title}
            </div>
          )}

          <div className="user-breadcrumb">
            <button className="user-crumb" onClick={goHome}>Home</button> /{' '}
            <button className="user-crumb" onClick={goHome}>Series</button> / <strong>{series.title}</strong>
          </div>

          <div className="user-badges-row">
            <span className="user-badge user-genre">#{series.category?.toUpperCase() || 'ROMANCE'}</span>
            {series.completed && <span className="user-badge user-completed">COMPLETED SERIES</span>}

            {isLoggedIn && authChecked ? (
              <>
                <RippleButton
                  className={`user-badge user-follow-button ${isFollowing ? 'user-following' : ''}`}
                  onClick={toggleFollow}
                  disabled={followActionLoading}
                  style={{ marginLeft: 'auto', marginRight: '8px' }}
                >
                  {followActionLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                </RippleButton>

                <RippleButton
                  className={`user-badge user-save-button ${isSaved ? 'user-saved' : ''}`}
                  onClick={toggleSave}
                  disabled={saveActionLoading}
                  title={isSaved ? 'Remove from favorites' : 'Add to favorites'}
                  style={{ marginRight: '8px' }}
                >
                  {isSaved ? <FaHeart /> : <FaRegHeart />} {saveActionLoading ? '...' : ''}
                </RippleButton>

                {isFollowing && (
                  <RippleButton
                    className={`user-badge user-notification-button ${notificationEnabled ? 'user-enabled' : ''}`}
                    onClick={toggleNotification}
                    disabled={followActionLoading}
                    title={notificationEnabled ? 'Disable notifications' : 'Enable notifications'}
                  >
                    {notificationEnabled ? <FaBell /> : <FaBellSlash />}
                  </RippleButton>
                )}
              </>
            ) : !isLoggedIn && (
              <button className="user-badge" onClick={requireLogin} style={{ marginLeft: 'auto' }}>
                Log in to interact
              </button>
            )}
          </div>

          <h2 className="user-series-title">{series.title}</h2>

          <div className="user-series-meta-row">
            <span className="user-muted">{series.plays || '—'} PLAYS</span>
            {series.averageRating != null && (
              <span className="user-muted">• ★ {series.averageRating.toFixed(1)}</span>
            )}
            <span className="user-muted">• {series.category || 'ROMANCE'}</span>
          </div>

          <div className="user-series-description-text">{series.description || 'No description provided.'}</div>

          {series.author && (
            <div className="user-author-row">
              <div className="user-muted user-small">By</div>
              <div style={{ fontWeight: 700, marginLeft: 8 }}>{series.author}</div>
            </div>
          )}

          {selectedEpisode && (
            <div className="user-selected-episode-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{selectedEpisode.title}</div>
                  <div className="user-muted user-small">
                    {selectedEpisode.number ? `E${selectedEpisode.number} • ` : ''}
                    {selectedEpisode.duration ? formatDuration(selectedEpisode.duration) : '—'} •{' '}
                    {selectedEpisode.publishedAt ? relativeDate(selectedEpisode.publishedAt) : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {!selectedEpisode.isFree && (
                    <>
                      {selectedEpisode.priceInCoins ? (
                        <div className="user-price-badge">{selectedEpisode.priceInCoins} coins</div>
                      ) : selectedEpisode.priceCents ? (
                        <div className="user-price-badge">{formatMoneyFromCents(selectedEpisode.priceCents, selectedEpisode.currency)}</div>
                      ) : null}
                      {isLoggedIn ? (
                        purchasedEpisodes.has(selectedEpisode.id) ? (
                          <span className="user-purchased-badge">
                            <FaCheckCircle /> Purchased
                          </span>
                        ) : (
                          <RippleButton
                            className="user-ctrl user-buy user-small"
                            onClick={() => handleBuyClick(selectedEpisode.raw)}
                            disabled={!!purchasingEpisodeId}
                          >
                            {purchasingEpisodeId === selectedEpisode.id ? 'Buying...' : 'Buy'}
                          </RippleButton>
                        )
                      ) : (
                        <button className="user-ctrl user-buy user-small" onClick={requireLogin}>Buy (Login)</button>
                      )}
                    </>
                  )}
                  {isLoggedIn ? (
                    <RippleButton
                      className="user-ctrl user-play user-small"
                      onClick={() => playEpisode(selectedEpisode.raw)}
                      aria-label="Play selected episode"
                    >
                      <FaPlay />
                    </RippleButton>
                  ) : (
                    <button className="user-ctrl user-play user-small" onClick={requireLogin}>
                      <FaPlay /> Play
                    </button>
                  )}
                  <RippleButton
                    className="user-ctrl"
                    onClick={() => setSelectedEpisode(null)}
                    aria-label="Close"
                  >
                    <FaTimes />
                  </RippleButton>
                </div>
              </div>
              {selectedEpisode.description && (
                <div style={{ marginTop: 8 }} className="user-muted user-small">
                  {selectedEpisode.description}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <aside className="user-series-right">
        <div className="user-episodes-header user-top">
          <div>
            <h3 className="user-section-title user-small">
              {activeTab === 'episodes' ? 'Episodes' : 'Reviews'}
            </h3>
            <div className="user-muted user-small">
              {activeTab === 'episodes'
                ? `All ${episodes.length} episodes`
                : `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`}
            </div>
          </div>
          <div className="user-tab-buttons" style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`user-tab-button ${activeTab === 'episodes' ? 'user-active' : ''}`}
              onClick={() => setActiveTab('episodes')}
            >
              Episodes
            </button>
            <button
              className={`user-tab-button ${activeTab === 'reviews' ? 'user-active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
          </div>
        </div>

        {activeTab === 'episodes' ? (
          <div className="user-episodes-list">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="user-episode-row user-skeleton" style={{ height: '68px' }} />)
              : episodes.map((eRaw, idx) => {
                  const e = mapEpisode(eRaw, idx);
                  const isPlaying = player.episodeId === e.id;
                  const isSelected = selectedEpisode && selectedEpisode.id === e.id;
                  const isPurchased = purchasedEpisodes.has(e.id);
                  return (
                    <EpisodeCard
                      key={e.id || idx}
                      episode={e}
                      rawEpisode={eRaw}
                      index={idx}
                      isPlaying={isPlaying}
                      isSelected={isSelected}
                      onSelect={selectEpisodeWithoutPlay}
                      onPlay={isLoggedIn ? playEpisode : requireLogin}
                      onBuy={isLoggedIn ? handleBuyClick : requireLogin}
                      purchasingId={purchasingEpisodeId}
                      isPurchased={isPurchased}
                    />
                  );
                })}
          </div>
        ) : (
          <div className="user-reviews-list">
            {loadingReviews ? (
              <div className="user-loading-reviews">Loading reviews...</div>
            ) : reviewError ? (
              <div className="user-error">{reviewError}</div>
            ) : (
              <>
                {isLoggedIn && (
                  <div className="user-my-review-area" style={{ marginBottom: '20px' }}>
                    {myReview ? (
                      <div className="user-my-review">
                        <h4>Your Review</h4>
                        <ReviewCard review={myReview} isOwn={true} />
                        <div className="user-my-review-actions" style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                          <button className="user-small-button" onClick={handleOpenReviewForm}>Edit</button>
                          <button className="user-small-button" onClick={handleDeleteReview}>Delete</button>
                        </div>
                      </div>
                    ) : (
                      <div className="user-no-review">
                        <p>You haven't reviewed this series yet.</p>
                        <button className="user-small-button" onClick={handleOpenReviewForm}>Write a Review</button>
                      </div>
                    )}
                  </div>
                )}

                <div className="user-all-reviews">
                  <h4>Community Reviews</h4>
                  {reviews.length === 0 ? (
                    <p>No reviews yet. {isLoggedIn ? 'Be the first to review!' : 'Log in to be the first to review.'}</p>
                  ) : (
                    reviews.map((review) => (
                      <ReviewCard
                        key={review.reviewId}
                        review={review}
                        isOwn={false}
                      />
                    ))
                  )}
                </div>
              </>
            )}

            {showReviewForm && isLoggedIn && (
              <div className="user-review-form-overlay">
                <div className="user-review-form">
                  <h3>{myReview ? 'Edit Your Review' : 'Write a Review'}</h3>
                  <div className="user-form-group">
                    <label>Rating:</label>
                    <RatingInput value={formRating} onChange={setFormRating} />
                  </div>
                  <div className="user-form-group">
                    <label>Review (optional):</label>
                    <textarea
                      rows="4"
                      value={formText}
                      onChange={(e) => setFormText(e.target.value)}
                      placeholder="Share your thoughts..."
                    />
                  </div>
                  <div className="user-form-actions">
                    <button onClick={handleCloseReviewForm} disabled={submittingReview}>
                      Cancel
                    </button>
                    <button onClick={handleSubmitReview} disabled={submittingReview}>
                      {submittingReview ? 'Saving...' : myReview ? 'Update' : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </section>
  );
};

export default SeriesDetailPage;