import React from 'react';

const SeriesCard = ({ series, onClick }) => {
  return (
    <article className="user-card user-clickable" onClick={onClick} title={series.title}>
      <div className="user-card-art">
        <div className="user-card-badge">{series.completed ? 'COMPLETED' : 'SERIES'}</div>
        {series.cover ? (
          <img className="user-card-thumb" src={series.cover} alt={series.title} />
        ) : (
          <div className="user-card-thumb" />
        )}
      </div>
      <div className="user-card-body">
        <div className="user-plays">{series.plays} PLAYS</div>
        <div className="user-card-title">{series.title}</div>
        <div className="user-card-meta">
          <span className="user-muted">{series.category}</span>
        </div>
      </div>
    </article>
  );
};

export default SeriesCard;