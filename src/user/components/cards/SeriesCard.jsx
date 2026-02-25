import React from 'react';

const SeriesCard = ({ series, onClick }) => {
  return (
    <article className="card clickable" onClick={onClick} title={series.title}>
      <div className="card-art">
        <div className="card-badge">{series.completed ? 'COMPLETED' : 'SERIES'}</div>
        {series.cover ? (
          <img className="card-thumb" src={series.cover} alt={series.title} />
        ) : (
          <div className="card-thumb" />
        )}
      </div>
      <div className="card-body">
        <div className="plays">{series.plays} PLAYS</div>
        <div className="card-title">{series.title}</div>
        <div className="card-meta">
          <span className="muted">{series.category}</span>
        </div>
      </div>
    </article>
  );
};

export default SeriesCard;