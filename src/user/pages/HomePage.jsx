// src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react';
import { getAllSeries } from '../services/seriesService';
import { getLatestEpisodes } from '../services/episodeService';
import SeriesCard from '../components/SeriesCard';
import EpisodeCard from '../components/EpisodeCard';
import SectionHeader from '../components/SectionHeader';

const safeExtractItems = (res) => {
  if (!res) return [];
  // common shapes: { content: [...] } | { items: [...] } | [...] | { data: [...] } | { results: [...] }
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.content)) return res.content;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.results)) return res.results;
  // sometimes API returns { content: { items: [...] } } or wrapper
  if (res.content && Array.isArray(res.content.items)) return res.content.items;
  // fallback: if there's a single object which is actually the item
  return [];
};

const HomePage = () => {
  const [series, setSeries] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loadingSeries, setLoadingSeries] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchHomeData = async () => {
      // reset errors + show loaders
      if (mounted) {
        setError(null);
        setLoadingSeries(true);
        setLoadingEpisodes(true);
      }

      try {
        const results = await Promise.allSettled([
          getAllSeries(0, 8),     // page 0, 8 items
          getLatestEpisodes(0, 6) // page 0, 6 items
        ]);

        // handle series result
        const seriesRes = results[0];
        if (seriesRes.status === 'fulfilled') {
          const items = safeExtractItems(seriesRes.value);
          if (mounted) setSeries(items);
        } else {
          console.error('getAllSeries failed', seriesRes.reason);
          if (mounted) setSeries([]); // keep UI consistent
        }

        // handle episodes result
        const episodesRes = results[1];
        if (episodesRes.status === 'fulfilled') {
          const items = safeExtractItems(episodesRes.value);
          if (mounted) setEpisodes(items);
        } else {
          console.error('getLatestEpisodes failed', episodesRes.reason);
          if (mounted) setEpisodes([]);
        }

        // If both rejected, set a combined error message
        if (results.every(r => r.status === 'rejected')) {
          // Compose a friendly error string
          const reasons = results.map((r, i) => `${i === 0 ? 'series' : 'episodes'}: ${String(r.reason)}`).join(' | ');
          if (mounted) setError(`Failed to load content (${reasons})`);
        }
      } catch (err) {
        // fallback unexpected error
        console.error('fetchHomeData error', err);
        if (mounted) setError(String(err) || 'Unknown error');
      } finally {
        if (mounted) {
          setLoadingSeries(false);
          setLoadingEpisodes(false);
        }
      }
    };

    fetchHomeData();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="admin-content">
        <div className="error-container">
          <h2 style={{ color: 'var(--danger-color)' }}>Oops!</h2>
          <p>Failed to load content: {error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-main" style={{ marginLeft: 0, padding: 0 }}>
      {/* Header – reuse admin header without sidebar toggle */}
      <header className="admin-header">
        <div className="header-left">
          <div className="brand" style={{ marginLeft: 0 }}>
            <div className="brand-logo">
              <span className="logo-text">🎧</span>
            </div>
            <div className="brand-text">
              <h1 className="brand-title">PodcastFM</h1>
              <p className="brand-subtitle">Listen. Anytime.</p>
            </div>
          </div>
          <div className="search-container">
            <svg className="search-icon">🔍</svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search series..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // navigate to search results page
                }
              }}
            />
          </div>
        </div>
        <div className="header-right">
          <button className="notification-btn">
            <span>🔔</span>
          </button>
          <div className="user-menu-container">
            <button className="user-menu-btn">
              <div className="header-user-avatar">JD</div>
              <div className="header-user-info">
                <span className="header-user-name">Guest</span>
                <span className="header-user-role">Listen free</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="admin-content">
        {/* Hero banner – optional static section */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Welcome back 👋</h1>
          <p className="dashboard-subtitle">
            Discover new stories, episodes and series.
          </p>
        </div>

        {/* Popular Series */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader
            title="Popular Series"
            subtitle="Top picks from our catalog"
            linkText="View all series"
            linkUrl="/series"
          />
          {loadingSeries ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p>Loading series...</p>
            </div>
          ) : (
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {series.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          )}
        </section>

        {/* Latest Episodes */}
        <section style={{ marginBottom: '2rem' }}>
          <SectionHeader
            title="Latest Episodes"
            subtitle="Fresh out of the studio"
            linkText="View all episodes"
            linkUrl="/episodes"
          />
          {loadingEpisodes ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p>Loading episodes...</p>
            </div>
          ) : (
            <div className="episodes-grid">
              {episodes.map((ep) => (
                <EpisodeCard key={ep.id} episode={ep} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;
