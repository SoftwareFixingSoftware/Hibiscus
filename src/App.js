// src/App.jsx - Updated with new user modular structure
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Admin Components (unchanged)
import AdminLayout from './admin/layouts/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import SeriesManagement from './admin/pages/SeriesManagement';
import EpisodeManagement from './admin/pages/EpisodeManagement';
import SeriesDetail from './admin/pages/SeriesDetail';
import AdminUsers from './admin/pages/AdminUsers';

// Auth Components (unchanged)
import ForgotPassword from './auth/ForgotPassword';
import ResetPassword from './auth/ResetPassword';
import SignUp from './auth/SignUp';
import SignUpAdmin from './auth/SignUpAdmin';
import SignIn from './auth/SignIn';

// ===== NEW USER MODULE IMPORTS (user) =====
import { AudioProvider } from './user/context/AudioContext';
import UserLayout from './user/layouts/UserLayout';
import HomePage from './user/pages/HomePage';
import SeriesDetailPage from './user/pages/SeriesDetailPage';
import BuyCoinsPage from './user/pages/BuyCoinsPage';
import SuccessPage from './user/pages/SuccessPage';
import CancelPage from './user/pages/CancelPage';
import UserProtectedRoute from './user/UserProtectedRoute';
import PurchaseHistoryPage from './user/pages/PurchaseHistoryPage';

// Common Components (guards) - admin guard unchanged
import ProtectedRoute from './admin/components/ProtectedRoute';

// Optional: Redirect wrapper for legacy series routes
const LegacySeriesRedirect = ({ to }) => {
  // This component reads the old params and redirects to new URL structure
  // It's used below for /series/:seriesId and /series/:seriesId/episode/:episodeId
  return <Navigate to={to} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========== PUBLIC AUTH ROUTES (no layout) ========== */}
        <Route path="/login" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/admin/register" element={<SignUpAdmin />} />

        {/* ========== ADMIN ROUTES (Protected) ========== */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="series" element={<SeriesManagement />} />
          <Route path="series/:id" element={<SeriesDetail />} />
          <Route path="episodes" element={<EpisodeManagement />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="episodes/series/:seriesId" element={<EpisodeManagement />} />
        </Route>

        {/* ========== LEGACY SERIES ROUTES (redirect to new /user paths) ========== */}
        <Route
          path="/series/:seriesId"
          element={
            <UserProtectedRoute>
              <Navigate to={`/user/series/${window.location.pathname.split('/')[2]}`} replace />
            </UserProtectedRoute>
          }
        />
        <Route
          path="/series/:seriesId/episode/:episodeId"
          element={
            <UserProtectedRoute>
              {({ params }) => {
                // Use params from route; but Navigate doesn't have access to params directly,
                // so we use a wrapper that reads the URL.
                // Simpler: use a component that reads window.location.
                // We'll use a small inline component.
                const pathParts = window.location.pathname.split('/');
                const seriesId = pathParts[2];
                const episodeId = pathParts[4];
                return <Navigate to={`/user/series/${seriesId}?episode=${episodeId}`} replace />;
              }}
            </UserProtectedRoute>
          }
        />

        {/* ========== USER ROUTES (Protected, new modular structure under /user) ========== */}
        <Route element={<UserProtectedRoute />}>
          <Route element={<AudioProvider><UserLayout /></AudioProvider>}>
            <Route path="/user" element={<Outlet />}>
              <Route index element={<HomePage />} />
              <Route path="series/:id" element={<SeriesDetailPage />} />
              <Route path="buy-coins" element={<BuyCoinsPage />} />
              <Route path="success" element={<SuccessPage />} />
              <Route path="cancel" element={<CancelPage />} />
              
              {/* Legacy redirects within /user namespace */}
              <Route path="dashboard" element={<Navigate to="/user" replace />} />
              <Route path="payments/paypal/success" element={<Navigate to="/user/success" replace />} />
              <Route path="payments/paypal/cancel" element={<Navigate to="/user/cancel" replace />} />
              <Route path="purchases" element={<PurchaseHistoryPage />} />
            </Route>
          </Route>
        </Route>

        {/* Redirect root to /user (new home) */}
        <Route index element={<Navigate to="/user" replace />} />

        {/* ========== 404 - NOT FOUND ========== */}
        <Route
          path="*"
          element={
            <div className="error-container" style={{ padding: 32, textAlign: 'center' }}>
              <h2>Page Not Found</h2>
              <p>The page you're looking for doesn't exist.</p>
              <button onClick={() => (window.location.href = '/user')}>Go Home</button>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;