/**
 * Dashboard Stores Index
 *
 * Re-exports all Zustand stores.
 */

// Legacy stores (existing)
export { useLayoutStore, type LayoutState } from './layout-store.js';
export {
  useNotificationsStore,
  type NotificationsState,
} from './notifications-store.js';
export {
  useGraphStore as useLegacyGraphStore,
  type GraphNode as LegacyGraphNode,
  type GraphEdge as LegacyGraphEdge,
  type GraphSettings,
} from './graph-store.js';
export {
  useAgentStore,
  type Agent,
  type AgentLog,
  type AgentStatus,
} from './agent-store.js';
export {
  useWorkflowStore,
  type Workflow,
  type WorkflowStep,
  type WorkflowRun,
  type WorkflowStatus,
} from './workflow-store.js';

// New stores (v2)
export {
  useGraphStore,
  useSelectedNode,
  useSelectedEdge,
  useHoveredNode,
  useGraphZoom,
  useGraphFilters,
  useGraphDisplay,
  useGraphLayout,
  type GraphState,
  type GraphActions,
  type ColorScheme,
  type LayoutAlgorithm,
} from './useGraphStore.js';

export {
  useUIStore,
  useSidebar,
  useSidebarCollapsed,
  useTheme,
  useResolvedTheme,
  useModal,
  useNotifications,
  useToasts,
  useGlobalLoading,
  useCommandPalette,
  useUIActions,
  type UIState,
  type UIActions,
  type Theme,
  type ModalType,
  type ConfirmConfig,
  type SidebarState,
  type ModalState,
  type Toast,
} from './useUIStore.js';

export {
  useSearchStore,
  useSearchQuery,
  useSearchMode,
  useSearchFilters,
  useRecentSearches,
  useIsSearching,
  useSearchSuggestions,
  useSearchActions,
  type SearchState,
  type SearchActions,
  type SearchFiltersState,
  type RecentSearch,
  type CachedSearchResult,
  type CachedVectorResult,
} from './useSearchStore.js';
