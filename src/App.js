import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AdminLayout from './admin/layouts/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import SeriesManagement from './admin/pages/SeriesManagement';
import EpisodeManagement from './admin/pages/EpisodeManagement';
import SeriesDetail from './admin/pages/SeriesDetail';
import ForgotPassword from './auth/ForgotPassword';
import ResetPassword from './auth/ResetPassword'

import SignIn from './auth/SignIn';
import ProtectedRoute from './admin/components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<SignIn />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />


        {/* Admin Routes - Protected */}
        <Route
          path="/admin"
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

        {/* User Routes - Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>User Dashboard</div>
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
