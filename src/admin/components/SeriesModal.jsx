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
    isPublished: false
  });

  useEffect(() => {
    if (series) {
      setFormData({
        title: series.title || '',
        description: series.description || '',
        category: series.category || '',
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
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      let result;
      
      if (isEditMode) {
        result = await SeriesService.updateSeries(series.id, formData);
      } else {
        result = await SeriesService.createSeries(formData);
      }
      
      onSubmit(result);
    } catch (error) {
      console.error('Error saving series:', error);
      
      // Handle unauthorized
      if (error === 'Unauthorized' || (error.message && error.message.includes('401'))) {
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
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">
            {isEditMode ? 'Edit Series' : 'Create New Series'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {errors.submit && (
            <div className="alert alert-error">
              {errors.submit}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Enter series title"
              disabled={loading}
            />
            {errors.title && (
              <span className="form-error">{errors.title}</span>
            )}
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`form-input ${errors.description ? 'error' : ''}`}
              placeholder="Enter series description"
              rows="4"
              disabled={loading}
            />
            {errors.description && (
              <span className="form-error">{errors.description}</span>
            )}
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="category">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`form-select ${errors.category ? 'error' : ''}`}
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
            {errors.category && (
              <span className="form-error">{errors.category}</span>
            )}
          </div>
          
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
                className="checkbox-input"
                disabled={loading}
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">Publish immediately</span>
            </label>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Series' : 'Create Series')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeriesModal;