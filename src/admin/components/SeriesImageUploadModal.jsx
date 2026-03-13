import React, { useState } from 'react';
import { FiX, FiUpload, FiImage } from 'react-icons/fi';
import SeriesService from '../services/SeriesService';

const SeriesImageUploadModal = ({ series, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, GIF, WebP, SVG allowed.');
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File is too large (${formatFileSize(file.size)}). Max allowed size is ${formatFileSize(maxSize)}.`);
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    setImageFile(file);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!imageFile || !series?.id) return;
    setLoading(true);
    setUploadProgress(0);
    try {
      await SeriesService.uploadSeriesCover(series.id, imageFile);
      setUploadProgress(100);
      setTimeout(() => onSubmit(), 500);
    } catch (err) {
      setError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setImageFile(null);
    setImagePreview(null);
    setError('');
  };

  return (
    <div className="adm-modal-overlay">
      <div className="adm-modal-container">
        <div className="adm-modal-header">
          <h3 className="adm-modal-title">
            <FiImage /> Upload Cover Image for {series?.title}
          </h3>
          <button className="adm-modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleUpload} className="adm-modal-form">
          {error && <div className="adm-alert adm-error">{error}</div>}

          <div className="adm-upload-instructions">
            <p>Upload a cover image for this series. Supported formats: JPEG, PNG, GIF, WebP, SVG</p>
            <p>Max file size: 10MB</p>
            <p>Recommended size: 1200x1200 pixels</p>
          </div>

          <div className="adm-image-upload-area">
            <label className="adm-file-upload-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="adm-file-input"
                disabled={loading}
              />
              <div className="adm-upload-content">
                {imagePreview ? (
                  <div className="adm-image-preview-container">
                    <div className="adm-image-preview">
                      <img src={imagePreview} alt="Preview" />
                    </div>
                    <div className="adm-file-info">
                      <FiImage className="adm-file-icon" />
                      <div className="adm-file-details">
                        <div className="adm-file-name">{imageFile.name}</div>
                        <div className="adm-file-size">{formatFileSize(imageFile.size)}</div>
                      </div>
                      <button
                        type="button"
                        className="adm-remove-file"
                        onClick={handleRemoveFile}
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <FiUpload className="adm-upload-icon" />
                    <span>Click to select image file</span>
                    <span className="adm-upload-hint">or drag and drop</span>
                  </>
                )}
              </div>
            </label>
          </div>

          {uploadProgress > 0 && (
            <div className="adm-upload-progress">
              <div className="adm-progress-bar">
                <div className="adm-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <div className="adm-progress-text">
                {uploadProgress === 100 ? 'Upload Complete!' : `Uploading... ${uploadProgress}%`}
              </div>
            </div>
          )}

          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="adm-btn-primary" disabled={!imageFile || !!error || loading}>
              {loading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeriesImageUploadModal;