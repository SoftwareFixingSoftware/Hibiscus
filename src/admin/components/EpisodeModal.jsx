import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock, FiAlertCircle } from 'react-icons/fi';
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
    durationSeconds: 0,
    isFree: false,
    priceInCoins: 0
  });

  useEffect(() => {
    if (episode) {
      const releaseDate = episode.releaseDate
        ? new Date(episode.releaseDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      setFormData({
        title: episode.title || '',
        description: episode.description || '',
        episodeNumber: episode.episodeNumber || 1,
        releaseDate: releaseDate,
        isPublished: episode.isPublished || false,
        durationSeconds: episode.durationSeconds || episode.duration || 0,
        isFree: episode.isFree || false,
        priceInCoins: episode.priceInCoins || 0
      });
    } else {
      setFormData({
        title: '',
        description: '',
        episodeNumber: 1,
        releaseDate: new Date().toISOString().split('T')[0],
        isPublished: false,
        durationSeconds: 0,
        isFree: false,
        priceInCoins: 0
      });
    }
  }, [episode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let newValue =
      type === 'checkbox'
        ? checked
        : type === 'number'
        ? parseInt(value) || 0
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleDurationMinutesChange = (e) => {
    const minutes = parseFloat(e.target.value) || 0;
    const seconds = Math.round(minutes * 60);

    setFormData((prev) => ({
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

    if (!formData.isFree && formData.priceInCoins <= 0) {
      newErrors.priceInCoins =
        'Price in coins must be greater than 0 for paid episodes';
    }

    if (!isEditMode && !seriesId) {
      newErrors.seriesId =
        'Series ID is required. Please make sure you are creating an episode within a series.';
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
      const episodeData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        episodeNumber: formData.episodeNumber,
        releaseDate: new Date(formData.releaseDate).toISOString(),
        isPublished: formData.isPublished,
        durationSeconds: formData.durationSeconds,
        isFree: formData.isFree,
        priceInCoins: formData.isFree ? 0 : formData.priceInCoins
      };

      let result;
      if (isEditMode) {
        result = await EpisodeService.updateEpisode(
          episode.id,
          episodeData
        );
      } else {
        if (!seriesId) {
          throw new Error(
            'Cannot create episode without a series ID'
          );
        }
        result = await EpisodeService.createEpisodeInSeries(
          seriesId,
          episodeData
        );
      }

      onSubmit(result.data);
    } catch (error) {
      let errorMessage = 'Failed to save episode';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

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
          </h3>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">

          {errors.submit && (
            <div className="alert alert-error">
              <FiAlertCircle />
              <div style={{ marginLeft: '8px' }}>
                <strong>Error:</strong> {errors.submit}
              </div>
            </div>
          )}

          {/* TITLE */}
          <div className="form-group">
            <label className="form-label">Episode Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-input ${errors.title ? 'error' : ''}`}
              disabled={loading}
            />
            {errors.title && (
              <span className="form-error">{errors.title}</span>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`form-input ${errors.description ? 'error' : ''}`}
              rows="4"
              disabled={loading}
            />
            {errors.description && (
              <span className="form-error">
                {errors.description}
              </span>
            )}
          </div>

          {/* EPISODE NUMBER + DURATION */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Episode Number *</label>
              <input
                type="number"
                name="episodeNumber"
                value={formData.episodeNumber}
                onChange={handleChange}
                min="1"
                className={`form-input ${
                  errors.episodeNumber ? 'error' : ''
                }`}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Duration (minutes) *
              </label>
              <div className="input-with-icon">
                <FiClock className="input-icon" />
                <input
                  type="number"
                  value={(formData.durationSeconds / 60).toFixed(
                    1
                  )}
                  onChange={handleDurationMinutesChange}
                  min="0.1"
                  step="0.1"
                  className={`form-input ${
                    errors.durationSeconds ? 'error' : ''
                  }`}
                  disabled={loading}
                />
              </div>
              <div className="form-hint">
                Current duration: {getDurationDisplay()}
              </div>
            </div>
          </div>

          {/* RELEASE DATE */}
          <div className="form-group">
            <label className="form-label">Release Date</label>
            <input
              type="date"
              name="releaseDate"
              value={formData.releaseDate}
              onChange={handleChange}
              className="form-input"
              disabled={loading}
            />
          </div>

          {/* FREE CHECKBOX */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isFree"
                checked={formData.isFree}
                onChange={handleChange}
                disabled={loading}
              />
              Free Episode
            </label>
          </div>

          {/* PRICE IN COINS */}
          {!formData.isFree && (
            <div className="form-group">
              <label className="form-label">
                Price (Coins) *
              </label>
              <input
                type="number"
                name="priceInCoins"
                value={formData.priceInCoins}
                onChange={handleChange}
                min="1"
                className={`form-input ${
                  errors.priceInCoins ? 'error' : ''
                }`}
                disabled={loading}
              />
              {errors.priceInCoins && (
                <span className="form-error">
                  {errors.priceInCoins}
                </span>
              )}
            </div>
          )}

          {/* PUBLISH */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
                disabled={loading}
              />
              Publish immediately
            </label>
          </div>

          {/* FOOTER */}
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
              {loading
                ? 'Saving...'
                : isEditMode
                ? 'Update Episode'
                : 'Create Episode'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EpisodeModal;