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
  FiBarChart2,
  FiPlus,
  FiUpload
} from 'react-icons/fi';
import SeriesService from '../services/SeriesService';
import EpisodeService from '../services/EpisodeService';
import SeasonService from '../services/SeasonService';          // NEW
import SeasonModal from '../components/SeasonModal';            // NEW
import SeriesImageUploadModal from '../components/SeriesImageUploadModal';

const SeriesDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState([]);                  // NEW
  const [seasonsLoading, setSeasonsLoading] = useState(false); // NEW
  const [showSeasonModal, setShowSeasonModal] = useState(false); // NEW
  const [selectedSeason, setSelectedSeason] = useState(null);   // NEW
  const [stats, setStats] = useState({
    totalEpisodes: 0,
    publishedEpisodes: 0,
    totalPlays: 0,
    totalDownloads: 0,
    averageRating: 0
  });
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);

  useEffect(() => {
    fetchSeriesDetails();
    fetchSeasons();                                             // NEW
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
        publishedEpisodes: publishedEpisodes.length,
        totalPlays: episodes.reduce((sum, ep) => sum + (ep.playCount || 0), 0),
        totalDownloads: episodes.reduce((sum, ep) => sum + (ep.downloadCount || 0), 0),
        averageRating: seriesData?.averageRating || 0
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching series details:', error);
      setLoading(false);
    }
  };

  // NEW: fetch seasons
 const fetchSeasons = async () => {
  if (!id) return;
  setSeasonsLoading(true);
  try {
    const res = await SeasonService.getSeasonsBySeries(id, { size: 100 });
    // Handle both wrapped (res.data) and unwrapped (res) responses
    const data = res.content || res.data?.content || res.data || [];
    setSeasons(data);
  } catch (error) {
    console.error('Error fetching seasons:', error);
  } finally {
    setSeasonsLoading(false);
  }
};

  // NEW: season handlers
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
      console.error('Error deleting season:', error);
      alert('Failed to delete season');
    }
  };

  const handleSeasonModalSubmit = () => {
    setShowSeasonModal(false);
    setSelectedSeason(null);
    fetchSeasons();
  };

  // Existing handlers
  const handleBack = () => navigate('/admin/series');
  const handleEdit = () => navigate(`/admin/series/${id}/edit`);
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this series? This action cannot be undone.')) return;
    try {
      await SeriesService.deleteSeries(id);
      navigate('/admin/series');
    } catch (error) {
      console.error('Error deleting series:', error);
      alert('Failed to delete series');
    }
  };
  const handlePublish = async () => {
    try {
      await SeriesService.updateSeries(id, { isPublished: true });
      fetchSeriesDetails();
    } catch (error) {
      console.error('Error publishing series:', error);
      alert('Failed to publish series');
    }
  };
  const handleUnpublish = async () => {
    try {
      await SeriesService.updateSeries(id, { isPublished: false });
      fetchSeriesDetails();
    } catch (error) {
      console.error('Error unpublishing series:', error);
      alert('Failed to unpublish series');
    }
  };
  const handleAddEpisode = () => navigate(`/admin/episodes/series/${id}`);
  const handleUploadCover = () => setShowImageUploadModal(true);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading series details...</p>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="error-container">
        <h2>Series not found</h2>
        <button className="btn-primary" onClick={handleBack}>
          Back to Series
        </button>
      </div>
    );
  }

  return (
    <div className="series-detail-container">
      <div className="detail-header">
        <button className="back-btn" onClick={handleBack}>
          <FiArrowLeft />
          <span>Back to Series</span>
        </button>

        <div className="header-actions">
          <button className="action-btn secondary" onClick={handleUploadCover}>
            <FiUpload />
            <span>Upload Cover</span>
          </button>

          {series.isPublished ? (
            <button className="action-btn warning" onClick={handleUnpublish}>
              <FiPauseCircle />
              <span>Unpublish</span>
            </button>
          ) : (
            <button className="action-btn success" onClick={handlePublish}>
              <FiPlayCircle />
              <span>Publish</span>
            </button>
          )}

          <button className="action-btn edit" onClick={handleEdit}>
            <FiEdit2 />
            <span>Edit</span>
          </button>
          <button className="action-btn delete" onClick={handleDelete}>
            <FiTrash2 />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="series-overview">
        <div className="series-cover-large">
          {series.coverImageUrl ? (
            <img src={series.coverImageUrl} alt={series.title} />
          ) : (
            <div className="cover-placeholder">
              <span>{series.title ? series.title.charAt(0) : '?'}</span>
            </div>
          )}
        </div>

        <div className="series-info">
          <div className="series-header">
            <h1 className="series-title">{series.title}</h1>
            <span className={`status-badge large ${series.isPublished ? 'active' : 'draft'}`}>
              {series.isPublished ? 'PUBLISHED' : 'DRAFT'}
            </span>
          </div>

          <p className="series-description">{series.description}</p>

          <div className="series-meta">
            <div className="meta-item">
              <FiCalendar />
              <span>Created: {series.createdAt ? new Date(series.createdAt).toLocaleDateString() : '—'}</span>
            </div>
            <div className="meta-item">
              <FiTag />
              <span>Category: {series.category || 'Uncategorized'}</span>
            </div>
            <div className="meta-item">
              <FiLink />
              <span>Slug: {series.slug || '—'}</span>
            </div>
            <div className="meta-item">
              <span className="rating">
                ★ {series.averageRating?.toFixed(1) || '0.0'}
              </span>
            </div>
          </div>

          {series.tags && series.tags.length > 0 && (
            <div className="series-tags">
              {series.tags.map((tag, index) => (
                <span key={index} className="tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-container">
            <FiPlayCircle className="stat-icon" />
          </div>
          <div className="stat-content">
            <p className="stat-title">Total Episodes</p>
            <h3 className="stat-value">{stats.totalEpisodes}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-container">
            <FiPlayCircle className="stat-icon" />
          </div>
          <div className="stat-content">
            <p className="stat-title">Published</p>
            <h3 className="stat-value">{stats.publishedEpisodes}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-container">
            <FiEye className="stat-icon" />
          </div>
          <div className="stat-content">
            <p className="stat-title">Total Plays</p>
            <h3 className="stat-value">{stats.totalPlays.toLocaleString()}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-container">
            <FiDownload className="stat-icon" />
          </div>
          <div className="stat-content">
            <p className="stat-title">Downloads</p>
            <h3 className="stat-value">{stats.totalDownloads.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* ========== NEW SEASONS SECTION ========== */}
      <div className="seasons-section">
        <div className="section-header">
          <h2 className="section-title">Seasons</h2>
          <div className="section-actions">
            <button className="btn-primary" onClick={handleAddSeason}>
              <FiPlus /> Add Season
            </button>
          </div>
        </div>

        {seasonsLoading ? (
          <div className="loading-spinner small" />
        ) : seasons.length === 0 ? (
          <div className="empty-state small">
            <p>No seasons created yet. Seasons help organize episodes.</p>
          </div>
        ) : (
          <div className="seasons-grid">
            {seasons.map(season => (
              <div key={season.id} className="season-card">
                <div className="season-card-header">
                  <h3 className="season-number">Season {season.seasonNumber}</h3>
                  <div className="season-actions">
                    <button className="icon-btn" onClick={() => handleEditSeason(season)} title="Edit">
                      <FiEdit2 />
                    </button>
                    <button className="icon-btn delete" onClick={() => handleDeleteSeason(season.id)} title="Delete">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                {season.title && <h4 className="season-title">{season.title}</h4>}
                <p className="season-description">{season.description || 'No description'}</p>
                <div className="season-meta">
                  <span className="episode-count">{season.episodeCount || 0} episodes</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* ========== END SEASONS SECTION ========== */}

      <div className="episodes-section">
        <div className="section-header">
          <h2 className="section-title">Episodes</h2>
          <div className="section-actions">
            <button className="btn-secondary" onClick={() => navigate(`/admin/episodes/series/${id}`)}>
              View All Episodes
            </button>
            <button className="btn-primary" onClick={handleAddEpisode}>
              <FiPlus />
              <span>Add New Episode</span>
            </button>
          </div>
        </div>

        <div className="episodes-preview">
          <p>Navigate to the episodes page to view and manage all episodes in this series.</p>
          <button
            className="btn-secondary"
            onClick={() => navigate(`/admin/episodes/series/${id}`)}
          >
            Go to Episodes
          </button>
        </div>
      </div>

      <div className="analytics-section">
        <div className="section-header">
          <h2 className="section-title">
            <FiBarChart2 />
            <span>Analytics</span>
          </h2>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card">
            <h4>Audience Growth</h4>
            <div className="growth-chart">
              <div className="growth-bar" style={{ height: '80%' }}></div>
              <div className="growth-bar" style={{ height: '90%' }}></div>
              <div className="growth-bar" style={{ height: '75%' }}></div>
              <div className="growth-bar" style={{ height: '95%' }}></div>
              <div className="growth-bar" style={{ height: '85%' }}></div>
            </div>
          </div>

          <div className="analytics-card">
            <h4>Top Episodes</h4>
            <ul className="top-episodes">
              <li>
                <span className="episode-name">The Future of AI</span>
                <span className="episode-plays">2,450 plays</span>
              </li>
              <li>
                <span className="episode-name">Web3 and Blockchain</span>
                <span className="episode-plays">1,980 plays</span>
              </li>
              <li>
                <span className="episode-name">Cybersecurity Essentials</span>
                <span className="episode-plays">1,750 plays</span>
              </li>
            </ul>
          </div>
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
    </div>
  );
};

export default SeriesDetail;