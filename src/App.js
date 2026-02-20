// src/api.jsx (or App.jsx) - drop-in replacement
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
 
// Admin Components
import AdminLayout from './admin/layouts/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import SeriesManagement from './admin/pages/SeriesManagement';
import EpisodeManagement from './admin/pages/EpisodeManagement';
import SeriesDetail from './admin/pages/SeriesDetail';
import AdminUsers from './admin/pages/AdminUsers'
// Auth Components
import ForgotPassword from './auth/ForgotPassword';
import ResetPassword from './auth/ResetPassword';
import SignUp from './auth/SignUp';
import SignUpAdmin from './auth/SignUpAdmin';
import SignIn from './auth/SignIn';

// User items
import UserDashboard from './user/Dashboard'

// Common Components (guards)
import ProtectedRoute from './admin/components/ProtectedRoute';
import UserProtectedRoute from './user/components/ProtectedRoute';

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
          <Route path="users" element={<AdminUsers/>} />
          <Route path="episodes/series/:seriesId" element={<EpisodeManagement />} />
        </Route>

        {/* ========== USER-FACING SERIES ROUTES (protected) ==========
            These make /series/:seriesId and
            /series/:seriesId/episode/:episodeId reachable directly. */}
        <Route
          path="/series/:seriesId"
          element={
            <UserProtectedRoute>
              <UserDashboard />
            </UserProtectedRoute>
          }
        />
        <Route
          path="/series/:seriesId/episode/:episodeId"
          element={
            <UserProtectedRoute>
              <UserDashboard />
            </UserProtectedRoute>
          }
        />

        {/* ========== USER ROUTES (Protected, legacy /user/ namespace) ========== */}
        <Route path="/user/*" element={<UserProtectedRoute />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          {/* add more /user/* child routes here if needed */}
        </Route>

        {/* Redirect root to user dashboard (optional) */}
        <Route index element={<Navigate to="/user/dashboard" replace />} />

        {/* ========== 404 - NOT FOUND ========== */}
        <Route
          path="*"
          element={
            <div className="error-container" style={{ padding: 32, textAlign: 'center' }}>
              <h2>Page Not Found</h2>
              <p>The page you're looking for doesn't exist.</p>
              <button onClick={() => (window.location.href = '/user/dashboard')}>Go Home</button>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
