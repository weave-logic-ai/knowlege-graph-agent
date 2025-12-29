/**
 * UI State Store (Zustand)
 *
 * Manages client-side UI state:
 * - Sidebar collapsed state
 * - Theme preference
 * - Modal states
 * - Notifications
 * - Loading states
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Notification, NotificationType } from '../lib/api/types.js';

// Theme type
export type Theme = 'light' | 'dark' | 'system';

// Modal types
export type ModalType =
  | 'create-node'
  | 'edit-node'
  | 'delete-node'
  | 'spawn-agent'
  | 'start-workflow'
  | 'export-graph'
  | 'settings'
  | 'keyboard-shortcuts'
  | 'confirm';

// Confirm dialog configuration
export interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel?: () => void;
}

// Sidebar state
export interface SidebarState {
  collapsed: boolean;
  width: number;
  openSections: string[];
}

// Modal state
export interface ModalState {
  type: ModalType | null;
  isOpen: boolean;
  props?: Record<string, unknown>;
  confirmConfig?: ConfirmConfig;
}

// Toast notification (ephemeral)
export interface Toast {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// UI State interface
export interface UIState {
  // Sidebar
  sidebar: SidebarState;

  // Theme
  theme: Theme;
  resolvedTheme: 'light' | 'dark';

  // Modal
  modal: ModalState;

  // Notifications (persistent)
  notifications: Notification[];
  unreadCount: number;

  // Toasts (ephemeral)
  toasts: Toast[];

  // Loading states
  isGlobalLoading: boolean;
  loadingMessage: string | null;

  // Command palette
  isCommandPaletteOpen: boolean;
}

// Actions interface
export interface UIActions {
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  toggleSidebarSection: (sectionId: string) => void;
  setSidebarSections: (sections: string[]) => void;

  // Theme actions
  setTheme: (theme: Theme) => void;
  setResolvedTheme: (theme: 'light' | 'dark') => void;

  // Modal actions
  openModal: (type: ModalType, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  confirm: (config: ConfirmConfig) => void;

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  setNotifications: (notifications: Notification[]) => void;

  // Toast actions
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;

  // Loading actions
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Command palette actions
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
}

// Initial state
const initialState: UIState = {
  // Sidebar
  sidebar: {
    collapsed: false,
    width: 280,
    openSections: ['overview', 'knowledge'],
  },

  // Theme
  theme: 'system',
  resolvedTheme: 'dark',

  // Modal
  modal: {
    type: null,
    isOpen: false,
    props: undefined,
    confirmConfig: undefined,
  },

  // Notifications
  notifications: [],
  unreadCount: 0,

  // Toasts
  toasts: [],

  // Loading
  isGlobalLoading: false,
  loadingMessage: null,

  // Command palette
  isCommandPaletteOpen: false,
};

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Create the store with persistence
export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Sidebar actions
      toggleSidebar: () => set((state) => ({
        sidebar: {
          ...state.sidebar,
          collapsed: !state.sidebar.collapsed,
        },
      })),

      setSidebarCollapsed: (collapsed) => set((state) => ({
        sidebar: { ...state.sidebar, collapsed },
      })),

      setSidebarWidth: (width) => set((state) => ({
        sidebar: { ...state.sidebar, width: Math.max(200, Math.min(400, width)) },
      })),

      toggleSidebarSection: (sectionId) => set((state) => {
        const { openSections } = state.sidebar;
        const isOpen = openSections.includes(sectionId);
        return {
          sidebar: {
            ...state.sidebar,
            openSections: isOpen
              ? openSections.filter(id => id !== sectionId)
              : [...openSections, sectionId],
          },
        };
      }),

      setSidebarSections: (sections) => set((state) => ({
        sidebar: { ...state.sidebar, openSections: sections },
      })),

      // Theme actions
      setTheme: (theme) => set({ theme }),

      setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),

      // Modal actions
      openModal: (type, props) => set({
        modal: {
          type,
          isOpen: true,
          props,
          confirmConfig: undefined,
        },
      }),

      closeModal: () => set({
        modal: {
          type: null,
          isOpen: false,
          props: undefined,
          confirmConfig: undefined,
        },
      }),

      confirm: (config) => set({
        modal: {
          type: 'confirm',
          isOpen: true,
          props: undefined,
          confirmConfig: config,
        },
      }),

      // Notification actions
      addNotification: (notification) => set((state) => {
        const newNotification: Notification = {
          ...notification,
          id: generateId(),
          timestamp: new Date().toISOString(),
          read: false,
        };
        return {
          notifications: [newNotification, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + 1,
        };
      }),

      markNotificationRead: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        if (!notification || notification.read) return state;

        return {
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      }),

      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      })),

      removeNotification: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        return {
          notifications: state.notifications.filter(n => n.id !== id),
          unreadCount: notification && !notification.read
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        };
      }),

      clearAllNotifications: () => set({
        notifications: [],
        unreadCount: 0,
      }),

      setNotifications: (notifications) => set({
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      }),

      // Toast actions
      showToast: (toast) => {
        const id = generateId();
        const newToast: Toast = { ...toast, id };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-dismiss after duration
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().dismissToast(id);
          }, duration);
        }
      },

      dismissToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id),
      })),

      clearToasts: () => set({ toasts: [] }),

      // Loading actions
      setGlobalLoading: (loading, message) => set({
        isGlobalLoading: loading,
        loadingMessage: loading ? (message ?? null) : null,
      }),

      // Command palette actions
      openCommandPalette: () => set({ isCommandPaletteOpen: true }),
      closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
      toggleCommandPalette: () => set((state) => ({
        isCommandPaletteOpen: !state.isCommandPaletteOpen,
      })),
    }),
    {
      name: 'kg-ui-state',
      storage: createJSONStorage(() => localStorage),
      // Only persist preferences, not ephemeral state
      partialize: (state) => ({
        sidebar: state.sidebar,
        theme: state.theme,
      }),
    }
  )
);

// Selector hooks for performance
export const useSidebar = () => useUIStore((state) => state.sidebar);
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebar.collapsed);
export const useTheme = () => useUIStore((state) => state.theme);
export const useResolvedTheme = () => useUIStore((state) => state.resolvedTheme);
export const useModal = () => useUIStore((state) => state.modal);
export const useNotifications = () => useUIStore((state) => ({
  notifications: state.notifications,
  unreadCount: state.unreadCount,
}));
export const useToasts = () => useUIStore((state) => state.toasts);
export const useGlobalLoading = () => useUIStore((state) => ({
  isLoading: state.isGlobalLoading,
  message: state.loadingMessage,
}));
export const useCommandPalette = () => useUIStore((state) => state.isCommandPaletteOpen);

// Action hooks
export const useUIActions = () => {
  const store = useUIStore();
  return {
    toggleSidebar: store.toggleSidebar,
    setSidebarCollapsed: store.setSidebarCollapsed,
    setTheme: store.setTheme,
    openModal: store.openModal,
    closeModal: store.closeModal,
    confirm: store.confirm,
    addNotification: store.addNotification,
    markNotificationRead: store.markNotificationRead,
    markAllNotificationsRead: store.markAllNotificationsRead,
    showToast: store.showToast,
    dismissToast: store.dismissToast,
    setGlobalLoading: store.setGlobalLoading,
    openCommandPalette: store.openCommandPalette,
    closeCommandPalette: store.closeCommandPalette,
    toggleCommandPalette: store.toggleCommandPalette,
  };
};
