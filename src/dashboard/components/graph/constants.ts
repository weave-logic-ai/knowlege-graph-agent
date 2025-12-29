/**
 * Graph Component Constants
 *
 * Color schemes, styling constants, and configuration for graph visualization.
 */

import type { NodeType, NodeStatus } from '../../../core/types';
import type { EdgeType, NodeColors, StatusOpacity, EdgeColors } from '../../types/graph';

// ============================================================================
// Node Colors by Type
// ============================================================================

export const NODE_COLORS: NodeColors = {
  concept: '#8B5CF6',      // Purple
  technical: '#3B82F6',    // Blue
  feature: '#10B981',      // Green
  primitive: '#F59E0B',    // Amber
  service: '#EF4444',      // Red
  guide: '#6366F1',        // Indigo
  standard: '#EC4899',     // Pink
  integration: '#14B8A6',  // Teal
};

// Dark mode variants (slightly brighter)
export const NODE_COLORS_DARK: NodeColors = {
  concept: '#A78BFA',      // Purple
  technical: '#60A5FA',    // Blue
  feature: '#34D399',      // Green
  primitive: '#FBBF24',    // Amber
  service: '#F87171',      // Red
  guide: '#818CF8',        // Indigo
  standard: '#F472B6',     // Pink
  integration: '#2DD4BF',  // Teal
};

// ============================================================================
// Status Opacity
// ============================================================================

export const STATUS_OPACITY: StatusOpacity = {
  active: 1.0,
  draft: 0.7,
  deprecated: 0.5,
  archived: 0.3,
};

// ============================================================================
// Edge Colors
// ============================================================================

export const EDGE_COLORS: EdgeColors = {
  link: '#94A3B8',      // Slate
  reference: '#60A5FA', // Light blue
  parent: '#34D399',    // Emerald
  related: '#F472B6',   // Pink
};

export const EDGE_COLORS_DARK: EdgeColors = {
  link: '#64748B',      // Slate
  reference: '#3B82F6', // Blue
  parent: '#10B981',    // Emerald
  related: '#EC4899',   // Pink
};

// ============================================================================
// Node Type Labels & Icons
// ============================================================================

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  concept: 'Concept',
  technical: 'Technical',
  feature: 'Feature',
  primitive: 'Primitive',
  service: 'Service',
  guide: 'Guide',
  standard: 'Standard',
  integration: 'Integration',
};

export const NODE_TYPE_ICONS: Record<NodeType, string> = {
  concept: 'lightbulb',
  technical: 'code',
  feature: 'star',
  primitive: 'cube',
  service: 'server',
  guide: 'book',
  standard: 'shield-check',
  integration: 'plug',
};

// ============================================================================
// Status Labels
// ============================================================================

export const NODE_STATUS_LABELS: Record<NodeStatus, string> = {
  active: 'Active',
  draft: 'Draft',
  deprecated: 'Deprecated',
  archived: 'Archived',
};

// ============================================================================
// Edge Type Labels
// ============================================================================

export const EDGE_TYPE_LABELS: Record<EdgeType, string> = {
  link: 'Links to',
  reference: 'References',
  parent: 'Parent of',
  related: 'Related to',
};

// ============================================================================
// Layout Configuration
// ============================================================================

export const LAYOUT_CONFIG = {
  force: {
    name: 'cose',
    idealEdgeLength: 100,
    nodeOverlap: 20,
    refresh: 20,
    fit: true,
    padding: 30,
    randomize: false,
    componentSpacing: 100,
    nodeRepulsion: 400000,
    edgeElasticity: 100,
    nestingFactor: 5,
    gravity: 80,
    numIter: 1000,
    initialTemp: 200,
    coolingFactor: 0.95,
    minTemp: 1.0,
    animate: true,
    animationDuration: 500,
  },
  circle: {
    name: 'circle',
    fit: true,
    padding: 30,
    avoidOverlap: true,
    nodeDimensionsIncludeLabels: true,
    spacingFactor: 1.5,
    radius: undefined,
    startAngle: (3 / 2) * Math.PI,
    sweep: undefined,
    clockwise: true,
    animate: true,
    animationDuration: 500,
  },
  grid: {
    name: 'grid',
    fit: true,
    padding: 30,
    avoidOverlap: true,
    avoidOverlapPadding: 10,
    nodeDimensionsIncludeLabels: true,
    spacingFactor: 1,
    condense: false,
    rows: undefined,
    cols: undefined,
    position: undefined,
    animate: true,
    animationDuration: 500,
  },
  hierarchical: {
    name: 'dagre',
    rankDir: 'TB',
    align: undefined,
    ranker: 'network-simplex',
    nodeSep: 50,
    edgeSep: 10,
    rankSep: 50,
    fit: true,
    padding: 30,
    animate: true,
    animationDuration: 500,
  },
};

// ============================================================================
// Zoom Configuration
// ============================================================================

export const ZOOM_CONFIG = {
  min: 0.1,
  max: 4,
  step: 0.1,
  default: 1,
  wheelSensitivity: 0.1,
};

// ============================================================================
// Cytoscape Stylesheet
// ============================================================================

export const getNodeStyle = (darkMode: boolean) => ({
  'background-color': (ele: { data: (key: string) => NodeType }) => {
    const type = ele.data('type') as NodeType;
    return darkMode ? NODE_COLORS_DARK[type] : NODE_COLORS[type];
  },
  'background-opacity': (ele: { data: (key: string) => NodeStatus }) => {
    const status = ele.data('status') as NodeStatus;
    return STATUS_OPACITY[status] || 1;
  },
  'width': (ele: { data: (key: string) => number }) => {
    const connections = ele.data('connections') || 1;
    return Math.min(30 + Math.sqrt(connections) * 5, 60);
  },
  'height': (ele: { data: (key: string) => number }) => {
    const connections = ele.data('connections') || 1;
    return Math.min(30 + Math.sqrt(connections) * 5, 60);
  },
  'label': 'data(label)',
  'text-valign': 'bottom',
  'text-halign': 'center',
  'text-margin-y': 5,
  'font-size': 11,
  'font-family': 'Inter, system-ui, sans-serif',
  'color': darkMode ? '#E2E8F0' : '#334155',
  'text-outline-color': darkMode ? '#0F172A' : '#FFFFFF',
  'text-outline-width': 2,
  'border-width': 2,
  'border-color': darkMode ? '#475569' : '#CBD5E1',
  'transition-property': 'background-color, border-color, width, height',
  'transition-duration': '0.15s',
});

export const getNodeSelectedStyle = (darkMode: boolean) => ({
  'border-width': 3,
  'border-color': darkMode ? '#60A5FA' : '#3B82F6',
  'box-shadow': '0 0 10px rgba(59, 130, 246, 0.5)',
});

export const getNodeHoverStyle = (darkMode: boolean) => ({
  'border-width': 3,
  'border-color': darkMode ? '#93C5FD' : '#60A5FA',
  'cursor': 'pointer',
});

export const getEdgeStyle = (darkMode: boolean) => ({
  'width': (ele: { data: (key: string) => number }) => {
    const weight = ele.data('weight') || 0.5;
    return 1 + weight * 2;
  },
  'line-color': (ele: { data: (key: string) => EdgeType }) => {
    const type = ele.data('type') as EdgeType;
    return darkMode ? EDGE_COLORS_DARK[type] : EDGE_COLORS[type];
  },
  'target-arrow-color': (ele: { data: (key: string) => EdgeType }) => {
    const type = ele.data('type') as EdgeType;
    return darkMode ? EDGE_COLORS_DARK[type] : EDGE_COLORS[type];
  },
  'target-arrow-shape': 'triangle',
  'curve-style': 'bezier',
  'opacity': 0.7,
  'transition-property': 'opacity, line-color',
  'transition-duration': '0.15s',
});

export const getEdgeSelectedStyle = (darkMode: boolean) => ({
  'line-color': darkMode ? '#60A5FA' : '#3B82F6',
  'target-arrow-color': darkMode ? '#60A5FA' : '#3B82F6',
  'opacity': 1,
  'width': 3,
});

export const getEdgeHoverStyle = () => ({
  'opacity': 1,
});

// ============================================================================
// Default Values
// ============================================================================

export const ALL_NODE_TYPES: NodeType[] = [
  'concept',
  'technical',
  'feature',
  'primitive',
  'service',
  'guide',
  'standard',
  'integration',
];

export const ALL_NODE_STATUSES: NodeStatus[] = [
  'active',
  'draft',
  'deprecated',
  'archived',
];

export const DEFAULT_FILTERS = {
  types: ALL_NODE_TYPES,
  statuses: ALL_NODE_STATUSES,
  tags: [],
  searchQuery: '',
};
