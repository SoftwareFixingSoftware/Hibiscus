import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import Footer from '../components/common/Footer';
import '../styles/user.css';

const PublicLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="user-root">
      <Sidebar public={true} />
      <main className="user-main">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;