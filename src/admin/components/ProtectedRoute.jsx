// src/admin/components/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import '../styles/loading.css';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isAdmin: false
  });
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      setLoading(true);
      console.log('ProtectedRoute - Verifying auth for path:', location.pathname);

      try {
        // This endpoint should work with cookies (withCredentials: true)
        const response = await api.get('/secure/admin/auth/verify');
        
        console.log('ProtectedRoute - Verify response:', response);
        
        const { username, email, role, isAdmin } = response || {};
        
        // Store user info
        if (username) localStorage.setItem('username', username);
        if (email) localStorage.setItem('userEmail', email);
        if (role) localStorage.setItem('userRole', role);
        if (isAdmin !== undefined) {
          localStorage.setItem('isAdmin', String(isAdmin));
        }
        
        setAuthState({
          isAuthenticated: true,
          isAdmin: Boolean(isAdmin)
        });
        
      } catch (error) {
        console.error('ProtectedRoute - Auth verification failed:', error);
        
        // Check if we have stored user data as fallback
        const hasUserData = localStorage.getItem('username') || localStorage.getItem('isAdmin');
        
        if (hasUserData) {
          console.log('ProtectedRoute - Using stored user data as fallback');
          setAuthState({
            isAuthenticated: true,
            isAdmin: localStorage.getItem('isAdmin') === 'true'
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            isAdmin: false
          });
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !authState.isAdmin) {
    console.log('ProtectedRoute - Not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute - Rendering protected content');
  return children;
};

export default ProtectedRoute;