// src/user/layouts/PublicPageLayout.jsx
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Footer from '../components/common/Footer';
import '../styles/user.css';

const PublicPageLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="user-root">
      <main className="user-main user-main--no-sidebar">
        <header className="user-app-header">
          <div className="user-logo" onClick={() => navigate('/user')}>Hibiscus</div>
        </header>
        <div className="user-content">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default PublicPageLayout;