import React, { useState, useEffect } from 'react';
import { FiSave } from 'react-icons/fi';

/**
 * ProfileCard — presentational card (no API calls)
 *
 * Props:
 *  - user: object matching your U entity
 *  - loading: boolean (save in progress)
 *  - errors: { submit?: string, ... }
 *  - countries: [{ code, name }]  // array of countries to render in select
 *  - onSubmit(formData) => called when user saves (page handles API)
 */
const ProfileCard = ({ user, loading = false, errors = {}, countries = [], onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    locale: '',
    countryCode: ''
  });

  useEffect(() => {
    // Initialize from user. If user has no countryCode we keep it empty so user must choose.
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        locale: user.locale || '',
        countryCode: user.countryCode || '' // keep '' if none
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      username: formData.username,
      locale: formData.locale,
      countryCode: formData.countryCode || null // server-friendly: null if empty
    };
    onSubmit && onSubmit(payload);
  };

  return (
    <article className="card profile-card">
      <div className="card-body">
        <h3 className="card-title">Profile Settings</h3>

        {errors.submit && <div className="alert alert-error">{errors.submit}</div>}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              value={formData.email}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="locale">Locale</label>
            <input
              id="locale"
              name="locale"
              value={formData.locale}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="countryCode">Country</label>
            <select
              id="countryCode"
              name="countryCode"
              value={formData.countryCode}
              onChange={handleChange}
              disabled={loading || countries.length === 0}
            >
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}{c.code ? ` (${c.code})` : ''}
                </option>
              ))}
            </select>
            {countries.length === 0 && (
              <div className="muted small" style={{ marginTop: 6 }}>
                Country list not available
              </div>
            )}
            {!formData.countryCode && countries.length > 0 && (
              <div className="muted small" style={{ marginTop: 6 }}>
                Please select your country.
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (<><FiSave style={{ marginRight: 6 }} />Save Profile</>)}
          </button>
        </form>
      </div>
    </article>
  );
};

export default ProfileCard;