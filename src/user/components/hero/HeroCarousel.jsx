import React, { useState, useEffect, useRef, useCallback } from 'react';
import RippleButton from '../common/RippleButton';

const HeroCarousel = ({ series, onSelectSeries }) => {
  const [heroIndex, setHeroIndex] = useState(0);
  const autoPlayRef = useRef(null);

  const startAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    if (series.length === 0) return;
    autoPlayRef.current = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % series.length);
    }, 5000);
  }, [series.length]);

  const handleHeroNav = (newIndex) => {
    setHeroIndex(newIndex);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      startAutoPlay();
    }
  };

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [startAutoPlay]);

  if (series.length === 0) return null;

  return (
    <div className="hero-carousel">
      {series.map((s, idx) => (
        <div key={s.id} className={`hero-slide ${idx === heroIndex ? 'active' : ''}`}>
          <img
            src={s.cover || 'https://via.placeholder.com/1200x600?text=No+Image'}
            alt={s.title}
            className="hero-image"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/1200x600?text=No+Image')}
          />
          <div className="hero-overlay">
            <div className="hero-meta">
              <span>{s.plays} PLAYS</span>
              <span>• {s.category}</span>
            </div>
            <h2 className="hero-title">{s.title}</h2>
            <p className="hero-description">{s.description}</p>
            <RippleButton className="hero-btn" onClick={() => onSelectSeries(s.raw)}>
              View Series
            </RippleButton>
          </div>
        </div>
      ))}

      <div className="hero-indicators">
        {series.map((_, idx) => (
          <button
            key={idx}
            className={`hero-dot ${idx === heroIndex ? 'active' : ''}`}
            onClick={() => handleHeroNav(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      <div className="hero-nav">
        <button
          className="hero-nav-btn"
          onClick={() => handleHeroNav((heroIndex - 1 + series.length) % series.length)}
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          className="hero-nav-btn"
          onClick={() => handleHeroNav((heroIndex + 1) % series.length)}
          aria-label="Next"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default HeroCarousel;