// src/admin/pages/AdminUsers.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiUser } from 'react-icons/fi';
import UserService from '../services/UserService';
import { mapDtoToUser, displayName } from '../components/UserModel';

const DEFAULT_PAGE_SIZE = 20;

const thStyle = { padding: '12px 10px', fontSize: 13, color: '#374151' };
const tdStyle = { padding: '12px 10px', fontSize: 14, color: '#111827', verticalAlign: 'middle' };
const actionBtn = { padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' };
const pageBtn = { padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' };
const primaryBtn = { padding: '8px 12px', borderRadius: 8, border: 'none', background: '#0ea5a4', color: '#fff', cursor: 'pointer' };
const outlineBtn = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' };

// DRAWER STYLES
const drawerOverlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15,23,42,0.55)',
  backdropFilter: 'blur(2px)',
  display: 'flex',
  justifyContent: 'flex-end',
  zIndex: 1000
};

const drawer = {
  width: '600px',
  maxWidth: '100%',
  height: '100%',
  background: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '-10px 0 30px rgba(0,0,0,0.12)'
};

const drawerHeader = {
  padding: '20px 24px',
  borderBottom: '1px solid #f1f5f9',
  fontSize: 18,
  fontWeight: 600
};

const drawerBody = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px 24px',
  display: 'grid',
  gap: 16
};

const drawerFooter = {
  padding: '16px 24px',
  borderTop: '1px solid #f1f5f9',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
  background: '#fff'
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  fontSize: 14
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 4,
  display: 'block',
  color: '#374151'
};

const normalizePage = (body = {}) => {
  if (Array.isArray(body.content)) {
    return {
      content: body.content,
      totalElements: typeof body.totalElements === 'number' ? body.totalElements : (body.total || 0),
      totalPages: typeof body.totalPages === 'number' ? body.totalPages : Math.ceil((body.total || 0) / (body.size || DEFAULT_PAGE_SIZE)),
      number: typeof body.number === 'number' ? body.number : (body.page || 0),
      size: typeof body.size === 'number' ? body.size : (body.size || DEFAULT_PAGE_SIZE)
    };
  }
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
  if (Array.isArray(body._content)) {
    return {
      content: body._content,
      totalElements: body.totalElements || 0,
      totalPages: body.totalPages || 0,
      number: body.number || 0,
      size: body.size || DEFAULT_PAGE_SIZE
    };
  }
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

  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editForm, setEditForm] = useState({});

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
        const body = await UserService.listUsers(listParams(), { signal });
        const normalized = normalizePage(body);
        const content = normalized.content.map(mapDtoToUser);

        setData({
          content,
          totalElements: normalized.totalElements,
          totalPages: normalized.totalPages,
          number: normalized.number
        });
      } catch (err) {
        if (!err) return;
        if (err?.canceled || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError') return;
        if (err?.response?.status === 403 || err?.status === 403) setError('You do not have permission (403)');
        else if (err?.response?.status === 401 || err?.status === 401) setError('Not authorized (401)');
        else setError(err?.message || 'Failed to load users');
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
    if (found) { setSelectedUser(found); setEditForm(found); setIsEditing(true); return; }

    const controller = new AbortController();
    UserService.getUserById(userId, { signal: controller.signal })
      .then((resBody) => {
        const mapped = mapDtoToUser(resBody);
        setSelectedUser(mapped);
        setEditForm(mapped);
        setIsEditing(true);
      })
      .catch(console.error);
  };

  const clearFilters = () => {
    setInternalQ('');
    setQ('');
    setPage(0);
    setSort({ field: 'createdAt', dir: 'desc' });
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  const handleEditChange = (key, value) => setEditForm((s) => ({ ...s, [key]: value }));

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    setEditLoading(true);
    setEditError(null);

    try {
      const payload = {
        name: editForm.name,
        username: editForm.username,
        email: editForm.email,
        locale: editForm.locale,
        countryCode: editForm.countryCode,
        active: !!editForm.active,
        emailVerified: !!editForm.emailVerified,
        admin: !!editForm.admin
      };

      const updated = await UserService.updateUser(selectedUser.userId, payload);
      const mapped = mapDtoToUser(updated);

      setData((prev) => ({
        ...prev,
        content: prev.content.map((u) => (u.userId === mapped.userId ? mapped : u))
      }));

      setSelectedUser(mapped);
      setEditForm(mapped);
      setIsEditing(false);
    } catch (err) {
      setEditError(err?.response?.data?.message || err?.message || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  const closeDrawer = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setEditError(null);
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
                        <button onClick={() => openUser(u.userId)} style={actionBtn}>Edit</button>
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

      {/* DETAIL DRAWER */}
      {selectedUser && (
        <div style={drawerOverlay} onClick={closeDrawer}>
          <div style={drawer} onClick={(e) => e.stopPropagation()}>
            {/* HEADER */}
            <div style={drawerHeader}>
              Edit User — {displayName(selectedUser)}
            </div>

            {/* BODY */}
            <div style={drawerBody}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  style={inputStyle}
                  value={editForm.name || ''}
                  onChange={(e) => handleEditChange('name', e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>Username</label>
                <input
                  style={inputStyle}
                  value={editForm.username || ''}
                  onChange={(e) => handleEditChange('username', e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  style={inputStyle}
                  value={editForm.email || ''}
                  onChange={(e) => handleEditChange('email', e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>Locale</label>
                <input
                  style={inputStyle}
                  value={editForm.locale || ''}
                  onChange={(e) => handleEditChange('locale', e.target.value)}
                  placeholder="e.g., en-US"
                />
              </div>

              <div>
                <label style={labelStyle}>Country Code</label>
                <input
                  style={inputStyle}
                  value={editForm.countryCode || ''}
                  onChange={(e) => handleEditChange('countryCode', e.target.value)}
                  placeholder="e.g., US"
                />
              </div>

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, color: '#000' }}>
                  <input
                    type="checkbox"
                    name="admin"
                    checked={!!editForm.admin}
                    onChange={(e) => handleEditChange('admin', e.target.checked)}
                  /> Admin
                </label>
                <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, color: '#000' }}>
                  <input
                    type="checkbox"
                    name="active"
                    checked={!!editForm.active}
                    onChange={(e) => handleEditChange('active', e.target.checked)}
                  /> Active
                </label>
                <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, color: '#000' }}>
                  <input
                    type="checkbox"
                    name="emailVerified"
                    checked={!!editForm.emailVerified}
                    onChange={(e) => handleEditChange('emailVerified', e.target.checked)}
                  /> Email Verified
                </label>
              </div>

              {editError && <div style={{ color: 'crimson', fontSize: 14 }}>{editError}</div>}
            </div>

            {/* FOOTER */}
            <div style={drawerFooter}>
              <button onClick={closeDrawer} style={outlineBtn}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={editLoading} style={primaryBtn}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;