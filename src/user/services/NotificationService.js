import api from './api';

const NotificationService = {
  getNotifications: (page = 0, size = 20) =>
    api.get(`/secure/user/notifications?page=${page}&size=${size}`),

  getUnreadCount: () =>
    api.get('/secure/user/notifications/unread-count'),

  markAsRead: (id) =>
    api.put(`/secure/user/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put('/secure/user/notifications/read-all'),

  deleteNotification: (id) =>
    api.delete(`/secure/user/notifications/${id}`),
};

export default NotificationService;