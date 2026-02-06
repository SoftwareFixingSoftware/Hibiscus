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

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, GIF, WebP, SVG allowed.');
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File is too large (${formatFileSize(file.size)}). Max allowed size is ${formatFileSize(maxSize)}.`);
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    // File is valid
    setImageFile(file);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      setError('Please select a valid image file before uploading.');
      return;
    }

    if (!series || !series.id) {
      setError('No series selected.');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      await SeriesService.uploadSeriesCover(series.id, imageFile);
      setUploadProgress(100);

      // Show completion briefly before closing
      setTimeout(() => {
        onSubmit();
      }, 500);
    } catch (err) {
      console.error('Error uploading image:', err);
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
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">
            <FiImage /> Upload Cover Image for {series.title}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleUpload} className="modal-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="upload-instructions">
            <p>Upload a cover image for this series. Supported formats: JPEG, PNG, GIF, WebP, SVG</p>
            <p>Max file size: 10MB</p>
            <p>Recommended size: 1200x1200 pixels</p>
          </div>

          <div className="image-upload-area">
            <label className="file-upload-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
                disabled={loading}
              />
              <div className="upload-content">
                {imagePreview ? (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                    </div>
                    <div className="file-info">
                      <FiImage className="file-icon" />
                      <div className="file-details">
                        <div className="file-name">{imageFile.name}</div>
                        <div className="file-size">{formatFileSize(imageFile.size)}</div>
                      </div>
                      <button
                        type="button"
                        className="remove-file"
                        onClick={handleRemoveFile}
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <FiUpload className="upload-icon" />
                    <span>Click to select image file</span>
                    <span className="upload-hint">or drag and drop</span>
                  </>
                )}
              </div>
            </label>
          </div>

          {uploadProgress > 0 && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {uploadProgress === 100 ? 'Upload Complete!' : `Uploading... ${uploadProgress}%`}
              </div>
            </div>
          )}

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
              disabled={!imageFile || !!error || loading}
            >
              {loading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeriesImageUploadModal;
