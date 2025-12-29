/**
 * useGraph Hook
 *
 * TanStack Query hook for managing full graph data (nodes + edges).
 * Provides data fetching, caching, and mutations for the complete graph.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  useQueries,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  query,
  mutate,
  type GraphNode,
  type GraphEdge,
  type GraphStats,
  type GraphFilters,
  GET_GRAPH_NODES,
  GET_GRAPH_EDGES,
  GET_GRAPH_STATS,
  GET_RELATED_NODES,
  CREATE_EDGE,
  DELETE_EDGE,
  EXPORT_GRAPH,
  SYNC_TO_CLAUDE_FLOW,
  type GetGraphNodesResponse,
  type GetGraphNodesVariables,
  type GetGraphEdgesResponse,
  type GetRelatedNodesResponse,
  type GetRelatedNodesVariables,
  type GetGraphStatsResponse,
  type CreateEdgeInput,
  type CreateEdgeResponse,
  type CreateEdgeVariables,
  type DeleteEdgeResponse,
  type DeleteEdgeVariables,
  type ExportGraphResponse,
  type ExportGraphVariables,
  type SyncToClaudeFlowResponse,
} from '../lib/api/index.js';
import { nodeKeys } from './useNodes.js';

// Query keys for cache management
export const graphKeys = {
  all: ['graph'] as const,
  nodes: (filters?: GraphFilters) => [...graphKeys.all, 'nodes', filters] as const,
  edges: () => [...graphKeys.all, 'edges'] as const,
  stats: () => [...graphKeys.all, 'stats'] as const,
  full: (filters?: GraphFilters) => [...graphKeys.all, 'full', filters] as const,
  related: (id: string, maxHops?: number) => [...graphKeys.all, 'related', id, maxHops] as const,
};

// Combined graph data type
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Hook to fetch complete graph data (nodes + edges)
 */
export function useGraph(
  filters?: GraphFilters,
  options?: Omit<UseQueryOptions<GraphData, Error>, 'queryKey' | 'queryFn'>
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: graphKeys.full(filters),
    queryFn: async () => {
      const [nodesResponse, edgesResponse] = await Promise.all([
        query<GetGraphNodesResponse, GetGraphNodesVariables>(
          GET_GRAPH_NODES,
          { filters }
        ),
        query<GetGraphEdgesResponse>(GET_GRAPH_EDGES),
      ]);

      return {
        nodes: nodesResponse.graphNodes,
        edges: edgesResponse.graphEdges,
      };
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Poll every 30 seconds
    ...options,
    // Populate individual node cache
    onSuccess: (data) => {
      data.nodes.forEach(node => {
        queryClient.setQueryData(nodeKeys.detail(node.id), { graphNode: node });
      });
    },
  });
}

/**
 * Hook to fetch graph nodes only
 */
export function useGraphNodes(
  filters?: GraphFilters,
  options?: Omit<UseQueryOptions<GetGraphNodesResponse, Error, GraphNode[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: graphKeys.nodes(filters),
    queryFn: () => query<GetGraphNodesResponse, GetGraphNodesVariables>(
      GET_GRAPH_NODES,
      { filters }
    ),
    select: (data) => data.graphNodes,
    staleTime: 30000,
    ...options,
  });
}

/**
 * Hook to fetch graph edges only
 */
export function useGraphEdges(
  options?: Omit<UseQueryOptions<GetGraphEdgesResponse, Error, GraphEdge[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: graphKeys.edges(),
    queryFn: () => query<GetGraphEdgesResponse>(GET_GRAPH_EDGES),
    select: (data) => data.graphEdges,
    staleTime: 30000,
    ...options,
  });
}

/**
 * Hook to fetch graph statistics
 */
export function useGraphStats(
  options?: Omit<UseQueryOptions<GetGraphStatsResponse, Error, GraphStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: graphKeys.stats(),
    queryFn: () => query<GetGraphStatsResponse>(GET_GRAPH_STATS),
    select: (data) => data.graphStats,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Poll every minute
    ...options,
  });
}

/**
 * Hook to fetch related nodes for a specific node
 */
export function useRelatedNodes(
  id: string,
  maxHops = 2,
  options?: Omit<UseQueryOptions<GetRelatedNodesResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: graphKeys.related(id, maxHops),
    queryFn: () => query<GetRelatedNodesResponse, GetRelatedNodesVariables>(
      GET_RELATED_NODES,
      { id, maxHops }
    ),
    enabled: !!id,
    staleTime: 30000,
    ...options,
  });
}

/**
 * Hook to fetch multiple nodes and their connections in parallel
 */
export function useMultipleRelatedNodes(
  ids: string[],
  maxHops = 2
) {
  return useQueries({
    queries: ids.map(id => ({
      queryKey: graphKeys.related(id, maxHops),
      queryFn: () => query<GetRelatedNodesResponse, GetRelatedNodesVariables>(
        GET_RELATED_NODES,
        { id, maxHops }
      ),
      enabled: !!id,
      staleTime: 30000,
    })),
    combine: (results) => ({
      data: results.map(r => r.data?.relatedNodes),
      isLoading: results.some(r => r.isLoading),
      isError: results.some(r => r.isError),
      errors: results.filter(r => r.error).map(r => r.error),
    }),
  });
}

/**
 * Hook to create an edge
 */
export function useCreateEdge(
  options?: UseMutationOptions<CreateEdgeResponse, Error, CreateEdgeInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEdgeInput) =>
      mutate<CreateEdgeResponse, CreateEdgeVariables>(CREATE_EDGE, { input }),
    onSuccess: () => {
      // Invalidate graph queries
      queryClient.invalidateQueries({ queryKey: graphKeys.edges() });
      queryClient.invalidateQueries({ queryKey: graphKeys.full() });
      queryClient.invalidateQueries({ queryKey: graphKeys.stats() });
    },
    ...options,
  });
}

/**
 * Hook to delete an edge
 */
export function useDeleteEdge(
  options?: UseMutationOptions<DeleteEdgeResponse, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      mutate<DeleteEdgeResponse, DeleteEdgeVariables>(DELETE_EDGE, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: graphKeys.edges() });
      queryClient.invalidateQueries({ queryKey: graphKeys.full() });
      queryClient.invalidateQueries({ queryKey: graphKeys.stats() });
    },
    ...options,
  });
}

/**
 * Hook to export the graph
 */
export function useExportGraph(
  options?: UseMutationOptions<ExportGraphResponse, Error, 'json' | 'csv' | 'graphml'>
) {
  return useMutation({
    mutationFn: (format) =>
      mutate<ExportGraphResponse, ExportGraphVariables>(EXPORT_GRAPH, { format }),
    ...options,
  });
}

/**
 * Hook to sync graph to Claude Flow
 */
export function useSyncToClaudeFlow(
  options?: UseMutationOptions<SyncToClaudeFlowResponse, Error, void>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      mutate<SyncToClaudeFlowResponse>(SYNC_TO_CLAUDE_FLOW),
    onSuccess: () => {
      // Invalidate all graph queries after sync
      queryClient.invalidateQueries({ queryKey: graphKeys.all });
    },
    ...options,
  });
}

/**
 * Hook to invalidate graph queries
 */
export function useInvalidateGraph() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: graphKeys.all }),
    invalidateNodes: (filters?: GraphFilters) =>
      queryClient.invalidateQueries({ queryKey: graphKeys.nodes(filters) }),
    invalidateEdges: () => queryClient.invalidateQueries({ queryKey: graphKeys.edges() }),
    invalidateStats: () => queryClient.invalidateQueries({ queryKey: graphKeys.stats() }),
    invalidateFull: (filters?: GraphFilters) =>
      queryClient.invalidateQueries({ queryKey: graphKeys.full(filters) }),
    invalidateRelated: (id: string) =>
      queryClient.invalidateQueries({ queryKey: graphKeys.related(id) }),
  };
}

/**
 * Hook to prefetch graph data
 */
export function usePrefetchGraph() {
  const queryClient = useQueryClient();

  return {
    prefetchFull: (filters?: GraphFilters) => {
      queryClient.prefetchQuery({
        queryKey: graphKeys.full(filters),
        queryFn: async () => {
          const [nodesResponse, edgesResponse] = await Promise.all([
            query<GetGraphNodesResponse, GetGraphNodesVariables>(
              GET_GRAPH_NODES,
              { filters }
            ),
            query<GetGraphEdgesResponse>(GET_GRAPH_EDGES),
          ]);
          return {
            nodes: nodesResponse.graphNodes,
            edges: edgesResponse.graphEdges,
          };
        },
        staleTime: 30000,
      });
    },
    prefetchStats: () => {
      queryClient.prefetchQuery({
        queryKey: graphKeys.stats(),
        queryFn: () => query<GetGraphStatsResponse>(GET_GRAPH_STATS),
        staleTime: 60000,
      });
    },
    prefetchRelated: (id: string, maxHops = 2) => {
      queryClient.prefetchQuery({
        queryKey: graphKeys.related(id, maxHops),
        queryFn: () => query<GetRelatedNodesResponse, GetRelatedNodesVariables>(
          GET_RELATED_NODES,
          { id, maxHops }
        ),
        staleTime: 30000,
      });
    },
  };
}
