// src/admin/pages/AdminUsers.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiUser } from 'react-icons/fi';
import UserService from '../services/UserService';
import { mapDtoToUser, displayName } from '../components/UserModel';
import '../styles/admin-users.css';

const DEFAULT_PAGE_SIZE = 20;

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

  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Avatar component with error fallback
  const AvatarCell = ({ url }) => {
    const [hasError, setHasError] = useState(false);
    if (!url || hasError) return <FiUser />;
    return <img src={url} alt="avatar" onError={() => setHasError(true)} />;
  };

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
    if (found) {
      setSelectedUser(found);
      setEditForm(found);
      setIsEditing(true);
      return;
    }

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
        admin: !!editForm.admin,
        authProvider: editForm.authProvider
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
    <div className="adm-users-container">
      <header className="adm-users-header">
        <div>
          <h1>Users</h1>
          <p className="adm-page-subtitle">Manage user accounts — search, sort, and review details.</p>
        </div>

        <div className="adm-search-box">
          <input
            type="search"
            value={internalQ}
            onChange={(e) => setInternalQ(e.target.value)}
            placeholder="Search by name, email or username"
          />
          <FiSearch />
        </div>
      </header>

      <section className="adm-users-table">
        {loading ? (
          <div className="adm-loading-container">
            <div className="adm-loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <div className="adm-error">{error}</div>
        ) : (
          <>
            <div className="adm-list-container">
              <table className="adm-data-table">
                <thead>
                  <tr>
                    <th></th>
                    <th onClick={() => onSort('username')}>Username</th>
                    <th onClick={() => onSort('email')}>Email</th>
                    <th onClick={() => onSort('name')}>Name</th>
                    <th>Locale</th>
                    <th>Country</th>
                    <th>Active</th>
                    <th>Admin</th>
                    <th>Verified</th>
                    <th>Auth Provider</th>
                    <th>Last Seen</th>
                    <th onClick={() => onSort('createdAt')}>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.length === 0 ? (
                    <tr><td colSpan="13" className="adm-empty-state">No users found.</td></tr>
                  ) : data.content.map((u) => (
                    <tr key={u.userId}>
                      <td>
                        <div className="adm-user-avatar-cell">
                          <AvatarCell url={u.avatarUrl} />
                        </div>
                      </td>
                      <td>{u.username || '—'}</td>
                      <td>{u.email || '—'}</td>
                      <td>{u.name || '—'}</td>
                      <td>{u.locale || '-'}</td>
                      <td>{u.countryCode || '-'}</td>
                      <td>{u.active ? 'Yes' : 'No'}</td>
                      <td>{u.admin ? 'Yes' : 'No'}</td>
                      <td>{u.emailVerified ? 'Yes' : 'No'}</td>
                      <td>{u.authProvider || '-'}</td>
                      <td>{formatDate(u.lastSeenAt)}</td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>
                        <button className="adm-action-btn adm-edit" onClick={() => openUser(u.userId)}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="adm-pagination-container">
              <div className="adm-pagination-info">
                Showing <strong>{data.content.length}</strong> of <strong>{data.totalElements}</strong>
              </div>
              <div className="adm-pagination-controls">
                <button
                  className="adm-pagination-nav"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <FiChevronLeft />
                </button>
                <span>Page { (data.number || page) + 1 } / { Math.max(1, data.totalPages || 1) }</span>
                <button
                  className="adm-pagination-nav"
                  disabled={page + 1 >= (data.totalPages || 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {selectedUser && (
        <div className="adm-drawer-overlay" onClick={closeDrawer}>
          <div className="adm-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer-header">
              Edit User — {displayName(selectedUser)}
              <button className="adm-modal-close" onClick={closeDrawer}>×</button>
            </div>

            <div className="adm-drawer-body">
              <div className="adm-form-group">
                <label className="adm-form-label">Full Name</label>
                <input
                  className="adm-form-input"
                  value={editForm.name || ''}
                  onChange={(e) => handleEditChange('name', e.target.value)}
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Username</label>
                <input
                  className="adm-form-input"
                  value={editForm.username || ''}
                  onChange={(e) => handleEditChange('username', e.target.value)}
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Email</label>
                <input
                  className="adm-form-input"
                  value={editForm.email || ''}
                  onChange={(e) => handleEditChange('email', e.target.value)}
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Locale</label>
                <input
                  className="adm-form-input"
                  value={editForm.locale || ''}
                  onChange={(e) => handleEditChange('locale', e.target.value)}
                  placeholder="e.g., en-US"
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Country Code</label>
                <input
                  className="adm-form-input"
                  value={editForm.countryCode || ''}
                  onChange={(e) => handleEditChange('countryCode', e.target.value)}
                  placeholder="e.g., US"
                />
              </div>

              {/* Auth Provider dropdown */}
              <div className="adm-form-group">
                <label className="adm-form-label">Auth Provider</label>
                <select
                  className="adm-form-select"
                  value={editForm.authProvider || ''}
                  onChange={(e) => handleEditChange('authProvider', e.target.value)}
                >
                  <option value="google">Google</option>
                  <option value="github">GitHub</option>
                  <option value="local">Local</option>
                </select>
              </div>

              <div className="adm-checkbox-group">
                <label className="adm-checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!editForm.admin}
                    onChange={(e) => handleEditChange('admin', e.target.checked)}
                  /> Admin
                </label>
                <label className="adm-checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!editForm.active}
                    onChange={(e) => handleEditChange('active', e.target.checked)}
                  /> Active
                </label>
                <label className="adm-checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!editForm.emailVerified}
                    onChange={(e) => handleEditChange('emailVerified', e.target.checked)}
                  /> Email Verified
                </label>
              </div>

              {editError && <div className="adm-alert adm-error">{editError}</div>}
            </div>

            <div className="adm-drawer-footer">
              <button className="adm-btn-secondary" onClick={closeDrawer}>Cancel</button>
              <button className="adm-btn-primary" onClick={handleSaveEdit} disabled={editLoading}>
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