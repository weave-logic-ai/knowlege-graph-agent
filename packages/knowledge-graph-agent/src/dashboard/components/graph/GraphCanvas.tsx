/**
 * GraphCanvas Component
 *
 * Main graph visualization component using Cytoscape.js via react-cytoscapejs.
 * Provides interactive force-directed graph with multiple layout options,
 * node selection, edge highlighting, and export capabilities.
 */

import React, {
  useRef,
  useCallback,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
// Note: dagre layout for hierarchical needs to be registered separately:
// import dagre from 'cytoscape-dagre';
// cytoscape.use(dagre);

import type {
  GraphCanvasProps,
  GraphNode,
  GraphEdge,
  LayoutType,
  ExportFormat,
} from '../../types/graph';
import type { NodeType, NodeStatus } from '../../../core/types';
import {
  NODE_COLORS,
  NODE_COLORS_DARK,
  STATUS_OPACITY,
  EDGE_COLORS,
  EDGE_COLORS_DARK,
  LAYOUT_CONFIG,
  ZOOM_CONFIG,
} from './constants';

// ============================================================================
// Types
// ============================================================================

// Cytoscape Core type - simplified for compatibility
interface CyCore {
  fit: () => void;
  center: () => void;
  zoom: (level?: number) => number;
  minZoom: (level: number) => void;
  maxZoom: (level: number) => void;
  userZoomingEnabled: (enabled: boolean) => void;
  userPanningEnabled: (enabled: boolean) => void;
  png: (options?: Record<string, unknown>) => string;
  svg: (options?: Record<string, unknown>) => string;
  layout: (options: Record<string, unknown>) => { run: () => void };
  elements: () => CyCollection;
  nodes: () => CyCollection;
  edges: () => CyCollection;
  getElementById: (id: string) => CyCollection;
  on: (event: string, selector: string | ((evt: CyEvent) => void), handler?: (evt: CyEvent) => void) => void;
}

interface CyCollection {
  length: number;
  select: () => CyCollection;
  unselect: () => CyCollection;
  addClass: (className: string) => CyCollection;
  removeClass: (className: string) => CyCollection;
  connectedEdges: () => CyCollection;
  connectedNodes: () => CyCollection;
}

interface CyEvent {
  target: {
    data: (key?: string) => unknown;
    addClass: (className: string) => void;
    removeClass: (className: string) => void;
    renderedPosition: () => { x: number; y: number };
  };
  originalEvent: Event;
}

export interface GraphCanvasRef {
  fit: () => void;
  center: () => void;
  zoomTo: (level: number) => void;
  getZoom: () => number;
  exportImage: (format: ExportFormat, options?: { scale?: number; background?: string }) => string;
  selectNode: (nodeId: string) => void;
  clearSelection: () => void;
  runLayout: (type?: LayoutType) => void;
  getCytoscape: () => CyCore | null;
}

interface CytoscapeElement {
  data: {
    id: string;
    label?: string;
    type?: NodeType | string;
    status?: NodeStatus;
    tags?: string[];
    connections?: number;
    source?: string;
    target?: string;
    weight?: number;
  };
  position?: { x: number; y: number };
  classes?: string;
}

interface StylesheetEntry {
  selector: string;
  style: Record<string, unknown>;
}

// ============================================================================
// Helper Functions
// ============================================================================

const convertNodesToCytoscapeElements = (nodes: GraphNode[]): CytoscapeElement[] => {
  return nodes.map((node) => ({
    data: {
      id: node.id,
      label: node.title,
      type: node.type,
      status: node.status,
      tags: node.tags,
      connections: node.connections,
    },
    position: node.x !== undefined && node.y !== undefined
      ? { x: node.x, y: node.y }
      : undefined,
  }));
};

const convertEdgesToCytoscapeElements = (edges: GraphEdge[]): CytoscapeElement[] => {
  return edges.map((edge) => ({
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      weight: edge.weight,
      label: edge.label,
    },
  }));
};

const getLayoutConfig = (layoutType: LayoutType): Record<string, unknown> => {
  switch (layoutType) {
    case 'force':
      return LAYOUT_CONFIG.force;
    case 'circle':
      return LAYOUT_CONFIG.circle;
    case 'grid':
      return LAYOUT_CONFIG.grid;
    case 'hierarchical':
      return LAYOUT_CONFIG.hierarchical;
    default:
      return LAYOUT_CONFIG.force;
  }
};

// ============================================================================
// Stylesheet Generator
// ============================================================================

const generateStylesheet = (
  darkMode: boolean,
  showLabels: boolean,
  showEdgeLabels: boolean
): StylesheetEntry[] => {
  const nodeColors = darkMode ? NODE_COLORS_DARK : NODE_COLORS;
  const edgeColors = darkMode ? EDGE_COLORS_DARK : EDGE_COLORS;
  const textColor = darkMode ? '#E2E8F0' : '#334155';
  const textOutline = darkMode ? '#0F172A' : '#FFFFFF';
  const borderColor = darkMode ? '#475569' : '#CBD5E1';
  const selectedColor = darkMode ? '#60A5FA' : '#3B82F6';
  const hoverColor = darkMode ? '#93C5FD' : '#60A5FA';

  return [
    // Base node style
    {
      selector: 'node',
      style: {
        'background-color': (ele: { data: (key: string) => string }) => {
          const type = ele.data('type') as NodeType;
          return nodeColors[type] || nodeColors.concept;
        },
        'background-opacity': (ele: { data: (key: string) => string }) => {
          const status = ele.data('status') as NodeStatus;
          return STATUS_OPACITY[status] || 1;
        },
        width: (ele: { data: (key: string) => number }) => {
          const connections = ele.data('connections') || 1;
          return Math.min(30 + Math.sqrt(connections) * 5, 60);
        },
        height: (ele: { data: (key: string) => number }) => {
          const connections = ele.data('connections') || 1;
          return Math.min(30 + Math.sqrt(connections) * 5, 60);
        },
        label: showLabels ? 'data(label)' : '',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 5,
        'font-size': 11,
        'font-family': 'Inter, system-ui, sans-serif',
        color: textColor,
        'text-outline-color': textOutline,
        'text-outline-width': 2,
        'border-width': 2,
        'border-color': borderColor,
        'transition-property': 'background-color, border-color, width, height',
        'transition-duration': 150,
      },
    },
    // Selected node style
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': selectedColor,
        'z-index': 999,
      },
    },
    // Hovered node style (applied via class)
    {
      selector: 'node.hover',
      style: {
        'border-width': 3,
        'border-color': hoverColor,
        cursor: 'pointer',
      },
    },
    // Highlighted node (connected to selected)
    {
      selector: 'node.highlighted',
      style: {
        'border-width': 3,
        'border-color': hoverColor,
        opacity: 1,
      },
    },
    // Dimmed node (not connected to selected)
    {
      selector: 'node.dimmed',
      style: {
        opacity: 0.3,
      },
    },
    // Base edge style
    {
      selector: 'edge',
      style: {
        width: (ele: { data: (key: string) => number }) => {
          const weight = ele.data('weight') || 0.5;
          return 1 + weight * 2;
        },
        'line-color': (ele: { data: (key: string) => string }) => {
          const type = ele.data('type') as keyof typeof edgeColors;
          return edgeColors[type] || edgeColors.link;
        },
        'target-arrow-color': (ele: { data: (key: string) => string }) => {
          const type = ele.data('type') as keyof typeof edgeColors;
          return edgeColors[type] || edgeColors.link;
        },
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        opacity: 0.6,
        label: showEdgeLabels ? 'data(label)' : '',
        'font-size': 9,
        'text-rotation': 'autorotate',
        color: textColor,
        'text-outline-color': textOutline,
        'text-outline-width': 1,
        'transition-property': 'opacity, line-color, width',
        'transition-duration': 150,
      },
    },
    // Selected edge style
    {
      selector: 'edge:selected',
      style: {
        'line-color': selectedColor,
        'target-arrow-color': selectedColor,
        opacity: 1,
        width: 3,
        'z-index': 999,
      },
    },
    // Highlighted edge (connected to selected node)
    {
      selector: 'edge.highlighted',
      style: {
        'line-color': selectedColor,
        'target-arrow-color': selectedColor,
        opacity: 1,
        width: 2.5,
      },
    },
    // Dimmed edge (not connected to selected)
    {
      selector: 'edge.dimmed',
      style: {
        opacity: 0.15,
      },
    },
  ];
};

// ============================================================================
// Main Component
// ============================================================================

const GraphCanvas = forwardRef<GraphCanvasRef, GraphCanvasProps>(
  (
    {
      nodes,
      edges,
      selectedNodeId,
      selectedEdgeId,
      onNodeSelect,
      onEdgeSelect,
      onNodeHover,
      onNodeRightClick,
      onCanvasClick,
      showLabels = true,
      showEdgeLabels = false,
      highlightConnections = true,
      layoutType = 'force',
      frozen = false,
      visibleTypes,
      visibleStatuses,
      enableZoom = true,
      enablePan = true,
      minZoom = ZOOM_CONFIG.min,
      maxZoom = ZOOM_CONFIG.max,
      className = '',
      darkMode = false,
    },
    ref
  ) => {
    const cyRef = useRef<CyCore | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter nodes based on visible types and statuses
    const filteredNodes = useMemo(() => {
      return nodes.filter((node) => {
        const typeMatch = !visibleTypes || visibleTypes.includes(node.type);
        const statusMatch = !visibleStatuses || visibleStatuses.includes(node.status);
        return typeMatch && statusMatch;
      });
    }, [nodes, visibleTypes, visibleStatuses]);

    // Filter edges to only include those with visible nodes
    const filteredEdges = useMemo(() => {
      const nodeIds = new Set(filteredNodes.map((n) => n.id));
      return edges.filter(
        (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
    }, [edges, filteredNodes]);

    // Convert to Cytoscape elements
    const elements = useMemo(() => {
      const nodeElements = convertNodesToCytoscapeElements(filteredNodes);
      const edgeElements = convertEdgesToCytoscapeElements(filteredEdges);
      return [...nodeElements, ...edgeElements];
    }, [filteredNodes, filteredEdges]);

    // Generate stylesheet
    const stylesheet = useMemo(() => {
      return generateStylesheet(darkMode, showLabels, showEdgeLabels);
    }, [darkMode, showLabels, showEdgeLabels]);

    // Highlight connections when a node is selected
    const updateHighlighting = useCallback(
      (nodeId: string | null) => {
        const cy = cyRef.current;
        if (!cy) return;

        // Remove all highlighting classes
        cy.elements().removeClass('highlighted dimmed');

        if (nodeId && highlightConnections) {
          const selectedNode = cy.getElementById(nodeId);
          if (selectedNode.length) {
            // Get connected nodes and edges
            const connectedEdges = selectedNode.connectedEdges();
            const connectedNodes = connectedEdges.connectedNodes();

            // Dim all elements
            cy.elements().addClass('dimmed');

            // Highlight selected node and connected elements
            selectedNode.removeClass('dimmed');
            connectedNodes.removeClass('dimmed').addClass('highlighted');
            connectedEdges.removeClass('dimmed').addClass('highlighted');
          }
        }
      },
      [highlightConnections]
    );

    // Handle node selection changes
    useEffect(() => {
      const cy = cyRef.current;
      if (!cy) return;

      if (selectedNodeId) {
        cy.nodes().unselect();
        const node = cy.getElementById(selectedNodeId);
        if (node.length) {
          node.select();
          updateHighlighting(selectedNodeId);
        }
      } else {
        cy.nodes().unselect();
        updateHighlighting(null);
      }
    }, [selectedNodeId, updateHighlighting]);

    // Handle edge selection changes
    useEffect(() => {
      const cy = cyRef.current;
      if (!cy) return;

      if (selectedEdgeId) {
        cy.edges().unselect();
        const edge = cy.getElementById(selectedEdgeId);
        if (edge.length) {
          edge.select();
        }
      } else {
        cy.edges().unselect();
      }
    }, [selectedEdgeId]);

    // Run layout when type changes or when frozen state changes
    const runLayout = useCallback(
      (type?: LayoutType) => {
        const cy = cyRef.current;
        if (!cy || frozen) return;

        const layoutConfig = getLayoutConfig(type || layoutType);
        const layout = cy.layout(layoutConfig);
        layout.run();
      },
      [layoutType, frozen]
    );

    // Imperative handle for parent component access
    useImperativeHandle(
      ref,
      () => ({
        fit: () => {
          cyRef.current?.fit();
        },
        center: () => {
          cyRef.current?.center();
        },
        zoomTo: (level: number) => {
          cyRef.current?.zoom(level);
        },
        getZoom: () => {
          return cyRef.current?.zoom() || 1;
        },
        exportImage: (
          format: ExportFormat,
          options?: { scale?: number; background?: string }
        ) => {
          const cy = cyRef.current;
          if (!cy) return '';

          const exportOptions = {
            full: true,
            scale: options?.scale || 2,
            bg: options?.background || (darkMode ? '#0F172A' : '#FFFFFF'),
          };

          if (format === 'png') {
            return cy.png(exportOptions);
          } else {
            return cy.svg(exportOptions);
          }
        },
        selectNode: (nodeId: string) => {
          const cy = cyRef.current;
          if (!cy) return;

          cy.nodes().unselect();
          const node = cy.getElementById(nodeId);
          if (node.length) {
            node.select();
            updateHighlighting(nodeId);
          }
        },
        clearSelection: () => {
          const cy = cyRef.current;
          if (!cy) return;

          cy.elements().unselect();
          updateHighlighting(null);
        },
        runLayout,
        getCytoscape: () => cyRef.current,
      }),
      [darkMode, runLayout, updateHighlighting]
    );

    // Cytoscape initialization callback
    const handleCy = useCallback(
      (cy: CyCore) => {
        cyRef.current = cy;

        // Configure zoom settings
        cy.minZoom(minZoom);
        cy.maxZoom(maxZoom);
        cy.userZoomingEnabled(enableZoom);
        cy.userPanningEnabled(enablePan);

        // Node click handler
        cy.on('tap', 'node', (event: CyEvent) => {
          const target = event.target;
          const nodeData = target.data() as Record<string, unknown>;
          const node: GraphNode = {
            id: nodeData.id as string,
            title: nodeData.label as string,
            type: nodeData.type as NodeType,
            status: nodeData.status as NodeStatus,
            tags: (nodeData.tags as string[]) || [],
            connections: (nodeData.connections as number) || 0,
          };
          onNodeSelect?.(node);
          updateHighlighting(node.id);
        });

        // Edge click handler
        cy.on('tap', 'edge', (event: CyEvent) => {
          const target = event.target;
          const edgeData = target.data() as Record<string, unknown>;
          const edge: GraphEdge = {
            id: edgeData.id as string,
            source: edgeData.source as string,
            target: edgeData.target as string,
            type: edgeData.type as GraphEdge['type'],
            weight: (edgeData.weight as number) || 0.5,
            label: edgeData.label as string | undefined,
          };
          onEdgeSelect?.(edge);
        });

        // Background click handler
        cy.on('tap', (event: CyEvent) => {
          // Check if target is the cy container itself (background)
          if (!event.target.data) {
            onNodeSelect?.(null);
            onEdgeSelect?.(null);
            onCanvasClick?.();
            updateHighlighting(null);
          }
        });

        // Node hover handlers
        cy.on('mouseover', 'node', (event: CyEvent) => {
          event.target.addClass('hover');
          const target = event.target;
          const nodeData = target.data() as Record<string, unknown>;
          const node: GraphNode = {
            id: nodeData.id as string,
            title: nodeData.label as string,
            type: nodeData.type as NodeType,
            status: nodeData.status as NodeStatus,
            tags: (nodeData.tags as string[]) || [],
            connections: (nodeData.connections as number) || 0,
          };
          onNodeHover?.(node);
        });

        cy.on('mouseout', 'node', (event: CyEvent) => {
          event.target.removeClass('hover');
          onNodeHover?.(null);
        });

        // Right-click handler
        cy.on('cxttap', 'node', (event: CyEvent) => {
          const target = event.target;
          const nodeData = target.data() as Record<string, unknown>;
          const node: GraphNode = {
            id: nodeData.id as string,
            title: nodeData.label as string,
            type: nodeData.type as NodeType,
            status: nodeData.status as NodeStatus,
            tags: (nodeData.tags as string[]) || [],
            connections: (nodeData.connections as number) || 0,
          };
          // Convert Cytoscape event position to DOM coordinates
          const renderedPosition = target.renderedPosition();
          const domEvent = event.originalEvent as MouseEvent;
          onNodeRightClick?.(node, {
            ...domEvent,
            clientX: renderedPosition.x,
            clientY: renderedPosition.y,
          } as MouseEvent);
        });

        // Initial layout
        if (!frozen && elements.length > 0) {
          const layout = cy.layout(getLayoutConfig(layoutType));
          layout.run();
        }
      },
      [
        minZoom,
        maxZoom,
        enableZoom,
        enablePan,
        onNodeSelect,
        onEdgeSelect,
        onNodeHover,
        onNodeRightClick,
        onCanvasClick,
        frozen,
        layoutType,
        updateHighlighting,
        elements.length,
      ]
    );

    // Container styles
    const containerStyles = useMemo(
      () => ({
        width: '100%',
        height: '100%',
        minHeight: '400px',
        backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
        borderRadius: '0.5rem',
        border: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}`,
      }),
      [darkMode]
    );

    return (
      <div
        ref={containerRef}
        className={`graph-canvas-container ${className}`}
        style={containerStyles}
      >
        <CytoscapeComponent
          elements={elements as unknown[]}
          stylesheet={stylesheet as unknown[]}
          style={{ width: '100%', height: '100%' }}
          cy={handleCy as (cy: unknown) => void}
          wheelSensitivity={ZOOM_CONFIG.wheelSensitivity}
          boxSelectionEnabled={true}
          autounselectify={false}
          autoungrabify={frozen}
        />
      </div>
    );
  }
);

GraphCanvas.displayName = 'GraphCanvas';

export default GraphCanvas;
