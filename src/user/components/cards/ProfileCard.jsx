import React, { useState, useEffect } from 'react';
import { FiSave } from 'react-icons/fi';

const ProfileCard = ({ user, loading = false, errors = {}, countries = [], onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    locale: '',
    countryCode: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        locale: user.locale || '',
        countryCode: user.countryCode || ''
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
      countryCode: formData.countryCode || null
    };
    onSubmit && onSubmit(payload);
  };

  return (
    <article className="user-card user-profile-card">
      <div className="user-card-body">
        <h3 className="user-card-title">Profile Settings</h3>

        {errors.submit && <div className="user-alert user-alert-error">{errors.submit}</div>}

        <form onSubmit={handleSubmit}>

          <div className="user-form-group">
            <label htmlFor="user-name">Name *</label>
            <input
              id="user-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="user-form-group">
            <label htmlFor="user-username">Username *</label>
            <input
              id="user-username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="user-form-group">
            <label htmlFor="user-email">Email</label>
            <input
              id="user-email"
              name="email"
              value={formData.email}
              disabled
            />
          </div>

          <div className="user-form-group">
            <label htmlFor="user-locale">Locale</label>
            <input
              id="user-locale"
              name="locale"
              value={formData.locale}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="user-form-group">
            <label htmlFor="user-countryCode">Country</label>
            <select
              id="user-countryCode"
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
              <div className="user-muted small" style={{ marginTop: 6 }}>
                Country list not available
              </div>
            )}
            {!formData.countryCode && countries.length > 0 && (
              <div className="user-muted small" style={{ marginTop: 6 }}>
                Please select your country.
              </div>
            )}
          </div>

          <button type="submit" className="user-btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (<><FiSave style={{ marginRight: 6 }} />Save Profile</>)}
          </button>
        </form>
      </div>
    </article>
  );
};

export default ProfileCard;