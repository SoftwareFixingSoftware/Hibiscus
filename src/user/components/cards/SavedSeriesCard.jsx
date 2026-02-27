import React from 'react';
import { useNavigate } from 'react-router-dom';
import RippleButton from '../common/RippleButton';
import { FaBell, FaBellSlash } from 'react-icons/fa';

/**
 * Expect `series` to be normalized:
 * {
 *   seriesId,
 *   id,
 *   title,
 *   author,
 *   coverImageUrl,
 *   notificationEnabled (boolean)
 * }
 */
const SavedSeriesCard = ({ series, onUnfollow, onToggleNotification }) => {
  const navigate = useNavigate();

  // Prefer series.seriesId but fall back to id
  const seriesId = series.seriesId || series.id;

  const handleClick = () => {
    navigate(`/user/series/${seriesId}`);
  };

  const handleUnfollow = (e) => {
    e.stopPropagation();
    onUnfollow(seriesId);
  };

  const handleNotificationClick = (e) => {
    e.stopPropagation();
    // pass the current boolean state — parent will flip it.
    onToggleNotification(seriesId, !!series.notificationEnabled);
  };

  return (
    <article className="saved-series-card" onClick={handleClick}>
      <div className="card-art">
        {series.coverImageUrl ? (
          <img src={series.coverImageUrl} alt={series.title} />
        ) : (
          <div className="card-placeholder" />
        )}
      </div>

      {/* Stop the article click from firing when interacting with controls */}
      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
        <RippleButton
          className={`notification-toggle ${series.notificationEnabled ? 'active' : ''}`}
          onClick={handleNotificationClick}
          aria-label={series.notificationEnabled ? 'Disable notifications' : 'Enable notifications'}
        >
          {series.notificationEnabled ? <FaBell /> : <FaBellSlash />}
        </RippleButton>

        <RippleButton
          className="remove-button"
          onClick={handleUnfollow}
          aria-label="Unfollow series"
        >
          ✕
        </RippleButton>
      </div>
    </article>
  );
};

export default SavedSeriesCard;