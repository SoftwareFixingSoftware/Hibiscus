// src/components/sidebar/Sidebar.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RippleButton from '../common/RippleButton';
import AuthService from '../../services/AuthService';
import LogoutModal from '../../components/LogoutModal';

import {
  FaHome,
  FaStore,
  FaUser,
  FaHistory,
  FaHeart,
  FaSignOutAlt,
  FaSignInAlt,        // added login icon
  FaChevronLeft,
  FaChevronRight,
  FaBell,
  FaHeadset,
  FaExchangeAlt
} from 'react-icons/fa';

const Sidebar = ({ public: isPublic = false }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/user') return location.pathname === '/user';
    return location.pathname.startsWith(path);
  };

  const toggleSidebar = () => setCollapsed(!collapsed);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed', err);
      alert('Logout failed. Please try again.');
    } finally {
      setShowLogoutModal(false);
    }
  };

  // For public mode, redirect to login instead of navigating
  const handleNavClick = (path) => {
    if (isPublic) {
      localStorage.setItem('redirectAfterLogin', path);
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  // Special handler for login button (public only)
  const handleLoginClick = () => {
    localStorage.setItem('redirectAfterLogin', location.pathname);
    navigate('/login');
  };

  const menuItems = [
    { path: '/user', label: 'Home', icon: <FaHome /> },
    { path: '/user/notifications', label: 'Notifications', icon: <FaBell /> },
    { path: '/user/buy-coins', label: 'Store', icon: <FaStore /> },
    { path: '/user/profile', label: 'Profile', icon: <FaUser /> },
    { path: '/user/support', label: 'Support', icon: <FaHeadset /> },
    { path: '/user/purchases', label: 'Purchases', icon: <FaHistory /> },
    { path: '/user/saved-series', label: 'Favorites', icon: <FaHeart /> },
    { path: '/admin/dashboard', label: 'Switch Roles', icon: <FaExchangeAlt /> }
  ];

  return (
    <>
      <aside className={`dash-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div
            className="dash-logo"
            onClick={() => isPublic ? navigate('/') : navigate('/user')}
            style={{ cursor: 'pointer' }}
          >
            {collapsed ? 'PF' : 'PodFlow'}
          </div>

          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        <div className="dash-nav">
          {menuItems.map((item) => (
            <RippleButton
              key={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNavClick(item.path)}
              title={collapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && (
                <span className="nav-label">{item.label}</span>
              )}
            </RippleButton>
          ))}

          {/* Conditional bottom button: Logout for private, Login for public */}
          {isPublic ? (
            <RippleButton
              className="nav-item"
              onClick={handleLoginClick}
              title={collapsed ? 'Login' : ''}
            >
              <span className="nav-icon">
                <FaSignInAlt />
              </span>
              {!collapsed && (
                <span className="nav-label">Login</span>
              )}
            </RippleButton>
          ) : (
            <RippleButton
              className="nav-item"
              onClick={() => setShowLogoutModal(true)}
              title={collapsed ? 'Logout' : ''}
            >
              <span className="nav-icon">
                <FaSignOutAlt />
              </span>
              {!collapsed && (
                <span className="nav-label">Logout</span>
              )}
            </RippleButton>
          )}
        </div>
      </aside>

      {!isPublic && (
        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
        />
      )}
    </>
  );
};

export default Sidebar;