import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import SeriesService from '../services/SeriesService';

const SeriesModal = ({ series, onClose, onSubmit }) => {
  const isEditMode = !!series;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    authorName: '',          // new field
    isPublished: false
  });

  useEffect(() => {
    if (series) {
      setFormData({
        title: series.title || '',
        description: series.description || '',
        category: series.category || '',
        authorName: series.authorName || '',   // populate if exists
        isPublished: series.isPublished || false
      });
    }
  }, [series]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    // authorName is optional
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Prepare payload – include authorName if provided
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        isPublished: formData.isPublished,
        ...(formData.authorName && { authorName: formData.authorName })
      };
      let result;
      if (isEditMode) {
        result = await SeriesService.updateSeries(series.id, payload);
      } else {
        result = await SeriesService.createSeries(payload);
      }
      onSubmit(result);
    } catch (error) {
      if (error === 'Unauthorized' || error.message?.includes('401')) {
        localStorage.clear();
        window.location.href = '/login';
        return;
      }
      setErrors({ submit: error.message || 'Failed to save series' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-modal-overlay">
      <div className="adm-modal-container">
        <div className="adm-modal-header">
          <h3 className="adm-modal-title">
            {isEditMode ? 'Edit Series' : 'Create New Series'}
          </h3>
          <button className="adm-modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="adm-modal-form">
          {errors.submit && (
            <div className="adm-alert adm-error">{errors.submit}</div>
          )}

          <div className="adm-form-group">
            <label className="adm-form-label" htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`adm-form-input ${errors.title ? 'adm-error' : ''}`}
              placeholder="Enter series title"
              disabled={loading}
            />
            {errors.title && <span className="adm-form-error">{errors.title}</span>}
          </div>

          <div className="adm-form-group">
            <label className="adm-form-label" htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`adm-form-textarea ${errors.description ? 'adm-error' : ''}`}
              placeholder="Enter series description"
              rows="4"
              disabled={loading}
            />
            {errors.description && <span className="adm-form-error">{errors.description}</span>}
          </div>

          <div className="adm-form-group">
            <label className="adm-form-label" htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`adm-form-select ${errors.category ? 'adm-error' : ''}`}
              disabled={loading}
            >
              <option value="">Select a category</option>
              <option value="Technology">Technology</option>
              <option value="Business">Business</option>
              <option value="Health">Health</option>
              <option value="Science">Science</option>
              <option value="Arts">Arts</option>
              <option value="Education">Education</option>
              <option value="Entertainment">Entertainment</option>
            </select>
            {errors.category && <span className="adm-form-error">{errors.category}</span>}
          </div>

          {/* New author name field */}
          <div className="adm-form-group">
            <label className="adm-form-label" htmlFor="authorName">Author Name (optional)</label>
            <input
              type="text"
              id="authorName"
              name="authorName"
              value={formData.authorName}
              onChange={handleChange}
              className="adm-form-input"
              placeholder="e.g., luke"
              disabled={loading}
            />
          </div>

          <div className="adm-form-group adm-checkbox-group">
            <label className="adm-checkbox-label">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
                className="adm-checkbox"
                disabled={loading}
              />
              <span className="adm-checkbox-text">Publish immediately</span>
            </label>
          </div>

          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="adm-btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEditMode ? 'Update Series' : 'Create Series')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeriesModal;