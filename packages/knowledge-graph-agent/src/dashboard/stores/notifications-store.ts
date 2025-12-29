/**
 * Notifications Store
 *
 * Zustand store for managing notification state.
 */

import { create } from 'zustand';
import type { Notification } from '../types';

export interface NotificationsState {
  // State
  notifications: Notification[];
  unreadCount: number;

  // Actions
  addNotification: (
    notification: Omit<Notification, 'id' | 'read' | 'timestamp'>
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const MAX_NOTIFICATIONS = 50;

export const useNotificationsStore = create<NotificationsState>((set) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,

  // Actions
  addNotification: (notification) =>
    set((state) => {
      const newNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        read: false,
        timestamp: new Date(),
      };

      return {
        notifications: [newNotification, ...state.notifications].slice(
          0,
          MAX_NOTIFICATIONS
        ),
        unreadCount: state.unreadCount + 1,
      };
    }),

  markAsRead: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (!notification || notification.read) return state;

      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification && !notification.read;

      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    }),

  clearAll: () =>
    set({
      notifications: [],
      unreadCount: 0,
    }),
}));
