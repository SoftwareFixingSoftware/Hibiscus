import React, { useEffect, useState } from 'react';
import ProfileCard from '../components/cards/ProfileCard';
import UserService from '../services/UserService';
import CountryService from '../services/CountryService';
import Footer from '../components/common/Footer';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoadingProfile(true);
    try {
      const [profile, countriesList] = await Promise.all([
        UserService.getProfile(),
        CountryService.getAllCountries()
      ]);

      setUser(profile);

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

      setCountries(normalized.filter(c => c.code || c.name));

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
    <div className="user-page-container">
      <h2 className="user-page-title">My Profile</h2>

      <div className="user-page-body">
        <ProfileCard
          user={user}
          loading={saving}
          errors={errors}
          countries={countries}
          onSubmit={handleUpdate}
        />

        {loadingProfile && <div className="user-muted">Loading profile & countries...</div>}
      </div>
            <Footer />
      
    </div>
  );
};

export default ProfilePage;