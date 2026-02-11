const API_ROOT = process.env.REACT_APP_API_URL || 'http://localhost:9019/api/secure/public';
const API_BASE = `${API_ROOT}/episodes`;

async function handleJsonResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const message = text || `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

export const getLatestEpisodes = async (page = 0, size = 8, freeOnly = null) => {
  const url = new URL(`${API_BASE}/latest`);
  url.searchParams.append('page', page);
  url.searchParams.append('size', size);
  if (freeOnly !== null) url.searchParams.append('freeOnly', freeOnly);
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    credentials: 'include'          // ✅ cookies included
  });
  return handleJsonResponse(res);
};

export const getEpisodesBySeries = async (
  seriesId,
  page = 0,
  size = 20,
  sortBy = 'episodeNumber',
  sortDirection = 'asc'
) => {
  const url = new URL(`${API_BASE}/series/${seriesId}`);
  url.searchParams.append('page', page);
  url.searchParams.append('size', size);
  url.searchParams.append('sortBy', sortBy);
  url.searchParams.append('sortDirection', sortDirection);
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  return handleJsonResponse(res);
};

export const getEpisodeById = async (id) => {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  return handleJsonResponse(res);
};

export const getStreamUrl = async (id) => {
  const res = await fetch(`${API_BASE}/${id}/stream-url`, {
    headers: { Accept: 'text/plain' },
    credentials: 'include'
  });
  const text = await handleJsonResponse(res);
  return typeof text === 'string' ? text : String(text);
};

const episodeService = {
  getLatestEpisodes,
  getEpisodesBySeries,
  getEpisodeById,
  getStreamUrl,
};

export default episodeService;