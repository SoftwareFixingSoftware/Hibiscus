import React, { useState, useEffect } from 'react';
import { FiMenu, FiSearch, FiBell, FiChevronDown } from 'react-icons/fi';
import AuthService from '../services/AuthService';

const Header = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState({
    username: 'Admin',
    email: 'admin@example.com',
    role: 'Administrator'
  });

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser.username) {
      setUser(currentUser);
    }
  }, []);

  const toggleSidebar = () => {
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('closed');
      sidebar.classList.toggle('open');
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      AuthService.clearAuthData();
      window.location.href = '/login';
    }
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <button 
          className="mobile-menu-toggle"
          onClick={toggleSidebar}
        >
          <FiMenu size={24} />
        </button>
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="search-input"
          />
        </div>
      </div>
      
      <div className="header-right">
        <button className="notification-btn">
          <FiBell size={20} />
          <span className="notification-badge">3</span>
        </button>
        
        <div className="user-menu-container">
          <button 
            className="user-menu-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="header-user-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="header-user-info">
              <span className="header-user-name">{user.username}</span>
              <span className="header-user-role">{user.role}</span>
            </div>
            <FiChevronDown className={`dropdown-icon ${userMenuOpen ? 'rotate' : ''}`} />
          </button>
          
          {userMenuOpen && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="dropdown-user-info">
                  <h4>{user.username}</h4>
                  <p>{user.email}</p>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item">Profile Settings</button>
              <button className="dropdown-item">Account</button>
              <button className="dropdown-item">Notifications</button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;