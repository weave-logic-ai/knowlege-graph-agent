/**
 * Enhanced Vector Store
 *
 * Provides vector storage with HNSW indexing and hybrid search
 * combining vector similarity with graph queries.
 *
 * Designed to integrate with RuVector patterns while working
 * with the existing SQLite database as a fallback.
 *
 * @module vector/services/vector-store
 */
import type { VectorEntry, SearchResult, HybridSearchQuery, HybridSearchResult, BatchInsertOperation, BatchInsertResult, VectorIndexStats, IVectorStore, VectorStoreEventListener } from '../types.js';
import type { RuVectorConfig } from '../config.js';
/**
 * Enhanced Vector Store class
 *
 * Provides:
 * - HNSW-based approximate nearest neighbor search
 * - Hybrid search combining vectors and graph queries
 * - Batch operations for efficient bulk inserts
 * - Integration with existing knowledge graph
 *
 * @example
 * ```typescript
 * const store = createVectorStore({
 *   index: { dimensions: 1536, distanceMetric: 'cosine' }
 * });
 * await store.initialize();
 *
 * await store.insert({
 *   id: 'doc-1',
 *   vector: embeddings,
 *   metadata: { title: 'Document 1' }
 * });
 *
 * const results = await store.search({
 *   vector: queryEmbedding,
 *   k: 10
 * });
 * ```
 */
export declare class EnhancedVectorStore implements IVectorStore {
    /** Store configuration */
    private config;
    /** In-memory node storage */
    private nodes;
    /** Entry point node ID for HNSW search */
    private entryPoint;
    /** Maximum level in the current index */
    private maxLevel;
    /** Level generation multiplier (1/ln(M)) */
    private levelMultiplier;
    /** Initialization state */
    private isInitialized;
    /** Event listeners */
    private eventListeners;
    /**
     * Create a new EnhancedVectorStore
     *
     * @param config - Optional configuration overrides
     */
    constructor(config?: Partial<RuVectorConfig>);
    /**
     * Initialize the vector store
     *
     * Sets up the storage backend and prepares the index for operations.
     * Must be called before any other operations.
     *
     * @throws Error if initialization fails
     */
    initialize(): Promise<void>;
    /**
     * Calculate distance between two vectors
     *
     * @param a - First vector
     * @param b - Second vector
     * @returns Distance value (lower = more similar for most metrics)
     * @throws Error if vectors have different dimensions
     */
    private calculateDistance;
    /**
     * Calculate cosine distance (1 - cosine similarity)
     *
     * @param a - First vector
     * @param b - Second vector
     * @returns Cosine distance (0 = identical, 2 = opposite)
     */
    private cosineDistance;
    /**
     * Calculate Euclidean (L2) distance
     *
     * @param a - First vector
     * @param b - Second vector
     * @returns Euclidean distance
     */
    private euclideanDistance;
    /**
     * Calculate negative dot product distance
     *
     * Higher dot product means more similar, so we negate for distance.
     *
     * @param a - First vector
     * @param b - Second vector
     * @returns Negative dot product
     */
    private dotProductDistance;
    /**
     * Calculate Manhattan (L1) distance
     *
     * @param a - First vector
     * @param b - Second vector
     * @returns Manhattan distance
     */
    private manhattanDistance;
    /**
     * Generate random level for new node (HNSW algorithm)
     *
     * Uses exponential distribution to generate levels.
     * Most nodes will be at level 0, with exponentially fewer at higher levels.
     *
     * @returns Generated level (0 or higher)
     */
    private generateLevel;
    /**
     * Insert a vector into the index
     *
     * Implements the HNSW insertion algorithm:
     * 1. Generate random level for the new node
     * 2. If first node, make it the entry point
     * 3. Otherwise, traverse from entry point to find insertion position
     * 4. Connect to nearest neighbors at each level
     *
     * @param entry - Vector entry to insert
     * @throws Error if not initialized or dimensions mismatch
     */
    insert(entry: {
        id: string;
        vector: number[];
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    /**
     * Greedy search to find nearest neighbor at a level
     *
     * Traverses the graph at the specified level, always moving
     * toward the nearest neighbor until no improvement is found.
     *
     * @param query - Query vector
     * @param startId - Starting node ID
     * @param level - Level to search at
     * @returns ID of nearest node found
     */
    private greedySearch;
    /**
     * Search a layer for nearest neighbors
     *
     * Implements beam search at a specific level using a priority queue.
     *
     * @param query - Query vector
     * @param startId - Starting node ID
     * @param ef - Size of dynamic candidate list
     * @param level - Level to search at
     * @returns Array of nearest neighbors with distances
     */
    private searchLayer;
    /**
     * Prune neighbors to keep only the best M
     *
     * Uses a simple distance-based pruning strategy.
     *
     * @param nodeVector - Vector of the node being pruned
     * @param neighborIds - Current neighbor IDs
     * @param m - Maximum neighbors to keep
     * @returns Pruned list of neighbor IDs
     */
    private pruneNeighbors;
    /**
     * Search for similar vectors
     *
     * Implements HNSW search algorithm:
     * 1. Start from entry point at top level
     * 2. Greedy search down to level 1
     * 3. Beam search at level 0 with efSearch candidates
     * 4. Return top-k results
     *
     * @param query - Search query with vector and options
     * @returns Array of search results sorted by similarity
     */
    search(query: {
        vector: number[];
        k?: number;
        filter?: Record<string, unknown>;
        minScore?: number;
    }): Promise<SearchResult[]>;
    /**
     * Convert distance to similarity score
     *
     * @param distance - Distance value
     * @returns Similarity score between 0 and 1
     */
    private distanceToScore;
    /**
     * Hybrid search combining vectors and graph queries
     *
     * Performs vector similarity search and optionally enriches
     * results with data from graph queries (Cypher).
     *
     * @param query - Hybrid search query
     * @returns Array of hybrid search results
     */
    hybridSearch(query: HybridSearchQuery): Promise<HybridSearchResult[]>;
    /**
     * Batch insert vectors
     *
     * Efficiently inserts multiple vectors in a single operation.
     * Supports progress callbacks and duplicate handling.
     *
     * @param operation - Batch insert operation configuration
     * @returns Result with counts of inserted, skipped, and errors
     */
    batchInsert(operation: BatchInsertOperation): Promise<BatchInsertResult>;
    /**
     * Get a vector by ID
     *
     * @param id - Vector ID to retrieve
     * @returns Vector entry or null if not found
     */
    get(id: string): Promise<VectorEntry | null>;
    /**
     * Delete a vector by ID
     *
     * Removes the vector from the index and updates neighbor connections.
     *
     * @param id - Vector ID to delete
     * @returns True if deleted, false if not found
     */
    delete(id: string): Promise<boolean>;
    /**
     * Get index statistics
     *
     * @returns Current statistics about the vector index
     */
    getStats(): VectorIndexStats;
    /**
     * Estimate memory usage in bytes
     *
     * Provides rough estimate of memory consumption.
     *
     * @returns Estimated memory usage in bytes
     */
    private estimateMemoryUsage;
    /**
     * Calculate average number of connections per node
     *
     * @returns Average connection count
     */
    private calculateAverageConnections;
    /**
     * Clear all vectors
     *
     * Removes all vectors from the index and resets state.
     */
    clear(): Promise<void>;
    /**
     * Get configuration
     *
     * @returns Copy of current configuration
     */
    getConfig(): RuVectorConfig;
    /**
     * Check if store is initialized
     *
     * @returns True if initialized
     */
    isReady(): boolean;
    /**
     * Get total vector count
     *
     * @returns Number of vectors in the store
     */
    size(): number;
    /**
     * Check if a vector exists
     *
     * @param id - Vector ID to check
     * @returns True if exists
     */
    has(id: string): boolean;
    /**
     * Get all vector IDs
     *
     * @returns Array of all vector IDs
     */
    getAllIds(): string[];
    /**
     * Add event listener
     *
     * @param event - Event type to listen for
     * @param listener - Callback function
     */
    on(event: string, listener: VectorStoreEventListener): void;
    /**
     * Remove event listener
     *
     * @param event - Event type
     * @param listener - Callback function to remove
     */
    off(event: string, listener: VectorStoreEventListener): void;
    /**
     * Emit an event to all registered listeners
     *
     * @param event - Event to emit
     */
    private emitEvent;
}
/**
 * Create an enhanced vector store instance
 *
 * Factory function for creating vector stores with optional configuration.
 *
 * @param config - Optional configuration overrides
 * @returns New EnhancedVectorStore instance
 *
 * @example
 * ```typescript
 * // Default configuration
 * const store = createVectorStore();
 *
 * // Custom configuration
 * const customStore = createVectorStore({
 *   index: {
 *     dimensions: 768,
 *     distanceMetric: 'euclidean',
 *   },
 *   cache: { enabled: true, maxSize: 5000 },
 * });
 * ```
 */
export declare function createVectorStore(config?: Partial<RuVectorConfig>): EnhancedVectorStore;
//# sourceMappingURL=vector-store.d.ts.map