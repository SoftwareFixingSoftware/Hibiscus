import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationService from '../services/NotificationService';
 
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
      console.error('Failed to load notifications', err);
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
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await NotificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    // try to read seriesId/episodeId from top-level or nested data
    const seriesId = notification.seriesId || notification.data?.seriesId;
    const episodeId = notification.episodeId || notification.data?.episodeId;

    // Optional: mark as read when user opens notification
    if (!notification.read) {
      try {
        await NotificationService.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
        );
      } catch (err) {
        console.error('Failed to mark as read on open', err);
      }
    }

    if (seriesId && episodeId) {
      // navigate to series page with query param for episode
      const params = new URLSearchParams();
      params.set('episode', episodeId);
      navigate(`/user/series/${seriesId}?${params.toString()}`);
    } else if (seriesId) {
      navigate(`/user/series/${seriesId}`);
    } else if (episodeId) {
      // fallback if only episodeId is available
      navigate(`/user/episode/${episodeId}`);
    } else {
      console.warn('Notification has no seriesId or episodeId', notification);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading && notifications.length === 0) {
    return <div className="loading">Loading notifications...</div>;
  }

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h1>Notifications</h1>
        {notifications.some(n => !n.read) && (
          <button onClick={handleMarkAllAsRead} className="btn-mark-all" type="button">
            Mark all as read
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {notifications.length === 0 && !loading && (
        <div className="empty-state">No notifications</div>
      )}

      <div className="notifications-list">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`notification-item ${n.read ? 'read' : 'unread'}`}
            onClick={() => handleNotificationClick(n)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNotificationClick(n); }}
          >
            <div className="notification-content">
              <div className="title">{n.title}</div>
              {n.body && <div className="body">{n.body}</div>}
              <div className="time">{formatTime(n.createdAt)}</div>
            </div>
            <div className="actions">
              {!n.read && (
                <button
                  type="button"
                  className="mark-read"
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
                className="delete"
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
        <div className="pagination">
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
    </div>
  );
};

export default NotificationsPage;