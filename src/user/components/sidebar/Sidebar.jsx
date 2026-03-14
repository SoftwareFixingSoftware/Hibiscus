import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RippleButton from '../common/RippleButton';
import AuthService from '../../services/AuthService';
import LogoutModal from '../../components/LogoutModal';
import '../../styles/user-sidebar.css';

import {
  FaHome,
  FaStore,
  FaUser,
  FaHistory,
  FaHeart,
  FaSignOutAlt,
  FaSignInAlt,
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

  const user = {
    username: localStorage.getItem('username') || 'User',
    role: 'Member'
  };

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

  const handleNavClick = (path) => {
    if (isPublic) {
      localStorage.setItem('redirectAfterLogin', path);
      navigate('/login');
    } else {
      navigate(path);
    }
  };

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
      <aside className={`user-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="user-sidebar-header">
          <div className="user-brand">
            <div className="user-brand-logo">H</div>
            {!collapsed && (
              <div className="user-brand-text">
                <h2 className="user-brand-title">Hibiscus</h2>
                <p className="user-brand-subtitle">User</p>
              </div>
            )}
          </div>
          <button
            className="user-sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        <div className="user-nav">
          {menuItems.map((item) => (
            <RippleButton
              key={item.path}
              className={`user-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNavClick(item.path)}
              title={collapsed ? item.label : ''}
            >
              <span className="user-nav-icon">{item.icon}</span>
              {!collapsed && <span className="user-nav-label">{item.label}</span>}
            </RippleButton>
          ))}

          {isPublic && (
            <RippleButton
              className="user-nav-item"
              onClick={handleLoginClick}
              title={collapsed ? 'Login' : ''}
            >
              <span className="user-nav-icon">
                <FaSignInAlt />
              </span>
              {!collapsed && <span className="user-nav-label">Login</span>}
            </RippleButton>
          )}
        </div>

        {!isPublic && (
          <div className="user-sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
              {!collapsed && (
                <div className="user-details">
                  <h4 className="user-name">{user.username}</h4>
                  <p className="user-role">{user.role}</p>
                </div>
              )}
              <button
                className="user-logout-btn"
                onClick={() => setShowLogoutModal(true)}
                title="Logout"
              >
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        )}
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