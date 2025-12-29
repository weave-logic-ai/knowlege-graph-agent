import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { GraphNode, GraphEdge } from '@/stores/graph-store';
import type { GraphQueryFilters, GraphStats, ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Fetch graph data from the API
 */
async function fetchGraph(filters?: GraphQueryFilters): Promise<{
  nodes: GraphNode[];
  edges: GraphEdge[];
}> {
  const params = new URLSearchParams();
  if (filters?.nodeTypes?.length) {
    params.set('nodeTypes', filters.nodeTypes.join(','));
  }
  if (filters?.edgeTypes?.length) {
    params.set('edgeTypes', filters.edgeTypes.join(','));
  }
  if (filters?.depth) {
    params.set('depth', String(filters.depth));
  }

  const response = await fetch(`${API_BASE_URL}/api/graph?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch graph data');
  }

  const result: ApiResponse<{ nodes: GraphNode[]; edges: GraphEdge[] }> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to fetch graph data');
  }

  return result.data;
}

/**
 * Fetch graph statistics
 */
async function fetchGraphStats(): Promise<GraphStats> {
  const response = await fetch(`${API_BASE_URL}/api/graph/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch graph statistics');
  }

  const result: ApiResponse<GraphStats> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to fetch graph statistics');
  }

  return result.data;
}

/**
 * Add a node to the graph
 */
async function addNode(node: Omit<GraphNode, 'id'>): Promise<GraphNode> {
  const response = await fetch(`${API_BASE_URL}/api/graph/nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(node),
  });

  if (!response.ok) {
    throw new Error('Failed to add node');
  }

  const result: ApiResponse<GraphNode> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to add node');
  }

  return result.data;
}

/**
 * Add an edge to the graph
 */
async function addEdge(edge: Omit<GraphEdge, 'id'>): Promise<GraphEdge> {
  const response = await fetch(`${API_BASE_URL}/api/graph/edges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(edge),
  });

  if (!response.ok) {
    throw new Error('Failed to add edge');
  }

  const result: ApiResponse<GraphEdge> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to add edge');
  }

  return result.data;
}

/**
 * Hook to query graph data
 */
export function useGraphQuery(filters?: GraphQueryFilters) {
  return useQuery({
    queryKey: ['graph', filters],
    queryFn: () => fetchGraph(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to query graph statistics
 */
export function useGraphStats() {
  return useQuery({
    queryKey: ['graph', 'stats'],
    queryFn: fetchGraphStats,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to add a node
 */
export function useAddNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph'] });
    },
  });
}

/**
 * Hook to add an edge
 */
export function useAddEdge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addEdge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph'] });
    },
  });
}
