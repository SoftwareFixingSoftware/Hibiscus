// src/components/EpisodeCard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStreamUrl } from '../services/episodeService';

const EpisodeCard = ({ episode }) => {
  const { id, title, description, episodeNumber, seasonNumber, duration, createdAt, audioUrl } = episode || {};
  const [streamUrl, setStreamUrl] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (audioUrl) {
      setStreamUrl(audioUrl);
    } else if (id) {
      getStreamUrl(id)
        .then((url) => {
          if (mounted) setStreamUrl(url);
        })
        .catch((err) => {
          console.error('getStreamUrl error', err);
          // optionally setStreamUrl(null)
        });
    }
    return () => {
      mounted = false;
    };
  }, [id, audioUrl]);

  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) : '--';

  return (
    <div className="episode-card">
      <div className="episode-header">
        <span className="episode-number">
          S{seasonNumber || 1}:E{episodeNumber ?? '--'}
        </span>
        <span className={`status-badge published`}>Published</span>
      </div>

      <div className="episode-content">
        <h4 className="episode-title">{title || 'Untitled'}</h4>
        <p className="episode-description">{description ? `${description.substring(0, 100)}...` : 'No description'}</p>
        <div className="episode-meta">
          <span className="meta-item">
            <svg>...</svg> {duration ? `${Math.floor(duration / 60)} min` : '-- min'}
          </span>
          <span className="meta-item">
            <svg>...</svg> {formattedDate}
          </span>
        </div>

        {streamUrl && (
          <div className="audio-preview">
            <audio controls className="audio-player" src={streamUrl}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>

      <div className="episode-actions">
        <div className="action-group">
          <button className="action-btn view" title="Play">▶</button>
          <button className="action-btn secondary" title="Share">📤</button>
        </div>
        <Link to={`/episode/${id}`} className="action-btn-with-text secondary">
          Details
        </Link>
      </div>
    </div>
  );
};

export default EpisodeCard;
