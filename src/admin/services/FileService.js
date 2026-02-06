// src/services/FileService.js
import api from './api';

// Get base URL from environment or use default
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9019';

const FileService = {
  /**
   * Get full URL for a file path or URL
   * Handles both full URLs and relative paths
   */
  getFileUrl: (pathOrUrl) => {
    if (!pathOrUrl) return null;
    
    // If it's already a full URL, return it as-is
    if (typeof pathOrUrl === 'string' && 
        (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://'))) {
      return pathOrUrl;
    }
    
    // If it starts with /api, it's already a full path
    if (typeof pathOrUrl === 'string' && pathOrUrl.startsWith('/api/')) {
      return `${API_BASE_URL}${pathOrUrl}`;
    }
    
    // Otherwise construct the URL
    const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl.substring(1) : pathOrUrl;
    return `${API_BASE_URL}/api/secure/files/${cleanPath}`;
  },

  /**
   * Extract the relative path from a full URL
   * Useful for when we need just the path portion
   */
  extractPathFromUrl: (url) => {
    if (!url) return null;
    
    // If it's not a full URL (doesn't start with http), return as-is
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return url;
    }
    
    try {
      const parsed = new URL(url);
      let path = parsed.pathname;
      
      // Remove the /api prefix if present
      path = path.replace(/^\/api/, '');
      
      // Remove leading/trailing slashes
      path = path.replace(/^\/+|\/+$/g, '');
      
      return path;
    } catch (e) {
      console.error('Error parsing URL:', e);
      return null;
    }
  },

  /**
   * Get file blob for direct download/playback
   */
  getFile: (path) => {
    return api.get(`/secure/files/${path}`, {
      responseType: 'blob',
    });
  },

  /**
   * Simple helper to check if string is a URL
   */
  isUrl: (str) => {
    return typeof str === 'string' && 
           (str.startsWith('http://') || str.startsWith('https://'));
  }
};

export default FileService;