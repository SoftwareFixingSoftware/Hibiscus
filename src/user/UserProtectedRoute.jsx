import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import api from './services/api';
import './styles/loading.css';

const UserProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const verifyAuth = async () => {
      setLoading(true);
      try {
        const response = await api.get('/auth/verify');
        if (!mounted) return;
        setIsAuthenticated(response?.status === 200);
      } catch (error) {
        if (!mounted) return;
        setIsAuthenticated(false);
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

  if (!isAuthenticated) {
    // store attempted location and redirect with query param for consistency with interceptor flow
    const attempted = location.pathname + location.search;
    sessionStorage.setItem('redirectAfterLogin', attempted);
    return <Navigate to={`/login?redirect=${encodeURIComponent(attempted)}`} state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default UserProtectedRoute;