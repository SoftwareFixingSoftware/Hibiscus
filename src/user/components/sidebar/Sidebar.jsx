import React, { useState, useRef, useEffect } from 'react';
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
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);

  const lastScrollY = useRef(0);
  const ticking = useRef(false);

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

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

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

  // Make collapse state available to the whole layout
  useEffect(() => {
    document.documentElement.classList.toggle('user-sidebar-collapsed', collapsed);
    document.documentElement.classList.toggle('user-sidebar-expanded', !collapsed);

    return () => {
      document.documentElement.classList.remove('user-sidebar-collapsed');
      document.documentElement.classList.remove('user-sidebar-expanded');
    };
  }, [collapsed]);

  // Scroll detection to hide/show bottom navigation bar
  useEffect(() => {
    const mainElement = document.querySelector('.user-main');
    if (!mainElement) return;

    const handleScroll = () => {
      if (ticking.current) return;

      ticking.current = true;
      requestAnimationFrame(() => {
        const currentScrollY = mainElement.scrollTop;

        if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          setIsBottomNavVisible(false);
        } else if (currentScrollY < lastScrollY.current) {
          setIsBottomNavVisible(true);
        }

        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });
    };

    mainElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, []);

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
      {/* Desktop sidebar */}
      <aside className={`user-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="user-sidebar-header">
          <div className="user-brand">
            <img src="/logo.png" alt="Hibiscus" className="user-brand-logo" />
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
            type="button"
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
              <div className="user-avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>

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
                type="button"
              >
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile bottom navigation bar */}
      <div className={`user-bottom-nav ${!isBottomNavVisible ? 'user-bottom-nav--hidden' : ''}`}>
        <div className="user-bottom-nav-scroll">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`user-bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNavClick(item.path)}
              title={item.label}
              type="button"
            >
              <span className="user-bottom-nav-icon">{item.icon}</span>
            </button>
          ))}

          {isPublic ? (
            <button
              className="user-bottom-nav-item"
              onClick={handleLoginClick}
              title="Login"
              type="button"
            >
              <span className="user-bottom-nav-icon">
                <FaSignInAlt />
              </span>
            </button>
          ) : (
            <button
              className="user-bottom-nav-item"
              onClick={() => setShowLogoutModal(true)}
              title="Logout"
              type="button"
            >
              <span className="user-bottom-nav-icon">
                <FaSignOutAlt />
              </span>
            </button>
          )}
        </div>
      </div>

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