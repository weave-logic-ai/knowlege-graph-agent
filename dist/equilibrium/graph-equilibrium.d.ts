/**
 * Graph Equilibrium Optimization
 *
 * Implements game-theoretic equilibrium for graph node importance and pruning.
 * Nodes compete for relevance based on content value, connectivity, and
 * inverse redundancy with neighbors.
 *
 * Uses PageRank-inspired dynamics combined with content-based scoring
 * to identify the most important nodes in a knowledge graph.
 *
 * @module equilibrium/graph-equilibrium
 */
/**
 * Graph node representation
 */
export interface GraphNode {
    /** Unique node identifier */
    id: string;
    /** Node content/text */
    content: string;
    /** Node type (optional) */
    type?: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
    /** Creation timestamp */
    createdAt?: Date;
    /** Last update timestamp */
    updatedAt?: Date;
    /** Tags for categorization */
    tags?: string[];
}
/**
 * Graph edge representation
 */
export interface GraphEdge {
    /** Source node ID */
    source: string;
    /** Target node ID */
    target: string;
    /** Edge weight (default: 1.0) */
    weight?: number;
    /** Edge type/relationship */
    type?: string;
    /** Edge metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Node participation metrics in equilibrium calculation
 */
export interface NodeParticipation {
    /** Node identifier */
    nodeId: string;
    /** Importance score (0-1) */
    importance: number;
    /** Normalized connectivity score */
    connectivity: number;
    /** Content value score */
    contentValue: number;
    /** Redundancy penalty */
    redundancy: number;
}
/**
 * Configuration for graph equilibrium optimizer
 */
export interface GraphEquilibriumConfig {
    /** Learning rate for importance updates (default: 0.1) */
    learningRate: number;
    /** Maximum iterations to find equilibrium (default: 100) */
    maxIterations: number;
    /** Minimum importance to retain node (default: 0.01) */
    minImportance: number;
    /** Convergence threshold (default: 0.0001) */
    convergenceThreshold: number;
    /** Damping factor for PageRank-like calculation (default: 0.85) */
    dampingFactor: number;
    /** Weight for connectivity in utility (default: 0.3) */
    connectivityWeight: number;
    /** Weight for content in utility (default: 0.7) */
    contentWeight: number;
    /** Redundancy penalty factor (default: 0.3) */
    redundancyPenalty: number;
}
/**
 * Result of graph optimization
 */
export interface GraphOptimizationResult {
    /** Node importance scores */
    importanceScores: Map<string, number>;
    /** Ordered list of nodes by importance */
    rankedNodes: string[];
    /** Nodes below minimum importance (prune candidates) */
    pruneCandidates: string[];
    /** Number of iterations */
    iterations: number;
    /** Whether equilibrium was reached */
    converged: boolean;
    /** Participation details for each node */
    participations: Map<string, NodeParticipation>;
}
/**
 * Cluster of similar nodes
 */
export interface NodeCluster {
    /** Representative node ID */
    representative: string;
    /** Member node IDs */
    members: string[];
    /** Average importance of cluster */
    avgImportance: number;
    /** Combined connectivity */
    totalConnectivity: number;
}
declare const DEFAULT_CONFIG: GraphEquilibriumConfig;
/**
 * Optimizes graph structure using game-theoretic equilibrium.
 *
 * The algorithm:
 * 1. Builds adjacency structure from edges
 * 2. Initializes equal importance for all nodes
 * 3. Computes content value and connectivity for each node
 * 4. Updates importance based on utility (content + connectivity) minus redundancy
 * 5. Propagates importance from neighbors (PageRank-inspired)
 * 6. Normalizes and checks convergence
 * 7. Identifies prune candidates below threshold
 */
export declare class GraphEquilibriumOptimizer {
    private config;
    constructor(config?: Partial<GraphEquilibriumConfig>);
    /**
     * Get current configuration
     */
    getConfig(): GraphEquilibriumConfig;
    /**
     * Update configuration
     */
    setConfig(config: Partial<GraphEquilibriumConfig>): void;
    /**
     * Calculate equilibrium importance scores for graph nodes
     * Nodes compete for relevance based on content and connections
     *
     * @param nodes - Graph nodes
     * @param edges - Graph edges
     * @param query - Optional query for relevance-based scoring
     * @returns Map of node ID to importance score
     */
    optimizeGraph(nodes: GraphNode[], edges: GraphEdge[], query?: string): Promise<Map<string, number>>;
    /**
     * Optimize graph and return detailed results
     */
    optimizeWithDetails(nodes: GraphNode[], edges: GraphEdge[], query?: string): Promise<GraphOptimizationResult>;
    /**
     * Identify nodes that should be pruned based on importance threshold
     */
    identifyPruneCandidates(nodes: GraphNode[], edges: GraphEdge[], threshold?: number): Promise<string[]>;
    /**
     * Get top N most important nodes
     */
    getTopNodes(nodes: GraphNode[], edges: GraphEdge[], n: number, query?: string): Promise<GraphNode[]>;
    /**
     * Find clusters of similar/related nodes
     */
    findNodeClusters(nodes: GraphNode[], edges: GraphEdge[], minClusterSize?: number): Promise<NodeCluster[]>;
    /**
     * Calculate importance delta if a node were removed
     */
    calculateRemovalImpact(nodes: GraphNode[], edges: GraphEdge[], nodeId: string): Promise<{
        impactedNodes: Map<string, number>;
        totalImpact: number;
    }>;
    private buildAdjacency;
    private calculateConnectivity;
    private calculateRelevance;
    private calculateIntrinsicValue;
    private calculateNodeRedundancy;
}
export { DEFAULT_CONFIG as DEFAULT_GRAPH_EQUILIBRIUM_CONFIG };
//# sourceMappingURL=graph-equilibrium.d.ts.map