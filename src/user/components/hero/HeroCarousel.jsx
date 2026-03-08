import React, { useState, useEffect, useRef, useCallback } from 'react';
import RippleButton from '../common/RippleButton';

// Local SVG placeholder as data URI (no external dependency)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'1200\' height=\'600\' viewBox=\'0 0 1200 600\'%3E%3Crect width=\'1200\' height=\'600\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\'sans-serif\' font-size=\'24\' fill=\'%23999\'%3ENo Image%3C/text%3E%3C/svg%3E';

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
            src={s.cover || PLACEHOLDER_IMAGE}
            alt={s.title}
            className="hero-image"
            onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
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