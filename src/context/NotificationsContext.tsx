import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getNotifications, markNotificationAsRead as markNotificationAsReadAPI, markAllNotificationsAsRead as markAllNotificationsAsReadAPI, deleteNotification as deleteNotificationAPI } from '../utils/api';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'subscribe' | 'trending' | 'reply';
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  action: string;
  content?: string;
  postId?: string;
  timestamp: string;
  read: boolean;
  createdAt: number;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  deleteNotification: (notificationId: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const loadNotifications = () => {
      try {
        const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        if (profile.id) {
          const saved = localStorage.getItem(`notifications_${profile.id}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            setNotifications(parsed);
          }
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();

    // Listen for profile changes
    window.addEventListener('profileUpdated', loadNotifications);
    return () => window.removeEventListener('profileUpdated', loadNotifications);
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
      if (profile.id && notifications.length > 0) {
        localStorage.setItem(`notifications_${profile.id}`, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }, [notifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Add new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'createdAt'>) => {
    const now = Date.now();
    const newNotification: Notification = {
      ...notification,
      id: `notif_${now}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: formatTimestamp(now),
      read: false,
      createdAt: now,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only last 50
    console.log('🔔 New notification added:', newNotification);
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    // Update local state immediately for better UX
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    
    // Sync with backend
    try {
      await markNotificationAsReadAPI(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read on backend:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    // Update local state immediately
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    
    // Sync with backend
    try {
      await markAllNotificationsAsReadAPI();
    } catch (error) {
      console.error('Failed to mark all notifications as read on backend:', error);
    }
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
    try {
      const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
      if (profile.id) {
        localStorage.removeItem(`notifications_${profile.id}`);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Delete single notification
  const deleteNotification = async (notificationId: string) => {
    // Update local state immediately
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    
    // Sync with backend
    try {
      await deleteNotificationAPI(notificationId);
    } catch (error) {
      console.error('Failed to delete notification on backend:', error);
    }
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Update timestamps periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          timestamp: formatTimestamp(notif.createdAt),
        }))
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Sync with backend periodically (polling for real-time updates)
  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        
        // Don't sync if no profile or no valid token
        if (!profile.id || !token) {
          // Clear notifications if user is not authenticated
          setNotifications([]);
          return;
        }

        // Get notifications from backend
        const backendNotifications = await getNotifications(50);
        
        if (backendNotifications && backendNotifications.length > 0) {
          // Transform backend notifications to frontend format
          const transformedNotifications: Notification[] = backendNotifications.map((notif: any) => ({
            id: notif.id,
            type: notif.type.toLowerCase().replace('new_', '') as any,
            user: {
              id: notif.data?.likerId || notif.data?.commenterId || notif.data?.followerId || 'unknown',
              name: notif.data?.likerDisplayName || notif.data?.commenterDisplayName || notif.data?.followerDisplayName || 'Unknown User',
              username: notif.data?.likerUsername || notif.data?.commenterUsername || notif.data?.followerUsername || '@unknown',
              avatar: notif.data?.likerAvatar || notif.data?.commenterAvatar || notif.data?.followerAvatar || '',
            },
            action: notif.message,
            content: notif.data?.postContent || notif.data?.commentContent || '',
            postId: notif.data?.postId || '',
            timestamp: formatTimestamp(new Date(notif.createdAt).getTime()),
            read: notif.isRead,
            createdAt: new Date(notif.createdAt).getTime(),
          }));

          // Merge with local notifications (keep local ones that aren't in backend yet)
          setNotifications(prev => {
            const backendIds = new Set(transformedNotifications.map(n => n.id));
            const localOnly = prev.filter(n => !backendIds.has(n.id) && n.createdAt > Date.now() - 60000); // Keep local notifications from last minute
            return [...transformedNotifications, ...localOnly].slice(0, 50);
          });
        }
      } catch (error: unknown) {
        // Silent fail if it's an auth error (user needs to login)
        // Only log other types of errors
        const message = error instanceof Error ? error.message : String(error);
        if (message !== 'Unauthorized' && message !== 'Failed to get notifications') {
          console.error('Failed to sync notifications from backend:', error);
        }
      }
    };

    // Sync immediately
    syncWithBackend();

    // Then sync every 10 seconds for real-time updates
    const interval = setInterval(syncWithBackend, 10000);

    // Listen for token expiration events
    const handleTokenExpired = () => {
      console.log('🔔 Token expired, clearing notifications');
      setNotifications([]);
    };

    window.addEventListener('authTokenExpired', handleTokenExpired);

    return () => {
      clearInterval(interval);
      window.removeEventListener('authTokenExpired', handleTokenExpired);
    };
  }, []);

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    deleteNotification,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

