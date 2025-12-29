/**
 * Knowledge Graph Database
 *
 * SQLite database for persistent storage of knowledge graph data.
 * Compatible with claude-flow database patterns.
 */
import Database from 'better-sqlite3';
import type { KnowledgeNode, GraphEdge, GraphStats, NodeType, NodeStatus } from './types.js';
/**
 * Knowledge Graph Database
 */
export declare class KnowledgeGraphDatabase {
    private db;
    private dbPath;
    constructor(dbPath: string);
    /**
     * Insert or update a node
     */
    upsertNode(node: KnowledgeNode): void;
    /**
     * Get node by ID
     */
    getNode(id: string): KnowledgeNode | null;
    /**
     * Get node by path
     */
    getNodeByPath(path: string): KnowledgeNode | null;
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
     * Sanitize FTS5 query to prevent query injection
     * Escapes special FTS5 operators and quotes terms
     */
    private sanitizeFtsQuery;
    /**
     * Search nodes by title or content
     */
    searchNodes(query: string, limit?: number): KnowledgeNode[];
    /**
     * Delete node
     */
    deleteNode(id: string): boolean;
    /**
     * Update tags for a node
     */
    private updateNodeTags;
    /**
     * Get tags for a node
     */
    getNodeTags(nodeId: string): string[];
    /**
     * Get all tags with counts
     */
    getAllTags(): Array<{
        name: string;
        count: number;
    }>;
    /**
     * Add edge
     */
    addEdge(edge: GraphEdge): void;
    /**
     * Get outgoing edges for a node
     */
    getOutgoingEdges(nodeId: string): GraphEdge[];
    /**
     * Get incoming edges for a node
     */
    getIncomingEdges(nodeId: string): GraphEdge[];
    /**
     * Delete edges for a node
     */
    deleteNodeEdges(nodeId: string): void;
    /**
     * Get graph statistics
     */
    getStats(): GraphStats;
    /**
     * Get metadata value
     */
    getMetadata(key: string): string | null;
    /**
     * Set metadata value
     */
    setMetadata(key: string, value: string): void;
    /**
     * Convert database row to KnowledgeNode
     */
    private rowToNode;
    /**
     * Convert database row to GraphEdge
     */
    private rowToEdge;
    /**
     * Close database connection
     */
    close(): void;
    /**
     * Get raw database instance
     */
    getDatabase(): Database.Database;
}
/**
 * Create knowledge graph database instance
 */
export declare function createDatabase(dbPath: string): KnowledgeGraphDatabase;
//# sourceMappingURL=database.d.ts.map