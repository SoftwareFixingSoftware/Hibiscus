import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import NotificationService from '../services/NotificationService';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await NotificationService.getUnreadCount();
      setUnreadCount(res.data);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  const handleClick = () => {
    navigate('/user/notifications');
  };

  return (
    <button
      className="user-notification-bell"
      onClick={handleClick}
      aria-label="Notifications"
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        marginLeft: 'auto',
        marginRight: '80px',        /* updated to 40px */
        color: 'var(--user-text-primary)',
        fontSize: '1.5rem',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <FaBell />
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-6px',
            background: 'var(--user-error-color)',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            minWidth: '18px',
            textAlign: 'center',
          }}
        >
          {unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;