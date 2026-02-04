import api from './api';

// Get base URL from environment or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9019';

const FileService = {
  // Get file by path (for serving audio/images)
  getFile: (path) => {
    return api.get(`/secure/files/${path}`, {
      responseType: 'blob',
      withCredentials: true,
    });
  },

  // Get file URL for direct use
  getFileUrl: (path) => {
    if (!path) return null;
    
    // Handle absolute URLs
    if (path.startsWith('http')) return path;
    
    // Handle relative paths
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Ensure we include the full path with credentials
    return `${API_BASE_URL}/api/secure/files/${cleanPath}`;
  },

  // Upload file - generic method
  uploadFile: (endpoint, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

export default FileService;