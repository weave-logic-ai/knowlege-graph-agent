/**
 * Layout Store
 *
 * Zustand store for managing layout state including sidebar and theme.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LayoutState {
  // Sidebar state
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  mobileSidebarOpen: boolean;

  // Theme state
  theme: 'light' | 'dark' | 'system';

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarCollapsed: false,
      sidebarWidth: 280,
      mobileSidebarOpen: false,
      theme: 'system',

      // Actions
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      setSidebarWidth: (width) =>
        set({ sidebarWidth: width }),

      setMobileSidebarOpen: (open) =>
        set({ mobileSidebarOpen: open }),

      setTheme: (theme) =>
        set({ theme }),
    }),
    {
      name: 'kg-layout',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarWidth: state.sidebarWidth,
        theme: state.theme,
      }),
    }
  )
);
