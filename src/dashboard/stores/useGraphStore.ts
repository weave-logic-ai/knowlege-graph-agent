/**
 * Graph State Store (Zustand)
 *
 * Manages client-side graph visualization state:
 * - Selected nodes/edges
 * - Graph layout settings
 * - Filters and visibility
 * - View settings
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NodeType, NodeStatus, EdgeType } from '../lib/api/types.js';

// Color schemes for graph visualization
export type ColorScheme = 'type' | 'status' | 'custom';

// Layout algorithms
export type LayoutAlgorithm = 'force' | 'dagre' | 'radial';

// Graph state interface
export interface GraphState {
  // View state
  zoom: number;
  centerX: number;
  centerY: number;

  // Selection state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  hoveredNodeId: string | null;
  selectedNodeIds: Set<string>; // Multi-select support

  // Filter state
  visibleTypes: Set<NodeType>;
  visibleStatuses: Set<NodeStatus>;
  visibleEdgeTypes: Set<EdgeType>;
  searchQuery: string;
  tagFilter: string[];

  // Display options
  showLabels: boolean;
  showEdgeLabels: boolean;
  highlightConnections: boolean;
  colorScheme: ColorScheme;

  // Layout options
  layoutAlgorithm: LayoutAlgorithm;
  frozen: boolean;

  // View controls
  enableZoom: boolean;
  enablePan: boolean;
  minZoom: number;
  maxZoom: number;
}

// Actions interface
export interface GraphActions {
  // View actions
  setZoom: (zoom: number) => void;
  setCenter: (x: number, y: number) => void;
  resetView: () => void;
  fitToScreen: () => void;

  // Selection actions
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  setHoveredNode: (id: string | null) => void;
  toggleNodeSelection: (id: string) => void;
  clearSelection: () => void;
  selectMultipleNodes: (ids: string[]) => void;

  // Filter actions
  toggleType: (type: NodeType) => void;
  toggleStatus: (status: NodeStatus) => void;
  toggleEdgeType: (type: EdgeType) => void;
  setVisibleTypes: (types: NodeType[]) => void;
  setVisibleStatuses: (statuses: NodeStatus[]) => void;
  setSearchQuery: (query: string) => void;
  setTagFilter: (tags: string[]) => void;
  resetFilters: () => void;

  // Display actions
  toggleLabels: () => void;
  toggleEdgeLabels: () => void;
  toggleHighlightConnections: () => void;
  setColorScheme: (scheme: ColorScheme) => void;

  // Layout actions
  setLayoutAlgorithm: (algorithm: LayoutAlgorithm) => void;
  toggleFrozen: () => void;
  setFrozen: (frozen: boolean) => void;

  // Control actions
  setEnableZoom: (enabled: boolean) => void;
  setEnablePan: (enabled: boolean) => void;
  setZoomBounds: (min: number, max: number) => void;
}

// Default visible types
const ALL_NODE_TYPES: NodeType[] = [
  'concept', 'technical', 'feature', 'primitive',
  'service', 'guide', 'standard', 'integration'
];

const ALL_STATUSES: NodeStatus[] = ['active', 'draft', 'deprecated', 'archived'];
const ALL_EDGE_TYPES: EdgeType[] = ['link', 'reference', 'parent', 'related'];

// Initial state
const initialState: GraphState = {
  // View state
  zoom: 1,
  centerX: 0,
  centerY: 0,

  // Selection state
  selectedNodeId: null,
  selectedEdgeId: null,
  hoveredNodeId: null,
  selectedNodeIds: new Set(),

  // Filter state
  visibleTypes: new Set(ALL_NODE_TYPES),
  visibleStatuses: new Set(ALL_STATUSES),
  visibleEdgeTypes: new Set(ALL_EDGE_TYPES),
  searchQuery: '',
  tagFilter: [],

  // Display options
  showLabels: true,
  showEdgeLabels: false,
  highlightConnections: true,
  colorScheme: 'type',

  // Layout options
  layoutAlgorithm: 'force',
  frozen: false,

  // View controls
  enableZoom: true,
  enablePan: true,
  minZoom: 0.1,
  maxZoom: 5,
};

// Create the store with persistence
export const useGraphStore = create<GraphState & GraphActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // View actions
      setZoom: (zoom) => {
        const { minZoom, maxZoom } = get();
        set({ zoom: Math.max(minZoom, Math.min(maxZoom, zoom)) });
      },

      setCenter: (x, y) => set({ centerX: x, centerY: y }),

      resetView: () => set({
        zoom: 1,
        centerX: 0,
        centerY: 0,
      }),

      fitToScreen: () => {
        // This will be handled by the graph component
        // Setting a flag or dispatch event would work here
        set({ zoom: 1, centerX: 0, centerY: 0 });
      },

      // Selection actions
      selectNode: (id) => set({
        selectedNodeId: id,
        selectedEdgeId: null, // Deselect edge when selecting node
      }),

      selectEdge: (id) => set({
        selectedEdgeId: id,
        selectedNodeId: null, // Deselect node when selecting edge
      }),

      setHoveredNode: (id) => set({ hoveredNodeId: id }),

      toggleNodeSelection: (id) => {
        const { selectedNodeIds } = get();
        const newSelection = new Set(selectedNodeIds);
        if (newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          newSelection.add(id);
        }
        set({ selectedNodeIds: newSelection });
      },

      clearSelection: () => set({
        selectedNodeId: null,
        selectedEdgeId: null,
        selectedNodeIds: new Set(),
      }),

      selectMultipleNodes: (ids) => set({
        selectedNodeIds: new Set(ids),
        selectedNodeId: ids.length === 1 ? ids[0] : null,
      }),

      // Filter actions
      toggleType: (type) => {
        const { visibleTypes } = get();
        const newTypes = new Set(visibleTypes);
        if (newTypes.has(type)) {
          newTypes.delete(type);
        } else {
          newTypes.add(type);
        }
        set({ visibleTypes: newTypes });
      },

      toggleStatus: (status) => {
        const { visibleStatuses } = get();
        const newStatuses = new Set(visibleStatuses);
        if (newStatuses.has(status)) {
          newStatuses.delete(status);
        } else {
          newStatuses.add(status);
        }
        set({ visibleStatuses: newStatuses });
      },

      toggleEdgeType: (type) => {
        const { visibleEdgeTypes } = get();
        const newTypes = new Set(visibleEdgeTypes);
        if (newTypes.has(type)) {
          newTypes.delete(type);
        } else {
          newTypes.add(type);
        }
        set({ visibleEdgeTypes: newTypes });
      },

      setVisibleTypes: (types) => set({ visibleTypes: new Set(types) }),

      setVisibleStatuses: (statuses) => set({ visibleStatuses: new Set(statuses) }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setTagFilter: (tags) => set({ tagFilter: tags }),

      resetFilters: () => set({
        visibleTypes: new Set(ALL_NODE_TYPES),
        visibleStatuses: new Set(ALL_STATUSES),
        visibleEdgeTypes: new Set(ALL_EDGE_TYPES),
        searchQuery: '',
        tagFilter: [],
      }),

      // Display actions
      toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),

      toggleEdgeLabels: () => set((state) => ({ showEdgeLabels: !state.showEdgeLabels })),

      toggleHighlightConnections: () => set((state) => ({
        highlightConnections: !state.highlightConnections,
      })),

      setColorScheme: (scheme) => set({ colorScheme: scheme }),

      // Layout actions
      setLayoutAlgorithm: (algorithm) => set({ layoutAlgorithm: algorithm }),

      toggleFrozen: () => set((state) => ({ frozen: !state.frozen })),

      setFrozen: (frozen) => set({ frozen }),

      // Control actions
      setEnableZoom: (enabled) => set({ enableZoom: enabled }),

      setEnablePan: (enabled) => set({ enablePan: enabled }),

      setZoomBounds: (min, max) => set({ minZoom: min, maxZoom: max }),
    }),
    {
      name: 'kg-graph-state',
      storage: createJSONStorage(() => localStorage),
      // Only persist display and layout preferences
      partialize: (state) => ({
        showLabels: state.showLabels,
        showEdgeLabels: state.showEdgeLabels,
        highlightConnections: state.highlightConnections,
        colorScheme: state.colorScheme,
        layoutAlgorithm: state.layoutAlgorithm,
        enableZoom: state.enableZoom,
        enablePan: state.enablePan,
      }),
      // Custom serialization for Set objects
      serialize: (state) => JSON.stringify(state),
      deserialize: (str) => JSON.parse(str),
    }
  )
);

// Selector hooks for performance
export const useSelectedNode = () => useGraphStore((state) => state.selectedNodeId);
export const useSelectedEdge = () => useGraphStore((state) => state.selectedEdgeId);
export const useHoveredNode = () => useGraphStore((state) => state.hoveredNodeId);
export const useGraphZoom = () => useGraphStore((state) => state.zoom);
export const useGraphFilters = () => useGraphStore((state) => ({
  visibleTypes: state.visibleTypes,
  visibleStatuses: state.visibleStatuses,
  visibleEdgeTypes: state.visibleEdgeTypes,
  searchQuery: state.searchQuery,
  tagFilter: state.tagFilter,
}));
export const useGraphDisplay = () => useGraphStore((state) => ({
  showLabels: state.showLabels,
  showEdgeLabels: state.showEdgeLabels,
  highlightConnections: state.highlightConnections,
  colorScheme: state.colorScheme,
}));
export const useGraphLayout = () => useGraphStore((state) => ({
  layoutAlgorithm: state.layoutAlgorithm,
  frozen: state.frozen,
}));
