import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationService from '../services/NotificationService';
 
const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef(null);
  const navigate = useNavigate();

  // Fetch unread count on mount and every 30 seconds (optional polling)
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recent notifications when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      fetchRecentNotifications();
    }
  }, [dropdownOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await NotificationService.getUnreadCount();
      setUnreadCount(res.data);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  const fetchRecentNotifications = async () => {
    setLoading(true);
    try {
      const res = await NotificationService.getNotifications(0, 5);
      setNotifications(res.data.content || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await NotificationService.markAsRead(id);
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = (notification) => {
    // Navigate based on type (e.g., if episode exists, go to episode page)
    if (notification.episodeId) {
      navigate(`/user/episode/${notification.episodeId}`);
    } else if (notification.seriesId) {
      navigate(`/user/series/${notification.seriesId}`);
    }
    setDropdownOpen(false);
    // Optionally mark as read after navigation
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell" ref={bellRef}>
      <button
        className="bell-icon"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M18 16v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5H4v2h16v-2h-2zm-6 4c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z"/>
        </svg>
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {dropdownOpen && (
        <div className="dropdown">
          <div className="dropdown-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="mark-all-read">
                Mark all read
              </button>
            )}
          </div>
          <div className="notifications-list">
            {loading && <div className="loading">Loading...</div>}
            {!loading && notifications.length === 0 && (
              <div className="empty">No notifications</div>
            )}
            {!loading &&
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${n.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="notification-content">
                    <div className="title">{n.title}</div>
                    {n.body && <div className="body">{n.body}</div>}
                    <div className="time">{formatTime(n.createdAt)}</div>
                  </div>
                  {!n.read && (
                    <button
                      className="mark-read"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n.id);
                      }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
          </div>
          <div className="dropdown-footer">
            <button onClick={() => navigate('/user/notifications')}>
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;