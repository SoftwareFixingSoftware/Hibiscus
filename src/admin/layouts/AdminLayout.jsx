import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { FiMenu, FiX } from 'react-icons/fi';
import '../styles/admin-base.css';

const AdminLayout = () => {
  const [sidebarHidden, setSidebarHidden] = useState(false);

  const toggleSidebar = () => setSidebarHidden(prev => !prev);

  return (
    <div className={`adm-admin-container ${sidebarHidden ? 'adm-sidebar-hidden' : ''}`}>
      <Sidebar />
      <div className="adm-admin-main">
        {/* Mobile toggle button – bottom right */}
        <button 
          className="adm-mobile-toggle" 
          onClick={toggleSidebar}
          aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
        >
          {sidebarHidden ? <FiMenu size={24} /> : <FiX size={24} />}
        </button>
        <main className="adm-admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;