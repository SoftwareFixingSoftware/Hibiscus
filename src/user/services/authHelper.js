// src/services/authHelper.js
export const isAuthenticatedByPath = () => {
  return window.location.pathname.startsWith('/user');
};

export const getFileUrl = (url) => {
  if (!url) return null;
  // If the user is authenticated, keep the original secure URL
  if (isAuthenticatedByPath()) {
    return url;
  }
  // For unauthenticated users, replace /secure/files/ with /files/covers/
  // This assumes the stored URL has the pattern: .../api/secure/files/covers/...
  return url.replace('/secure/files/', '/files/');
};