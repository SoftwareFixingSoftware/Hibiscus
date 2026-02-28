import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicSeriesService from '../services/PublicSeriesService';
import { mapSeries } from '../utils/episodeHelpers';
import HeroCarousel from '../components/hero/HeroCarousel';
import SearchBar from '../components/search/SearchBar';
import SeriesCard from '../components/cards/SeriesCard';
import NotificationBell from '../components/NotificationBell';  
import Footer from '../components/common/Footer';

const HomePage = () => {
  const navigate = useNavigate();

  const [allSeries, setAllSeries] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [mode, setMode] = useState('browse');

  const PAGE_SIZE = 100;

  const heroSeries = useMemo(() => {
    return [...allSeries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  }, [allSeries]);

  const categories = useMemo(() => {
    const map = new Map();
    allSeries.forEach((s) => {
      const cat = s.category || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(s);
    });
    return Array.from(map.entries())
      .map(([category, items]) => ({ category, items }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [allSeries]);

  useEffect(() => {
    if (mode === 'browse') {
      loadBrowseSeries();
    }
  }, [mode]);

  useEffect(() => {
    if (searchQuery.trim() !== '') {
      performSearch();
    } else {
      setMode('browse');
    }
  }, [searchTrigger]);

  const loadBrowseSeries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await PublicSeriesService.getAllSeries({ page: 0, size: PAGE_SIZE });
      const list = Array.isArray(res) ? res : res?.content || res?.items || [];
      setAllSeries(list.map(mapSeries));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setMode('search');
    try {
      const res = await PublicSeriesService.searchSeries(searchQuery, { page: 0, size: PAGE_SIZE });
      const list = Array.isArray(res) ? res : res?.content || res?.items || [];
      setSearchResults(list.map(mapSeries));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (q) => setSearchQuery(q);
  const handleSearchSubmit = () => setSearchTrigger(t => t + 1);
  const handleClearSearch = () => {
    setSearchQuery('');
    setMode('browse');
    setSearchTrigger(0);
  };

  const openSeries = (seriesRaw) => {
    const id = seriesRaw.id || seriesRaw.uuid;
    if (id) navigate(`/user/series/${id}`);
  };

  const displaySeries = mode === 'search' ? searchResults : allSeries;

  return (
    <>
      {/* Header with app name and notification bell */}
      <header className="app-header">
        <div className="logo" onClick={() => navigate('/')}>Hibiscus</div>
        <NotificationBell />
      </header>

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onClear={handleClearSearch}
        mode={mode}
      />

      {/* ... rest of the content as before ... */}
      {loading && displaySeries.length === 0 ? (
        <>
          {mode === 'browse' && <div className="hero-carousel skeleton" style={{ height: '460px' }} />}
          {[1, 2, 3].map(i => (
            <div key={i} className="category-section">
              <div className="category-header">
                <div className="skeleton" style={{ width: '200px', height: '32px' }} />
              </div>
              <div className="carousel-wrap category-carousel">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="card skeleton" style={{ height: '220px' }} />
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          {mode === 'browse' && heroSeries.length > 0 && (
            <HeroCarousel series={heroSeries} onSelectSeries={openSeries} />
          )}

          {mode === 'search' && (
            <div className="grid-header" style={{ marginBottom: '24px' }}>
              <h2 className="section-title">Search Results for "{searchQuery}"</h2>
              <div className="muted small">{searchResults.length} items</div>
            </div>
          )}

          {mode === 'browse' &&
            categories.map(({ category, items }) => (
              <section key={category} className="category-section">
                <div className="category-header">
                  <h3 className="category-title">{category}</h3>
                  <span className="category-count">{items.length} series</span>
                </div>
                <div className="carousel-wrap category-carousel">
                  {items.map(s => (
                    <SeriesCard key={s.id} series={s} onClick={() => openSeries(s.raw)} />
                  ))}
                </div>
              </section>
            ))}

          {mode === 'search' && (
            <div className="carousel-wrap large">
              {searchResults.map(s => (
                <SeriesCard key={s.id} series={s} onClick={() => openSeries(s.raw)} />
              ))}
            </div>
          )}

          {displaySeries.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No series found.</div>
          )}
        </>
      )}

      <Footer />
    </>
  );
};

export default HomePage;