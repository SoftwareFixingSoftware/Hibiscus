import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RippleButton from '../common/RippleButton';
import { FaHome, FaStore, FaFilm, FaUser, FaHistory, FaBars, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/user') return location.pathname === '/user';
    return location.pathname.startsWith(path);
  };

  const toggleSidebar = () => setCollapsed(!collapsed);

  const menuItems = [
    { path: '/user', label: 'Home', icon: <FaHome /> },
    { path: '/user/buy-coins', label: 'Store', icon: <FaStore /> },
    { path: '/user/studio', label: 'Studio', icon: <FaFilm /> },
    { path: '/user/profile', label: 'Profile', icon: <FaUser /> },
    { path: '/user/purchases', label: 'Purchases', icon: <FaHistory /> },
  ];

  return (
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
      </div>
    </aside>
  );
};

export default Sidebar;