import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationService from '../services/NotificationService';
import Footer from '../components/common/Footer';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await NotificationService.getNotifications(page, pageSize);
      const data = res.data;
      setNotifications(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
       setError('Could not load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
     }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
     }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await NotificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
     }
  };

  const handleNotificationClick = async (notification) => {
    const seriesId = notification.seriesId || notification.data?.seriesId;
    const episodeId = notification.episodeId || notification.data?.episodeId;

    if (!notification.read) {
      try {
        await NotificationService.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
        );
      } catch (err) {
       }
    }

    if (seriesId && episodeId) {
      const params = new URLSearchParams();
      params.set('episode', episodeId);
      navigate(`/user/series/${seriesId}?${params.toString()}`);
    } else if (seriesId) {
      navigate(`/user/series/${seriesId}`);
    } else if (episodeId) {
      navigate(`/user/episode/${episodeId}`);
    } else {
     }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading && notifications.length === 0) {
    return <div className="user-loading">Loading notifications...</div>;
  }

  return (
    <div className="user-notifications-page">
      <div className="user-page-header">
        <h1>Notifications</h1>
        {notifications.some(n => !n.read) && (
          <button onClick={handleMarkAllAsRead} className="user-btn-mark-all" type="button">
            Mark all as read
          </button>
        )}
      </div>

      {error && <div className="user-error-message">{error}</div>}

      {notifications.length === 0 && !loading && (
        <div className="user-empty-state">No notifications</div>
      )}

      <div className="user-notifications-list">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`user-notification-item ${n.read ? 'read' : 'unread'}`}
            onClick={() => handleNotificationClick(n)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNotificationClick(n); }}
          >
            <div className="user-notification-content">
              <div className="user-title">{n.title}</div>
              {n.body && <div className="user-body">{n.body}</div>}
              <div className="user-time">{formatTime(n.createdAt)}</div>
            </div>
            <div className="user-actions">
              {!n.read && (
                <button
                  type="button"
                  className="user-mark-read"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsRead(n.id);
                  }}
                >
                  Mark read
                </button>
              )}
              <button
                type="button"
                className="user-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(n.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="user-pagination">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            type="button"
          >
            Previous
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      )}
      <Footer/>
    </div>
  );
};

export default NotificationsPage;