/**
 * Graph Visualization Types
 *
 * TypeScript types for the graph visualization components using Cytoscape.js
 */

import type { NodeType, NodeStatus } from '../../core/types';

// ============================================================================
// Graph Node Types
// ============================================================================

export interface GraphNode {
  id: string;
  title: string;
  type: NodeType;
  status: NodeStatus;
  tags: string[];
  connections: number;
  path?: string;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
  label?: string;
}

export type EdgeType = 'link' | 'reference' | 'parent' | 'related';

// ============================================================================
// Layout Types
// ============================================================================

export type LayoutType = 'force' | 'circle' | 'grid' | 'hierarchical';

export interface LayoutOptions {
  type: LayoutType;
  animate?: boolean;
  animationDuration?: number;
  fit?: boolean;
  padding?: number;
}

// ============================================================================
// Color Scheme Types
// ============================================================================

export type ColorScheme = 'type' | 'status' | 'custom';

export interface NodeColors {
  concept: string;
  technical: string;
  feature: string;
  primitive: string;
  service: string;
  guide: string;
  standard: string;
  integration: string;
}

export interface StatusOpacity {
  active: number;
  draft: number;
  deprecated: number;
  archived: number;
}

export interface EdgeColors {
  link: string;
  reference: string;
  parent: string;
  related: string;
}

// ============================================================================
// Graph State Types
// ============================================================================

export interface GraphFilters {
  types: NodeType[];
  statuses: NodeStatus[];
  tags: string[];
  searchQuery: string;
}

export interface GraphViewState {
  zoom: number;
  pan: { x: number; y: number };
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  hoveredNodeId: string | null;
}

export interface GraphDisplayOptions {
  showLabels: boolean;
  showEdgeLabels: boolean;
  highlightConnections: boolean;
  colorScheme: ColorScheme;
  layout: LayoutType;
  frozen: boolean;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId?: string;
  selectedEdgeId?: string;
  onNodeSelect?: (node: GraphNode | null) => void;
  onEdgeSelect?: (edge: GraphEdge | null) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  onNodeRightClick?: (node: GraphNode, event: MouseEvent) => void;
  onCanvasClick?: () => void;
  showLabels?: boolean;
  showEdgeLabels?: boolean;
  highlightConnections?: boolean;
  colorScheme?: ColorScheme;
  layoutType?: LayoutType;
  frozen?: boolean;
  visibleTypes?: NodeType[];
  visibleStatuses?: NodeStatus[];
  enableZoom?: boolean;
  enablePan?: boolean;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
  darkMode?: boolean;
}

export interface GraphControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomFit: () => void;
  onZoomChange: (zoom: number) => void;
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  colorScheme: ColorScheme;
  onColorSchemeChange: (scheme: ColorScheme) => void;
  filters: GraphFilters;
  onFiltersChange: (filters: GraphFilters) => void;
  onExport: (format: 'png' | 'svg') => void;
  onCenterGraph: () => void;
  allTags: string[];
  className?: string;
  darkMode?: boolean;
}

export interface NodeTooltipProps {
  node: GraphNode | null;
  position: { x: number; y: number };
  visible: boolean;
  onView?: (node: GraphNode) => void;
  onEdit?: (node: GraphNode) => void;
  onDelete?: (node: GraphNode) => void;
  darkMode?: boolean;
}

export interface GraphLegendProps {
  visibleTypes: NodeType[];
  onToggleType: (type: NodeType) => void;
  colorScheme: ColorScheme;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
  darkMode?: boolean;
}

// ============================================================================
// Export Format Types
// ============================================================================

export type ExportFormat = 'png' | 'svg';

export interface ExportOptions {
  format: ExportFormat;
  scale?: number;
  background?: string;
  full?: boolean;
}
