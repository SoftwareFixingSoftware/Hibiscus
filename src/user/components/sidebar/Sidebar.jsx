import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RippleButton from '../common/RippleButton';
import AuthService from '../../services/AuthService';
import LogoutModal from '../../components/LogoutModal';  
import {
  FaHome,
  FaStore,
  FaFilm,
  FaUser,
  FaHistory,
  FaHeart,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';

const Sidebar = () => {
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
      navigate('/'); // or '/login'
    } catch (err) {
      console.error('Logout failed', err);
      alert('Logout failed. Please try again.');
    } finally {
      setShowLogoutModal(false);
    }
  };

  const menuItems = [
    { path: '/user', label: 'Home', icon: <FaHome /> },
    { path: '/user/buy-coins', label: 'Store', icon: <FaStore /> },
    { path: '/user/studio', label: 'Studio', icon: <FaFilm /> },
    { path: '/user/profile', label: 'Profile', icon: <FaUser /> },
    { path: '/user/purchases', label: 'Purchases', icon: <FaHistory /> },
    { path: '/user/saved-series', label: 'Favorites', icon: <FaHeart /> },
  ];

  return (
    <>
      <aside className={`dash-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="dash-logo" onClick={() => navigate('/user')} style={{ cursor: 'pointer' }}>
            {collapsed ? 'PF' : 'PodFlow'}
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        <div className="dash-nav">
          {menuItems.map((item) => (
            <RippleButton
              key={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </RippleButton>
          ))}

          {/* Logout button – separate because it doesn't navigate */}
          <RippleButton
            className="nav-item"
            onClick={() => setShowLogoutModal(true)}
            title={collapsed ? 'Logout' : ''}
          >
            <span className="nav-icon"><FaSignOutAlt /></span>
            {!collapsed && <span className="nav-label">Logout</span>}
          </RippleButton>
        </div>
      </aside>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
};

export default Sidebar;