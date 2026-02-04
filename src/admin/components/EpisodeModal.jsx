import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock } from 'react-icons/fi';
import EpisodeService from '../services/EpisodeService';

const EpisodeModal = ({ episode, seriesId, onClose, onSubmit }) => {
  const isEditMode = !!episode;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    episodeNumber: 1,
    releaseDate: new Date().toISOString().split('T')[0],
    isPublished: false,
    durationSeconds: 0 // REQUIRED FIELD
  });

  useEffect(() => {
    if (episode) {
      // For edit mode
      setFormData({
        title: episode.title || '',
        description: episode.description || '',
        episodeNumber: episode.episodeNumber || 1,
        releaseDate: episode.releaseDate ? 
          new Date(episode.releaseDate).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        isPublished: episode.isPublished || false,
        durationSeconds: episode.durationSeconds || 0
      });
    } else {
      // For create mode
      setFormData({
        title: '',
        description: '',
        episodeNumber: 1,
        releaseDate: new Date().toISOString().split('T')[0],
        isPublished: false,
        durationSeconds: 0
      });
    }
  }, [episode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    const newValue = type === 'checkbox' ? checked : 
                    (type === 'number' ? parseInt(value) || 0 : value);
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Special handler for duration (minutes to seconds)
  const handleDurationMinutesChange = (e) => {
    const minutes = parseFloat(e.target.value) || 0;
    const seconds = Math.round(minutes * 60);
    
    setFormData(prev => ({
      ...prev,
      durationSeconds: seconds
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.episodeNumber <= 0) {
      newErrors.episodeNumber = 'Episode number must be positive';
    }
    
    if (formData.durationSeconds <= 0) {
      newErrors.durationSeconds = 'Duration must be greater than 0';
    }
    
    // Only check seriesId for new episodes, not when editing
    if (!isEditMode && !seriesId) {
      newErrors.seriesId = 'Series ID is required. Please make sure you are creating an episode within a series.';
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
      // Prepare the episode data - REMOVE durationMinutes from the data sent
      const episodeData = {
        title: formData.title,
        description: formData.description,
        episodeNumber: formData.episodeNumber,
        releaseDate: new Date(formData.releaseDate).toISOString(),
        isPublished: formData.isPublished,
        durationSeconds: formData.durationSeconds // Send this, not durationMinutes
      };
      
      console.log('Sending episode data:', episodeData);
      console.log('Series ID:', seriesId);
      
      let result;
      if (isEditMode) {
        result = await EpisodeService.updateEpisode(episode.id, episodeData);
      } else {
        // For new episodes, we MUST have seriesId
        if (!seriesId) {
          throw new Error('Cannot create episode without a series ID');
        }
        result = await EpisodeService.createEpisodeInSeries(seriesId, episodeData);
      }
      
      console.log('Episode saved successfully');
      onSubmit(result);
    } catch (error) {
      console.error('Error saving episode:', error);
      
      let errorMessage = 'Failed to save episode';
      
      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response error:', error.response.data);
        if (error.response.data) {
          if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.errors) {
            // Handle validation errors from Spring Boot @Valid
            const validationErrors = error.response.data.errors;
            const fieldErrors = validationErrors.map(err => 
              `${err.field}: ${err.defaultMessage}`
            ).join(', ');
            errorMessage = `Validation errors: ${fieldErrors}`;
          } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          }
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Request error:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      // Handle specific error messages
      if (errorMessage.includes('durationSeconds')) {
        errorMessage = 'Duration is required. Please enter a valid duration in minutes.';
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Get duration display
  const getDurationDisplay = () => {
    const minutes = Math.floor(formData.durationSeconds / 60);
    const seconds = formData.durationSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">
            {isEditMode ? 'Edit Episode' : 'Create New Episode'}
            {seriesId && !isEditMode && (
              <span className="modal-subtitle"> (for current series)</span>
            )}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Show series info */}
          {seriesId && !isEditMode && (
            <div className="form-info">
              <div className="info-badge">
                Creating episode for Series ID: {seriesId.substring(0, 12)}...
              </div>
            </div>
          )}
          
          {errors.seriesId && (
            <div className="alert alert-error">
              <strong>Error:</strong> {errors.seriesId}
              <div style={{ marginTop: '8px' }}>
                Please navigate to a specific series first, or go to the Series page and click "View Details" to manage episodes.
              </div>
            </div>
          )}
          
          {errors.submit && (
            <div className="alert alert-error">
              <strong>Error:</strong> {errors.submit}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Episode Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Enter episode title"
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
              placeholder="Enter episode description"
              rows="4"
              disabled={loading}
            />
            {errors.description && (
              <span className="form-error">{errors.description}</span>
            )}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="episodeNumber">
                Episode Number *
              </label>
              <input
                type="number"
                id="episodeNumber"
                name="episodeNumber"
                value={formData.episodeNumber}
                onChange={handleChange}
                className={`form-input ${errors.episodeNumber ? 'error' : ''}`}
                min="1"
                disabled={loading}
              />
              {errors.episodeNumber && (
                <span className="form-error">{errors.episodeNumber}</span>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="durationMinutes">
                Duration (minutes) *
              </label>
              <div className="input-with-icon">
                <FiClock className="input-icon" />
                <input
                  type="number"
                  id="durationMinutes"
                  name="durationMinutes"
                  value={(formData.durationSeconds / 60).toFixed(1)}
                  onChange={handleDurationMinutesChange}
                  className={`form-input ${errors.durationSeconds ? 'error' : ''}`}
                  placeholder="e.g., 45.5"
                  min="0.1"
                  step="0.1"
                  disabled={loading}
                />
              </div>
              {errors.durationSeconds && (
                <span className="form-error">{errors.durationSeconds}</span>
              )}
              <div className="form-hint">
                Current duration: {getDurationDisplay()} (MM:SS)
              </div>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="releaseDate">
                Release Date
              </label>
              <div className="date-input-group">
                <FiCalendar className="date-icon" />
                <input
                  type="date"
                  id="releaseDate"
                  name="releaseDate"
                  value={formData.releaseDate}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loading}
                />
              </div>
            </div>
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
              disabled={loading || (!seriesId && !isEditMode)}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Episode' : 'Create Episode')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EpisodeModal;