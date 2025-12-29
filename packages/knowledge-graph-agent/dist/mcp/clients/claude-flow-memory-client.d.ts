/**
 * Claude-Flow Memory Client
 *
 * High-level memory client that wraps McpClientAdapter with
 * knowledge-graph-specific functionality and type safety.
 *
 * @module mcp/clients/claude-flow-memory-client
 */
import { McpClientAdapter, type McpClientConfig } from './mcp-client-adapter.js';
/**
 * Memory node entry for knowledge graph
 */
export interface MemoryNodeEntry {
    id: string;
    title: string;
    type: string;
    status: string;
    path: string;
    tags: string[];
    outgoingLinks: string[];
    incomingLinks: string[];
    summary: string;
    contentHash: string;
    lastModified: string;
    syncedAt: string;
}
/**
 * Memory index entry
 */
export interface MemoryIndexEntry {
    id: string;
    title: string;
    type: string;
    path: string;
}
/**
 * Memory metadata
 */
export interface MemoryMetadata {
    lastSync: string;
    nodeCount: number;
    namespace: string;
    version?: string;
}
/**
 * Graph stats stored in memory
 */
export interface MemoryGraphStats {
    totalNodes: number;
    totalEdges: number;
    nodesByType: Record<string, number>;
    nodesByStatus: Record<string, number>;
    averageLinksPerNode: number;
    orphanNodes: number;
}
/**
 * Client configuration
 */
export interface ClaudeFlowMemoryClientConfig extends Partial<McpClientConfig> {
    /** Memory namespace for knowledge graph (default: 'knowledge-graph') */
    namespace?: string;
    /** Key prefix for nodes (default: 'node/') */
    nodeKeyPrefix?: string;
    /** Key prefix for indexes (default: 'index/') */
    indexKeyPrefix?: string;
}
/**
 * Batch operation result
 */
export interface BatchOperationResult {
    total: number;
    succeeded: number;
    failed: number;
    errors: Array<{
        key: string;
        error: string;
    }>;
}
/**
 * Claude-Flow Memory Client
 *
 * Provides high-level memory operations for the knowledge graph agent
 * with proper typing and batch operations support.
 *
 * @example
 * ```typescript
 * const client = new ClaudeFlowMemoryClient({
 *   namespace: 'my-project-kg',
 * });
 *
 * // Store a node
 * await client.storeNode({
 *   id: 'abc123',
 *   title: 'My Node',
 *   type: 'document',
 *   // ...
 * });
 *
 * // Retrieve a node
 * const node = await client.getNode('abc123');
 * ```
 */
export declare class ClaudeFlowMemoryClient {
    private adapter;
    private namespace;
    private nodeKeyPrefix;
    private indexKeyPrefix;
    constructor(config?: ClaudeFlowMemoryClientConfig);
    /**
     * Store a knowledge node in memory
     *
     * @param node - The node to store
     * @param ttl - Optional TTL in seconds
     * @returns Whether the operation succeeded
     */
    storeNode(node: MemoryNodeEntry, ttl?: number): Promise<boolean>;
    /**
     * Retrieve a knowledge node from memory
     *
     * @param nodeId - The node ID
     * @returns The node or null if not found
     */
    getNode(nodeId: string): Promise<MemoryNodeEntry | null>;
    /**
     * Delete a knowledge node from memory
     *
     * @param nodeId - The node ID to delete
     * @returns Whether the operation succeeded
     */
    deleteNode(nodeId: string): Promise<boolean>;
    /**
     * Store multiple nodes in batch
     *
     * @param nodes - Array of nodes to store
     * @param ttl - Optional TTL in seconds
     * @returns Batch operation result
     */
    storeNodesBatch(nodes: MemoryNodeEntry[], ttl?: number): Promise<BatchOperationResult>;
    /**
     * Search for nodes by pattern
     *
     * @param pattern - Search pattern (e.g., 'node/*', 'node/abc*')
     * @param limit - Maximum results
     * @returns Array of matching node keys
     */
    searchNodes(pattern: string, limit?: number): Promise<string[]>;
    /**
     * Store the node index
     *
     * @param entries - Index entries
     * @returns Whether the operation succeeded
     */
    storeNodeIndex(entries: MemoryIndexEntry[]): Promise<boolean>;
    /**
     * Retrieve the node index
     *
     * @returns Array of index entries or null
     */
    getNodeIndex(): Promise<MemoryIndexEntry[] | null>;
    /**
     * Store the tag index
     *
     * @param tagIndex - Map of tags to node IDs
     * @returns Whether the operation succeeded
     */
    storeTagIndex(tagIndex: Record<string, string[]>): Promise<boolean>;
    /**
     * Retrieve the tag index
     *
     * @returns Tag index or null
     */
    getTagIndex(): Promise<Record<string, string[]> | null>;
    /**
     * Store graph statistics
     *
     * @param stats - Graph stats
     * @returns Whether the operation succeeded
     */
    storeStats(stats: MemoryGraphStats): Promise<boolean>;
    /**
     * Retrieve graph statistics
     *
     * @returns Graph stats or null
     */
    getStats(): Promise<MemoryGraphStats | null>;
    /**
     * Store metadata
     *
     * @param metadata - Metadata to store
     * @returns Whether the operation succeeded
     */
    storeMetadata(metadata: MemoryMetadata): Promise<boolean>;
    /**
     * Retrieve metadata
     *
     * @returns Metadata or null
     */
    getMetadata(): Promise<MemoryMetadata | null>;
    /**
     * Store a custom key-value pair
     *
     * @param key - Storage key
     * @param value - Value to store
     * @param ttl - Optional TTL in seconds
     * @returns Whether the operation succeeded
     */
    store(key: string, value: unknown, ttl?: number): Promise<boolean>;
    /**
     * Retrieve a custom key
     *
     * @param key - Storage key
     * @returns Value or null
     */
    retrieve<T = unknown>(key: string): Promise<T | null>;
    /**
     * Delete a custom key
     *
     * @param key - Storage key
     * @returns Whether the operation succeeded
     */
    delete(key: string): Promise<boolean>;
    /**
     * Search for keys by pattern
     *
     * @param pattern - Search pattern
     * @param limit - Maximum results
     * @returns Array of matching keys
     */
    search(pattern: string, limit?: number): Promise<string[]>;
    /**
     * List all keys in the namespace
     *
     * @returns Array of keys
     */
    listKeys(): Promise<string[]>;
    /**
     * Check if CLI is available
     *
     * @returns Whether CLI is available
     */
    isCliAvailable(): Promise<boolean>;
    /**
     * Get the configured namespace
     */
    getNamespace(): string;
    /**
     * Get the underlying adapter (for advanced usage)
     */
    getAdapter(): McpClientAdapter;
    /**
     * Clear all fallback storage
     */
    clearFallback(): void;
}
/**
 * Create a configured Claude-Flow memory client
 */
export declare function createClaudeFlowMemoryClient(config?: ClaudeFlowMemoryClientConfig): ClaudeFlowMemoryClient;
//# sourceMappingURL=claude-flow-memory-client.d.ts.map