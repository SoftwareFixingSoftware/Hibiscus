import React from 'react';
import { useNavigate } from 'react-router-dom';
import RippleButton from '../common/RippleButton';
import { FaBell, FaBellSlash } from 'react-icons/fa';

const SavedSeriesCard = ({ series, onUnfollow, onToggleNotification }) => {
  const navigate = useNavigate();
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
    onToggleNotification(seriesId, !!series.notificationEnabled);
  };

  return (
    <article className="user-saved-series-card" onClick={handleClick}>
      <div className="user-card-art">
        {series.coverImageUrl ? (
          <img src={series.coverImageUrl} alt={series.title} />
        ) : (
          <div className="user-card-placeholder" />
        )}
      </div>

      <div className="user-card-body">
        <h3 className="user-card-title">{series.title || 'Untitled'}</h3>
        <p className="user-card-author">{series.author || 'Unknown'}</p>
      </div>

      <div className="user-card-actions" onClick={(e) => e.stopPropagation()}>
        <RippleButton
          className={`user-notification-toggle ${series.notificationEnabled ? 'active' : ''}`}
          onClick={handleNotificationClick}
          aria-label={series.notificationEnabled ? 'Disable notifications' : 'Enable notifications'}
        >
          {series.notificationEnabled ? <FaBell /> : <FaBellSlash />}
        </RippleButton>

        <RippleButton
          className="user-remove-button"
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