import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Graph node representation
 */
export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, unknown>;
  position?: { x: number; y: number };
}

/**
 * Graph edge representation
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  properties: Record<string, unknown>;
}

/**
 * Graph visualization settings
 */
export interface GraphSettings {
  layout: 'force' | 'hierarchical' | 'circular' | 'grid';
  showLabels: boolean;
  nodeSize: number;
  edgeWidth: number;
  animationEnabled: boolean;
}

/**
 * Graph store state
 */
interface GraphState {
  // Data
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];

  // Settings
  settings: GraphSettings;

  // UI state
  isLoading: boolean;
  error: string | null;
  searchQuery: string;

  // Actions
  setNodes: (nodes: GraphNode[]) => void;
  setEdges: (edges: GraphEdge[]) => void;
  addNode: (node: GraphNode) => void;
  addEdge: (edge: GraphEdge) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<GraphNode>) => void;
  updateEdge: (edgeId: string, updates: Partial<GraphEdge>) => void;
  selectNodes: (nodeIds: string[]) => void;
  selectEdges: (edgeIds: string[]) => void;
  clearSelection: () => void;
  updateSettings: (settings: Partial<GraphSettings>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

const defaultSettings: GraphSettings = {
  layout: 'force',
  showLabels: true,
  nodeSize: 30,
  edgeWidth: 2,
  animationEnabled: true,
};

const initialState = {
  nodes: [],
  edges: [],
  selectedNodeIds: [],
  selectedEdgeIds: [],
  settings: defaultSettings,
  isLoading: false,
  error: null,
  searchQuery: '',
};

export const useGraphStore = create<GraphState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setNodes: (nodes) => set({ nodes }),

        setEdges: (edges) => set({ edges }),

        addNode: (node) =>
          set((state) => ({ nodes: [...state.nodes, node] })),

        addEdge: (edge) =>
          set((state) => ({ edges: [...state.edges, edge] })),

        removeNode: (nodeId) =>
          set((state) => ({
            nodes: state.nodes.filter((n) => n.id !== nodeId),
            edges: state.edges.filter(
              (e) => e.source !== nodeId && e.target !== nodeId
            ),
            selectedNodeIds: state.selectedNodeIds.filter((id) => id !== nodeId),
          })),

        removeEdge: (edgeId) =>
          set((state) => ({
            edges: state.edges.filter((e) => e.id !== edgeId),
            selectedEdgeIds: state.selectedEdgeIds.filter((id) => id !== edgeId),
          })),

        updateNode: (nodeId, updates) =>
          set((state) => ({
            nodes: state.nodes.map((n) =>
              n.id === nodeId ? { ...n, ...updates } : n
            ),
          })),

        updateEdge: (edgeId, updates) =>
          set((state) => ({
            edges: state.edges.map((e) =>
              e.id === edgeId ? { ...e, ...updates } : e
            ),
          })),

        selectNodes: (nodeIds) => set({ selectedNodeIds: nodeIds }),

        selectEdges: (edgeIds) => set({ selectedEdgeIds: edgeIds }),

        clearSelection: () =>
          set({ selectedNodeIds: [], selectedEdgeIds: [] }),

        updateSettings: (settings) =>
          set((state) => ({
            settings: { ...state.settings, ...settings },
          })),

        setLoading: (isLoading) => set({ isLoading }),

        setError: (error) => set({ error }),

        setSearchQuery: (searchQuery) => set({ searchQuery }),

        reset: () => set(initialState),
      }),
      {
        name: 'knowledge-graph-store',
        partialize: (state) => ({
          settings: state.settings,
        }),
      }
    ),
    { name: 'GraphStore' }
  )
);
