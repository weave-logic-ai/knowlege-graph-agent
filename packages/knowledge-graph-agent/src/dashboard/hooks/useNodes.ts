/**
 * useNodes Hook
 *
 * TanStack Query hook for managing graph nodes data.
 * Provides data fetching, caching, and mutations for nodes.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  query,
  mutate,
  type GraphNode,
  type NodeDetail,
  type NodeFilters,
  type PaginationParams,
  type PaginatedResponse,
  GET_GRAPH_NODES,
  GET_GRAPH_NODE,
  GET_NODES_PAGINATED,
  CREATE_NODE,
  UPDATE_NODE,
  DELETE_NODE,
  BULK_UPDATE_NODES,
  BULK_DELETE_NODES,
  type GetGraphNodesResponse,
  type GetGraphNodesVariables,
  type GetGraphNodeResponse,
  type GetGraphNodeVariables,
  type GetNodesPaginatedResponse,
  type GetNodesPaginatedVariables,
  type CreateNodeInput,
  type CreateNodeResponse,
  type CreateNodeVariables,
  type UpdateNodeInput,
  type UpdateNodeResponse,
  type UpdateNodeVariables,
  type DeleteNodeResponse,
  type DeleteNodeVariables,
  type BulkUpdateNodesResponse,
  type BulkUpdateNodesVariables,
  type BulkDeleteNodesResponse,
  type BulkDeleteNodesVariables,
} from '../lib/api/index.js';

// Query keys for cache management
export const nodeKeys = {
  all: ['nodes'] as const,
  lists: () => [...nodeKeys.all, 'list'] as const,
  list: (filters?: NodeFilters) => [...nodeKeys.lists(), filters] as const,
  paginated: (filters?: NodeFilters, pagination?: PaginationParams) =>
    [...nodeKeys.all, 'paginated', filters, pagination] as const,
  details: () => [...nodeKeys.all, 'detail'] as const,
  detail: (id: string) => [...nodeKeys.details(), id] as const,
};

/**
 * Hook to fetch all graph nodes
 */
export function useNodes(
  filters?: NodeFilters,
  options?: Omit<UseQueryOptions<GetGraphNodesResponse, Error, GraphNode[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: nodeKeys.list(filters),
    queryFn: () => query<GetGraphNodesResponse, GetGraphNodesVariables>(
      GET_GRAPH_NODES,
      { filters }
    ),
    select: (data) => data.graphNodes,
    staleTime: 30000, // 30 seconds
    ...options,
  });
}

/**
 * Hook to fetch paginated nodes
 */
export function useNodesPaginated(
  filters?: NodeFilters,
  pagination: PaginationParams = { page: 0, limit: 20 },
  options?: Omit<UseQueryOptions<GetNodesPaginatedResponse, Error, PaginatedResponse<GraphNode>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: nodeKeys.paginated(filters, pagination),
    queryFn: () => query<GetNodesPaginatedResponse, GetNodesPaginatedVariables>(
      GET_NODES_PAGINATED,
      { filters, pagination }
    ),
    select: (data) => data.nodesPaginated,
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
    ...options,
  });
}

/**
 * Hook to fetch infinite paginated nodes
 */
export function useNodesInfinite(
  filters?: NodeFilters,
  pageSize = 20
) {
  return useInfiniteQuery({
    queryKey: [...nodeKeys.lists(), 'infinite', filters],
    queryFn: ({ pageParam = 0 }) => query<GetNodesPaginatedResponse, GetNodesPaginatedVariables>(
      GET_NODES_PAGINATED,
      {
        filters,
        pagination: { page: pageParam, limit: pageSize }
      }
    ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const { hasMore } = lastPage.nodesPaginated;
      return hasMore ? allPages.length : undefined;
    },
    select: (data) => ({
      pages: data.pages.map(page => page.nodesPaginated.data),
      pageParams: data.pageParams,
    }),
    staleTime: 30000,
  });
}

/**
 * Hook to fetch a single node by ID
 */
export function useNode(
  id: string,
  options?: Omit<UseQueryOptions<GetGraphNodeResponse, Error, NodeDetail>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: nodeKeys.detail(id),
    queryFn: () => query<GetGraphNodeResponse, GetGraphNodeVariables>(
      GET_GRAPH_NODE,
      { id }
    ),
    select: (data) => data.graphNode,
    enabled: !!id,
    staleTime: 60000, // 1 minute
    ...options,
  });
}

/**
 * Hook to create a new node
 */
export function useCreateNode(
  options?: UseMutationOptions<CreateNodeResponse, Error, CreateNodeInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNodeInput) =>
      mutate<CreateNodeResponse, CreateNodeVariables>(CREATE_NODE, { input }),
    onSuccess: (data) => {
      // Add new node to cache
      queryClient.setQueryData<GetGraphNodesResponse>(
        nodeKeys.list(),
        (old) => {
          if (!old) return { graphNodes: [data.createNode] };
          return {
            graphNodes: [...old.graphNodes, data.createNode],
          };
        }
      );
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
    },
    ...options,
  });
}

/**
 * Hook to update a node
 */
export function useUpdateNode(
  options?: UseMutationOptions<UpdateNodeResponse, Error, { id: string; input: UpdateNodeInput }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) =>
      mutate<UpdateNodeResponse, UpdateNodeVariables>(UPDATE_NODE, { id, input }),
    onSuccess: (data, variables) => {
      // Update node in cache
      queryClient.setQueryData<GetGraphNodeResponse>(
        nodeKeys.detail(variables.id),
        { graphNode: data.updateNode }
      );
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
    },
    // Optimistic update
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: nodeKeys.detail(id) });

      const previousNode = queryClient.getQueryData<GetGraphNodeResponse>(
        nodeKeys.detail(id)
      );

      if (previousNode) {
        queryClient.setQueryData<GetGraphNodeResponse>(
          nodeKeys.detail(id),
          {
            graphNode: {
              ...previousNode.graphNode,
              ...input,
              updatedAt: new Date().toISOString(),
            },
          }
        );
      }

      return { previousNode };
    },
    onError: (_error, variables, context) => {
      if (context?.previousNode) {
        queryClient.setQueryData(
          nodeKeys.detail(variables.id),
          context.previousNode
        );
      }
    },
    ...options,
  });
}

/**
 * Hook to delete a node
 */
export function useDeleteNode(
  options?: UseMutationOptions<DeleteNodeResponse, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      mutate<DeleteNodeResponse, DeleteNodeVariables>(DELETE_NODE, { id }),
    onSuccess: (data) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: nodeKeys.detail(data.deleteNode.deletedId)
      });
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
    },
    ...options,
  });
}

/**
 * Hook to bulk update nodes
 */
export function useBulkUpdateNodes(
  options?: UseMutationOptions<BulkUpdateNodesResponse, Error, { ids: string[]; input: UpdateNodeInput }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, input }) =>
      mutate<BulkUpdateNodesResponse, BulkUpdateNodesVariables>(
        BULK_UPDATE_NODES,
        { ids, input }
      ),
    onSuccess: () => {
      // Invalidate all node queries
      queryClient.invalidateQueries({ queryKey: nodeKeys.all });
    },
    ...options,
  });
}

/**
 * Hook to bulk delete nodes
 */
export function useBulkDeleteNodes(
  options?: UseMutationOptions<BulkDeleteNodesResponse, Error, string[]>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) =>
      mutate<BulkDeleteNodesResponse, BulkDeleteNodesVariables>(
        BULK_DELETE_NODES,
        { ids }
      ),
    onSuccess: (data) => {
      // Remove deleted nodes from cache
      data.bulkDeleteNodes.deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: nodeKeys.detail(id) });
      });
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
    },
    ...options,
  });
}

/**
 * Hook to prefetch a node
 */
export function usePrefetchNode() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: nodeKeys.detail(id),
      queryFn: () => query<GetGraphNodeResponse, GetGraphNodeVariables>(
        GET_GRAPH_NODE,
        { id }
      ),
      staleTime: 60000,
    });
  };
}

/**
 * Hook to invalidate node queries
 */
export function useInvalidateNodes() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: nodeKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: nodeKeys.lists() }),
    invalidateNode: (id: string) =>
      queryClient.invalidateQueries({ queryKey: nodeKeys.detail(id) }),
  };
}
