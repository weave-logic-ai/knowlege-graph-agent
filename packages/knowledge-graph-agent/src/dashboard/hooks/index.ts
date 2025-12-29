/**
 * Custom hooks barrel export
 */

// Legacy hooks (existing)
export { useGraphQuery, useGraphStats, useAddNode, useAddEdge } from './use-graph-query.js';
export { useWebSocket } from './use-websocket.js';
export { useGraphState } from './useGraphState.js';
export type { UseGraphStateOptions, UseGraphStateReturn } from './useGraphState.js';
export { useDebounce } from './use-debounce.js';
export { useLocalStorage } from './use-local-storage.js';
export { useKeyboardShortcut } from './use-keyboard-shortcut.js';

// New TanStack Query hooks (v2)
export {
  useNodes,
  useNode,
  useNodesPaginated,
  useNodesInfinite,
  useCreateNode,
  useUpdateNode,
  useDeleteNode,
  useBulkUpdateNodes,
  useBulkDeleteNodes,
  usePrefetchNode,
  useInvalidateNodes,
  nodeKeys,
} from './useNodes.js';

export {
  useGraph,
  useGraphNodes,
  useGraphEdges,
  useGraphStats as useGraphStatsQuery,
  useRelatedNodes,
  useMultipleRelatedNodes,
  useCreateEdge,
  useDeleteEdge,
  useExportGraph,
  useSyncToClaudeFlow,
  useInvalidateGraph,
  usePrefetchGraph,
  graphKeys,
  type GraphData,
} from './useGraph.js';

export {
  useSystemHealth,
  useServiceHealth,
  useAllServicesHealth,
  useHealthIndicators,
  useServiceLatencies,
  useInvalidateHealth,
  useIsSystemHealthy,
  useServiceStatus,
  healthKeys,
  KNOWN_SERVICES,
  type ServiceName,
} from './useHealth.js';

export {
  useSSE,
  useGraphQLSubscription,
  useWorkflowStatusSubscription,
  useAgentActivitySubscription,
  useAuditEventsSubscription,
  useNotificationsSubscription,
  useWorkflowSSE,
  useNotificationsSSE,
  useAgentActivitySSE,
  useAuditEventsSSE,
  type SSEState,
  type SSEOptions,
  type SubscriptionOptions,
} from './useSubscription.js';
