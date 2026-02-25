import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RippleButton from '../common/RippleButton';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/user') return location.pathname === '/user';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="dash-sidebar">
      <div className="dash-logo" onClick={() => navigate('/user')} style={{ cursor: 'pointer' }}>
        pf
      </div>
      <div className="dash-nav">
        <RippleButton className={`nav-item ${isActive('/user') ? 'active' : ''}`} onClick={() => navigate('/user')}>
          Home
        </RippleButton>
        <RippleButton className={`nav-item ${isActive('/user/buy-coins') ? 'active' : ''}`} onClick={() => navigate('/user/buy-coins')}>
          Store
        </RippleButton>
        <RippleButton className="nav-item" onClick={() => navigate('/user/studio')}>
          Studio
        </RippleButton>
        <RippleButton className="nav-item" onClick={() => navigate('/user/profile')}>
          Profile
        </RippleButton>
      </div>
    </aside>
  );
};

export default Sidebar;