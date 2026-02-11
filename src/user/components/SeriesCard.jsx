import React from 'react';
import { Link } from 'react-router-dom'; // if using react-router

const SeriesCard = ({ series }) => {
  const { id, title, coverImage, totalEpisodes, category, status } = series;

  return (
    <div className="series-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
        <div className="series-cover">
          {coverImage ? (
            <img src={coverImage} alt={title} />
          ) : (
            <div className="series-cover-placeholder">
              {title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="series-info" style={{ flex: 1 }}>
          <h3 className="series-name">{title}</h3>
          {category && <p className="series-category">{category}</p>}
          <div className="episode-count" style={{ alignItems: 'flex-start', transform: 'none' }}>
            <span className="count">{totalEpisodes || 0}</span>
            <span className="label">episodes</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '0.75rem' }}>
        <span className={`status-badge ${status?.toLowerCase()}`}>
          {status || 'Active'}
        </span>
        <Link to={`/series/${id}`} className="action-btn-with-text view">
          View Series
        </Link>
      </div>
    </div>
  );
};

export default SeriesCard;