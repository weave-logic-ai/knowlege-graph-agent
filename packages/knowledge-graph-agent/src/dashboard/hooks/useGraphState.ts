/**
 * useGraphState Hook
 *
 * Custom hook for managing graph visualization state including
 * selection, filters, display options, and zoom/pan state.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  GraphNode,
  GraphEdge,
  GraphFilters,
  GraphDisplayOptions,
  GraphViewState,
  LayoutType,
  ColorScheme,
} from '../types/graph';
import type { NodeType, NodeStatus } from '../../core/types';
import { ALL_NODE_TYPES, ALL_NODE_STATUSES, ZOOM_CONFIG } from '../components/graph/constants';

// ============================================================================
// Types
// ============================================================================

export interface UseGraphStateOptions {
  initialLayout?: LayoutType;
  initialShowLabels?: boolean;
  initialShowEdgeLabels?: boolean;
  initialHighlightConnections?: boolean;
  initialColorScheme?: ColorScheme;
  initialFrozen?: boolean;
}

export interface UseGraphStateReturn {
  // Selection state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  hoveredNodeId: string | null;
  selectedNode: GraphNode | null;

  // Selection actions
  selectNode: (node: GraphNode | null) => void;
  selectEdge: (edge: GraphEdge | null) => void;
  setHoveredNode: (node: GraphNode | null) => void;
  clearSelection: () => void;

  // View state
  zoom: number;
  pan: { x: number; y: number };

  // View actions
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  setPan: (pan: { x: number; y: number }) => void;

  // Filter state
  filters: GraphFilters;

  // Filter actions
  setFilters: (filters: GraphFilters) => void;
  toggleTypeFilter: (type: NodeType) => void;
  toggleStatusFilter: (status: NodeStatus) => void;
  toggleTagFilter: (tag: string) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;

  // Display options
  displayOptions: GraphDisplayOptions;

  // Display actions
  setLayout: (layout: LayoutType) => void;
  toggleLabels: () => void;
  toggleEdgeLabels: () => void;
  toggleHighlightConnections: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleFrozen: () => void;

  // Computed values
  visibleTypes: NodeType[];
  visibleStatuses: NodeStatus[];
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_FILTERS: GraphFilters = {
  types: [...ALL_NODE_TYPES],
  statuses: [...ALL_NODE_STATUSES],
  tags: [],
  searchQuery: '',
};

const DEFAULT_DISPLAY_OPTIONS: GraphDisplayOptions = {
  showLabels: true,
  showEdgeLabels: false,
  highlightConnections: true,
  colorScheme: 'type',
  layout: 'force',
  frozen: false,
};

const DEFAULT_VIEW_STATE: GraphViewState = {
  zoom: ZOOM_CONFIG.default,
  pan: { x: 0, y: 0 },
  selectedNodeIds: [],
  selectedEdgeId: null,
  hoveredNodeId: null,
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useGraphState(
  nodes: GraphNode[],
  options: UseGraphStateOptions = {}
): UseGraphStateReturn {
  // Initialize display options from options or defaults
  const initialDisplayOptions: GraphDisplayOptions = {
    ...DEFAULT_DISPLAY_OPTIONS,
    layout: options.initialLayout ?? DEFAULT_DISPLAY_OPTIONS.layout,
    showLabels: options.initialShowLabels ?? DEFAULT_DISPLAY_OPTIONS.showLabels,
    showEdgeLabels: options.initialShowEdgeLabels ?? DEFAULT_DISPLAY_OPTIONS.showEdgeLabels,
    highlightConnections:
      options.initialHighlightConnections ?? DEFAULT_DISPLAY_OPTIONS.highlightConnections,
    colorScheme: options.initialColorScheme ?? DEFAULT_DISPLAY_OPTIONS.colorScheme,
    frozen: options.initialFrozen ?? DEFAULT_DISPLAY_OPTIONS.frozen,
  };

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeIdState] = useState<string | null>(null);

  // View state
  const [zoom, setZoomState] = useState(DEFAULT_VIEW_STATE.zoom);
  const [pan, setPan] = useState(DEFAULT_VIEW_STATE.pan);

  // Filter state
  const [filters, setFiltersState] = useState<GraphFilters>(DEFAULT_FILTERS);

  // Display options state
  const [displayOptions, setDisplayOptions] = useState<GraphDisplayOptions>(initialDisplayOptions);

  // ============================================================================
  // Selection Actions
  // ============================================================================

  const selectNode = useCallback((node: GraphNode | null) => {
    setSelectedNodeId(node?.id ?? null);
    // Clear edge selection when selecting a node
    if (node) {
      setSelectedEdgeId(null);
    }
  }, []);

  const selectEdge = useCallback((edge: GraphEdge | null) => {
    setSelectedEdgeId(edge?.id ?? null);
    // Don't clear node selection when selecting an edge
  }, []);

  const setHoveredNode = useCallback((node: GraphNode | null) => {
    setHoveredNodeIdState(node?.id ?? null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  // Get selected node object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, nodes]);

  // ============================================================================
  // View Actions
  // ============================================================================

  const setZoom = useCallback((newZoom: number) => {
    setZoomState(Math.max(ZOOM_CONFIG.min, Math.min(ZOOM_CONFIG.max, newZoom)));
  }, []);

  const zoomIn = useCallback(() => {
    setZoomState((prev) => Math.min(ZOOM_CONFIG.max, prev + ZOOM_CONFIG.step));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomState((prev) => Math.max(ZOOM_CONFIG.min, prev - ZOOM_CONFIG.step));
  }, []);

  const zoomReset = useCallback(() => {
    setZoomState(ZOOM_CONFIG.default);
  }, []);

  // ============================================================================
  // Filter Actions
  // ============================================================================

  const setFilters = useCallback((newFilters: GraphFilters) => {
    setFiltersState(newFilters);
  }, []);

  const toggleTypeFilter = useCallback((type: NodeType) => {
    setFiltersState((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  }, []);

  const toggleStatusFilter = useCallback((status: NodeStatus) => {
    setFiltersState((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  }, []);

  const toggleTagFilter = useCallback((tag: string) => {
    setFiltersState((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setFiltersState((prev) => ({
      ...prev,
      searchQuery: query,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.types.length !== ALL_NODE_TYPES.length ||
      filters.statuses.length !== ALL_NODE_STATUSES.length ||
      filters.tags.length > 0 ||
      filters.searchQuery.length > 0
    );
  }, [filters]);

  // ============================================================================
  // Display Actions
  // ============================================================================

  const setLayout = useCallback((layout: LayoutType) => {
    setDisplayOptions((prev) => ({ ...prev, layout }));
  }, []);

  const toggleLabels = useCallback(() => {
    setDisplayOptions((prev) => ({ ...prev, showLabels: !prev.showLabels }));
  }, []);

  const toggleEdgeLabels = useCallback(() => {
    setDisplayOptions((prev) => ({ ...prev, showEdgeLabels: !prev.showEdgeLabels }));
  }, []);

  const toggleHighlightConnections = useCallback(() => {
    setDisplayOptions((prev) => ({
      ...prev,
      highlightConnections: !prev.highlightConnections,
    }));
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setDisplayOptions((prev) => ({ ...prev, colorScheme: scheme }));
  }, []);

  const toggleFrozen = useCallback(() => {
    setDisplayOptions((prev) => ({ ...prev, frozen: !prev.frozen }));
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Selection state
    selectedNodeId,
    selectedEdgeId,
    hoveredNodeId,
    selectedNode,

    // Selection actions
    selectNode,
    selectEdge,
    setHoveredNode,
    clearSelection,

    // View state
    zoom,
    pan,

    // View actions
    setZoom,
    zoomIn,
    zoomOut,
    zoomReset,
    setPan,

    // Filter state
    filters,

    // Filter actions
    setFilters,
    toggleTypeFilter,
    toggleStatusFilter,
    toggleTagFilter,
    setSearchQuery,
    clearFilters,
    hasActiveFilters,

    // Display options
    displayOptions,

    // Display actions
    setLayout,
    toggleLabels,
    toggleEdgeLabels,
    toggleHighlightConnections,
    setColorScheme,
    toggleFrozen,

    // Computed values
    visibleTypes: filters.types,
    visibleStatuses: filters.statuses,
  };
}

export default useGraphState;
