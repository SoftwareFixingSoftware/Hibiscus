import React, { useState } from 'react';
import { FiX, FiUpload, FiMusic } from 'react-icons/fi';
import EpisodeService from '../services/EpisodeService';

const AudioUploadModal = ({ episode, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/mp3'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid audio file (MP3, M4A, WAV, OGG)');
      return;
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 100MB');
      return;
    }

    setAudioFile(file);
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      // Create promise for XHR
      const uploadPromise = new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', audioFile);
        
        xhr.open('POST', `http://localhost:9019/api/secure/admin/episodes/${episode.id}/upload-audio`);
        
        // Include credentials
        xhr.withCredentials = true;
        
        // Get token from localStorage for auth header
        const token = localStorage.getItem('token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              resolve(xhr.responseText);
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };
        
        xhr.send(formData);
      });

      // Upload the file
      await uploadPromise;
      
      setUploadProgress(100);
      
      // Wait a moment to show completion
      setTimeout(() => {
        onSubmit();
      }, 500);

    } catch (error) {
      console.error('Error uploading audio:', error);
      setError(error.message || 'Failed to upload audio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">
            Upload Audio for {episode.title}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <form onSubmit={handleUpload} className="modal-form">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="upload-instructions">
            <p>Upload an audio file for this episode. Supported formats: MP3, M4A, WAV, OGG</p>
            <p>Max file size: 100MB</p>
          </div>

          <div className="file-upload-area">
            <label className="file-upload-label">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="file-input"
                disabled={loading}
              />
              <div className="upload-content">
                {audioFile ? (
                  <div className="file-info">
                    <FiMusic className="file-icon" />
                    <div className="file-details">
                      <div className="file-name">{audioFile.name}</div>
                      <div className="file-size">{formatFileSize(audioFile.size)}</div>
                    </div>
                    <button
                      type="button"
                      className="remove-file"
                      onClick={() => setAudioFile(null)}
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <FiUpload className="upload-icon" />
                    <span>Click to select audio file</span>
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
              disabled={!audioFile || loading}
            >
              {loading ? 'Uploading...' : 'Upload Audio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AudioUploadModal;