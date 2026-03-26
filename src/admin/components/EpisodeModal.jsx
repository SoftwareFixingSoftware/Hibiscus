import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiClock, FiAlertCircle, FiUpload } from 'react-icons/fi';
import EpisodeService from '../services/EpisodeService';
import SeasonService from '../services/SeasonService';

const EpisodeModal = ({ episode, seriesId, suggestedEpisodeNumber, onClose, onSubmit }) => {
  const isEditMode = !!episode;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [seasons, setSeasons] = useState([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [computingDuration, setComputingDuration] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    episodeNumber: 1,
    releaseDate: new Date().toISOString().split('T')[0],
    isPublished: false,
    durationSeconds: 0,
    isFree: false,
    priceInCoins: 0,
    seasonId: ''
  });

  useEffect(() => {
    if (seriesId) {
      fetchSeasons();
    }
  }, [seriesId]);

  useEffect(() => {
    if (episode) {
      const releaseDate = episode.releaseDate
        ? new Date(episode.releaseDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      setFormData({
        title: episode.title || '',
        description: episode.description || '',
        episodeNumber: episode.episodeNumber || 1,
        releaseDate,
        isPublished: episode.isPublished || false,
        durationSeconds: episode.durationSeconds || episode.duration || 0,
        isFree: episode.isFree || false,
        priceInCoins: episode.priceInCoins || 0,
        seasonId: episode.seasonId || ''
      });
    } else if (suggestedEpisodeNumber) {
      setFormData(prev => ({ ...prev, episodeNumber: suggestedEpisodeNumber }));
    }
  }, [episode, suggestedEpisodeNumber]);

  const fetchSeasons = async () => {
    setLoadingSeasons(true);
    try {
      const res = await SeasonService.getSeasonsBySeries(seriesId, { size: 100 });
      const data = res.content || res.data?.content || res.data || [];
      setSeasons(data);
    } catch (error) {
      console.error('Error fetching seasons:', error);
    } finally {
      setLoadingSeasons(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const newValue =
      type === 'checkbox'
        ? checked
        : type === 'number'
          ? parseInt(value, 10) || 0
          : value;

    setFormData(prev => ({ ...prev, [name]: newValue }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDurationMinutesChange = (e) => {
    const minutes = parseFloat(e.target.value) || 0;
    const seconds = Math.round(minutes * 60);
    setFormData(prev => ({ ...prev, durationSeconds: seconds }));

    if (errors.durationSeconds) {
      setErrors(prev => ({ ...prev, durationSeconds: '' }));
    }
  };

  const handleAudioFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAudioFile(file);
    setComputingDuration(true);

    const url = URL.createObjectURL(file);
    const audio = new Audio(url);

    audio.addEventListener('loadedmetadata', () => {
      const duration = Math.round(audio.duration);
      setFormData(prev => ({ ...prev, durationSeconds: duration }));
      URL.revokeObjectURL(url);
      setComputingDuration(false);
    });

    audio.addEventListener('error', () => {
      alert('Could not read audio file duration. Please enter manually.');
      URL.revokeObjectURL(url);
      setComputingDuration(false);
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.episodeNumber <= 0) newErrors.episodeNumber = 'Episode number must be positive';
    if (formData.durationSeconds <= 0) newErrors.durationSeconds = 'Duration must be greater than 0';

    if (!formData.isFree && formData.priceInCoins <= 0) {
      newErrors.priceInCoins = 'Price in coins must be greater than 0 for paid episodes';
    }

    if (!isEditMode && !seriesId) {
      newErrors.seriesId = 'Series ID is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
        priceInCoins: formData.isFree ? 0 : formData.priceInCoins,
        seasonId: formData.seasonId ? formData.seasonId : null
      };

      let result;
      if (isEditMode) {
        result = await EpisodeService.updateEpisode(episode.id, episodeData);
      } else {
        if (formData.seasonId) {
          result = await EpisodeService.createEpisodeInSeason(formData.seasonId, episodeData);
        } else {
          result = await EpisodeService.createEpisodeInSeries(seriesId, episodeData);
        }
      }

      onSubmit(result.data);
    } catch (error) {
      console.error('Episode save error:', error);

      let errorMessage = 'Failed to save episode';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (
        errorMessage.toLowerCase().includes('duplicate') ||
        errorMessage.includes('ux_series_episode') ||
        errorMessage.includes('1062')
      ) {
        errorMessage = `Episode number ${formData.episodeNumber} already exists for this series. Please choose a different number.`;
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
    <div className="adm-modal-overlay">
      <div className="adm-modal-container">
        <div className="adm-modal-header">
          <h3 className="adm-modal-title">
            {isEditMode ? 'Edit Episode' : 'Create New Episode'}
          </h3>
          <button className="adm-modal-close" onClick={onClose} type="button">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="adm-modal-form">
          {errors.submit && (
            <div className="adm-alert adm-error">
              <FiAlertCircle className="adm-alert-icon" />
              <div style={{ marginLeft: '8px' }}>
                <strong>Error:</strong> {errors.submit}
              </div>
            </div>
          )}

          <div className="adm-form-group">
            <label className="adm-form-label">Season (optional)</label>
            <select
              name="seasonId"
              value={formData.seasonId}
              onChange={handleChange}
              className="adm-form-select"
              disabled={loadingSeasons || loading}
            >
              <option value="">-- Auto-assign based on episode number --</option>
              {seasons.map(season => (
                <option key={season.id} value={season.id}>
                  Season {season.seasonNumber}
                </option>
              ))}
            </select>
            {loadingSeasons && <span className="adm-form-hint">Loading seasons...</span>}
          </div>

          <div className="adm-form-group">
            <label className="adm-form-label">Episode Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`adm-form-input ${errors.title ? 'adm-error' : ''}`}
              disabled={loading}
            />
            {errors.title && <span className="adm-form-error">{errors.title}</span>}
          </div>

          <div className="adm-form-group">
            <label className="adm-form-label">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`adm-form-textarea ${errors.description ? 'adm-error' : ''}`}
              rows="4"
              disabled={loading}
            />
            {errors.description && <span className="adm-form-error">{errors.description}</span>}
          </div>

          <div className="adm-form-row">
            <div className="adm-form-group">
              <label className="adm-form-label">Episode Number *</label>
              <input
                type="number"
                name="episodeNumber"
                value={formData.episodeNumber}
                onChange={handleChange}
                min="1"
                className={`adm-form-input ${errors.episodeNumber ? 'adm-error' : ''}`}
                disabled={loading}
              />
              {!isEditMode && suggestedEpisodeNumber && (
                <span className="adm-form-hint">Suggested: {suggestedEpisodeNumber} (you can change it)</span>
              )}
            </div>

            <div className="adm-form-group">
              <label className="adm-form-label">Duration (minutes) *</label>
              <div className="adm-input-with-icon">
                <FiClock className="adm-input-icon" />
                <input
                  type="number"
                  value={(formData.durationSeconds / 60).toFixed(1)}
                  onChange={handleDurationMinutesChange}
                  min="0.1"
                  step="0.1"
                  className={`adm-form-input ${errors.durationSeconds ? 'adm-error' : ''}`}
                  disabled={loading || computingDuration}
                />
              </div>
              <div className="adm-form-hint">
                {computingDuration ? 'Computing from audio...' : `Current: ${getDurationDisplay()}`}
              </div>
              {errors.durationSeconds && <span className="adm-form-error">{errors.durationSeconds}</span>}
            </div>
          </div>

          {!isEditMode && (
            <div className="adm-form-group">
              <label className="adm-form-label">Audio File (for auto-duration)</label>
              <div>
                <input
                  type="file"
                  accept="audio/*"
                  ref={fileInputRef}
                  onChange={handleAudioFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="adm-btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={computingDuration}
                >
                  <FiUpload /> Select Audio File
                </button>
              </div>
              {audioFile && (
                <span className="adm-form-hint">Selected: {audioFile.name}</span>
              )}
            </div>
          )}

          <div className="adm-form-group">
            <label className="adm-form-label">Release Date</label>
            <input
              type="date"
              name="releaseDate"
              value={formData.releaseDate}
              onChange={handleChange}
              className="adm-form-input"
              disabled={loading}
            />
          </div>

          <div className="adm-form-group adm-checkbox-group">
            <label className="adm-checkbox-label">
              <input
                type="checkbox"
                name="isFree"
                checked={formData.isFree}
                onChange={handleChange}
                disabled={loading}
                className="adm-checkbox"
              />
              Free Episode
            </label>
          </div>

          {!formData.isFree && (
            <div className="adm-form-group">
              <label className="adm-form-label">Price (Coins) *</label>
              <input
                type="number"
                name="priceInCoins"
                value={formData.priceInCoins}
                onChange={handleChange}
                min="1"
                className={`adm-form-input ${errors.priceInCoins ? 'adm-error' : ''}`}
                disabled={loading}
              />
              {errors.priceInCoins && <span className="adm-form-error">{errors.priceInCoins}</span>}
            </div>
          )}

          <div className="adm-form-group adm-checkbox-group">
            <label className="adm-checkbox-label">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
                disabled={loading}
                className="adm-checkbox"
              />
              Publish immediately
            </label>
          </div>

          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="adm-btn-primary" disabled={loading || computingDuration}>
              {loading ? 'Saving...' : isEditMode ? 'Update Episode' : 'Create Episode'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EpisodeModal;