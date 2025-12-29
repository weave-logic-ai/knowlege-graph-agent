/**
 * AgentDB Vector Store Adapter
 *
 * Provides a high-performance vector store implementation using AgentDB
 * with 150x performance improvement over SQLite-based storage.
 *
 * Features:
 * - Auto-detection of optimal backend (RuVector, HNSWLib, SQLite)
 * - GNN-enhanced similarity search
 * - Hybrid search combining vector and text
 * - Batch operations with 3-4x speedup
 * - HNSW indexing for approximate nearest neighbor search
 *
 * @module integrations/agentic-flow/adapters/agentdb-vector-store
 */
import { BaseAdapter } from './base-adapter.js';
/**
 * Vector search result interface
 */
export interface VectorSearchResult {
    /** Node identifier */
    nodeId: string;
    /** Content associated with the vector */
    content: string;
    /** Similarity score (0-1, higher is more similar) */
    similarity: number;
    /** Additional metadata */
    metadata: Record<string, unknown>;
}
/**
 * AgentDB vector store configuration
 */
export interface AgentDBVectorConfig {
    /** Backend selection strategy */
    backend: 'auto' | 'ruvector' | 'hnswlib' | 'sqlite' | 'sqljs';
    /** Vector embedding dimensions */
    dimensions: number;
    /** Enable Graph Neural Network enhancement */
    enableGNN: boolean;
    /** Number of GNN attention heads */
    gnnHeads: number;
    /** Path for persistent storage (optional) */
    persistPath?: string;
    /** Enable result caching */
    enableCache: boolean;
    /** Maximum cache size */
    cacheSize: number;
    /** HNSW M parameter (max connections per node) */
    hnswM?: number;
    /** HNSW efConstruction parameter */
    hnswEfConstruction?: number;
    /** HNSW efSearch parameter */
    hnswEfSearch?: number;
}
/**
 * Upsert batch entry
 */
export interface UpsertBatchEntry {
    nodeId: string;
    content: string;
    embedding: Float32Array;
    metadata?: Record<string, unknown>;
}
/**
 * Hybrid search options
 */
export interface HybridSearchOptions {
    limit?: number;
    vectorWeight?: number;
    textWeight?: number;
    minScore?: number;
    useGNN?: boolean;
}
/**
 * Vector store statistics
 */
export interface VectorStoreStats {
    totalVectors: number;
    indexSize: number;
    cacheHitRate: number;
    backendType: string;
    gnnEnabled: boolean;
}
/**
 * AgentDB Vector Store adapter
 *
 * Provides a drop-in replacement for the existing VectorStore with
 * significant performance improvements through AgentDB's optimized
 * vector indexing and search capabilities.
 *
 * @example
 * ```typescript
 * const store = new AgentDBVectorStore({
 *   dimensions: 384,
 *   enableGNN: true,
 *   persistPath: './data/vectors.db',
 * });
 *
 * await store.initialize();
 *
 * // Insert vectors
 * await store.upsert('node-1', 'Document content', embedding, { type: 'document' });
 *
 * // Search
 * const results = await store.search(queryEmbedding, 10, 0.5);
 *
 * // Hybrid search
 * const hybridResults = await store.hybridSearch('query text', queryEmbedding, {
 *   limit: 20,
 *   vectorWeight: 0.6,
 *   textWeight: 0.4,
 * });
 * ```
 */
export declare class AgentDBVectorStore extends BaseAdapter<unknown> {
    private config;
    private db;
    private vectorIndex;
    private cache;
    private cacheHits;
    private cacheMisses;
    constructor(config?: Partial<AgentDBVectorConfig>);
    /**
     * Get the feature name for this adapter
     */
    getFeatureName(): string;
    /**
     * Check if the adapter is available and initialized
     */
    isAvailable(): boolean;
    /**
     * Initialize the AgentDB vector store
     *
     * Attempts to load AgentDB and create the vector index with
     * the configured settings. Falls back gracefully if AgentDB
     * is not available.
     *
     * @throws Error if AgentDB module is not available
     */
    initialize(): Promise<void>;
    /**
     * Upsert a vector embedding
     *
     * Inserts or updates a vector in the index. If a vector with the
     * same nodeId exists, it will be updated.
     *
     * @param nodeId - Unique identifier for the node
     * @param content - Text content associated with the vector
     * @param embedding - Vector embedding (Float32Array)
     * @param metadata - Optional metadata to store with the vector
     */
    upsert(nodeId: string, content: string, embedding: Float32Array, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Batch upsert for efficiency
     *
     * Inserts or updates multiple vectors in a single operation.
     * AgentDB batch operations are 3-4x faster than individual upserts.
     *
     * @param entries - Array of entries to upsert
     */
    upsertBatch(entries: UpsertBatchEntry[]): Promise<void>;
    /**
     * Vector similarity search with optional GNN enhancement
     *
     * Performs approximate nearest neighbor search using HNSW indexing.
     * When GNN is enabled, results are enhanced with graph-based
     * relationship scoring.
     *
     * @param queryEmbedding - Query vector embedding
     * @param limit - Maximum number of results to return
     * @param threshold - Minimum similarity threshold (0-1)
     * @param useGNN - Whether to use GNN enhancement (default: true)
     * @returns Array of search results sorted by similarity
     */
    search(queryEmbedding: Float32Array, limit?: number, threshold?: number, useGNN?: boolean): Promise<VectorSearchResult[]>;
    /**
     * Hybrid search combining vector and text
     *
     * Performs a combined search using both vector similarity and
     * text matching, with configurable weights for each component.
     *
     * @param query - Text query for text-based search
     * @param queryEmbedding - Vector embedding for similarity search
     * @param options - Search options including weights and limits
     * @returns Array of hybrid search results with combined scores
     */
    hybridSearch(query: string, queryEmbedding: Float32Array, options?: HybridSearchOptions): Promise<VectorSearchResult[]>;
    /**
     * Delete a vector
     *
     * @param nodeId - ID of the vector to delete
     */
    delete(nodeId: string): Promise<void>;
    /**
     * Get statistics
     *
     * @returns Vector store statistics
     */
    getStats(): Promise<VectorStoreStats>;
    /**
     * Close the database
     *
     * Releases resources and closes the database connection.
     */
    close(): Promise<void>;
    /**
     * Get current configuration
     */
    getConfig(): AgentDBVectorConfig;
    /**
     * Get cache hit rate
     */
    private getCacheHitRate;
    /**
     * Create cache key from search parameters
     */
    private createCacheKey;
    /**
     * Cache a search result
     */
    private cacheResult;
    /**
     * Invalidate all cached results
     */
    private invalidateCache;
    /**
     * Clear cache and reset statistics
     */
    clearCache(): void;
}
/**
 * Factory function to create an AgentDB vector store
 *
 * @param config - Optional configuration overrides
 * @returns Initialized AgentDBVectorStore instance
 *
 * @example
 * ```typescript
 * const store = await createAgentDBVectorStore({
 *   dimensions: 384,
 *   persistPath: './vectors.db',
 * });
 *
 * await store.upsert('doc-1', 'Content', embedding);
 * const results = await store.search(queryEmbedding);
 * ```
 */
export declare function createAgentDBVectorStore(config?: Partial<AgentDBVectorConfig>): Promise<AgentDBVectorStore>;
//# sourceMappingURL=agentdb-vector-store.d.ts.map