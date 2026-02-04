import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPlayCircle,
  FiPauseCircle,
  FiUpload,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiMusic,
  FiHeadphones,
  FiList,
  FiAlertCircle
} from 'react-icons/fi';
import EpisodeModal from '../components/EpisodeModal';
import AudioUploadModal from '../components/AudioUploadModal';
import EpisodeService from '../services/EpisodeService';
import SeriesService from '../services/SeriesService';
import FileService from '../services/FileService';

const EpisodeManagement = () => {
  const { seriesId: rawSeriesId } = useParams();
  const navigate = useNavigate();

  // Helper: UUID regex (v1-v5)
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

  const PAGE_SIZE = 10;

  // Validate and normalize seriesId whenever params change
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
      setPage(0); // reset paging when series changes
      setLoading(true);
    }
  }, [rawSeriesId]);

  // Fetch episodes and series info when relevant params change
  useEffect(() => {
    // Only fetch when we either have no seriesId (global mode) OR a valid UUID seriesId
    if (rawSeriesId && !seriesId) {
      // rawSeriesId was present but invalid -> don't fetch
      return;
    }

    fetchEpisodes();
    if (seriesId) {
      fetchSeriesInfo();
    } else {
      setSeriesInfo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters, seriesId]);

  // Helper to unwrap axios or plain responses
  const unwrapResponse = (res) => {
    if (!res && res !== 0) return null;
    return res && res.data !== undefined ? res.data : res;
  };

  const fetchSeriesInfo = async () => {
    try {
      const res = await SeriesService.getSeriesById(seriesId);
      const data = unwrapResponse(res);
      setSeriesInfo(data || null);
    } catch (error) {
      console.error('Error fetching series info:', error);
      setSeriesInfo(null);
    }
  };

  const fetchEpisodes = async () => {
    try {
      // If params had an invalid seriesId, bail out (safety)
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

      // pageContent is either raw.content (paged) or raw itself (array) or empty array
      const pageContent = Array.isArray(raw)
        ? raw
        : (raw && Array.isArray(raw.content) ? raw.content : []);

      // Normalize each episode to what the UI expects:
      const processedEpisodes = (pageContent || []).map((ep) => {
        // Duration: check possible fields
        const durationSeconds = ep.durationSeconds ?? ep.duration ?? ep.duration_in_seconds ?? null;

        // File size: prefer raw bytes
        const fileSizeBytes = ep.fileSizeBytes ?? ep.fileSize ?? ep.file_size ?? null;

        // Audio key/url: backend may return audioFileUrl, audioStorageKey, audioUrl, or nothing
        const audioKey = ep.audioFileUrl ?? ep.audioStorageKey ?? ep.audioUrl ?? ep.audioKey ?? null;

        // Build final audioUrl: if it's already an absolute URL, use it; otherwise resolve via FileService
        let audioUrl = null;
        if (audioKey) {
          if (typeof audioKey === 'string' && (audioKey.startsWith('http://') || audioKey.startsWith('https://'))) {
            audioUrl = audioKey;
          } else {
            audioUrl = FileService.getFileUrl(audioKey);
          }
        }

        return {
          ...ep,
          // keep original keys, but provide UI-friendly aliases used by the component:
          duration: durationSeconds, // component reads episode.duration
          durationSeconds,           // normalized
          fileSize: fileSizeBytes,   // component reads episode.fileSize
          fileSizeBytes,
          audioUrl
        };
      });

      setEpisodes(processedEpisodes);

      // Update pagination metadata
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

  // Pagination helpers
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
              <span>Add New Episode</span>
            </button>
          ) : (
            <div className="warning-message">
              <FiAlertCircle />
              <span>Select a series to create episodes</span>
              <button className="btn-secondary" onClick={() => navigate('/admin/series')}>
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
            <span>Back to Series</span>
          </button>
        </div>
      )}

      {creatingWithoutSeries && (
        <div className="alert alert-warning">
          <FiAlertCircle />
          <div>
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
              <span>Status</span>
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

      {!seriesId && (
        <div className="info-card">
          <h4>How to create episodes:</h4>
          <ol>
            <li>Go to <strong>Series</strong> page from the sidebar</li>
            <li>Create a new series or select an existing one</li>
            <li>Click on a series to view details</li>
            <li>From the series detail page, click "Add New Episode"</li>
          </ol>
        </div>
      )}

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
                <div className="episode-number">
                  <span>Episode {episode.episodeNumber}</span>
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
                    <span>{getDurationString(episode.duration)}</span>
                  </div>
                  <div className="meta-item">
                    <FiMusic />
                    <span>{getFileSize(episode.fileSize)}</span>
                  </div>
                  {episode.releaseDate && (
                    <div className="meta-item">
                      <span>{new Date(episode.releaseDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {episode.audioUrl && (
                  <div className="audio-preview">
                    <audio controls className="audio-player">
                      <source src={episode.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
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

                  {!episode.audioUrl && (
                    <button
                      className="action-btn secondary"
                      onClick={() => handleUploadAudio(episode)}
                      title="Upload Audio"
                    >
                      <FiUpload />
                    </button>
                  )}
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
            <button
              className="pagination-nav"
              onClick={handlePrevPage}
              disabled={page === 0}
            >
              <FiChevronLeft />
            </button>

            <div className="pagination-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (page < 3) {
                  pageNum = i;
                } else if (page > totalPages - 4) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`pagination-btn ${page === pageNum ? 'active' : ''}`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>

            <button
              className="pagination-nav"
              onClick={handleNextPage}
              disabled={page >= totalPages - 1}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {showEpisodeModal && seriesId && (
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
            fetchEpisodes();
          }}
        />
      )}
    </div>
  );
};

export default EpisodeManagement;
