const API_ROOT = process.env.REACT_APP_API_URL || 'http://localhost:9019/api/secure/public';
const API_BASE = `${API_ROOT}/series`;

async function handleJsonResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const message = text || `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const getAllSeries = async (
  page = 0,
  size = 12,
  sortBy = 'createdAt',
  sortDirection = 'desc'
) => {
  const url = new URL(API_BASE);
  url.searchParams.append('page', page);
  url.searchParams.append('size', size);
  url.searchParams.append('sortBy', sortBy);
  url.searchParams.append('sortDirection', sortDirection);
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    credentials: 'include'          // ✅ cookies included
  });
  return handleJsonResponse(res);
};

export const getSeriesById = async (id) => {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  return handleJsonResponse(res);
};

export const searchSeries = async (keyword, page = 0, size = 20) => {
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.append('keyword', keyword);
  url.searchParams.append('page', page);
  url.searchParams.append('size', size);
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  return handleJsonResponse(res);
};

const seriesService = {
  getAllSeries,
  getSeriesById,
  searchSeries,
};

export default seriesService;