/**
 * SOP Overlay Manager
 *
 * Manages multi-layer knowledge graph overlays for SOP compliance visualization.
 * Supports standards layer, project layer, and compliance overlay.
 *
 * @module sops/overlay-manager
 */
import { GraphLayer, LayerNode, LayerEdge, MultiLayerGraph, ComplianceStatus, SOPCategory } from './types.js';
import { ComplianceCheckResult } from './compliance-checker.js';
import { GapAnalysisResult } from './gap-analyzer.js';
/**
 * Overlay manager options
 */
export interface OverlayManagerOptions {
    /** Graph ID */
    graphId?: string;
    /** Graph name */
    graphName?: string;
    /** Include all SOPs in standards layer */
    includeAllSOPs?: boolean;
    /** SOP categories to include */
    categories?: SOPCategory[];
    /** Custom node styling */
    nodeStyles?: NodeStyleConfig;
}
/**
 * Node style configuration
 */
export interface NodeStyleConfig {
    /** Colors by compliance status */
    statusColors?: Record<ComplianceStatus, string>;
    /** Colors by layer */
    layerColors?: Record<GraphLayer, string>;
    /** Node size by type */
    nodeSizes?: Record<string, number>;
}
/**
 * Create a multi-layer graph with SOP standards overlay
 */
export declare function createMultiLayerGraph(options?: OverlayManagerOptions): MultiLayerGraph;
/**
 * Add project layer to graph from knowledge graph data
 */
export declare function addProjectLayer(graph: MultiLayerGraph, projectNodes: Array<{
    id: string;
    title: string;
    type: string;
    tags?: string[];
}>, projectEdges: Array<{
    source: string;
    target: string;
    type?: string;
}>): MultiLayerGraph;
/**
 * Add compliance overlay from check results
 */
export declare function addComplianceOverlay(graph: MultiLayerGraph, checkResult: ComplianceCheckResult, gapResult?: GapAnalysisResult): MultiLayerGraph;
/**
 * Filter graph by layer
 */
export declare function filterByLayer(graph: MultiLayerGraph, layer: GraphLayer): {
    nodes: LayerNode[];
    edges: LayerEdge[];
};
/**
 * Filter graph by compliance status
 */
export declare function filterByComplianceStatus(graph: MultiLayerGraph, status: ComplianceStatus): {
    nodes: LayerNode[];
    edges: LayerEdge[];
};
/**
 * Get compliance summary from graph
 */
export declare function getComplianceSummary(graph: MultiLayerGraph): {
    totalSOPs: number;
    compliant: number;
    partial: number;
    nonCompliant: number;
    pending: number;
    overallScore: number;
};
/**
 * Get gap nodes from graph
 */
export declare function getGapNodes(graph: MultiLayerGraph): LayerNode[];
/**
 * Toggle layer visibility
 */
export declare function toggleLayerVisibility(graph: MultiLayerGraph, layerType: GraphLayer, visible: boolean): MultiLayerGraph;
/**
 * Export graph to visualization format (Obsidian/D3 compatible)
 */
export declare function exportToVisualizationFormat(graph: MultiLayerGraph, styles?: NodeStyleConfig): {
    nodes: Array<{
        id: string;
        label: string;
        group: string;
        color: string;
        size: number;
        metadata: Record<string, unknown>;
    }>;
    edges: Array<{
        source: string;
        target: string;
        type: string;
        weight: number;
    }>;
};
/**
 * Create a focused subgraph around a specific SOP
 */
export declare function createSOPFocusedSubgraph(graph: MultiLayerGraph, sopId: string, depth?: number): MultiLayerGraph;
//# sourceMappingURL=overlay-manager.d.ts.map