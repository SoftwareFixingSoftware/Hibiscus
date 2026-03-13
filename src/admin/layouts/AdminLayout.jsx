import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/admin-base.css';  

const AdminLayout = () => {
  return (
    <div className="adm-admin-container">
      <Sidebar />
      <div className="adm-admin-main">
        <main className="adm-admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;