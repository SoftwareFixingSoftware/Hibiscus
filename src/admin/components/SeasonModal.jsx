import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import SeasonService from '../services/SeasonService';

const SeasonModal = ({ season, seriesId, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    seasonNumber: '',
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (season) {
      setFormData({
        seasonNumber: season.seasonNumber || '',
        title: season.title || '',
        description: season.description || ''
      });
    }
  }, [season]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (season) {
        await SeasonService.updateSeason(season.id, formData);
      } else {
        await SeasonService.createSeason(seriesId, formData);
      }
      onSubmit();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save season');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-modal-overlay">
      <div className="adm-modal-container">
        <div className="adm-modal-header">
          <h3 className="adm-modal-title">{season ? 'Edit Season' : 'Create New Season'}</h3>
          <button className="adm-modal-close" onClick={onClose}><FiX /></button>
        </div>
        <form onSubmit={handleSubmit} className="adm-modal-form">
          <div className="adm-form-group">
            <label className="adm-form-label">Season Number *</label>
            <input
              type="number"
              name="seasonNumber"
              value={formData.seasonNumber}
              onChange={handleChange}
              required
              min="1"
              className="adm-form-input"
            />
          </div>
          <div className="adm-form-group">
            <label className="adm-form-label">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="adm-form-input"
              placeholder="e.g. Season 1: The Beginning"
            />
          </div>
          <div className="adm-form-group">
            <label className="adm-form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="adm-form-textarea"
              placeholder="Brief description of this season..."
            />
          </div>
          {error && <div className="adm-alert adm-error">{error}</div>}
          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="adm-btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (season ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeasonModal;