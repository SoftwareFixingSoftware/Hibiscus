import React, { useState } from 'react';
import { NavLink } from 'react-router-dom'; // useNavigate no longer needed
import {
  FiHome, FiVideo, FiMusic, FiUsers, FiBarChart2,
  FiMenu, FiX, FiPackage, FiLogOut, FiCreditCard,
  FiShoppingCart, FiHelpCircle, FiRepeat
} from 'react-icons/fi';

const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user] = useState({
    username: localStorage.getItem('username') || 'Admin',
    role: localStorage.getItem('userRole') || 'Administrator'
  });

  const navigationItems = [
    { name: 'Dashboard', icon: FiHome, path: '/admin/dashboard' },
    { name: 'Series Management', icon: FiVideo, path: '/admin/series' },
    { name: 'Episodes', icon: FiMusic, path: '/admin/episodes' },
    { name: 'Users', icon: FiUsers, path: '/admin/users' },
    { name: 'Analytics', icon: FiBarChart2, path: '/admin/analytics' },
    { name: 'Coin Packages', icon: FiPackage, path: '/admin/coin-packages' },
    { name: 'Payments', icon: FiCreditCard, path: '/admin/payments' },
    { name: 'Purchases', icon: FiShoppingCart, path: '/admin/purchases' },
    { name: 'Support', icon: FiHelpCircle, path: '/admin/support' },
    { name: 'Switch Role', icon: FiRepeat, path: '/user' }
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <aside className={`adm-sidebar ${sidebarOpen ? 'adm-open' : 'adm-closed'}`}>
      <div className="adm-sidebar-header">
        <div className="adm-brand">
          <img
            src="/logo.png"
            alt="Hibiscus"
            className="adm-brand-logo"
            // no onClick – not clickable
          />
          {sidebarOpen && (
            <div className="adm-brand-text">
              <h1 className="adm-brand-title">Hibiscus</h1>
              <p className="adm-brand-subtitle">Content Admin</p>
            </div>
          )}
        </div>
        <button className="adm-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      <nav className="adm-sidebar-nav">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `adm-nav-item ${isActive ? 'adm-active' : ''}`}
          >
            <item.icon className="adm-nav-icon" size={20} />
            {sidebarOpen && <span className="adm-nav-text">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {sidebarOpen && (
        <div className="adm-sidebar-footer">
          <div className="adm-user-info">
            <div className="adm-user-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="adm-user-details">
              <h4 className="adm-user-name">{user.username}</h4>
              <p className="adm-user-role">{user.role}</p>
            </div>
            <button className="adm-logout-btn" onClick={handleLogout} title="Logout">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;