import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiPlus, FiEdit2, FiTrash2, FiPlayCircle, FiPauseCircle, FiUpload,
  FiFilter, FiChevronLeft, FiChevronRight, FiMusic, FiHeadphones, FiList, FiAlertCircle
} from 'react-icons/fi';
import EpisodeModal from '../components/EpisodeModal';
import AudioUploadModal from '../components/AudioUploadModal';
import EpisodeService from '../services/EpisodeService';
import SeriesService from '../services/SeriesService';

const EpisodeManagement = () => {
  const { seriesId: rawSeriesId } = useParams();
  const navigate = useNavigate();

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isValidUuid = (id) => typeof id === 'string' && UUID_REGEX.test(id.trim());

  const [seriesId, setSeriesId] = useState(rawSeriesId || null);
  const [invalidSeriesId, setInvalidSeriesId] = useState(false);

  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [filters, setFilters] = useState({
    publishedOnly: null,
    sortBy: 'episodeNumber',
    sortDirection: 'asc'
  });
  const [seriesInfo, setSeriesInfo] = useState(null);
  const [creatingWithoutSeries, setCreatingWithoutSeries] = useState(false);
  const [audioVersionTracker, setAudioVersionTracker] = useState({}); // Track audio versions

  const PAGE_SIZE = 10;

  // AUDIO PLAYBACK state & refs
  const audioRefs = useRef(new Map()); // episodeId -> HTMLAudioElement
  const objectUrlMap = useRef(new Map()); // episodeId -> objectUrl
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [loadingAudioId, setLoadingAudioId] = useState(null);

  // Validate seriesId param
  useEffect(() => {
    if (!rawSeriesId) {
      setSeriesId(null);
      setInvalidSeriesId(false);
      setLoading(false);
      return;
    }
    const candidate = rawSeriesId.trim();
    if (!isValidUuid(candidate)) {
      setInvalidSeriesId(true);
      setSeriesId(null);
      setLoading(false);
    } else {
      setInvalidSeriesId(false);
      setSeriesId(candidate);
      setPage(0);
      setLoading(true);
    }
  }, [rawSeriesId]);

  useEffect(() => {
    if (rawSeriesId && !seriesId) return; // invalid id, skip fetch
    fetchEpisodes();
    if (seriesId) fetchSeriesInfo();
    else setSeriesInfo(null);

    return () => {
      // cleanup object URLs on unmount
      objectUrlMap.current.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch (e) {}
      });
      objectUrlMap.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters, seriesId]);

  const unwrapResponse = (res) => {
    if (!res && res !== 0) return null;
    return res && res.data !== undefined ? res.data : res;
  };

  const fetchSeriesInfo = async () => {
    try {
      const res = await SeriesService.getSeriesById(seriesId);
      const data = unwrapResponse(res);
      setSeriesInfo(data || null);
    } catch (err) {
      console.error('Error fetching series info:', err);
      setSeriesInfo(null);
    }
  };

  const fetchEpisodes = async () => {
    try {
      if (rawSeriesId && !seriesId) {
        setEpisodes([]);
        setTotalPages(0);
        setTotalElements(0);
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await EpisodeService.getEpisodesBySeries(seriesId, {
        page, size: PAGE_SIZE, sortBy: filters.sortBy, sortDirection: filters.sortDirection, publishedOnly: filters.publishedOnly
      });
      const raw = unwrapResponse(res) || {};
      const pageContent = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.content) ? raw.content : []);

      // Process episodes - use audioUrl first, then audioStorageKey
      const processedEpisodes = (pageContent || []).map((ep) => {
        const durationSeconds = ep.durationSeconds ?? ep.duration ?? ep.duration_in_seconds ?? null;
        const fileSizeBytes = ep.fileSizeBytes ?? ep.fileSize ?? ep.file_size ?? null;

        // Check all possible audio URL fields
        let audioKey = ep.audioUrl || ep.audioStorageKey || ep.audioFileUrl || ep.audioKey || null;

        // If it's a relative path (starts with series/), convert to absolute URL
        if (audioKey && !audioKey.startsWith('http') && !audioKey.startsWith('blob:')) {
          if (audioKey.startsWith('series/')) {
            audioKey = `http://localhost:9019/api/secure/files/${audioKey}`;
          } else if (!audioKey.includes('/api/')) {
            // Assume it's a relative path to our API
            audioKey = `http://localhost:9019/api/secure/files/${audioKey}`;
          }
        }

        // Clean URL - remove any existing cache busting parameters
        if (audioKey && audioKey.includes('?')) {
          audioKey = audioKey.split('?')[0];
        }

        // Pricing fallbacks:
        const priceInCoins = ep.priceInCoins ?? ep.price_in_coins ?? ep.price_in_coins_amount ?? null;
        const priceCents = ep.priceCents ?? ep.price_cents ?? ep.amount_cents ?? null;
        const currency = ep.currency ?? ep.currency_code ?? 'USD';

        return {
          ...ep,
          duration: durationSeconds,
          durationSeconds,
          fileSize: fileSizeBytes,
          fileSizeBytes,
          audioKey, // Store the clean URL
          hasAudio: !!audioKey,
          priceInCoins,
          priceCents,
          currency
        };
      });

      setEpisodes(processedEpisodes);
      const rawTotalPages = (raw && typeof raw.totalPages === 'number') ? raw.totalPages : (processedEpisodes.length ? 1 : 0);
      const rawTotalElements = (raw && typeof raw.totalElements === 'number') ? raw.totalElements : (Array.isArray(pageContent) ? pageContent.length : processedEpisodes.length);
      setTotalPages(rawTotalPages);
      setTotalElements(rawTotalElements);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching episodes:', error);
      setLoading(false);
    }
  };

  // ---------- AUDIO PLAYBACK HELPERS ----------
  const attachAudioRef = (id, el) => {
    if (!el) audioRefs.current.delete(id);
    else {
      audioRefs.current.set(id, el);
      el.onended = () => setCurrentPlayingId(null);
      // Add error handler
      el.onerror = () => {
        console.error(`Audio playback error for episode ${id}:`, el.error);
        setCurrentPlayingId(null);
        setLoadingAudioId(null);
      };
    }
  };

  const pauseAllExcept = (keepId = null) => {
    audioRefs.current.forEach((audioEl, id) => {
      if (id !== keepId && audioEl && !audioEl.paused) {
        try {
          audioEl.pause();
          audioEl.currentTime = 0;
        } catch (e) {}
      }
    });
    if (keepId === null) setCurrentPlayingId(null);
  };

  const revokeObjectUrl = (episodeId) => {
    const url = objectUrlMap.current.get(episodeId);
    if (url) {
      try { URL.revokeObjectURL(url); } catch (e) {}
      objectUrlMap.current.delete(episodeId);
    }
  };

  // Clear audio cache for a specific episode
  const clearAudioCache = (episodeId) => {
    // Clear object URL if exists
    revokeObjectUrl(episodeId);

    // Clear audio element source
    const audioEl = audioRefs.current.get(episodeId);
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.src = '';
    }

    // Update audio version tracker to force reload
    setAudioVersionTracker(prev => ({
      ...prev,
      [episodeId]: (prev[episodeId] || 0) + 1
    }));
  };

  // SIMPLIFIED AUDIO PLAY HANDLER - Uses the URL directly with cache busting
  const handlePlayClick = async (episode) => {
    const id = episode.id;
    const audioEl = audioRefs.current.get(id);

    if (!audioEl) {
      console.error('Audio element not found for episode:', id);
      return;
    }

    // Toggle pause if same playing
    if (!audioEl.paused && currentPlayingId === id) {
      audioEl.pause();
      setCurrentPlayingId(null);
      return;
    }

    pauseAllExcept(id);

    // Check if we have an audio URL
    if (!episode.audioKey) {
      alert('No audio file available for this episode.');
      return;
    }

    setLoadingAudioId(id);

    try {
      // Clean up previous object URL
      revokeObjectUrl(id);

      // CRITICAL: Add cache busting query parameter with version
      let audioUrl = episode.audioKey;

      // Always add cache busting parameters
      const separator = audioUrl.includes('?') ? '&' : '?';
      const version = audioVersionTracker[id] || 0;
      audioUrl = `${audioUrl}${separator}v=${version}&t=${Date.now()}`;

      // Reset the audio element completely
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.src = audioUrl;

      // Load the new source
      await new Promise((resolve, reject) => {
        audioEl.oncanplay = resolve;
        audioEl.onerror = reject;
        audioEl.load();
      });

      // Try to play
      await audioEl.play();
      setCurrentPlayingId(id);

    } catch (err) {
      console.error('Playback error:', err);

      // Handle specific errors
      if (err.name === 'NotAllowedError') {
        alert('Autoplay was blocked. Please click the play button again.');
      } else if (err.name === 'NetworkError') {
        alert('Network error. Please check your internet connection and try again.');
      } else if (err.name === 'MediaError') {
        alert('Audio format not supported or corrupted file.');
      } else {
        alert('Unable to play audio. The audio file may not be accessible.');
      }

      // Reset audio element
      audioEl.src = '';
    } finally {
      setLoadingAudioId(null);
    }
  };

  // Handle successful audio upload
  const handleAudioUploadSuccess = (episodeId) => {
    // Clear audio cache for this episode
    clearAudioCache(episodeId);

    // Fetch fresh episode data
    fetchEpisodes();
  };

  // ---------- other handlers ----------
  const handleCreate = () => {
    if (!seriesId) {
      setCreatingWithoutSeries(true);
      return;
    }
    setSelectedEpisode(null);
    setShowEpisodeModal(true);
  };

  const handleEdit = (episode) => {
    setSelectedEpisode(episode);
    setShowEpisodeModal(true);
  };

  const handleUploadAudio = (episode) => {
    setSelectedEpisode(episode);
    setShowUploadModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this episode?')) return;
    try {
      await EpisodeService.deleteEpisode(id);
      fetchEpisodes();
    } catch (error) {
      console.error('Error deleting episode:', error);
      alert('Failed to delete episode');
    }
  };

  const handlePublish = async (id) => {
    try {
      await EpisodeService.publishEpisode(id);
      fetchEpisodes();
    } catch (error) {
      console.error('Error publishing episode:', error);
      alert('Failed to publish episode');
    }
  };

  const handleUnpublish = async (id) => {
    try {
      await EpisodeService.unpublishEpisode(id);
      fetchEpisodes();
    } catch (error) {
      console.error('Error unpublishing episode:', error);
      alert('Failed to unpublish episode');
    }
  };

  const getDurationString = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '--';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  // format money from cents
  const formatMoneyFromCents = (cents, currency = 'USD') => {
    if (cents == null) return null;
    const value = (Number(cents) / 100).toFixed(2);
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
    } catch (e) {
      return `${currency} ${value}`;
    }
  };

  const handlePrevPage = () => setPage((p) => Math.max(0, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  if (invalidSeriesId) {
    return (
      <div className="invalid-id-container">
        <h2>Invalid Series ID</h2>
        <p>The series id in the URL does not look like a valid UUID.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" onClick={() => navigate('/admin/series')}>Back to Series</button>
        </div>
      </div>
    );
  }

  if (loading && page === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading episodes...</p>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <div className="header-left">
          <h2 className="page-title">
            {seriesId ? `Episodes - ${seriesInfo?.title || 'Loading...'}` : 'All Episodes'}
          </h2>
          <p className="page-subtitle">
            {seriesId ? (seriesInfo?.description || 'Loading...') : 'View and manage all episodes'}
          </p>
        </div>
        <div className="header-right">
          {seriesId ? (
            <button className="btn-primary" onClick={handleCreate}>
              <FiPlus />
              <span style={{ marginLeft: 8 }}>Add New Episode</span>
            </button>
          ) : (
            <div className="warning-message">
              <FiAlertCircle />
              <span style={{ marginLeft: 8 }}>Select a series to create episodes</span>
              <button className="btn-secondary" style={{ marginLeft: 12 }} onClick={() => navigate('/admin/series')}>
                Go to Series
              </button>
            </div>
          )}
        </div>
      </div>

      {seriesId && (
        <div className="series-breadcrumb">
          <button className="back-link" onClick={() => navigate('/admin/series')}>
            <FiList />
            <span style={{ marginLeft: 8 }}>Back to Series</span>
          </button>
        </div>
      )}

      {creatingWithoutSeries && (
        <div className="alert alert-warning">
          <FiAlertCircle />
          <div style={{ marginLeft: 8 }}>
            <strong>Cannot create episode without a series</strong>
            <p>Please select a series first, or create one from the Series page.</p>
            <div className="alert-actions">
              <button className="btn-primary" onClick={() => navigate('/admin/series')}>
                Go to Series
              </button>
              <button className="btn-secondary" onClick={() => setCreatingWithoutSeries(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="filters-container">
        <div className="filter-controls">
          <div className="filter-group">
            <label className="filter-label">
              <FiFilter />
              <span style={{ marginLeft: 6 }}>Status</span>
            </label>
            <select
              value={filters.publishedOnly === null ? 'all' : filters.publishedOnly ? 'published' : 'draft'}
              onChange={(e) => {
                const value = e.target.value;
                setFilters({
                  ...filters,
                  publishedOnly: value === 'all' ? null : value === 'published'
                });
                setPage(0);
              }}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="published">Published Only</option>
              <option value="draft">Draft Only</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => {
                setFilters({ ...filters, sortBy: e.target.value });
                setPage(0);
              }}
              className="filter-select"
            >
              <option value="episodeNumber">Episode Number</option>
              <option value="createdAt">Created Date</option>
              <option value="title">Title</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Order</label>
            <select
              value={filters.sortDirection}
              onChange={(e) => {
                setFilters({ ...filters, sortDirection: e.target.value });
                setPage(0);
              }}
              className="filter-select"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="episodes-grid">
        {episodes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">🎵</div>
              <h3>No episodes found</h3>
              <p>{seriesId ? 'Get started by creating your first episode' : 'Select a series to view episodes'}</p>
              {seriesId ? (
                <button className="btn-primary" onClick={handleCreate}>
                  Create Episode
                </button>
              ) : (
                <button className="btn-primary" onClick={() => navigate('/admin/series')}>
                  Go to Series
                </button>
              )}
            </div>
          </div>
        ) : (
          episodes.map((episode) => (
            <div key={episode.id} className="episode-card">
              <div className="episode-header">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="episode-number">
                    <span>Episode {episode.episodeNumber}</span>
                  </div>

                  {/* NEW: Season badge */}
                  {episode.seasonNumber && (
                    <span className="season-badge">S{episode.seasonNumber}</span>
                  )}

                  {/* Price badge */}
                  <div>
                    {episode.isFree ? (
                      <span className="status-badge free">Free</span>
                    ) : episode.priceInCoins ? (
                      <span className="status-badge coins">{episode.priceInCoins} coins</span>
                    ) : (episode.priceCents && episode.priceCents > 0) ? (
                      <span className="status-badge money">{formatMoneyFromCents(episode.priceCents, episode.currency)}</span>
                    ) : null}
                  </div>
                </div>

                <span className={`status-badge ${episode.isPublished ? 'published' : 'draft'}`}>
                  {episode.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>

              <div className="episode-content">
                <h3 className="episode-title">{episode.title}</h3>
                <p className="episode-description">
                  {episode.description?.substring(0, 100)}...
                </p>

                <div className="episode-meta">
                  <div className="meta-item">
                    <FiHeadphones />
                    <span style={{ marginLeft: 6 }}>{getDurationString(episode.duration)}</span>
                  </div>
                  <div className="meta-item" style={{ marginLeft: 12 }}>
                    <FiMusic />
                    <span style={{ marginLeft: 6 }}>{getFileSize(episode.fileSize)}</span>
                  </div>
                  {episode.releaseDate && (
                    <div className="meta-item" style={{ marginLeft: 12 }}>
                      <span>{new Date(episode.releaseDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="audio-preview" style={{ marginTop: 12 }}>
                  <audio
                    ref={(el) => attachAudioRef(episode.id, el)}
                    className="audio-player"
                    preload="none"
                    controls
                    onPlay={() => {
                      pauseAllExcept(episode.id);
                      setCurrentPlayingId(episode.id);
                    }}
                    onPause={() => {
                      if (currentPlayingId === episode.id) setCurrentPlayingId(null);
                    }}
                  >
                    Your browser does not support the audio element.
                  </audio>

                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button
                      className="btn-secondary"
                      onClick={() => handlePlayClick(episode)}
                      disabled={loadingAudioId === episode.id}
                      title={currentPlayingId === episode.id ? 'Pause' : 'Play'}
                    >
                      {loadingAudioId === episode.id ? 'Loading…' : (currentPlayingId === episode.id ? <><FiPauseCircle/> Pause</> : <><FiPlayCircle/> Play</>)}
                    </button>

                    {/* Upload/Replace button */}
                    <button
                      className="btn-secondary"
                      onClick={() => handleUploadAudio(episode)}
                      title={episode.hasAudio ? "Replace Audio" : "Upload Audio"}
                      style={{
                        backgroundColor: episode.hasAudio ? '#f59e0b' : '#6b7280',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      <FiUpload /> {episode.hasAudio ? 'Replace' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="episode-actions">
                <div className="action-group">
                  {episode.isPublished ? (
                    <button
                      className="action-btn warning"
                      onClick={() => handleUnpublish(episode.id)}
                      title="Unpublish"
                    >
                      <FiPauseCircle />
                    </button>
                  ) : (
                    <button
                      className="action-btn success"
                      onClick={() => handlePublish(episode.id)}
                      title="Publish"
                    >
                      <FiPlayCircle />
                    </button>
                  )}

                  {/* Upload button */}
                  <button
                    className="action-btn secondary"
                    onClick={() => handleUploadAudio(episode)}
                    title={episode.hasAudio ? "Replace Audio" : "Upload Audio"}
                    style={{
                      backgroundColor: episode.hasAudio ? '#f59e0b' : '#6b7280',
                      color: 'white'
                    }}
                  >
                    <FiUpload />
                  </button>
                </div>

                <div className="action-group">
                  <button
                    className="action-btn edit"
                    onClick={() => handleEdit(episode)}
                    title="Edit"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(episode.id)}
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {episodes.length > 0 && totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, totalElements)} of {totalElements} episodes
          </div>
          <div className="pagination-controls">
            <button className="pagination-nav" onClick={handlePrevPage} disabled={page === 0}><FiChevronLeft /></button>

            <div className="pagination-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i;
                else if (page < 3) pageNum = i;
                else if (page > totalPages - 4) pageNum = totalPages - 5 + i;
                else pageNum = page - 2 + i;
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)} className={`pagination-btn ${page === pageNum ? 'active' : ''}`}>
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>

            <button className="pagination-nav" onClick={handleNextPage} disabled={page >= totalPages - 1}><FiChevronRight /></button>
          </div>
        </div>
      )}

      {showEpisodeModal && (
        <EpisodeModal
          episode={selectedEpisode}
          seriesId={seriesId}
          onClose={() => {
            setShowEpisodeModal(false);
            setSelectedEpisode(null);
          }}
          onSubmit={() => {
            setShowEpisodeModal(false);
            setSelectedEpisode(null);
            fetchEpisodes();
          }}
        />
      )}

      {showUploadModal && selectedEpisode && (
        <AudioUploadModal
          episode={selectedEpisode}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedEpisode(null);
          }}
          onSubmit={() => {
            setShowUploadModal(false);
            setSelectedEpisode(null);
            handleAudioUploadSuccess(selectedEpisode.id);
          }}
        />
      )}
    </div>
  );
};

export default EpisodeManagement;