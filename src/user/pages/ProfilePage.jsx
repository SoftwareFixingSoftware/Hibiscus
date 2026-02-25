import React, { useEffect, useState } from 'react';
import ProfileCard from '../components/cards/ProfileCard';
import UserService from '../services/UserService';
import CountryService from '../services/CountryService';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    setLoadingProfile(true);
    try {
      const [profile, countriesList] = await Promise.all([
        UserService.getProfile(),
        CountryService.getAllCountries()
      ]);

      setUser(profile);

      // Normalize and sort countries so the card can reliably use {code, name}
      const normalized = Array.isArray(countriesList) ? countriesList.map(c => ({
        code: c.code || c.countryCode || c.id || '',
        name: c.name || c.displayName || c.label || (c.country || '')
      })) : [];

      normalized.sort((a, b) => {
        const an = (a.name || '').toLowerCase();
        const bn = (b.name || '').toLowerCase();
        if (an < bn) return -1;
        if (an > bn) return 1;
        return 0;
      });

      setCountries(normalized.filter(c => c.code || c.name)); // keep only useful entries

    } catch (err) {
      console.error('Failed to load profile or countries', err);
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
        return;
      }
      setErrors({ submit: 'Failed to load profile or countries' });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdate = async (payload) => {
    setSaving(true);
    setErrors({});
    try {
      const updated = await UserService.updateProfile(payload);
      setUser(updated);
    } catch (err) {
      console.error('Failed to save profile', err);
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
        return;
      }
      const msg = err.response?.data?.message || err.message || 'Failed to save profile';
      setErrors({ submit: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <h2 className="page-title">My Profile</h2>

      <div className="page-body">
        <ProfileCard
          user={user}
          loading={saving}
          errors={errors}
          countries={countries}
          onSubmit={handleUpdate}
        />

        {loadingProfile && <div className="muted">Loading profile & countries...</div>}
      </div>
    </div>
  );
};

export default ProfilePage;