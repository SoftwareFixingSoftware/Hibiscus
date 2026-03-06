// src/admin/components/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiHome, 
  FiVideo, 
  FiMusic, 
  FiSettings, 
  FiUsers, 
  FiBarChart2,
  FiMenu,
  FiX,
  FiPackage,
  FiLogOut,
  FiCreditCard,
  FiShoppingCart,
  FiHelpCircle
  
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
    { name: 'Settings', icon: FiSettings, path: '/admin/settings' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-logo">
            <span className="logo-text">H</span>
          </div>

          {sidebarOpen && (
            <div className="brand-text">
              <h2 className="brand-title">Hibiscus</h2>
              <p className="brand-subtitle">Content Admin</p>
            </div>
          )}
        </div>

        <button 
          className="sidebar-toggle" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="nav-icon" size={20} />
            {sidebarOpen && <span className="nav-text">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {sidebarOpen && (
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>

            <div className="user-details">
              <h4 className="user-name">{user.username}</h4>
              <p className="user-role">{user.role}</p>
            </div>

            <button 
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;