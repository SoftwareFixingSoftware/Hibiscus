import React from 'react';
import { useAudio } from '../../context/AudioContext';
import RippleButton from '../common/RippleButton';
import { formatDuration, formatMoneyFromCents, relativeDate } from '../../utils/episodeHelpers';

const EpisodeCard = ({ episode, rawEpisode, index, isPlaying, isSelected, onSelect, onPlay, onBuy, purchasingId }) => {
  const e = episode; // already mapped

  const buyDisabled = purchasingId !== null && purchasingId !== e.id;

  return (
    <div
      className={`episode-row ${isPlaying ? 'playing' : ''} ${isSelected ? 'selected' : ''}`}
      title={e.title}
      onClick={() => onSelect(rawEpisode, index)}
    >
      <div className="episode-left">
        <div className="episode-number">E{e.number}</div>
        <div className="episode-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="episode-title">{e.title}</div>
            <div>
              {e.isFree ? (
                <span className="price-pill free">Free</span>
              ) : e.priceInCoins ? (
                <span className="price-pill coins">{e.priceInCoins} coins</span>
              ) : e.priceCents ? (
                <span className="price-pill money">{formatMoneyFromCents(e.priceCents, e.currency)}</span>
              ) : null}
            </div>
          </div>
          <div className="muted small">
            {e.duration ? formatDuration(e.duration) : '—'} • {e.publishedAt ? relativeDate(e.publishedAt) : ''}
          </div>
        </div>
      </div>
      <div className="episode-actions">
        <RippleButton
          className="play-circle"
          onClick={(ev) => {
            ev.stopPropagation();
            onPlay(rawEpisode);
          }}
          aria-label={`Play ${e.title}`}
        >
          {isPlaying ? '▮▮' : '▶'}
        </RippleButton>
        {!e.isFree && (
          <RippleButton
            className="buy-short"
            onClick={(ev) => {
              ev.stopPropagation();
              onBuy(rawEpisode);
            }}
            disabled={buyDisabled || purchasingId === e.id}
          >
            {purchasingId === e.id ? 'Buying...' : 'Buy'}
          </RippleButton>
        )}
      </div>
    </div>
  );
};

export default EpisodeCard;