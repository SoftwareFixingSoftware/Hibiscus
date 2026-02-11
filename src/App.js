import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Admin Components
import AdminLayout from './admin/layouts/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import SeriesManagement from './admin/pages/SeriesManagement';
import EpisodeManagement from './admin/pages/EpisodeManagement';
import SeriesDetail from './admin/pages/SeriesDetail';

// Auth Components
import ForgotPassword from './auth/ForgotPassword';
import ResetPassword from './auth/ResetPassword';
import SignUp from './auth/SignUp';
import SignUpAdmin from './auth/SignUpAdmin';
import SignIn from './auth/SignIn';

// Public User Components
import HomePage from './user/pages/HomePage'; // <-- NEW: public home page

// Common Components
import ProtectedRoute from './admin/components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========== PUBLIC ROUTES ========== */}
        <Route path="/" element={<HomePage />} />                   {/* Home */}
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
          <Route path="episodes/series/:seriesId" element={<EpisodeManagement />} />
        </Route>

        {/* ========== ADDITIONAL PUBLIC ROUTES (Optional) ========== 
             You can easily add these later:
        <Route path="/series" element={<SeriesListPage />} />
        <Route path="/series/:id" element={<SeriesDetailPage />} />
        <Route path="/episodes" element={<EpisodesPage />} />
        <Route path="/episode/:id" element={<EpisodeDetailPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        */}

        {/* ========== 404 - NOT FOUND ========== */}
        <Route
          path="*"
          element={
            <div className="error-container">
              <h2>Page Not Found</h2>
              <p>The page you're looking for doesn't exist.</p>
              <button onClick={() => window.location.href = '/'}>Go Home</button>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;