// src/routes/ProtectedRoute.jsx
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
    let mounted = true;

    const verifyAuth = async () => {
      setLoading(true);
      try {
        // api returns response.data, so 'res' is the payload
        const res = await api.get('/auth/verify');
        if (!mounted) return;

        const isAdmin = Boolean(res?.isAdmin);
        setAuthState({
          isAuthenticated: true,
          isAdmin
        });
      } catch (error) {
        if (!mounted) return;
        setAuthState({
          isAuthenticated: false,
          isAdmin: false
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    verifyAuth();
    return () => { mounted = false; };
  }, [location.pathname, location.search]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    // Save attempted location and redirect to login with redirect query
    const attempted = location.pathname + location.search;
    sessionStorage.setItem('redirectAfterLogin', attempted);
    return <Navigate to={`/login?redirect=${encodeURIComponent(attempted)}`} replace />;
  }

  if (adminOnly && !authState.isAdmin) {
    // Authenticated but not an admin — don't expose admin content.
    // Redirect to home (or change to '/user' if desired).
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;