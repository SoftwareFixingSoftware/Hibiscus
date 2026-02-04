// src/admin/layouts/AdminLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import '../styles/admin.css';

const AdminLayout = () => {
  return (
    <div className="admin-container">
      <Sidebar />
      <div className="admin-main">
        <Header />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;