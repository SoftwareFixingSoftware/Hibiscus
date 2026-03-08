// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Admin Components
import AdminLayout from './admin/layouts/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import SeriesManagement from './admin/pages/SeriesManagement';
import EpisodeManagement from './admin/pages/EpisodeManagement';
import SeriesDetail from './admin/pages/SeriesDetail';
import AdminUsers from './admin/pages/AdminUsers';
import AdminAnalytics from './admin/pages/AdminAnalytics';
// Auth Components
import ForgotPassword from './auth/ForgotPassword';
import ResetPassword from './auth/ResetPassword';
import SignUp from './auth/SignUp';
import SignUpAdmin from './auth/SignUpAdmin';
import SignIn from './auth/SignIn';

// User Module
import { AudioProvider } from './user/context/AudioContext';   // moved to top level
import UserLayout from './user/layouts/UserLayout';
import PublicLayout from './user/layouts/PublicLayout';
import HomePage from './user/pages/HomePage';
import SeriesDetailPage from './user/pages/SeriesDetailPage';
import BuyCoinsPage from './user/pages/BuyCoinsPage';
import SuccessPage from './user/pages/SuccessPage';
import CancelPage from './user/pages/CancelPage';
import UserProtectedRoute from './user/UserProtectedRoute';
import PurchaseHistoryPage from './user/pages/PurchaseHistoryPage';
import UserProfile from './user/pages/ProfilePage';
import SavedSeries from './user/pages/SavedSeriesPage';
import NotificationsPage from './user/pages/NotificationsPage';
import UserSupport from './user/pages/SupportCenterPage';

// Common Components (admin guard)
import ProtectedRoute from './admin/components/ProtectedRoute';
import AdminCoinPackagesPage from './admin/pages/AdminCoinPackagesPage';
import AdminPayments from './admin/pages/AdminPayments';
import AdminEpisodePurchases from './admin/pages/AdminEpisodePurchases';
import AdminSupport from './admin/pages/AdminSupportPage';
import AdminPaymentDetail from './admin/pages/AdminPaymentDetail';

function App() {
  return (
    <BrowserRouter>
      <AudioProvider>   {/* Audio context available everywhere */}
        <Routes>
          {/* ========== PUBLIC AUTH ROUTES ========== */}
          <Route path="/login" element={<SignIn />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<SignUp />} />
          <Route path="/admin/register" element={<SignUpAdmin />} />

          {/* ========== ADMIN ROUTES ========== */}
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
            <Route path="coin-packages" element={<AdminCoinPackagesPage />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="purchases" element={<AdminEpisodePurchases />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="payments/:paymentId" element={<AdminPaymentDetail />} />
          </Route>

          {/* ========== PUBLIC ROUTES (no /user prefix) ========== */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/series/:id" element={<SeriesDetailPage />} />
          </Route>

          {/* ========== USER ROUTES (protected, /user prefix) ========== */}
          <Route element={<UserProtectedRoute />}>
            <Route element={<UserLayout />}>   {/* AudioProvider removed from here */}
              <Route path="/user" element={<Outlet />}>
                <Route index element={<HomePage />} />
                <Route path="series/:id" element={<SeriesDetailPage />} />
                <Route path="buy-coins" element={<BuyCoinsPage />} />
                <Route path="success" element={<SuccessPage />} />
                <Route path="cancel" element={<CancelPage />} />
                <Route path="dashboard" element={<Navigate to="/user" replace />} />
                <Route path="payments/paypal/success" element={<Navigate to="/user/success" replace />} />
                <Route path="payments/paypal/cancel" element={<Navigate to="/user/cancel" replace />} />
                <Route path="purchases" element={<PurchaseHistoryPage />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="saved-series" element={<SavedSeries />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="support" element={<UserSupport />} />
              </Route>
            </Route>
          </Route>

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="error-container" style={{ padding: 32, textAlign: 'center' }}>
                <h2>Page Not Found</h2>
                <p>The page you're looking for doesn't exist.</p>
                <button onClick={() => (window.location.href = '/')}>Go Home</button>
              </div>
            }
          />
        </Routes>
      </AudioProvider>
    </BrowserRouter>
  );
}

export default App;