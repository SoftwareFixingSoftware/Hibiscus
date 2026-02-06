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

  // Check if episode has audio
  const hasAudio = episode.hasAudio || episode.audioKey || episode.audioUrl || episode.audioStorageKey;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'audio/mpeg', 
      'audio/mp3', 
      'audio/wav', 
      'audio/ogg', 
      'audio/aac', 
      'audio/flac',
      'audio/x-m4a',
      'audio/mp4'
    ];
    
    // Also check by file extension
    const allowedExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.mp4'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Please select a valid audio file (MP3, WAV, OGG, AAC, FLAC, M4A, or MP4)');
      setSelectedFile(null);
      return;
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 500MB');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError('');
    setSuccess('');
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
      // Make the API call
      const response = await EpisodeService.uploadEpisodeAudio(episode.id, selectedFile);
      
      console.log('Upload response:', response.data);
      
      setSuccess('Audio uploaded successfully!');
      setSelectedFile(null);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Call onSubmit to refresh the episode list
      setTimeout(() => {
        onSubmit();
      }, 1500);

    } catch (err) {
      console.error('Upload error details:', err);
      
      let errorMessage = 'Failed to upload audio file';
      
      if (err.response) {
        console.error('Response error:', err.response);
        
        if (err.response.status === 404) {
          errorMessage = 'Episode not found';
        } else if (err.response.status === 400) {
          errorMessage = 'Invalid file or episode data';
        } else if (err.response.data) {
          if (err.response.data.message) {
            errorMessage = err.response.data.message;
          } else if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          }
        }
      } else if (err.request) {
        console.error('Request error:', err.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveAudio = async () => {
    if (!window.confirm('Are you sure you want to remove the audio file? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await EpisodeService.deleteEpisodeAudio(episode.id);
      setSuccess('Audio removed successfully!');
      
      // Wait a moment then refresh
      setTimeout(() => {
        onSubmit();
      }, 1500);
    } catch (err) {
      let errorMessage = 'Failed to remove audio file';
      
      if (err.response) {
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      setError(errorMessage);
      console.error('Remove error:', err);
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
    
    return {
      url: audioUrl,
      size: fileSize,
      formattedSize: formatFileSize(fileSize)
    };
  };

  const currentAudio = getCurrentAudioInfo();

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '550px' }}>
        <div className="modal-header">
          <h3 className="modal-title">
            <FiMusic style={{ marginRight: '10px' }} />
            Audio Management - Episode {episode.episodeNumber}
          </h3>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            <FiX />
          </button>
        </div>
        
        <div className="modal-form">
          <div className="upload-info">
            <h4>{episode.title}</h4>
            {hasAudio && currentAudio && (
              <div className="current-audio-info">
                <div className="audio-status">
                  <FiCheck style={{ color: '#10b981', marginRight: '5px' }} />
                  <span>Current audio file:</span>
                </div>
                <div className="audio-details">
                  <div className="audio-url" title={currentAudio.url}>
                    {currentAudio.url ? currentAudio.url.substring(0, 50) + '...' : 'Audio file'}
                  </div>
                  {currentAudio.size && (
                    <div className="audio-size">
                      Size: {currentAudio.formattedSize}
                    </div>
                  )}
                </div>
                <div className="audio-warning">
                  <FiAlertCircle style={{ color: '#f59e0b', marginRight: '5px' }} />
                  <span>Uploading a new file will replace the existing audio.</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-error" style={{ margin: '15px 0' }}>
              <FiAlertCircle />
              <div style={{ marginLeft: '8px' }}>
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{ margin: '15px 0' }}>
              <FiCheck />
              <div style={{ marginLeft: '8px' }}>
                <strong>Success:</strong> {success}
              </div>
            </div>
          )}

          <div className="upload-section">
            <div
              className={`file-drop-zone ${selectedFile ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !loading && fileInputRef.current.click()}
              style={{ 
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                padding: '30px',
                textAlign: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
                backgroundColor: selectedFile ? '#f0f9ff' : '#f9fafb',
                margin: '15px 0'
              }}
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
                <div className="file-selected" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <FiMusic size={48} color="#3b82f6" />
                  <div className="file-details" style={{ marginTop: '15px', textAlign: 'center' }}>
                    <div className="file-name" style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {selectedFile.name}
                    </div>
                    <div className="file-size" style={{ color: '#6b7280', marginBottom: '5px' }}>
                      {formatFileSize(selectedFile.size)}
                    </div>
                    <div className="file-type" style={{ color: '#6b7280' }}>
                      {selectedFile.type || 'Unknown type'}
                    </div>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    disabled={loading}
                    style={{ marginTop: '15px', padding: '8px 16px' }}
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div className="file-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <FiUpload size={48} color="#9ca3af" />
                  <div className="upload-instructions" style={{ marginTop: '15px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      Click to select or drag audio file here
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>
                      Supported formats: MP3, WAV, OGG, AAC, FLAC, M4A, MP4
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>
                      Max file size: 500MB
                    </div>
                  </div>
                </div>
              )}
            </div>

            {uploadProgress > 0 && (
              <div className="upload-progress" style={{ margin: '15px 0' }}>
                <div className="progress-bar" style={{
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${uploadProgress}%`,
                      height: '100%',
                      backgroundColor: '#3b82f6',
                      transition: 'width 0.3s ease'
                    }}
                  ></div>
                </div>
                <div className="progress-text" style={{ textAlign: 'center', marginTop: '5px' }}>
                  {uploadProgress}%
                </div>
              </div>
            )}

            <div className="modal-footer" style={{ 
              marginTop: '20px', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                {hasAudio && (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={handleRemoveAudio}
                    disabled={loading}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FiTrash2 />
                    Remove Audio
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleUpload}
                  disabled={loading || !selectedFile}
                  style={{
                    backgroundColor: !selectedFile || loading ? '#93c5fd' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: (!selectedFile || loading) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload />
                      {hasAudio ? 'Replace Audio' : 'Upload Audio'}
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