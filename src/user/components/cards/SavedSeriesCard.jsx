import React from 'react';
import { useNavigate } from 'react-router-dom';
import RippleButton from '../common/RippleButton';
 
const SavedSeriesCard = ({ series, onRemove }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/user/series/${series.id}`);
  };

  const handleRemove = (e) => {
    e.stopPropagation(); // prevent card click
    onRemove(series.id);
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
      <div className="card-body">
        <h4 className="card-title">{series.title}</h4>
        <p className="card-author">{series.author || series.authorName || 'Unknown'}</p>
      </div>
      <RippleButton className="remove-button" onClick={handleRemove} aria-label="Remove from favorites">
        ✕
      </RippleButton>
    </article>
  );
};

export default SavedSeriesCard;