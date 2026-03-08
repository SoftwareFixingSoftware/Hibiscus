// src/user/layouts/PublicLayout.jsx
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import Footer from '../components/common/Footer';
import '../styles/user.css'; // reuse same styles

const PublicLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="dash-root">   {/* use same class as user layout */}
      <Sidebar public={true} />    {/* sidebar in public mode */}
      <main className="dash-main">
        <Outlet />
      </main>
      {/* no MiniPlayer for public users */}
    </div>
  );
};

export default PublicLayout;