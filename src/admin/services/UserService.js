// src/services/UserService.js
import secure from './api';

const DEBUG = false;
const log = (...args) => { if (DEBUG) console.log('[UserService]', ...args); };

/** Detect cancellation across normalized and raw axios error shapes */
const isCanceledError = (err) =>
  !err ? false :
  err?.code === 'ERR_CANCELED' ||
  err?.original?.code === 'ERR_CANCELED' ||
  err?.name === 'CanceledError' ||
  err?.original?.name === 'CanceledError' ||
  err?.name === 'AbortError';

/** Centralized request wrapper that returns response.body or a normalized rejection */
const request = async (promise) => {
  try {
    const res = await promise;
    // axios instance already returns response.data, so just return res
    return res;
  } catch (err) {
    if (isCanceledError(err)) {
      return Promise.reject({ canceled: true });
    }
    if (DEBUG) console.error('[UserService] Request failed:', err);
    return Promise.reject(err);
  }
};

const normalizeQuery = (params = {}) => {
  const out = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    out[k] = v;
  });
  return out;
};

const buildListParams = ({
  q,
  page = 0,
  size = 20,
  sortField = 'createdAt',
  sortDir = 'desc',
  email,
  username,
  locale,
  countryCode,
  active,
  emailVerified,
  admin
} = {}) => {
  const params = normalizeQuery({ q, email, username, locale, countryCode, active, emailVerified, admin });
  params.page = page;
  params.size = size;
  params.sort = `${sortField},${sortDir}`;
  return params;
};

const UserService = {
  listUsers: (params = {}, options = {}) => {
    const query = buildListParams(params);
    log('listUsers', query);
    return request(
      secure.get('/secure/users', { params: query, signal: options.signal })
    );
  },

  getUserById: (id, options = {}) => {
    if (!id) return Promise.reject(new Error('id is required'));
    log('getUserById', id);
    return request(secure.get(`/secure/users/${id}`, { signal: options.signal }));
  },

  getByEmail: (email, options = {}) => {
    if (!email) return Promise.reject(new Error('email is required'));
    log('getByEmail', email);
    return request(secure.get('/secure/users/by-email', { params: { email }, signal: options.signal }));
  },

  getByUsername: (username, options = {}) => {
    if (!username) return Promise.reject(new Error('username is required'));
    log('getByUsername', username);
    return request(secure.get('/secure/users/by-username', { params: { username }, signal: options.signal }));
  },

  getByProvider: (providerUserId, authProvider = 'local', options = {}) => {
    if (!providerUserId) return Promise.reject(new Error('providerUserId is required'));
    log('getByProvider', providerUserId, authProvider);
    return request(secure.get('/secure/users/by-provider', { params: { providerUserId, authProvider }, signal: options.signal }));
  },

  getAllNoPaging: (options = {}) => {
    log('getAllNoPaging');
    return request(secure.get('/secure/users/all', { signal: options.signal }));
  },

  updateUser: (id, payload, options = {}) => {
    if (!id) return Promise.reject(new Error('id is required'));
    log('updateUser', id, payload);
    return request(secure.put(`/secure/users/${id}`, payload, { signal: options.signal }));
  },

  deleteUser: (id, options = {}) => {
    if (!id) return Promise.reject(new Error('id is required'));
    log('deleteUser', id);
    return request(secure.delete(`/secure/users/${id}`, { signal: options.signal }));
  },

  bulkDelete: (ids = [], options = {}) => {
    if (!Array.isArray(ids) || ids.length === 0) return Promise.reject(new Error('ids array required'));
    log('bulkDelete', ids.length);
    return request(secure.post('/secure/users/bulk-delete', { ids }, { signal: options.signal }));
  },

  exportCsv: (params = {}, options = {}) => {
    const query = buildListParams(params);
    log('exportCsv', query);
    return request(secure.get('/secure/users/export', { params: query, responseType: 'blob', signal: options.signal }));
  }
};

export default UserService;