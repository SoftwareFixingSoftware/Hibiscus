import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiPlayCircle,
  FiPauseCircle,
  FiEye,
  FiDownload,
  FiCalendar,
  FiTag,
  FiLink,
  FiPlus,
  FiUpload
} from 'react-icons/fi';
import SeriesService from '../services/SeriesService';
import EpisodeService from '../services/EpisodeService';
import SeasonService from '../services/SeasonService';
import SeasonModal from '../components/SeasonModal';
import SeriesModal from '../components/SeriesModal';          // Import for editing
import SeriesImageUploadModal from '../components/SeriesImageUploadModal';
import '../styles/admin-series.css';

const SeriesDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState([]);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);      // New state for edit modal
  const [stats, setStats] = useState({
    totalEpisodes: 0,
    publishedEpisodes: 0
  });
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);

  useEffect(() => {
    fetchSeriesDetails();
    fetchSeasons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSeriesDetails = async () => {
    try {
      setLoading(true);

      const [seriesData, episodesData] = await Promise.all([
        SeriesService.getSeriesById(id),
        EpisodeService.getEpisodesBySeries(id, {
          page: 0,
          size: 100,
          publishedOnly: true
        })
      ]);

      setSeries(seriesData);

      const episodes = (episodesData && episodesData.content) ? episodesData.content : (episodesData || []);
      const publishedEpisodes = episodes.filter(ep => ep.isPublished);

      setStats({
        totalEpisodes: episodes.length,
        publishedEpisodes: publishedEpisodes.length
      });

      setLoading(false);
    } catch (error) {

      setLoading(false);
    }
  };

  const fetchSeasons = async () => {
    if (!id) return;
    setSeasonsLoading(true);
    try {
      const res = await SeasonService.getSeasonsBySeries(id, { size: 100 });
      const data = res.content || res.data?.content || res.data || [];
      setSeasons(data);
    } catch (error) {

    } finally {
      setSeasonsLoading(false);
    }
  };

  const handleAddSeason = () => {
    setSelectedSeason(null);
    setShowSeasonModal(true);
  };

  const handleEditSeason = (season) => {
    setSelectedSeason(season);
    setShowSeasonModal(true);
  };

  const handleDeleteSeason = async (seasonId) => {
    if (!window.confirm('Delete this season? Episodes in this season will lose their season association.')) return;
    try {
      await SeasonService.deleteSeason(seasonId);
      fetchSeasons();
    } catch (error) {

      alert('Failed to delete season');
    }
  };

  const handleSeasonModalSubmit = () => {
    setShowSeasonModal(false);
    setSelectedSeason(null);
    fetchSeasons();
  };

  // Edit series via modal
  const handleEditSeries = () => {
    setShowEditModal(true);
  };

  const handleEditModalSubmit = () => {
    setShowEditModal(false);
    fetchSeriesDetails();   // Refresh after update
  };

  const handleBack = () => navigate('/admin/series');
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this series? This action cannot be undone.')) return;
    try {
      await SeriesService.deleteSeries(id);
      navigate('/admin/series');
    } catch (error) {

      alert('Failed to delete series');
    }
  };
  const handlePublish = async () => {
    try {
      await SeriesService.updateSeries(id, { isPublished: true });
      fetchSeriesDetails();
    } catch (error) {

      alert('Failed to publish series');
    }
  };
  const handleUnpublish = async () => {
    try {
      await SeriesService.updateSeries(id, { isPublished: false });
      fetchSeriesDetails();
    } catch (error) {

      alert('Failed to unpublish series');
    }
  };
  const handleAddEpisode = () => navigate(`/admin/episodes/series/${id}`);
  const handleUploadCover = () => setShowImageUploadModal(true);

  if (loading) {
    return (
      <div className="adm-loading-container">
        <div className="adm-loading-spinner"></div>
        <p>Loading series details...</p>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="adm-error-container">
        <h2>Series not found</h2>
        <button className="adm-btn-primary" onClick={handleBack}>
          Back to Series
        </button>
      </div>
    );
  }

  return (
    <div className="adm-series-detail-container">
      <div className="adm-detail-header">
        <button className="adm-back-btn" onClick={handleBack}>
          <FiArrowLeft />
          <span>Back to Series</span>
        </button>

        <div className="adm-header-actions">
          <button className="adm-action-btn adm-secondary" onClick={handleUploadCover}>
            <FiUpload />
            <span>Upload Cover</span>
          </button>

          {series.isPublished ? (
            <button className="adm-action-btn adm-warning" onClick={handleUnpublish}>
              <FiPauseCircle />
              <span>Unpublish</span>
            </button>
          ) : (
            <button className="adm-action-btn adm-success" onClick={handlePublish}>
              <FiPlayCircle />
              <span>Publish</span>
            </button>
          )}

          <button className="adm-action-btn adm-edit" onClick={handleEditSeries}>
            <FiEdit2 />
            <span>Edit</span>
          </button>
          <button className="adm-action-btn adm-delete" onClick={handleDelete}>
            <FiTrash2 />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="adm-series-overview">
        <div className="adm-series-cover-large">
          {series.coverImageUrl ? (
            <img src={series.coverImageUrl} alt={series.title} />
          ) : (
            <div className="adm-cover-placeholder">
              <span>{series.title ? series.title.charAt(0) : '?'}</span>
            </div>
          )}
        </div>

        <div className="adm-series-info">
          <div className="adm-series-header">
            <h1 className="adm-series-title">{series.title}</h1>
            <span className={`adm-status-badge large ${series.isPublished ? 'active' : 'draft'}`}>
              {series.isPublished ? 'PUBLISHED' : 'DRAFT'}
            </span>
          </div>

          <p className="adm-series-description">{series.description}</p>

          <div className="adm-series-meta">
            <div className="adm-meta-item">
              <FiCalendar />
              <span>Created: {series.createdAt ? new Date(series.createdAt).toLocaleDateString() : '—'}</span>
            </div>
            <div className="adm-meta-item">
              <FiTag />
              <span>Category: {series.category || 'Uncategorized'}</span>
            </div>
            <div className="adm-meta-item">
              <FiLink />
              <span>Slug: {series.slug || '—'}</span>
            </div>
            <div className="adm-meta-item">
              <span className="adm-rating">★ {series.averageRating?.toFixed(1) || '0.0'}</span>
            </div>
          </div>

          {series.tags && series.tags.length > 0 && (
            <div className="adm-series-tags">
              {series.tags.map((tag, index) => (
                <span key={index} className="adm-tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="adm-stats-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-icon-container">
            <FiPlayCircle className="adm-stat-icon" />
          </div>
          <div className="adm-stat-content">
            <p className="adm-stat-title">Total Episodes</p>
            <h3 className="adm-stat-value">{stats.totalEpisodes}</h3>
          </div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-icon-container">
            <FiPlayCircle className="adm-stat-icon" />
          </div>
          <div className="adm-stat-content">
            <p className="adm-stat-title">Published</p>
            <h3 className="adm-stat-value">{stats.publishedEpisodes}</h3>
          </div>
        </div>
      </div>

      {/* Seasons Section */}
      <div className="adm-seasons-section">
        <div className="adm-section-header">
          <h2 className="adm-section-title">Seasons</h2>
          <div className="adm-section-actions">
            <button className="adm-btn-primary" onClick={handleAddSeason}>
              <FiPlus /> Add Season
            </button>
          </div>
        </div>

        {seasonsLoading ? (
          <div className="adm-loading-spinner small" />
        ) : seasons.length === 0 ? (
          <div className="adm-empty-state small">
            <p>No seasons created yet. Seasons help organize episodes.</p>
          </div>
        ) : (
          <div className="adm-seasons-grid">
            {seasons.map(season => (
              <div key={season.id} className="adm-season-card">
                <div className="adm-season-card-header">
                  <h3 className="adm-season-number">Season {season.seasonNumber}</h3>
                  <div className="adm-season-actions">
                    <button className="adm-icon-btn" onClick={() => handleEditSeason(season)} title="Edit">
                      <FiEdit2 />
                    </button>
                    <button className="adm-icon-btn adm-delete" onClick={() => handleDeleteSeason(season.id)} title="Delete">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                {season.title && <h4 className="adm-season-title">{season.title}</h4>}
                <p className="adm-season-description">{season.description || 'No description'}</p>
                <div className="adm-season-meta">
                  <span className="episode-count">{season.episodeCount || 0} episodes</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="adm-episodes-section">
        <div className="adm-section-header">
          <h2 className="adm-section-title">Episodes</h2>
          <div className="adm-section-actions">
            <button className="adm-btn-secondary" onClick={() => navigate(`/admin/episodes/series/${id}`)}>
              View All Episodes
            </button>
            <button className="adm-btn-primary" onClick={handleAddEpisode}>
              <FiPlus />
              <span>Add New Episode</span>
            </button>
          </div>
        </div>

        <div className="adm-episodes-preview">
          <p>Navigate to the episodes page to view and manage all episodes in this series.</p>
          <button
            className="adm-btn-secondary"
            onClick={() => navigate(`/admin/episodes/series/${id}`)}
          >
            Go to Episodes
          </button>
        </div>
      </div>

      {showImageUploadModal && series && (
        <SeriesImageUploadModal
          series={series}
          onClose={() => setShowImageUploadModal(false)}
          onSubmit={() => {
            setShowImageUploadModal(false);
            fetchSeriesDetails();
          }}
        />
      )}

      {showSeasonModal && (
        <SeasonModal
          season={selectedSeason}
          seriesId={id}
          onClose={() => setShowSeasonModal(false)}
          onSubmit={handleSeasonModalSubmit}
        />
      )}

      {showEditModal && series && (
        <SeriesModal
          series={series}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditModalSubmit}
        />
      )}
    </div>
  );
};

export default SeriesDetail;