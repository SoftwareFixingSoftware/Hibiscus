// src/admin/pages/AdminUsers.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiUser } from 'react-icons/fi';
import UserService from '../services/UserService';
import { mapDtoToUser, displayName } from '../components/UserModel';

/**
 * Admin users table + detail drawer
 */

const DEFAULT_PAGE_SIZE = 20;

const thStyle = { padding: '12px 10px', fontSize: 13, color: '#374151' };
const tdStyle = { padding: '12px 10px', fontSize: 14, color: '#111827', verticalAlign: 'middle' };
const actionBtn = { padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' };
const pageBtn = { padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' };
const drawerOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', justifyContent: 'flex-end', zIndex: 60 };
const drawer = { width: 520, maxWidth: '100%', height: '100%', background: '#fff', padding: 20, boxShadow: '-8px 0 24px rgba(15,23,42,0.12)', overflow: 'auto' };
const primaryBtn = { padding: '8px 12px', borderRadius: 8, border: 'none', background: '#0ea5a4', color: '#fff', cursor: 'pointer' };
const outlineBtn = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' };

const normalizePage = (body = {}) => {
  // Already the DTO we want:
  if (Array.isArray(body.content)) {
    return {
      content: body.content,
      totalElements: typeof body.totalElements === 'number' ? body.totalElements : (body.total || body.totalElements || 0),
      totalPages: typeof body.totalPages === 'number' ? body.totalPages : Math.ceil((body.total || 0) / (body.size || DEFAULT_PAGE_SIZE)),
      number: typeof body.number === 'number' ? body.number : (body.page || 0),
      size: typeof body.size === 'number' ? body.size : (body.size || DEFAULT_PAGE_SIZE)
    };
  }

  // HATEOAS style: { _embedded: { users: [...] }, page: { totalElements, totalPages, number, size } }
  if (body._embedded) {
    const key = Object.keys(body._embedded)[0];
    const content = Array.isArray(body._embedded[key]) ? body._embedded[key] : [];
    const meta = body.page || {};
    return {
      content,
      totalElements: meta.totalElements || content.length,
      totalPages: meta.totalPages || 1,
      number: typeof meta.number === 'number' ? meta.number : 0,
      size: typeof meta.size === 'number' ? meta.size : DEFAULT_PAGE_SIZE
    };
  }

  // Some older PageImpl serializations use _content or content inside nested fields
  if (Array.isArray(body._content)) {
    return {
      content: body._content,
      totalElements: body.totalElements || 0,
      totalPages: body.totalPages || 0,
      number: body.number || 0,
      size: body.size || DEFAULT_PAGE_SIZE
    };
  }

  // Final fallback: treat body as array
  if (Array.isArray(body)) {
    return {
      content: body,
      totalElements: body.length,
      totalPages: 1,
      number: 0,
      size: body.length
    };
  }

  return { content: [], totalElements: 0, totalPages: 0, number: 0, size: DEFAULT_PAGE_SIZE };
};

const AdminUsers = () => {
  const [internalQ, setInternalQ] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState({ field: 'createdAt', dir: 'desc' });

  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0, number: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // debounce q -> setQ
  useEffect(() => {
    const t = setTimeout(() => setQ(internalQ), 300);
    return () => clearTimeout(t);
  }, [internalQ]);

  const listParams = useCallback(() => ({
    q,
    page,
    size,
    sortField: sort.field,
    sortDir: sort.dir
  }), [q, page, size, sort]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('Fetching users:', listParams());
        const body = await UserService.listUsers(listParams(), { signal });
        console.log('Users API body:', body);

        const normalized = normalizePage(body);
        const content = normalized.content.map(mapDtoToUser);

        setData({
          content,
          totalElements: normalized.totalElements,
          totalPages: normalized.totalPages,
          number: normalized.number
        });
      } catch (err) {
        // canceled
        if (!err) return;
        if (err?.canceled || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError') {
          console.log('Users fetch aborted/canceled');
          return;
        }

        if (err?.response?.status === 403 || err?.status === 403) {
          setError('You do not have permission to view users (403). Ensure your account has ROLE_ADMIN.');
          return;
        }
        if (err?.response?.status === 401 || err?.status === 401) {
          setError('Not authorized (401). Your session may have expired — please log in again.');
          return;
        }

        console.error('Failed to load users', err);
        setError(err?.message || (typeof err === 'string' ? err : 'Failed to load users'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [listParams]);

  const onSort = (field) => {
    setPage(0);
    setSort((s) => (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'desc' }));
  };

  const openUser = (userId) => {
    const found = data.content.find((x) => x.userId === userId);
    if (found) { setSelectedUser(found); return; }

    // fallback: fetch single user
    const controller = new AbortController();
    UserService.getUserById(userId, { signal: controller.signal })
      .then((resBody) => setSelectedUser(mapDtoToUser(resBody)))
      .catch((err) => {
        if (err?.canceled || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        console.error('Failed to load user', err);
      });
  };

  const clearFilters = () => {
    setInternalQ('');
    setQ('');
    setPage(0);
    setSort({ field: 'createdAt', dir: 'desc' });
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Users</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>Manage user accounts — search, sort, and review details.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="search"
              value={internalQ}
              onChange={(e) => setInternalQ(e.target.value)}
              placeholder="Search by name, email or username"
              style={{ padding: '8px 36px 8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', minWidth: 320 }}
            />
            <FiSearch style={{ position: 'absolute', right: 10, top: 8, color: '#9ca3af' }} />
          </div>

          <select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }} style={{ padding: 8, borderRadius: 8 }}>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>

          <button onClick={clearFilters} style={{ padding: '8px 12px', borderRadius: 8 }}>Reset</button>
        </div>
      </header>

      <section style={{ background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading users...</div>
        ) : error ? (
          <div style={{ padding: 20, color: 'crimson' }}>{error}</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #efefef' }}>
                    <th style={thStyle}></th>
                    <th style={thStyle}>Username</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Locale</th>
                    <th style={thStyle}>Country</th>
                    <th style={thStyle}>Active</th>
                    <th style={thStyle}>Admin</th>
                    <th style={thStyle}>Verified</th>
                    <th style={thStyle}>Created</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {data.content.length === 0 ? (
                    <tr><td colSpan={11} style={{ padding: 24, color: '#6b7280' }}>No users found.</td></tr>
                  ) : data.content.map((u) => (
                    <tr key={u.userId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={tdStyle}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {u.avatarUrl ? <img src={u.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FiUser />}
                        </div>
                      </td>
                      <td style={tdStyle}>{u.username || <span style={{ color: '#9ca3af' }}>—</span>}</td>
                      <td style={tdStyle}>{u.email || <span style={{ color: '#9ca3af' }}>—</span>}</td>
                      <td style={tdStyle}>{u.name || <span style={{ color: '#9ca3af' }}>—</span>}</td>
                      <td style={tdStyle}>{u.locale || '-'}</td>
                      <td style={tdStyle}>{u.countryCode || '-'}</td>
                      <td style={tdStyle}>{u.active ? 'Yes' : 'No'}</td>
                      <td style={tdStyle}>{u.admin ? 'Yes' : 'No'}</td>
                      <td style={tdStyle}>{u.emailVerified ? 'Yes' : 'No'}</td>
                      <td style={tdStyle}>{formatDate(u.createdAt)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <button onClick={() => openUser(u.userId)} style={actionBtn}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 6px' }}>
              <div style={{ color: '#6b7280' }}>Showing <strong>{data.content.length}</strong> of <strong>{data.totalElements}</strong></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))} style={pageBtn}><FiChevronLeft /></button>
                <span style={{ minWidth: 80, textAlign: 'center' }}>Page { (data.number || page) + 1 } / { Math.max(1, data.totalPages || 1) }</span>
                <button disabled={page + 1 >= (data.totalPages || 1)} onClick={() => setPage((p) => p + 1)} style={pageBtn}><FiChevronRight /></button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* detail drawer */}
      {selectedUser && (
        <div style={drawerOverlay} onClick={() => setSelectedUser(null)}>
          <div style={drawer} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{displayName(selectedUser)}</h3>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'transparent', border: 'none', fontSize: 18 }}>✕</button>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedUser.avatarUrl ? <img src={selectedUser.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FiUser size={28} />}
                </div>

                <div>
                  <div style={{ fontWeight: 700 }}>{selectedUser.name || selectedUser.username}</div>
                  <div style={{ color: '#6b7280' }}>{selectedUser.email}</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{selectedUser.username ? `@${selectedUser.username}` : ''}</div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 8, columnGap: 12 }}>
                  <dt style={{ color: '#6b7280' }}>Locale</dt><dd>{selectedUser.locale || '-'}</dd>
                  <dt style={{ color: '#6b7280' }}>Country</dt><dd>{selectedUser.countryCode || '-'}</dd>
                  <dt style={{ color: '#6b7280' }}>Active</dt><dd>{selectedUser.active ? 'Yes' : 'No'}</dd>
                  <dt style={{ color: '#6b7280' }}>Admin</dt><dd>{selectedUser.admin ? 'Yes' : 'No'}</dd>
                  <dt style={{ color: '#6b7280' }}>Email verified</dt><dd>{selectedUser.emailVerified ? 'Yes' : 'No'}</dd>
                  <dt style={{ color: '#6b7280' }}>Created</dt><dd>{formatDate(selectedUser.createdAt)}</dd>
                  <dt style={{ color: '#6b7280' }}>Last seen</dt><dd>{formatDate(selectedUser.lastSeenAt)}</dd>
                </dl>
              </div>

              <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
                <button onClick={() => { /* handle edit navigation */ }} style={primaryBtn}>Edit user</button>
                <button onClick={() => { /* more actions */ }} style={outlineBtn}>More</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;