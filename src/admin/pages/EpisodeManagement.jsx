import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiPlus, FiEdit2, FiTrash2, FiPlayCircle, FiPauseCircle, FiUpload,
  FiFilter, FiChevronLeft, FiChevronRight, FiMusic, FiHeadphones, FiList, FiAlertCircle,
  FiExternalLink
} from 'react-icons/fi';
import EpisodeModal from '../components/EpisodeModal';
import AudioUploadModal from '../components/AudioUploadModal';
import EpisodeService from '../services/EpisodeService';
import SeriesService from '../services/SeriesService';
import '../styles/admin-episodes.css';

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
  const [nextEpisodeNumber, setNextEpisodeNumber] = useState(1);
  const [successLink, setSuccessLink] = useState(null); // for success banner

  const PAGE_SIZE = 10;

  // Auto‑dismiss success link after 5 seconds
  useEffect(() => {
    if (successLink) {
      const timer = setTimeout(() => setSuccessLink(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successLink]);

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
    if (rawSeriesId && !seriesId) return;
    fetchEpisodes();
    if (seriesId) fetchSeriesInfo();
    else setSeriesInfo(null);
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
        page,
        size: PAGE_SIZE,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
        publishedOnly: filters.publishedOnly
      });
      const raw = unwrapResponse(res) || {};
      const pageContent = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.content) ? raw.content : []);

      const processedEpisodes = (pageContent || []).map((ep) => {
        const durationSeconds = ep.durationSeconds ?? ep.duration ?? ep.duration_in_seconds ?? null;
        const fileSizeBytes = ep.fileSizeBytes ?? ep.fileSize ?? ep.file_size ?? null;
        const hasAudio = !!(ep.audioUrl || ep.audioStorageKey || ep.audioFileUrl || ep.audioKey);

        const priceInCoins = ep.priceInCoins ?? ep.price_in_coins ?? ep.price_in_coins_amount ?? null;
        const priceCents = ep.priceCents ?? ep.price_cents ?? ep.amount_cents ?? null;
        const currency = ep.currency ?? ep.currency_code ?? 'USD';

        return {
          ...ep,
          duration: durationSeconds,
          durationSeconds,
          fileSize: fileSizeBytes,
          fileSizeBytes,
          hasAudio,
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

  const getNextEpisodeNumber = async () => {
    if (!seriesId) return 1;
    try {
      const res = await EpisodeService.getEpisodesBySeries(seriesId, {
        page: 0,
        size: 1000,
        sortBy: 'episodeNumber',
        sortDirection: 'desc'
      });
      const raw = unwrapResponse(res);
      let episodesList = [];

      if (raw && Array.isArray(raw.content)) {
        episodesList = raw.content;
      } else if (Array.isArray(raw)) {
        episodesList = raw;
      }

      episodesList.sort((a, b) => (b.episodeNumber || 0) - (a.episodeNumber || 0));

      const maxNumber = episodesList.length > 0 ? Math.max(...episodesList.map(e => e.episodeNumber || 0)) : 0;
      return maxNumber + 1;
    } catch (err) {
      console.error('Error fetching next episode number', err);
      return 1;
    }
  };

  const handleCreate = async () => {
    if (!seriesId) {
      setCreatingWithoutSeries(true);
      return;
    }
    const nextNumber = await getNextEpisodeNumber();
    setNextEpisodeNumber(nextNumber);
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

  const handleAudioUploadSuccess = (episodeData) => {
    fetchEpisodes();
    if (episodeData && episodeData.id && episodeData.seriesId) {
      setSuccessLink(`/user/series/${episodeData.seriesId}?episode=${episodeData.id}`);
    }
  };

  if (invalidSeriesId) {
    return (
      <div className="adm-invalid-id-container">
        <h2>Invalid Series ID</h2>
        <p>The series id in the URL does not look like a valid UUID.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="adm-btn-primary" onClick={() => navigate('/admin/series')}>Back to Series</button>
        </div>
      </div>
    );
  }

  if (loading && page === 0) {
    return (
      <div className="adm-loading-container">
        <div className="adm-loading-spinner"></div>
        <p>Loading episodes...</p>
      </div>
    );
  }

  return (
    <div className="adm-management-container">
      <div className="adm-management-header">
        <div className="adm-header-left">
          <h2 className="adm-page-title">
            {seriesId ? `Episodes - ${seriesInfo?.title || 'Loading...'}` : 'All Episodes'}
          </h2>
          <p className="adm-page-subtitle">
            {seriesId ? (seriesInfo?.description || 'Loading...') : 'View and manage all episodes'}
          </p>
        </div>
        <div className="adm-header-right">
          {seriesId ? (
            <button className="adm-btn-primary" onClick={handleCreate}>
              <FiPlus />
              <span style={{ marginLeft: 8 }}>Add New Episode</span>
            </button>
          ) : (
            <div className="adm-warning-message">
              <FiAlertCircle />
              <span style={{ marginLeft: 8 }}>Select a series to create episodes</span>
              <button className="adm-btn-secondary" style={{ marginLeft: 12 }} onClick={() => navigate('/admin/series')}>
                Go to Series
              </button>
            </div>
          )}
        </div>
      </div>

      {seriesId && (
        <div className="adm-series-breadcrumb">
          <button className="adm-back-link" onClick={() => navigate('/admin/series')}>
            <FiList />
            <span style={{ marginLeft: 8 }}>Back to Series</span>
          </button>
        </div>
      )}

      {/* Success banner with link */}
      {successLink && (
        <div className="adm-success-banner">
          <FiExternalLink />
          <span style={{ marginLeft: 8 }}>
            Episode saved!{' '}
            <a href={successLink} target="_blank" rel="noopener noreferrer">
              View episode in user view
            </a>
          </span>
          <button className="adm-close-banner" onClick={() => setSuccessLink(null)}>×</button>
        </div>
      )}

      {creatingWithoutSeries && (
        <div className="adm-alert adm-warning">
          <FiAlertCircle />
          <div style={{ marginLeft: 8 }}>
            <strong>Cannot create episode without a series</strong>
            <p>Please select a series first, or create one from the Series page.</p>
            <div className="adm-alert-actions">
              <button className="adm-btn-primary" onClick={() => navigate('/admin/series')}>
                Go to Series
              </button>
              <button className="adm-btn-secondary" onClick={() => setCreatingWithoutSeries(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="adm-filters-container">
        <div className="adm-filter-controls">
          <div className="adm-filter-group">
            <label className="adm-filter-label">
              <FiFilter />
              <span style={{ marginLeft: 6 }}>Status</span>
            </label>
            <select
              value={filters.publishedOnly === null ? 'all' : filters.publishedOnly ? 'published' : 'draft'}
              onChange={(e) => {
                const value = e.target.value;
                setFilters({ ...filters, publishedOnly: value === 'all' ? null : value === 'published' });
                setPage(0);
              }}
              className="adm-filter-select"
            >
              <option value="all">All Status</option>
              <option value="published">Published Only</option>
              <option value="draft">Draft Only</option>
            </select>
          </div>

          <div className="adm-filter-group">
            <label className="adm-filter-label">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => {
                setFilters({ ...filters, sortBy: e.target.value });
                setPage(0);
              }}
              className="adm-filter-select"
            >
              <option value="episodeNumber">Episode Number</option>
              <option value="createdAt">Created Date</option>
              <option value="title">Title</option>
            </select>
          </div>

          <div className="adm-filter-group">
            <label className="adm-filter-label">Order</label>
            <select
              value={filters.sortDirection}
              onChange={(e) => {
                setFilters({ ...filters, sortDirection: e.target.value });
                setPage(0);
              }}
              className="adm-filter-select"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="adm-episodes-grid">
        {episodes.length === 0 ? (
          <div className="adm-empty-state">
            <div className="adm-empty-content">
              <div className="adm-empty-icon">🎵</div>
              <h3>No episodes found</h3>
              <p>{seriesId ? 'Get started by creating your first episode' : 'Select a series to view episodes'}</p>
              {seriesId ? (
                <button className="adm-btn-primary" onClick={handleCreate}>
                  Create Episode
                </button>
              ) : (
                <button className="adm-btn-primary" onClick={() => navigate('/admin/series')}>
                  Go to Series
                </button>
              )}
            </div>
          </div>
        ) : (
          episodes.map((episode) => (
            <div key={episode.id} className="adm-episode-card">
              <div className="adm-episode-header">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="adm-episode-number">
                    <span>Episode {episode.episodeNumber}</span>
                  </div>
                  {episode.seasonNumber && (
                    <span className="adm-season-badge">S{episode.seasonNumber}</span>
                  )}
                  <div>
                    {episode.isFree ? (
                      <span className="adm-status-badge adm-free">Free</span>
                    ) : episode.priceInCoins ? (
                      <span className="adm-status-badge adm-coins">{episode.priceInCoins} coins</span>
                    ) : (episode.priceCents && episode.priceCents > 0) ? (
                      <span className="adm-status-badge adm-money">{formatMoneyFromCents(episode.priceCents, episode.currency)}</span>
                    ) : null}
                  </div>
                </div>
                <span className={`adm-status-badge ${episode.isPublished ? 'published' : 'draft'}`}>
                  {episode.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>

              <div className="adm-episode-content">
                <h3 className="adm-episode-title">{episode.title}</h3>
                <p className="adm-episode-description">
                  {episode.description?.substring(0, 100)}...
                </p>

                <div className="adm-episode-meta">
                  <div className="adm-meta-item">
                    <FiHeadphones />
                    <span style={{ marginLeft: 6 }}>{getDurationString(episode.duration)}</span>
                  </div>
                  <div className="adm-meta-item" style={{ marginLeft: 12 }}>
                    <FiMusic />
                    <span style={{ marginLeft: 6 }}>{getFileSize(episode.fileSize)}</span>
                  </div>
                  {episode.releaseDate && (
                    <div className="adm-meta-item" style={{ marginLeft: 12 }}>
                      <span>{new Date(episode.releaseDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 12 }}>
                  <button
                    className="adm-btn-secondary"
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

              <div className="adm-episode-actions">
                <div className="adm-action-group">
                  {episode.isPublished ? (
                    <button
                      className="adm-action-btn adm-warning"
                      onClick={() => handleUnpublish(episode.id)}
                      title="Unpublish"
                    >
                      <FiPauseCircle />
                    </button>
                  ) : (
                    <button
                      className="adm-action-btn adm-success"
                      onClick={() => handlePublish(episode.id)}
                      title="Publish"
                    >
                      <FiPlayCircle />
                    </button>
                  )}
                  <button
                    className="adm-action-btn adm-secondary"
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

                <div className="adm-action-group">
                  {/* NEW: View in user interface button */}
                  <button
                    className="adm-action-btn adm-view"
                    onClick={() => window.open(`/user/series/${episode.seriesId || seriesId}?episode=${episode.id}`, '_blank')}
                    title="View in user interface"
                  >
                    <FiExternalLink />
                  </button>
                  <button
                    className="adm-action-btn adm-edit"
                    onClick={() => handleEdit(episode)}
                    title="Edit"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="adm-action-btn adm-delete"
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
        <div className="adm-pagination-container">
          <div className="adm-pagination-info">
            Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, totalElements)} of {totalElements} episodes
          </div>
          <div className="adm-pagination-controls">
            <button className="adm-pagination-nav" onClick={handlePrevPage} disabled={page === 0}><FiChevronLeft /></button>
            <div className="adm-pagination-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i;
                else if (page < 3) pageNum = i;
                else if (page > totalPages - 4) pageNum = totalPages - 5 + i;
                else pageNum = page - 2 + i;
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)} className={`adm-pagination-btn ${page === pageNum ? 'adm-active' : ''}`}>
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>
            <button className="adm-pagination-nav" onClick={handleNextPage} disabled={page >= totalPages - 1}><FiChevronRight /></button>
          </div>
        </div>
      )}

      {showEpisodeModal && (
        <EpisodeModal
          episode={selectedEpisode}
          seriesId={seriesId}
          suggestedEpisodeNumber={nextEpisodeNumber}
          onClose={() => {
            setShowEpisodeModal(false);
            setSelectedEpisode(null);
          }}
          onSubmit={(episodeData) => {
            setShowEpisodeModal(false);
            setSelectedEpisode(null);
            fetchEpisodes();
            if (episodeData && episodeData.id && episodeData.seriesId) {
              setSuccessLink(`/user/series/${episodeData.seriesId}?episode=${episodeData.id}`);
            }
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
          onSubmit={(episodeData) => {
            setShowUploadModal(false);
            setSelectedEpisode(null);
            handleAudioUploadSuccess(episodeData);
          }}
        />
      )}
    </div>
  );
};

export default EpisodeManagement;