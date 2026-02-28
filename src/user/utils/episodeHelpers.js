// src/utils/episodeHelpers.js

export const mapSeries = (s) => ({
  id: s.id || s.uuid,
  title: s.title || s.name,
  description: s.description || s.summary || '',
  cover: s.coverImageUrl || s.thumbnail || s.imageUrl || null,       // for home page cards
  coverImageUrl: s.coverImageUrl || s.thumbnail || s.imageUrl || null, // for series detail page
  completed: s.isCompleted || s.completed || false,
  plays: s.playsDisplay || s.plays || '—',
  category: s.category || 'Uncategorized',
  author: s.authorName || s.author || s.creator || 'Unknown',
  averageRating: s.averageRating, // may be null (no reviews)
  createdAt: s.createdAt,
  raw: s,
});

export const mapEpisode = (e, idx = 0) => {
  const priceInCoins = e.priceInCoins ?? e.price_in_coins ?? e.price_in_coins_amount ?? null;
  const priceCents = e.priceCents ?? e.price_cents ?? e.amount_cents ?? null;
  const currency = e.currency ?? e.currency_code ?? 'USD';
  // ✅ isFree only from server flag – zero prices do NOT automatically mean free
  const isFree = (e.isFree === true) || (e.is_free === true);

  return {
    id: e.id || e.episodeId || e.uuid,
    title: e.title || e.name || e.episodeTitle || `Episode ${idx + 1}`,
    duration: e.durationSeconds || e.duration || null,
    number: e.episodeNumber || e.number || idx + 1,
    publishedAt: e.publishedAt || e.createdAt || null,
    plays: e.playsDisplay || e.plays || '—',
    description: e.description || e.summary || e.note || '',
    raw: e,
    priceInCoins,
    priceCents,
    currency,
    isFree,
  };
};

export const formatDuration = (sec) => {
  const s = Number(sec) || 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

export const relativeDate = (iso) => {
  try {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 1) return 'today';
    if (diff === 1) return '1 day ago';
    if (diff < 30) return `${diff} days ago`;
    const months = Math.floor(diff / 30);
    if (months < 12) return `${months} mo ago`;
    const years = Math.floor(months / 12);
    return `${years} yr${years > 1 ? 's' : ''} ago`;
  } catch {
    return '';
  }
};

export const formatMoneyFromCents = (cents, currency = 'USD') => {
  if (cents == null) return null;
  const value = Number(cents) / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch (e) {
    return `${currency} ${value.toFixed(2)}`;
  }
};