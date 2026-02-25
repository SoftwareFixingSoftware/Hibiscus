import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // added useLocation
import { useAudio } from '../context/AudioContext';
import PublicSeriesService from '../services/PublicSeriesService';
import PublicEpisodeService from '../services/PublicEpisodeService';
import { mapSeries, mapEpisode, formatDuration, relativeDate, formatMoneyFromCents } from '../utils/episodeHelpers';
import EpisodeCard from '../components/cards/EpisodeCard';
import RippleButton from '../components/common/RippleButton';

const SeriesDetailPage = () => {
  const { id } = useParams(); // series id from route
  const location = useLocation(); // to read query params
  const navigate = useNavigate();
  const { player, play } = useAudio();

  const [series, setSeries] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [purchasingEpisodeId, setPurchasingEpisodeId] = useState(null);

  // Overlay scroll fade
  const overlayRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  // Load series and episodes on mount or id change
  useEffect(() => {
    if (!id) return;
    loadSeriesAndEpisodes(id);
  }, [id]);

  // After episodes are loaded, check for episode query param
  useEffect(() => {
    if (!episodes.length) return;

    const params = new URLSearchParams(location.search);
    const episodeId = params.get('episode');
    if (episodeId) {
      const foundRaw = episodes.find(e => 
        (e.id === episodeId) || (e.episodeId === episodeId) || (e.uuid === episodeId)
      );
      if (foundRaw) {
        // Find index for proper mapping (mapEpisode uses index for title fallback)
        const index = episodes.findIndex(e => 
          (e.id === episodeId) || (e.episodeId === episodeId) || (e.uuid === episodeId)
        );
        setSelectedEpisode(mapEpisode(foundRaw, index));
      }
    }
  }, [episodes, location.search]);

  useEffect(() => {
    updateOverlayFade();
    const el = overlayRef.current;
    if (!el) return;
    const onScroll = () => updateOverlayFade();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateOverlayFade);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateOverlayFade);
    };
  }, [series, episodes]);

  const loadSeriesAndEpisodes = async (seriesId) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await PublicSeriesService.getSeriesById(seriesId);
      setSeries(detail ? mapSeries(detail) : null);

      const eps = await PublicEpisodeService.getEpisodesBySeries(seriesId, {
        page: 0,
        size: 1000,
        sortBy: 'episodeNumber',
        sortDirection: 'asc',
      });
      const list = Array.isArray(eps) ? eps : eps?.content || eps?.items || [];
      setEpisodes(list);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateOverlayFade = () => {
    const el = overlayRef.current;
    if (!el) {
      setShowTopFade(false);
      setShowBottomFade(false);
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = el;
    setShowTopFade(scrollTop > 6);
    setShowBottomFade(scrollTop + clientHeight < scrollHeight - 6);
  };

  // Access & purchase helpers (unchanged)
  const checkAccess = async (epRaw) => {
    try {
      const id = epRaw.id || epRaw.episodeId || epRaw.uuid;
      if (!id) return false;
      const res = await PublicEpisodeService.checkAccess(id);
      if (typeof res === 'boolean') return res;
      if (res && typeof res.hasAccess === 'boolean') return res.hasAccess;
      return false;
    } catch (err) {
      console.warn('checkAccess error', err);
      return false;
    }
  };

  const purchaseWithCoins = async (epRaw) => {
    try {
      const id = epRaw.id || epRaw.episodeId || epRaw.uuid;
      if (!id) throw new Error('episode id missing');
      let idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `ikey_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const stored = localStorage.getItem(`purchase:${id}`);
      if (stored) idempotencyKey = stored;
      localStorage.setItem(`purchase:${id}`, idempotencyKey);
      setPurchasingEpisodeId(id);
      const resp = await PublicEpisodeService.purchaseEpisodeWithCoins(id, idempotencyKey);
      localStorage.removeItem(`purchase:${id}`);
      const purchased = resp && (resp.purchased === true || resp.success === true || resp.purchased === 'true');
      if (purchased) {
        const hasAccess = await PublicEpisodeService.checkAccess(id);
        return hasAccess;
      } else {
        const msg = resp && (resp.message || resp.error) ? (resp.message || resp.error) : 'Coin purchase failed';
        alert(msg);
        return false;
      }
    } catch (err) {
      console.error('purchaseWithCoins', err);
      const errMsg = err?.response?.data || err.message || 'unknown error';
      alert('Coin purchase failed: ' + (typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)));
      return false;
    } finally {
      setPurchasingEpisodeId(null);
    }
  };

  const purchaseWithMoney = async (epRaw) => {
    try {
      const id = epRaw.id || epRaw.episodeId || epRaw.uuid;
      if (!id) throw new Error('episode id missing');
      const resp = await PublicEpisodeService.createOrderForEpisode(id);
      const approvalUrl = resp?.approvalUrl || resp?.approval_url || resp?.redirect_url;
      if (approvalUrl) {
        window.open(approvalUrl, '_blank');
        alert('A new window was opened for payment. After approval the episode will be available.');
        return true;
      } else {
        alert('Failed to create payment order.');
        return false;
      }
    } catch (err) {
      console.error('purchaseWithMoney', err);
      alert('Payment initiation failed: ' + (err.message || 'unknown error'));
      return false;
    }
  };

  const playEpisode = async (epRaw) => {
    try {
      const id = epRaw.id || epRaw.episodeId || epRaw.uuid;
      if (!id) throw new Error('episode id missing');
      const mapped = mapEpisode(epRaw, 0);

      if (!mapped.isFree) {
        const hasAccess = await checkAccess(epRaw);
        if (!hasAccess) {
          const wantsToBuy = window.confirm(
            mapped.priceInCoins
              ? `This episode costs ${mapped.priceInCoins} coins. Would you like to buy it with your coins now? (OK = buy with coins, Cancel = pay with card/paypal if available)`
              : mapped.priceCents
              ? `This episode costs ${(mapped.priceCents/100).toFixed(2)} ${mapped.currency}. Click OK to buy with PayPal, Cancel to cancel.`
              : `This episode is paid. Would you like to purchase it?`
          );
          if (!wantsToBuy) return;
          if (mapped.priceInCoins) {
            const coinSuccess = await purchaseWithCoins(epRaw);
            if (!coinSuccess) return;
          } else if (mapped.priceCents && mapped.priceCents > 0) {
            const moneyStarted = await purchaseWithMoney(epRaw);
            if (!moneyStarted) return;
            return;
          } else {
            alert('Unable to determine pricing for this episode.');
            return;
          }
        }
      }

      let url = await PublicEpisodeService.getStreamUrl(id);
      if (!url || !/^https?:\/\//i.test(url)) throw new Error('No playable url');

      await play(url, {
        episodeId: id,
        title: epRaw.title || epRaw.name || epRaw.episodeTitle || 'Untitled',
        author: series?.title || series?.name || '',
      });

      setSelectedEpisode(mapped);
    } catch (err) {
      console.error('playEpisode', err);
      alert('Could not play episode — check console.');
    }
  };

  const selectEpisodeWithoutPlay = (epRaw, idx) => {
    setSelectedEpisode(mapEpisode(epRaw, idx));
  };

  const handleBuyClick = async (epRaw) => {
    const mapped = mapEpisode(epRaw);
    if (mapped.priceInCoins) {
      const ok = await purchaseWithCoins(epRaw);
      if (ok) {
        await playEpisode(epRaw);
      }
    } else if (mapped.priceCents) {
      await purchaseWithMoney(epRaw);
    } else {
      alert('No pricing available.');
    }
  };

  const goHome = () => navigate('/user');

  if (error) return <div className="error-message">Error: {error.message}</div>;
  if (!series) return <div className="loading-indicator">Loading series...</div>;

  return (
    <section className="series-detail">
      <div className="series-left">
        <div className="series-cover artwork-area">
          <img src={series.coverImageUrl || series.cover} alt={series.title} />
        </div>
        <div ref={overlayRef} className="series-info-overlay warm-overlay no-scrollbars">
          <div className={`desc-fade fade-top ${showTopFade ? 'visible' : ''}`} />
          <div className={`desc-fade fade-bottom ${showBottomFade ? 'visible' : ''}`} />

          {selectedEpisode && (
            <div className="now-playing-badge">
              <span className="now-playing-icon">▶</span>{' '}
              {player.playing && player.episodeId === selectedEpisode.id ? 'Now Playing:' : 'Selected:'}{' '}
              {selectedEpisode.title}
            </div>
          )}

          <div className="breadcrumb">
            <button className="crumb" onClick={goHome}>Home</button> /{' '}
            <button className="crumb" onClick={goHome}>Series</button> / <strong>{series.title}</strong>
          </div>

          <div className="badges-row">
            <span className="badge genre">#{series.category?.toUpperCase() || 'ROMANCE'}</span>
            {series.completed && <span className="badge completed">COMPLETED SERIES</span>}
          </div>

          <h2 className="series-title">{series.title}</h2>

          <div className="series-meta-row">
            <span className="muted">{series.plays || '—'} PLAYS</span>
            <span className="muted">• ★ {series.averageRating ?? 4.6}</span>
            <span className="muted">• {series.category || 'ROMANCE'}</span>
          </div>

          <div className="series-description-text">{series.description || 'No description provided.'}</div>

          <div className="author-row">
            <div className="muted small">By</div>
            <div style={{ fontWeight: 700, marginLeft: 8 }}>{series.author}</div>
          </div>

          {/* Selected episode panel */}
          {selectedEpisode && (
            <div className="selected-episode-panel" style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{selectedEpisode.title}</div>
                  <div className="muted small">
                    {selectedEpisode.number ? `E${selectedEpisode.number} • ` : ''}
                    {selectedEpisode.duration ? formatDuration(selectedEpisode.duration) : '—'} •{' '}
                    {selectedEpisode.publishedAt ? relativeDate(selectedEpisode.publishedAt) : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {!selectedEpisode.isFree && (
                    <>
                      {selectedEpisode.priceInCoins ? (
                        <div className="price-badge">{selectedEpisode.priceInCoins} coins</div>
                      ) : selectedEpisode.priceCents ? (
                        <div className="price-badge">{formatMoneyFromCents(selectedEpisode.priceCents, selectedEpisode.currency)}</div>
                      ) : null}
                      <RippleButton
                        className="ctrl buy small"
                        onClick={() => handleBuyClick(selectedEpisode.raw)}
                        disabled={!!purchasingEpisodeId}
                      >
                        {purchasingEpisodeId === selectedEpisode.id ? 'Buying...' : 'Buy'}
                      </RippleButton>
                    </>
                  )}
                  <RippleButton
                    className="ctrl play small"
                    onClick={() => playEpisode(selectedEpisode.raw)}
                    aria-label="Play selected episode"
                  >
                    ► Play
                  </RippleButton>
                  <RippleButton className="ctrl" onClick={() => setSelectedEpisode(null)}>
                    Close
                  </RippleButton>
                </div>
              </div>
              {selectedEpisode.description && (
                <div style={{ marginTop: 8 }} className="muted small">
                  {selectedEpisode.description}
                </div>
              )}
            </div>
          )}
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
            ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="episode-row skeleton" style={{ height: '68px' }} />)
            : episodes.map((eRaw, idx) => {
                const e = mapEpisode(eRaw, idx);
                const isPlaying = player.episodeId === e.id;
                const isSelected = selectedEpisode && selectedEpisode.id === e.id;
                return (
                  <EpisodeCard
                    key={e.id || idx}
                    episode={e}
                    rawEpisode={eRaw}
                    index={idx}
                    isPlaying={isPlaying}
                    isSelected={isSelected}
                    onSelect={selectEpisodeWithoutPlay}
                    onPlay={playEpisode}
                    onBuy={handleBuyClick}
                    purchasingId={purchasingEpisodeId}
                  />
                );
              })}
        </div>
      </aside>
    </section>
  );
};

export default SeriesDetailPage;