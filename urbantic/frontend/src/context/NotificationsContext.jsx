import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import * as notificationsApi from '../api/notifications.api.js';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!isAuthenticated) return;
    if (!silent) setLoading(true);
    try {
      const data = await notificationsApi.list();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError('');
    } catch (apiError) {
      if (!silent) setError(apiError.response?.data?.message || 'No se pudieron cargar las notificaciones.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return undefined;
    }

    refreshNotifications();
    const interval = window.setInterval(() => refreshNotifications({ silent: true }), 30_000);
    const handleFocus = () => refreshNotifications({ silent: true });
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, user?.id, refreshNotifications]);

  async function markAsRead(notification) {
    if (notification.isRead) return;
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
    setUnreadCount((current) => Math.max(0, current - 1));
    try {
      await notificationsApi.markAsRead(notification.id);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'No se pudo actualizar la notificación.');
      refreshNotifications({ silent: true });
    }
  }

  async function markAllAsRead() {
    if (!unreadCount) return;
    const previousNotifications = notifications;
    const previousCount = unreadCount;
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationsApi.markAllAsRead();
    } catch (apiError) {
      setNotifications(previousNotifications);
      setUnreadCount(previousCount);
      setError(apiError.response?.data?.message || 'No se pudieron actualizar las notificaciones.');
    }
  }

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead
  }), [notifications, unreadCount, loading, error, refreshNotifications]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications debe usarse dentro de NotificationsProvider.');
  return context;
}
