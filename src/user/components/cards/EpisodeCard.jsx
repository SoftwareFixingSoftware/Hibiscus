import React from 'react';
import { useAudio } from '../../context/AudioContext';
import RippleButton from '../common/RippleButton';
import { formatDuration, formatMoneyFromCents, relativeDate } from '../../utils/episodeHelpers';
import { FaPlay, FaPause, FaShoppingCart, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const EpisodeCard = ({ episode, rawEpisode, index, isPlaying, isSelected, isLoading, onSelect, onPlay, onBuy, purchasingId, isPurchased }) => {
  const e = episode;
  const buyDisabled = purchasingId !== null && purchasingId !== e.id;

  return (
    <div
      className={`user-episode-row ${isPlaying ? 'playing' : ''} ${isSelected ? 'selected' : ''}`}
      title={e.title}
      onClick={() => onSelect(rawEpisode, index)}
    >
      <div className="user-episode-left">
        <div className="user-episode-number">E{e.number}</div>
        <div className="user-episode-meta">
          <div className="user-episode-title-row">
            <span className="user-episode-title">{e.title}</span>
            {e.seasonNumber && <span className="user-season-badge">S{e.seasonNumber}</span>}
            <div>
              {e.isFree ? (
                <span className="user-price-pill free">Free</span>
              ) : isPurchased ? (
                <span className="user-price-pill purchased">
                  <FaCheckCircle /> Purchased
                </span>
              ) : e.priceInCoins ? (
                <span className="user-price-pill coins">{e.priceInCoins} coins</span>
              ) : e.priceCents ? (
                <span className="user-price-pill money">{formatMoneyFromCents(e.priceCents, e.currency)}</span>
              ) : null}
            </div>
          </div>
          <div className="user-muted small">
            {e.duration ? formatDuration(e.duration) : '—'} • {e.publishedAt ? relativeDate(e.publishedAt) : ''}
          </div>
        </div>
      </div>
      <div className="user-episode-actions">
        <RippleButton
          className="user-play-circle"
          onClick={(ev) => {
            ev.stopPropagation();
            onPlay(rawEpisode);
          }}
          disabled={isLoading}
          aria-label={`Play ${e.title}`}
        >
          {isLoading ? <FaSpinner className="user-spinner" /> : (isPlaying ? <FaPause /> : <FaPlay />)}
        </RippleButton>
        {!e.isFree && !isPurchased && (
          <RippleButton
            className="user-buy-short"
            onClick={(ev) => {
              ev.stopPropagation();
              onBuy(rawEpisode);
            }}
            disabled={buyDisabled || purchasingId === e.id}
          >
            {purchasingId === e.id ? 'Buying...' : <><FaShoppingCart /> Buy</>}
          </RippleButton>
        )}
        {!e.isFree && isPurchased && (
          <span className="user-purchased-indicator" title="Purchased">
            <FaCheckCircle />
          </span>
        )}
      </div>
    </div>
  );
};

export default EpisodeCard;