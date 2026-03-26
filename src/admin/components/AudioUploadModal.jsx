import React, { useState, useRef } from 'react';
import { FiUpload, FiX, FiAlertCircle, FiCheck, FiMusic, FiTrash2 } from 'react-icons/fi';
import EpisodeService from '../services/EpisodeService';

const AudioUploadModal = ({ episode, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const hasAudio = episode.hasAudio || episode.audioKey || episode.audioUrl || episode.audioStorageKey;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
      'audio/aac', 'audio/flac', 'audio/x-m4a', 'audio/mp4'
    ];
    const allowedExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.mp4'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Please select a valid audio file (MP3, WAV, OGG, AAC, FLAC, M4A, or MP4)');
      setSelectedFile(null);
      return;
    }

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 500MB');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError('');
    setSuccess('');
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      // 1. Get presigned URL from server
      const uploadData = await EpisodeService.getUploadUrl(episode.id);
      const { uploadUrl, storageKey } = uploadData; // data is returned directly

      // 2. Upload file directly to R2 using XMLHttpRequest (supports progress)
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', selectedFile.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(percent);
        }
      };

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(selectedFile);
      });

      await uploadPromise;

      // 3. Finalize on server
      await EpisodeService.finalizeAudioUpload(episode.id, storageKey, selectedFile.size, selectedFile.type);

      setSuccess('Audio uploaded successfully!');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => onSubmit(), 1500);
    } catch (err) {
      console.error('Upload error:', err);
      let errorMessage = 'Failed to upload audio file';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveAudio = async () => {
    if (!window.confirm('Are you sure you want to remove the audio file? This action cannot be undone.')) return;
    setLoading(true);
    setError('');
    try {
      await EpisodeService.deleteEpisodeAudio(episode.id);
      setSuccess('Audio removed successfully!');
      setTimeout(() => onSubmit(), 1500);
    } catch (err) {
      let errorMessage = 'Failed to remove audio file';
      if (err.response?.data?.message) errorMessage = err.response.data.message;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const event = { target: { files: [file] } };
      handleFileChange(event);
    }
  };

  const getCurrentAudioInfo = () => {
    if (!hasAudio) return null;
    const audioUrl = episode.audioUrl || episode.audioStorageKey || episode.audioKey;
    const fileSize = episode.fileSizeBytes || episode.fileSize;
    return { url: audioUrl, size: fileSize, formattedSize: formatFileSize(fileSize) };
  };

  const currentAudio = getCurrentAudioInfo();

  return (
    <div className="adm-modal-overlay">
      <div className="adm-modal-container" style={{ maxWidth: '550px' }}>
        <div className="adm-modal-header">
          <h3 className="adm-modal-title">
            <FiMusic style={{ marginRight: '10px' }} />
            Audio Management - Episode {episode.episodeNumber}
          </h3>
          <button className="adm-modal-close" onClick={onClose} disabled={loading}>
            <FiX />
          </button>
        </div>

        <div className="adm-modal-content">
          <div className="adm-upload-info">
            <h4>{episode.title}</h4>
            {hasAudio && currentAudio && (
              <div className="adm-current-audio-info">
                <div className="adm-audio-status">
                  <FiCheck style={{ color: '#10b981', marginRight: '5px' }} />
                  <span>Current audio file:</span>
                </div>
                <div className="adm-audio-details">
                  <div className="adm-audio-url" title={currentAudio.url}>
                    {currentAudio.url ? currentAudio.url.substring(0, 50) + '...' : 'Audio file'}
                  </div>
                  {currentAudio.size && (
                    <div className="adm-audio-size">
                      Size: {currentAudio.formattedSize}
                    </div>
                  )}
                </div>
                <div className="adm-audio-warning">
                  <FiAlertCircle style={{ color: '#f59e0b', marginRight: '5px' }} />
                  <span>Uploading a new file will replace the existing audio.</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="adm-alert adm-error" style={{ margin: '15px 0' }}>
              <FiAlertCircle className="adm-alert-icon" />
              <div style={{ marginLeft: '8px' }}>
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {success && (
            <div className="adm-alert adm-success" style={{ margin: '15px 0' }}>
              <FiCheck className="adm-alert-icon" />
              <div style={{ marginLeft: '8px' }}>
                <strong>Success:</strong> {success}
              </div>
            </div>
          )}

          <div className="adm-upload-section">
            <div
              className={`adm-file-drop-zone ${selectedFile ? 'adm-has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !loading && fileInputRef.current.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={loading}
              />

              {selectedFile ? (
                <div className="adm-file-selected">
                  <FiMusic size={48} color="#3b82f6" />
                  <div className="adm-file-details">
                    <div className="adm-file-name">{selectedFile.name}</div>
                    <div className="adm-file-size">{formatFileSize(selectedFile.size)}</div>
                    <div className="adm-file-type">{selectedFile.type || 'Unknown type'}</div>
                  </div>
                  <button
                    className="adm-btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={loading}
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div className="adm-file-empty">
                  <FiUpload size={48} color="#9ca3af" />
                  <div className="adm-upload-instructions">
                    <div>Click to select or drag audio file here</div>
                    <div>Supported formats: MP3, WAV, OGG, AAC, FLAC, M4A, MP4</div>
                    <div>Max file size: 500MB</div>
                  </div>
                </div>
              )}
            </div>

            {uploadProgress > 0 && (
              <div className="adm-upload-progress">
                <div className="adm-progress-bar">
                  <div className="adm-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <div className="adm-progress-text">{uploadProgress}%</div>
              </div>
            )}

            <div className="adm-modal-footer">
              <div>
                {hasAudio && (
                  <button
                    type="button"
                    className="adm-btn-danger"
                    onClick={handleRemoveAudio}
                    disabled={loading}
                  >
                    <FiTrash2 /> Remove Audio
                  </button>
                )}
              </div>
              <div>
                <button
                  type="button"
                  className="adm-btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="adm-btn-primary"
                  onClick={handleUpload}
                  disabled={loading || !selectedFile}
                >
                  {loading ? (
                    <>
                      <span className="adm-loading-spinner" style={{ width: '16px', height: '16px' }}></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload /> {hasAudio ? 'Replace Audio' : 'Upload Audio'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioUploadModal;