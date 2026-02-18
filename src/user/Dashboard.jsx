import React, { useEffect, useRef, useState } from "react";
import PublicSeriesService from "./service/PublicSeriesService";
import PublicEpisodeService from "./service/PublicEpisodeService";
import "./Dashboard.css";

export default function Dashboard() {
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);
  const [player, setPlayer] = useState({ playing: false, src: "", episodeId: null, title: "", author: "" });

  // overlay & scroll state
  const overlayRef = useRef(null);
  const imageRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [overlayOffset, setOverlayOffset] = useState(0); // how many px the overlay is pulled up
  const [maxOverlayOffset, setMaxOverlayOffset] = useState(0); // maximum pull (60% of image height)

  // constants
  const SERIES_PAGE = 0, SERIES_SIZE = 12;
  const EPISODES_PAGE = 0, EPISODES_SIZE = 1000;

  useEffect(() => {
    loadSeries();
    return () => {
      try { audioRef.current?.pause(); } catch {}
      audioRef.current = null;
    };
    // eslint-disable-next-line
  }, []);

  // Update max offset when image size changes
  useEffect(() => {
    if (!imageRef.current) return;
    const updateMaxOffset = () => {
      const imgHeight = imageRef.current.clientHeight;
      setMaxOverlayOffset(Math.floor(imgHeight * 0.6)); // cover at most 60% of image
    };
    updateMaxOffset();
    window.addEventListener("resize", updateMaxOffset);
    return () => window.removeEventListener("resize", updateMaxOffset);
  }, [selectedSeries]);

  // Listen to main scroll to adjust overlay pull
  useEffect(() => {
    const handleScroll = () => {
      if (!overlayRef.current || !imageRef.current) return;
      const scrollY = window.scrollY;
      const imageRect = imageRef.current.getBoundingClientRect();
      // When the top of the image goes above the viewport, start pulling
      if (imageRect.top < 0) {
        const pull = Math.min(Math.abs(imageRect.top), maxOverlayOffset);
        setOverlayOffset(pull);
      } else {
        setOverlayOffset(0);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [maxOverlayOffset]);

  // Update fades when overlay scrolls
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const updateFade = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setShowTopFade(scrollTop > 6);
      setShowBottomFade(scrollTop + clientHeight < scrollHeight - 6);
    };
    updateFade();
    el.addEventListener("scroll", updateFade, { passive: true });
    return () => el.removeEventListener("scroll", updateFade);
  }, [selectedSeries, episodes]);

  async function loadSeries() {
    setLoading(true);
    setError(null);
    try {
      const res = await PublicSeriesService.getAllSeries({ page: SERIES_PAGE, size: SERIES_SIZE });
      const list = Array.isArray(res) ? res : (res?.content || res?.items || []);
      setSeriesList(list || []);
    } catch (err) {
      console.error("loadSeries", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function openSeries(s) {
    setLoading(true);
    setError(null);
    try {
      const id = s.id || s.uuid;
      if (!id) throw new Error("series id missing");

      const detail = await PublicSeriesService.getSeriesById(id);
      setSelectedSeries(detail || s);

      const eps = await PublicEpisodeService.getEpisodesBySeries(id, {
        page: EPISODES_PAGE, size: EPISODES_SIZE, sortBy: "episodeNumber", sortDirection: "asc"
      });
      const list = Array.isArray(eps) ? eps : (eps?.content || eps?.items || []);
      setEpisodes(list || []);

      setSelectedEpisode(null);
      setShowTopFade(false);
      setShowBottomFade(false);
      setOverlayOffset(0);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error("openSeries", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  const isFullUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s.trim());

  const playEpisode = async (ep) => {
    try {
      const id = ep.id || ep.episodeId || ep.uuid;
      if (!id) throw new Error("episode id missing");

      const candidates = ["audioStorageKey","audioUrl","audio","audio_storage_key","audio_url","audio_link"];
      let direct = null;
      for (const k of candidates) {
        const v = ep[k];
        if (v && isFullUrl(v)) { direct = v.trim(); break; }
      }

      let url = direct;
      if (!url) url = await PublicEpisodeService.getStreamUrl(id);
      if (!url || !isFullUrl(url)) throw new Error("No playable url");

      if (!audioRef.current) audioRef.current = new Audio(url);
      else if (audioRef.current.src !== url) {
        try { audioRef.current.pause(); } catch {}
        audioRef.current = new Audio(url);
      }

      await audioRef.current.play();

      setSelectedEpisode(ep);
      setPlayer({
        playing: true, src: url, episodeId: id,
        title: ep.title || ep.name || ep.episodeTitle || "Untitled",
        author: selectedSeries?.title || selectedSeries?.name || ep.seriesTitle || ""
      });

      audioRef.current.onended = () => setPlayer(p => ({ ...p, playing: false }));
      audioRef.current.onpause = () => setPlayer(p => ({ ...p, playing: false }));
      audioRef.current.onplay = () => setPlayer(p => ({ ...p, playing: true }));
    } catch (err) {
      console.error("playEpisode", err);
      alert("Could not play episode — check console.");
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    if (player.playing) {
      audioRef.current.pause();
      setPlayer(p => ({ ...p, playing: false }));
    } else {
      try {
        await audioRef.current.play();
        setPlayer(p => ({ ...p, playing: true }));
      } catch (err) {
        console.error("togglePlayPause", err);
      }
    }
  };

  const mapSeries = s => ({
    id: s.id || s.uuid, title: s.title || s.name, description: s.description || s.summary || "",
    cover: s.coverImageUrl || s.thumbnail || s.imageUrl || null, completed: s.isCompleted || s.completed || false,
    plays: s.playsDisplay || s.plays || "—", genre: s.genre || (s.tags && s.tags[0]) || "—", author: s.author || s.creator || "Unknown"
  });

  const mapEpisode = (e, i) => ({
    id: e.id || e.episodeId || e.uuid, title: e.title || e.name || e.episodeTitle || `Episode ${i+1}`,
    duration: e.durationSeconds || e.duration || null, number: e.episodeNumber || e.number || (i+1),
    publishedAt: e.publishedAt || e.createdAt || null, plays: e.playsDisplay || e.plays || "—", raw: e
  });

  function formatDuration(sec) {
    const s = Number(sec) || 0; const m = Math.floor(s/60); const r = Math.floor(s%60);
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }
  function relativeDate(iso) {
    try {
      const d = new Date(iso); const diff = Math.floor((Date.now() - d.getTime()) / (1000*60*60*24));
      if (diff<1) return "today"; if (diff===1) return "1 day ago"; if (diff<30) return `${diff} days ago`;
      const months = Math.floor(diff/30); if (months<12) return `${months} mo ago`;
      const years = Math.floor(months/12); return `${years} yr${years>1 ? "s": ""} ago`;
    } catch { return ""; }
  }

  return (
    <div className="dash-root">
      <aside className="dash-sidebar">
        <div className="dash-logo">pf</div>
        <div className="dash-nav">
          <button className="nav-item active">Home</button>
          <button className="nav-item">Store</button>
          <button className="nav-item">Studio</button>
          <button className="nav-item">Profile</button>
        </div>
      </aside>

      <main className="dash-main">
        {!selectedSeries ? (
          <>
            <div className="grid-header">
              <h2 className="section-title">Top Series</h2>
              <div className="muted small">{loading ? "Loading..." : `${seriesList.length} items`}</div>
            </div>

            <div className="carousel-wrap large">
              {seriesList.map(sRaw => {
                const s = mapSeries(sRaw);
                return (
                  <article key={s.id} className="card clickable" onClick={() => openSeries(sRaw)} title={s.title}>
                    <div className="card-art">
                      <div className="card-badge">{s.completed ? "COMPLETED" : "SERIES"}</div>
                      {s.cover ? <img className="card-thumb" src={s.cover} alt={s.title} /> : <div className="card-thumb" />}
                    </div>
                    <div className="card-body">
                      <div className="plays">{s.plays} PLAYS</div>
                      <div className="card-title">{s.title}</div>
                      <div className="card-meta"><span className="muted">{s.genre}</span><span style={{ marginLeft: "auto" }} className="muted">Open</span></div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <section className="series-detail">
            <div className="series-left">
              {/* Image */}
              <div ref={imageRef} className="series-cover artwork-area">
                <img
                  src={selectedSeries.cover || selectedSeries.coverImageUrl}
                  alt={selectedSeries.title}
                />
              </div>

              {/* Overlay panel – starts below image, gets pulled up on scroll */}
              <div
                ref={overlayRef}
                className="series-info-overlay no-scrollbars"
                style={{ transform: `translateY(-${overlayOffset}px)` }}
              >
                <div className={`desc-fade fade-top ${showTopFade ? "visible" : ""}`} />
                <div className={`desc-fade fade-bottom ${showBottomFade ? "visible" : ""}`} />

                {selectedEpisode && (
                  <div className="now-playing-badge">
                    <span className="now-playing-icon">▶</span> Now Playing: {selectedEpisode.title || selectedEpisode.name}
                  </div>
                )}

                <div className="breadcrumb">Home / Series / <strong>{selectedSeries.title}</strong></div>

                <div className="badges-row">
                  <span className="badge genre">#3 IN ROMANCE</span>
                  {selectedSeries.isCompleted && <span className="badge completed">COMPLETED SERIES</span>}
                </div>

                <h2 className="series-title">{selectedSeries.title}</h2>

                <div className="series-meta-row">
                  <span className="muted">{selectedSeries.plays || "—"} PLAYS</span>
                  <span className="muted">• ★ {selectedSeries.averageRating ?? 4.6}</span>
                  <span className="muted">• {selectedSeries.genre || "ROMANCE"}</span>
                </div>

                <div className="series-description-text">
                  {selectedSeries.description || "No description provided."}
                </div>

                <div className="author-row">
                  <div className="muted small">By</div>
                  <div style={{ fontWeight: 700, marginLeft: 8 }}>{selectedSeries.author || selectedSeries.creator || "Unknown"}</div>
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
                {episodes.map((eRaw, idx) => {
                  const e = mapEpisode(eRaw, idx);
                  const isPlaying = player.episodeId === (e.id || eRaw.id);
                  return (
                    <div key={e.id || idx} className={`episode-row ${isPlaying ? "playing" : ""}`} title={e.title}>
                      <div className="episode-left">
                        <div className="episode-number">E{e.number}</div>
                        <div className="episode-meta">
                          <div className="episode-title">{e.title}</div>
                          <div className="muted small">{e.duration ? formatDuration(e.duration) : "—"} • {e.publishedAt ? relativeDate(e.publishedAt) : ""}</div>
                        </div>
                      </div>

                      <div className="episode-actions">
                        <button className="play-circle" onClick={() => playEpisode(eRaw)} aria-label={`Play ${e.title}`}>
                          {isPlaying ? "▮▮" : "▶"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </section>
        )}
      </main>

      {/* mini-player */}
      {player.src ? (
        <div className="dash-player">
          <div className="player-left">
            <div className="mini-art">EP</div>
            <div className="mini-info">
              <div className="mini-title">{player.title}</div>
              <div className="mini-author muted">{player.author}</div>
            </div>
          </div>

          <div className="player-controls">
            <button className="ctrl" onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, (audioRef.current.currentTime || 0) - 10); }}>◐</button>
            <button className="ctrl play" onClick={togglePlayPause}>{player.playing ? "▮▮" : "►"}</button>
            <button className="ctrl" onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10; }}>10s</button>
          </div>

          <div className="player-progress">
            <div className="progress-bar">
              <div className={`progress ${player.playing ? "anim" : ""}`} style={{ width: player.playing ? "25%" : "0%" }} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}