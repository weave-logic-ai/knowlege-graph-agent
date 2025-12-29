/**
 * Knowledge Graph Core
 *
 * Core graph data structure and operations for managing knowledge nodes.
 */
import type { KnowledgeNode, KnowledgeGraph, GraphEdge, GraphMetadata, GraphStats, NodeType, NodeStatus } from './types.js';
/**
 * Knowledge Graph Manager
 *
 * Manages the in-memory knowledge graph with efficient operations
 * for node/edge management, traversal, and analysis.
 */
export declare class KnowledgeGraphManager {
    private nodes;
    private edges;
    private incomingIndex;
    private outgoingIndex;
    private tagIndex;
    private metadata;
    constructor(name: string, rootPath: string);
    /**
     * Add a node to the graph
     */
    addNode(node: KnowledgeNode): void;
    /**
     * Get a node by ID
     */
    getNode(id: string): KnowledgeNode | undefined;
    /**
     * Get all nodes
     */
    getAllNodes(): KnowledgeNode[];
    /**
     * Get nodes by type
     */
    getNodesByType(type: NodeType): KnowledgeNode[];
    /**
     * Get nodes by status
     */
    getNodesByStatus(status: NodeStatus): KnowledgeNode[];
    /**
     * Get nodes by tag
     */
    getNodesByTag(tag: string): KnowledgeNode[];
    /**
     * Update a node
     */
    updateNode(id: string, updates: Partial<KnowledgeNode>): boolean;
    /**
     * Remove a node
     */
    removeNode(id: string): boolean;
    /**
     * Add an edge to the graph
     */
    addEdge(edge: GraphEdge): void;
    /**
     * Get incoming edges for a node
     */
    getIncomingEdges(nodeId: string): GraphEdge[];
    /**
     * Get outgoing edges for a node
     */
    getOutgoingEdges(nodeId: string): GraphEdge[];
    /**
     * Get all edges
     */
    getAllEdges(): GraphEdge[];
    /**
     * Find orphan nodes (no incoming or outgoing links)
     */
    findOrphanNodes(): KnowledgeNode[];
    /**
     * Find most connected nodes
     */
    findMostConnected(limit?: number): Array<{
        node: KnowledgeNode;
        connections: number;
    }>;
    /**
     * Find path between two nodes (BFS)
     */
    findPath(sourceId: string, targetId: string): string[] | null;
    /**
     * Find related nodes (nodes connected within n hops)
     */
    findRelated(nodeId: string, maxHops?: number): KnowledgeNode[];
    /**
     * Get graph statistics
     */
    getStats(): GraphStats;
    /**
     * Export graph to JSON
     */
    toJSON(): KnowledgeGraph;
    /**
     * Import graph from JSON
     */
    static fromJSON(data: KnowledgeGraph): KnowledgeGraphManager;
    /**
     * Get graph metadata
     */
    getMetadata(): GraphMetadata;
}
/**
 * Create a new knowledge graph manager
 */
export declare function createKnowledgeGraph(name: string, rootPath: string): KnowledgeGraphManager;
//# sourceMappingURL=graph.d.ts.map