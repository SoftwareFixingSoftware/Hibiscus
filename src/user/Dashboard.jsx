import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import PublicSeriesService from "./service/PublicSeriesService";
import PublicEpisodeService from "./service/PublicEpisodeService";
import "./Dashboard.css";

// Ripple Button Component (unchanged)
const RippleButton = ({ children, onClick, className = "", ...props }) => {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id, x, y, size }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
    onClick?.(e);
  };

  return (
    <button {...props} className={`ripple-btn ${className}`} onClick={handleClick}>
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
          }}
        />
      ))}
    </button>
  );
};

export default function Dashboard() {
  // ---------- State ----------
  const [allSeries, setAllSeries] = useState([]); // all fetched series (browse mode)
  const [searchResults, setSearchResults] = useState([]); // results when searching
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0); // increment to trigger search

  // UI mode: 'browse' or 'search'
  const [mode, setMode] = useState("browse");

  // Hero carousel
  const [heroIndex, setHeroIndex] = useState(0);
  const autoPlayRef = useRef(null);

  // Audio ref and player state
  const audioRef = useRef(null);
  const [player, setPlayer] = useState({
    playing: false,
    src: "",
    episodeId: null,
    title: "",
    author: "",
  });
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Overlay / details scroll fade state
  const overlayRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  // Transition state for main content fade
  const [transition, setTransition] = useState(false);

  // ---------- Constants ----------
  const PAGE_SIZE = 100; // fetch enough for grouping

  // ---------- Helper: map series ----------
  const mapSeries = (s) => ({
    id: s.id || s.uuid,
    title: s.title || s.name,
    description: s.description || s.summary || "",
    cover: s.coverImageUrl || s.thumbnail || s.imageUrl || null,
    completed: s.isCompleted || s.completed || false,
    plays: s.playsDisplay || s.plays || "—",
    category: s.category || "Uncategorized",
    author: s.authorName || s.author || s.creator || "Unknown",
    createdAt: s.createdAt,
    raw: s,
  });

  // ---------- Derived data (browse mode) ----------
  const heroSeries = useMemo(() => {
    return [...allSeries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  }, [allSeries]);

  const categories = useMemo(() => {
    const map = new Map();
    allSeries.forEach((s) => {
      const cat = s.category || "Uncategorized";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(s);
    });
    return Array.from(map.entries())
      .map(([category, items]) => ({ category, items }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [allSeries]);

  // ---------- Auto-play logic ----------
  const startAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    if (heroSeries.length === 0) return;
    autoPlayRef.current = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSeries.length);
    }, 5000);
  }, [heroSeries.length]);

  const handleHeroNav = (newIndex) => {
    setHeroIndex(newIndex);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      startAutoPlay();
    }
  };

  // ---------- Effects ----------
  // Load initial series (browse mode) on mount and when mode becomes 'browse'
  useEffect(() => {
    if (mode === "browse") {
      loadBrowseSeries();
    }
    // eslint-disable-next-line
  }, [mode]);

  // Perform search when searchTrigger changes
  useEffect(() => {
    if (searchQuery.trim() !== "") {
      performSearch();
    } else {
      setMode("browse");
    }
    // eslint-disable-next-line
  }, [searchTrigger]);

  // Auto-play hero (only in browse mode)
  useEffect(() => {
    if (selectedSeries || mode !== "browse") {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }
    startAutoPlay();
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [selectedSeries, mode, startAutoPlay]);

  // Transition when series changes
  useEffect(() => {
    setTransition(true);
    const timer = setTimeout(() => setTransition(false), 300);
    return () => clearTimeout(timer);
  }, [selectedSeries]);

  // Audio listeners
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const updateTime = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const setAudioDuration = () => setDuration(audio.duration);
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", setAudioDuration);
    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", setAudioDuration);
    };
  }, [player.src]);

  // Overlay fade (detail view)
  useEffect(() => {
    updateOverlayFade();
    const el = overlayRef.current;
    if (!el) return;
    const onScroll = () => updateOverlayFade();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateOverlayFade);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateOverlayFade);
    };
    // eslint-disable-next-line
  }, [selectedSeries, episodes]);

  // ---------- URL sync helpers ----------
  // Parse URL like /series/:seriesId[/episode/:episodeId]?play=true
  const parseLocation = () => {
    try {
      const path = window.location.pathname || "/";
      const seriesMatch = path.match(/^\/series\/([^/]+)(?:\/episode\/([^/]+))?/);
      const params = new URLSearchParams(window.location.search);
      const play = params.get("play") === "true" || params.get("play") === "1";
      if (seriesMatch) {
        return { seriesId: decodeURIComponent(seriesMatch[1]), episodeId: seriesMatch[2] ? decodeURIComponent(seriesMatch[2]) : null, play };
      }
      return { seriesId: null, episodeId: null, play: false };
    } catch {
      return { seriesId: null, episodeId: null, play: false };
    }
  };

  const updateUrlForSeries = (seriesId, replace = false) => {
    const url = seriesId ? `/series/${encodeURIComponent(seriesId)}` : "/";
    if (replace) window.history.replaceState({}, "", url);
    else window.history.pushState({}, "", url);
  };

  const updateUrlForEpisode = (seriesId, episodeId, { play = false, replace = false } = {}) => {
    let url = `/series/${encodeURIComponent(seriesId)}/episode/${encodeURIComponent(episodeId)}`;
    if (play) url += `?play=true`;
    if (replace) window.history.replaceState({}, "", url);
    else window.history.pushState({}, "", url);
  };

  const removePlayParam = (replace = false) => {
    // remove ?play from current url, keep pathname and other params
    const u = new URL(window.location.href);
    u.searchParams.delete("play");
    if (replace) window.history.replaceState({}, "", u.pathname + u.search);
    else window.history.pushState({}, "", u.pathname + u.search);
  };

  // Sync UI with URL (called on mount and on popstate)
  const syncWithUrl = async () => {
    const { seriesId, episodeId, play } = parseLocation();
    if (!seriesId) {
      // go back to listing mode
      setSelectedSeries(null);
      setSelectedEpisode(null);
      setMode("browse");
      return;
    }

    // if we already have this series selected, avoid refetching details unnecessarily
    const alreadySelected = selectedSeries && (selectedSeries.id === seriesId || selectedSeries.uuid === seriesId);

    try {
      setLoading(true);
      if (!alreadySelected) {
        // fetch series detail & episodes
        try {
          const detail = await PublicSeriesService.getSeriesById(seriesId);
          setSelectedSeries(detail || null);
        } catch (err) {
          console.warn("Failed to fetch series detail for URL sync", err);
          setSelectedSeries(null);
        }
      }

      // fetch episodes if possible
      try {
        const eps = await PublicEpisodeService.getEpisodesBySeries(seriesId, {
          page: 0,
          size: 1000,
          sortBy: "episodeNumber",
          sortDirection: "asc",
        });
        const list = Array.isArray(eps) ? eps : eps?.content || eps?.items || [];
        setEpisodes(list || []);
      } catch (err) {
        console.warn("Failed to fetch episodes for URL sync", err);
        setEpisodes([]);
      }

      if (episodeId) {
        // find the episode object in the fetched episodes
        const epRaw = (Array.isArray(episodes) ? episodes : []).find(
          (x) => (x.id || x.episodeId || x.uuid) === episodeId
        );
        // fallback: try fetching if not present (optional)
        const targetEp = epRaw || null;
        setSelectedEpisode(targetEp);
        if (play && targetEp) {
          // if play param present, start play
          await playEpisode(targetEp);
        } else if (!play) {
          // ensure player isn't automatically playing if query doesn't request so
        }
      } else {
        setSelectedEpisode(null);
        if (player.playing && !play) {
          // stop playback if the URL no longer indicates playing
          stopPlayback(true);
        }
      }
    } catch (err) {
      console.error("syncWithUrl", err);
    } finally {
      setLoading(false);
    }
  };

  // listen for browser navigation
  useEffect(() => {
    const onPop = () => {
      syncWithUrl();
    };
    window.addEventListener("popstate", onPop);
    // initial sync on mount
    syncWithUrl();
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line
  }, []);

  // ---------- Data loading functions ----------
  async function loadBrowseSeries() {
    setLoading(true);
    setError(null);
    try {
      const res = await PublicSeriesService.getAllSeries({
        page: 0,
        size: PAGE_SIZE,
      });
      const list = Array.isArray(res) ? res : res?.content || res?.items || [];
      const mapped = list.map(mapSeries);
      setAllSeries(mapped);
    } catch (err) {
      console.error("loadBrowseSeries", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function performSearch() {
    if (!searchQuery.trim()) {
      setMode("browse");
      return;
    }
    setLoading(true);
    setError(null);
    setMode("search");
    try {
      const res = await PublicSeriesService.searchSeries(searchQuery, {
        page: 0,
        size: PAGE_SIZE,
      });
      const list = Array.isArray(res) ? res : res?.content || res?.items || [];
      const mapped = list.map(mapSeries);
      setSearchResults(mapped);
    } catch (err) {
      console.error("performSearch", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  const clearSearch = () => {
    setSearchQuery("");
    setMode("browse");
    setSearchTrigger(0);
    // update url to root (listing)
    window.history.pushState({}, "", "/");
  };

  // openSeries now updates the URL
  async function openSeries(s) {
    setLoading(true);
    setError(null);
    try {
      const id = s.id || s.uuid;
      if (!id) throw new Error("series id missing");

      // Update URL to series route
      updateUrlForSeries(id);

      const detail = await PublicSeriesService.getSeriesById(id);
      setSelectedSeries(detail || s.raw);

      const eps = await PublicEpisodeService.getEpisodesBySeries(id, {
        page: 0,
        size: 1000,
        sortBy: "episodeNumber",
        sortDirection: "asc",
      });
      const list = Array.isArray(eps) ? eps : eps?.content || eps?.items || [];
      setEpisodes(list || []);

      setSelectedEpisode(null);
      setShowTopFade(false);
      setShowBottomFade(false);

      requestAnimationFrame(() => updateOverlayFade());
    } catch (err) {
      console.error("openSeries", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  // ---------- Audio helpers ----------
  const isFullUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s.trim());

  const playEpisode = async (ep) => {
    try {
      const id = ep.id || ep.episodeId || ep.uuid;
      if (!id) throw new Error("episode id missing");

      // Update URL to show episode + set play=true
      const sid = selectedSeries?.id || selectedSeries?.uuid || (ep.seriesId || ep.series?.id) || null;
      if (sid) updateUrlForEpisode(sid, id, { play: true });

      const candidates = [
        "audioStorageKey",
        "audioUrl",
        "audio",
        "audio_storage_key",
        "audio_url",
        "audio_link",
      ];
      let direct = null;
      for (const k of candidates) {
        const v = ep[k];
        if (v && isFullUrl(v)) {
          direct = v.trim();
          break;
        }
      }

      let url = direct;
      if (!url) url = await PublicEpisodeService.getStreamUrl(id);
      if (!url || !isFullUrl(url)) throw new Error("No playable url");

      if (!audioRef.current) audioRef.current = new Audio(url);
      else if (audioRef.current.src !== url) {
        try {
          audioRef.current.pause();
        } catch {}
        audioRef.current = new Audio(url);
      }

      await audioRef.current.play();

      setSelectedEpisode(ep);
      setPlayer({
        playing: true,
        src: url,
        episodeId: id,
        title: ep.title || ep.name || ep.episodeTitle || "Untitled",
        author: selectedSeries?.title || selectedSeries?.name || ep.seriesTitle || "",
      });

      audioRef.current.onended = () => setPlayer((p) => ({ ...p, playing: false }));
      audioRef.current.onpause = () => setPlayer((p) => ({ ...p, playing: false }));
      audioRef.current.onplay = () => setPlayer((p) => ({ ...p, playing: true }));
    } catch (err) {
      console.error("playEpisode", err);
      alert("Could not play episode — check console.");
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    if (player.playing) {
      audioRef.current.pause();
      setPlayer((p) => ({ ...p, playing: false }));
    } else {
      try {
        await audioRef.current.play();
        setPlayer((p) => ({ ...p, playing: true }));
      } catch (err) {
        console.error("togglePlayPause", err);
      }
    }
  };

  // Stop playback and clear player state. If replaceUrl is true, use replaceState (used on pop navigation)
  const stopPlayback = (replaceUrl = false) => {
    try {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
        audioRef.current = null;
      }
    } catch (err) {
      console.warn("stopPlayback err", err);
    }
    setPlayer({
      playing: false,
      src: "",
      episodeId: null,
      title: "",
      author: "",
    });
    setSelectedEpisode(null);
    // remove play param but keep pathname (so we stay on /series/:id or /)
    removePlayParam(replaceUrl);
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    audioRef.current.currentTime = newTime;
  };

  // When clicking an episode row (select episode without playing)
  const selectEpisodeWithoutPlay = (epRaw) => {
    setSelectedEpisode(epRaw);
    const sid = selectedSeries?.id || selectedSeries?.uuid || (epRaw.seriesId || epRaw.series?.id) || null;
    const eid = epRaw.id || epRaw.episodeId || epRaw.uuid;
    if (sid && eid) {
      updateUrlForEpisode(sid, eid);
    }
  };

  // Overlay fade updater
  function updateOverlayFade() {
    const el = overlayRef.current;
    if (!el) {
      setShowTopFade(false);
      setShowBottomFade(false);
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = el;
    setShowTopFade(scrollTop > 6);
    setShowBottomFade(scrollTop + clientHeight < scrollHeight - 6);
  }

  // Formatting helpers
  function formatDuration(sec) {
    const s = Number(sec) || 0;
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function relativeDate(iso) {
    try {
      const d = new Date(iso);
      const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 1) return "today";
      if (diff === 1) return "1 day ago";
      if (diff < 30) return `${diff} days ago`;
      const months = Math.floor(diff / 30);
      if (months < 12) return `${months} mo ago`;
      const years = Math.floor(months / 12);
      return `${years} yr${years > 1 ? "s" : ""} ago`;
    } catch {
      return "";
    }
  }

  // ---------- Render ----------
  if (selectedSeries) {
    // ----- DETAIL VIEW (unchanged layout but breadcrumb links are functional) -----
    return (
      <div className="dash-root">
        <aside className="dash-sidebar">
          <div className="dash-logo">pf</div>
          <div className="dash-nav">
            <RippleButton className="nav-item" onClick={() => { setSelectedSeries(null); window.history.pushState({}, "", "/"); }}>
              ← Home
            </RippleButton>
            <RippleButton className="nav-item">Store</RippleButton>
            <RippleButton className="nav-item">Studio</RippleButton>
            <RippleButton className="nav-item">Profile</RippleButton>
          </div>
        </aside>

        <main className={`dash-main ${transition ? "fade-enter" : ""}`}>
          <section className="series-detail">
            <div className="series-left">
              <div className="series-cover artwork-area">
                <img
                  src={selectedSeries.coverImageUrl || selectedSeries.cover}
                  alt={selectedSeries.title}
                />
              </div>
              <div
                ref={overlayRef}
                className="series-info-overlay warm-overlay no-scrollbars"
              >
                <div className={`desc-fade fade-top ${showTopFade ? "visible" : ""}`} />
                <div className={`desc-fade fade-bottom ${showBottomFade ? "visible" : ""}`} />
                {selectedEpisode && (
                  <div className="now-playing-badge">
                    <span className="now-playing-icon">▶</span> Now Playing:{" "}
                    {selectedEpisode.title || selectedEpisode.name}
                  </div>
                )}
                <div className="breadcrumb">
                  <button className="crumb" onClick={() => { setSelectedSeries(null); setSelectedEpisode(null); window.history.pushState({}, "", "/"); }}>
                    Home
                  </button>{" "}
                  /{" "}
                  <button className="crumb" onClick={() => { setSelectedSeries(null); setSelectedEpisode(null); window.history.pushState({}, "", "/"); }}>
                    Series
                  </button>{" "}
                  / <strong>{selectedSeries.title}</strong>
                </div>
                <div className="badges-row">
                  <span className="badge genre">
                    #{selectedSeries.category?.toUpperCase() || "ROMANCE"}
                  </span>
                  {selectedSeries.isCompleted && (
                    <span className="badge completed">COMPLETED SERIES</span>
                  )}
                </div>
                <h2 className="series-title">{selectedSeries.title}</h2>
                <div className="series-meta-row">
                  <span className="muted">{selectedSeries.plays || "—"} PLAYS</span>
                  <span className="muted">• ★ {selectedSeries.averageRating ?? 4.6}</span>
                  <span className="muted">• {selectedSeries.category || "ROMANCE"}</span>
                </div>
                <div className="series-description-text">
                  {selectedSeries.description || "No description provided."}
                </div>
                <div className="author-row">
                  <div className="muted small">By</div>
                  <div style={{ fontWeight: 700, marginLeft: 8 }}>
                    {selectedSeries.authorName || selectedSeries.author || "Unknown"}
                  </div>
                </div>
              </div>
            </div>

            <aside className="series-right">
              <div className="episodes-header top">
                <div>
                  <h3 className="section-title small">Episodes</h3>
                  <div className="muted small">All {episodes.length} episodes</div>
                </div>
              </div>
              <div className="episodes-list">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="episode-row skeleton" style={{ height: "68px" }} />
                    ))
                  : episodes.map((eRaw, idx) => {
                      const e = mapEpisode(eRaw, idx);
                      const isPlaying = player.episodeId === (e.id || eRaw.id);
                      return (
                        <div
                          key={e.id || idx}
                          className={`episode-row ${isPlaying ? "playing" : ""}`}
                          title={e.title}
                          onClick={() => selectEpisodeWithoutPlay(eRaw)}
                        >
                          <div className="episode-left">
                            <div className="episode-number">E{e.number}</div>
                            <div className="episode-meta">
                              <div className="episode-title">{e.title}</div>
                              <div className="muted small">
                                {e.duration ? formatDuration(e.duration) : "—"} •{" "}
                                {e.publishedAt ? relativeDate(e.publishedAt) : ""}
                              </div>
                            </div>
                          </div>
                          <div className="episode-actions">
                            <RippleButton
                              className="play-circle"
                              onClick={(ev) => { ev.stopPropagation(); playEpisode(eRaw); }}
                              aria-label={`Play ${e.title}`}
                            >
                              {isPlaying ? "▮▮" : "▶"}
                            </RippleButton>
                          </div>
                        </div>
                      );
                    })}
              </div>
            </aside>
          </section>
        </main>

        {/* Mini player */}
        {player.src && (
          <div className="dash-player">
            <div className="player-left">
              <div className="mini-art">EP</div>
              <div className="mini-info">
                <div className="mini-title">{player.title}</div>
                <div className="mini-author muted">{player.author}</div>
              </div>
            </div>
            <div className="player-controls">
              <RippleButton className="ctrl" onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10; }}>◐</RippleButton>
              <RippleButton className="ctrl play" onClick={togglePlayPause}>
                {player.playing ? "▮▮" : "►"}
              </RippleButton>
              <RippleButton className="ctrl" onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10; }}>10s</RippleButton>
              <RippleButton className="ctrl cancel" onClick={() => stopPlayback(false)} title="Stop / Cancel">
                ✕
              </RippleButton>
            </div>
            <div className="player-progress" onClick={handleSeek}>
              <div className="progress-bar"><div className="progress" style={{ width: `${progress}%` }} /></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----- MAIN PAGE (BROWSE or SEARCH) -----
  const displaySeries = mode === "search" ? searchResults : allSeries;

  return (
    <div className="dash-root">
      <aside className="dash-sidebar">
        <div className="dash-logo" onClick={clearSearch} style={{ cursor: "pointer" }}>pf</div>
        <div className="dash-nav">
          <RippleButton className="nav-item active" onClick={clearSearch}>Home</RippleButton>
          <RippleButton className="nav-item">Store</RippleButton>
          <RippleButton className="nav-item">Studio</RippleButton>
          <RippleButton className="nav-item">Profile</RippleButton>
        </div>
      </aside>

      <main className="dash-main">
        {/* Search Bar (only input and clear button) */}
        <div className="search-sort-bar">
          <input
            type="text"
            placeholder="Search series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearchTrigger((t) => t + 1)}
            className="search-input"
          />
          {mode === "search" && (
            <RippleButton className="ctrl" onClick={clearSearch} style={{ padding: "12px 20px" }}>
              ✕ Clear
            </RippleButton>
          )}
        </div>

        {loading && displaySeries.length === 0 ? (
          // Skeleton loading state
          <>
            {mode === "browse" && <div className="hero-carousel skeleton" style={{ height: "460px" }} />}
            {[1, 2, 3].map((i) => (
              <div key={i} className="category-section">
                <div className="category-header">
                  <div className="skeleton" style={{ width: "200px", height: "32px" }} />
                </div>
                <div className="carousel-wrap category-carousel">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="card skeleton" style={{ height: "220px" }} />
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* HERO CAROUSEL (only in browse mode and if there are series) */}
            {mode === "browse" && heroSeries.length > 0 && (
              <div className="hero-carousel">
                {heroSeries.map((s, idx) => (
                  <div key={s.id} className={`hero-slide ${idx === heroIndex ? "active" : ""}`}>
                    <img
                      src={s.cover || "https://via.placeholder.com/1200x600?text=No+Image"}
                      alt={s.title}
                      className="hero-image"
                      onError={(e) => (e.target.src = "https://via.placeholder.com/1200x600?text=No+Image")}
                    />
                    <div className="hero-overlay">
                      <div className="hero-meta">
                        <span>{s.plays} PLAYS</span>
                        <span>• {s.category}</span>
                      </div>
                      <h2 className="hero-title">{s.title}</h2>
                      <p className="hero-description">{s.description}</p>
                      <RippleButton className="hero-btn" onClick={() => openSeries(s.raw)}>
                        View Series
                      </RippleButton>
                    </div>
                  </div>
                ))}

                <div className="hero-indicators">
                  {heroSeries.map((_, idx) => (
                    <button
                      key={idx}
                      className={`hero-dot ${idx === heroIndex ? "active" : ""}`}
                      onClick={() => handleHeroNav(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="hero-nav">
                  <button
                    className="hero-nav-btn"
                    onClick={() => handleHeroNav((heroIndex - 1 + heroSeries.length) % heroSeries.length)}
                    aria-label="Previous"
                  >
                    ‹
                  </button>
                  <button
                    className="hero-nav-btn"
                    onClick={() => handleHeroNav((heroIndex + 1) % heroSeries.length)}
                    aria-label="Next"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}

            {/* Search results header */}
            {mode === "search" && (
              <div className="grid-header" style={{ marginBottom: "24px" }}>
                <h2 className="section-title">Search Results for "{searchQuery}"</h2>
                <div className="muted small">{searchResults.length} items</div>
              </div>
            )}

            {/* CATEGORY ROWS (only in browse mode) */}
            {mode === "browse" &&
              categories.map(({ category, items }) => (
                <section key={category} className="category-section">
                  <div className="category-header">
                    <h3 className="category-title">{category}</h3>
                    <span className="category-count">{items.length} series</span>
                  </div>
                  <div className="carousel-wrap category-carousel">
                    {items.map((s) => (
                      <article
                        key={s.id}
                        className="card clickable"
                        onClick={() => openSeries(s.raw)}
                        title={s.title}
                      >
                        <div className="card-art">
                          <div className="card-badge">{s.completed ? "COMPLETED" : "SERIES"}</div>
                          {s.cover ? (
                            <img className="card-thumb" src={s.cover} alt={s.title} />
                          ) : (
                            <div className="card-thumb" />
                          )}
                        </div>
                        <div className="card-body">
                          <div className="plays">{s.plays} PLAYS</div>
                          <div className="card-title">{s.title}</div>
                          <div className="card-meta">
                            <span className="muted">{s.category}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}

            {/* Search results grid (if in search mode) */}
            {mode === "search" && (
              <div className="carousel-wrap large">
                {searchResults.map((s) => (
                  <article
                    key={s.id}
                    className="card clickable"
                    onClick={() => openSeries(s.raw)}
                    title={s.title}
                  >
                    <div className="card-art">
                      <div className="card-badge">{s.completed ? "COMPLETED" : "SERIES"}</div>
                      {s.cover ? (
                        <img className="card-thumb" src={s.cover} alt={s.title} />
                      ) : (
                        <div className="card-thumb" />
                      )}
                    </div>
                    <div className="card-body">
                      <div className="plays">{s.plays} PLAYS</div>
                      <div className="card-title">{s.title}</div>
                      <div className="card-meta">
                        <span className="muted">{s.category}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {displaySeries.length === 0 && !loading && (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                No series found.
              </div>
            )}

            {/* FOOTER */}
            <footer className="dash-footer">
              <div className="footer-content">
                <div className="footer-section">
                  <h4>Podcast App</h4>
                  <p>© {new Date().getFullYear()} Hibiscus Media. All rights reserved.</p>
                </div>
                <div className="footer-section">
                  <h4>Contact</h4>
                  <ul>
                    <li><a href="mailto:support@podcastapp.com">support@podcastapp.com</a></li>
                    <li><a href="tel:+1234567890">+1 (234) 567-890</a></li>
                  </ul>
                </div>
                <div className="footer-section">
                  <h4>Follow Us</h4>
                  <ul className="social-links">
                    <li><a href="#" target="_blank" rel="noopener noreferrer">Twitter</a></li>
                    <li><a href="#" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                    <li><a href="#" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                  </ul>
                </div>
              </div>
            </footer>
          </>
        )}
      </main>

      {/* Mini player */}
      {player.src && (
        <div className="dash-player">
          <div className="player-left">
            <div className="mini-art">EP</div>
            <div className="mini-info">
              <div className="mini-title">{player.title}</div>
              <div className="mini-author muted">{player.author}</div>
            </div>
          </div>
          <div className="player-controls">
            <RippleButton className="ctrl" onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10; }}>◐</RippleButton>
            <RippleButton className="ctrl play" onClick={togglePlayPause}>
              {player.playing ? "▮▮" : "►"}
            </RippleButton>
            <RippleButton className="ctrl" onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10; }}>10s</RippleButton>
            <RippleButton className="ctrl cancel" onClick={() => stopPlayback(false)} title="Stop / Cancel">
              ✕
            </RippleButton>
          </div>
          <div className="player-progress" onClick={handleSeek}>
            <div className="progress-bar"><div className="progress" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to map episode (used in detail view)
function mapEpisode(e, i) {
  return {
    id: e.id || e.episodeId || e.uuid,
    title: e.title || e.name || e.episodeTitle || `Episode ${i + 1}`,
    duration: e.durationSeconds || e.duration || null,
    number: e.episodeNumber || e.number || i + 1,
    publishedAt: e.publishedAt || e.createdAt || null,
    plays: e.playsDisplay || e.plays || "—",
    raw: e,
  };
}
