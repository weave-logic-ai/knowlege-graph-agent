/**
 * Vector Types
 *
 * Type definitions for vector storage, search, and indexing operations.
 * Designed for integration with HNSW-based approximate nearest neighbor search
 * and hybrid search combining vectors with graph queries.
 *
 * @module vector/types
 */
/**
 * Distance metric for vector similarity calculations
 */
export type DistanceMetric = 'cosine' | 'euclidean' | 'dotProduct' | 'manhattan';
/**
 * Index type for vector storage
 */
export type IndexType = 'hnsw' | 'flat' | 'ivf' | 'pq';
/**
 * Source of search result for hybrid search
 */
export type SearchSource = 'vector' | 'graph' | 'merged';
/**
 * Vector entry in the database
 *
 * Represents a single vector with its associated metadata.
 */
export interface VectorEntry {
    /**
     * Unique identifier for the vector entry
     */
    id: string;
    /**
     * The embedding vector (array of floating point numbers)
     */
    vector: number[];
    /**
     * Arbitrary metadata associated with this vector
     * Can include source document info, labels, timestamps, etc.
     */
    metadata: Record<string, unknown>;
    /**
     * When this entry was created
     */
    createdAt: Date;
    /**
     * When this entry was last updated (if modified)
     */
    updatedAt?: Date;
    /**
     * Optional source document reference
     */
    sourceId?: string;
    /**
     * Optional namespace for multi-tenant support
     */
    namespace?: string;
}
/**
 * Search result with similarity score
 *
 * Returned from vector similarity searches.
 */
export interface SearchResult {
    /**
     * ID of the matched vector entry
     */
    id: string;
    /**
     * Similarity score (interpretation depends on distance metric)
     * For cosine similarity: 0-1 where 1 is most similar
     * For euclidean distance: 0-infinity where 0 is most similar
     */
    score: number;
    /**
     * Metadata from the matched entry
     */
    metadata: Record<string, unknown>;
    /**
     * The actual vector (only included if requested)
     */
    vector?: number[];
    /**
     * Optional distance value (raw distance before conversion to score)
     */
    distance?: number;
}
/**
 * Hybrid search combining vector and graph queries
 *
 * Allows combining semantic similarity search with
 * graph pattern matching for more precise results.
 */
export interface HybridSearchQuery {
    /**
     * Query embedding vector for semantic similarity
     */
    embedding: number[];
    /**
     * Optional Cypher query for graph-based filtering
     * Results must match both vector similarity and graph pattern
     *
     * @example
     * ```cypher
     * MATCH (n:Document)-[:REFERENCES]->(ref:Document)
     * WHERE ref.topic = 'AI'
     * RETURN n.id
     * ```
     */
    cypher?: string;
    /**
     * Metadata filters to apply
     * Supports exact match, ranges, and arrays
     *
     * @example
     * ```typescript
     * {
     *   type: 'article',
     *   year: { $gte: 2020 },
     *   tags: { $in: ['AI', 'ML'] }
     * }
     * ```
     */
    filters?: Record<string, unknown>;
    /**
     * Maximum number of results to return
     * @default 10
     */
    limit?: number;
    /**
     * Include the actual vectors in results
     * Set to false to reduce response size
     * @default false
     */
    includeVectors?: boolean;
    /**
     * Minimum similarity threshold (0-1 for cosine)
     * Results below this threshold are filtered out
     */
    minScore?: number;
    /**
     * Optional parameters for the Cypher query
     */
    cypherParams?: Record<string, unknown>;
    /**
     * Weight for vector vs graph results (0-1, where 1 is pure vector)
     */
    vectorWeight?: number;
    /**
     * Namespace filter
     */
    namespace?: string;
}
/**
 * Hybrid search result combining vector similarity and graph data
 *
 * Extends SearchResult with additional graph-specific information.
 */
export interface HybridSearchResult extends SearchResult {
    /**
     * Graph relationship data if Cypher query was provided
     * Contains matched nodes, relationships, and properties
     */
    graphData?: Record<string, unknown>;
    /**
     * Source of the result indicating how it was matched
     * - vector: Matched only by vector similarity
     * - graph: Matched only by graph pattern
     * - merged: Matched by both and results were merged
     */
    source: SearchSource;
    /**
     * Combined score from vector and graph (if merged)
     */
    combinedScore?: number;
    /**
     * Node connections from graph traversal
     */
    connections?: Array<{
        nodeId: string;
        relationship: string;
        direction: 'in' | 'out';
    }>;
}
/**
 * Single entry for batch insert operation
 */
export interface BatchInsertEntry {
    /**
     * Unique identifier for the vector
     */
    id: string;
    /**
     * The embedding vector
     */
    vector: number[];
    /**
     * Optional metadata for this entry
     */
    metadata?: Record<string, unknown>;
}
/**
 * Batch insert operation configuration
 *
 * Used for efficiently inserting multiple vectors at once.
 */
export interface BatchInsertOperation {
    /**
     * Array of entries to insert
     */
    entries: BatchInsertEntry[];
    /**
     * Skip duplicate IDs instead of throwing an error
     * @default false
     */
    skipDuplicates?: boolean;
    /**
     * Namespace for all entries
     */
    namespace?: string;
    /**
     * Callback for progress updates
     */
    onProgress?: (inserted: number, total: number) => void;
}
/**
 * Result of a batch insert operation
 */
export interface BatchInsertResult {
    /**
     * Number of entries successfully inserted
     */
    inserted: number;
    /**
     * Number of entries skipped (due to duplicates)
     */
    skipped: number;
    /**
     * Detailed errors for failed insertions
     */
    errors: Array<{
        id: string;
        error: string;
    }>;
    /**
     * Total processing time in milliseconds
     */
    durationMs?: number;
}
/**
 * Vector index statistics
 *
 * Provides information about the current state of the vector index.
 */
export interface VectorIndexStats {
    /**
     * Total number of vectors in the index
     */
    totalVectors: number;
    /**
     * Dimensionality of vectors in the index
     */
    dimensions: number;
    /**
     * Type of index (hnsw, flat, ivf)
     */
    indexType: IndexType;
    /**
     * Approximate memory usage in bytes
     */
    memoryUsage: number;
    /**
     * When the index was last modified
     */
    lastUpdated: Date;
    /**
     * Index-specific statistics
     */
    indexStats?: {
        /** Number of levels in HNSW */
        levels?: number;
        /** Entry point node ID */
        entryPoint?: string;
        /** Average connections per node */
        avgConnections?: number;
    };
    /**
     * Namespace breakdown if multi-tenant
     */
    namespaces?: Record<string, number>;
}
/**
 * Trajectory step for agent operation tracking
 *
 * Records a single action taken by an agent during workflow execution.
 * Used for learning and optimization.
 */
export interface TrajectoryStep {
    /**
     * The action that was performed
     * @example 'search', 'create_node', 'traverse_relationship'
     */
    action: string;
    /**
     * State snapshot at this step
     * Contains relevant context for the action
     */
    state: Record<string, unknown>;
    /**
     * Outcome of the action
     */
    outcome: 'success' | 'failure' | 'pending';
    /**
     * Duration of the action in milliseconds
     */
    duration: number;
    /**
     * When this step occurred
     */
    timestamp: Date;
    /**
     * Additional metadata about the step
     */
    metadata?: Record<string, unknown>;
}
/**
 * Agent trajectory for learning
 *
 * Complete record of an agent's actions during a workflow.
 * Used by SONA for pattern learning and optimization.
 */
export interface AgentTrajectory {
    /**
     * Unique trajectory identifier
     */
    id: string;
    /**
     * ID of the agent that executed this trajectory
     */
    agentId: string;
    /**
     * ID of the workflow this trajectory belongs to
     */
    workflowId?: string;
    /**
     * Ordered list of steps in this trajectory
     */
    steps: TrajectoryStep[];
    /**
     * When the trajectory started
     */
    startedAt: Date;
    /**
     * When the trajectory completed (if finished)
     */
    completedAt?: Date;
    /**
     * Whether the overall trajectory was successful
     */
    success: boolean;
    /**
     * Total duration in milliseconds
     */
    totalDuration: number;
    /**
     * Additional trajectory metadata
     */
    metadata?: Record<string, unknown>;
}
/**
 * SONA (Self-Optimizing Neural Architecture) learning record
 *
 * Captures learned patterns from agent trajectories for
 * future optimization and behavior improvement.
 */
export interface SonaLearningRecord {
    /**
     * ID of the trajectory this was learned from
     */
    trajectoryId: string;
    /**
     * Unique identifier for the learned pattern
     */
    patternId: string;
    /**
     * Type of pattern that was learned
     * - success: Pattern that leads to successful outcomes
     * - failure: Pattern that leads to failures (to avoid)
     * - optimization: Pattern that improves performance
     */
    patternType: 'success' | 'failure' | 'optimization';
    /**
     * Confidence score for this pattern (0-1)
     * Higher values indicate more reliable patterns
     */
    confidence: number;
    /**
     * When this pattern was learned
     */
    learnedAt: Date;
    /**
     * Number of times this pattern has been applied
     */
    appliedCount: number;
}
/**
 * Graph node for knowledge graph integration
 *
 * Represents an entity in the knowledge graph with optional embedding.
 */
export interface GraphNode {
    /**
     * Unique node identifier
     */
    id: string;
    /**
     * Node type/label
     * @example 'Document', 'Person', 'Concept'
     */
    type: string;
    /**
     * Node properties
     */
    properties: Record<string, unknown>;
    /**
     * Optional embedding vector for semantic search
     */
    embedding?: number[];
}
/**
 * Graph edge for relationships
 *
 * Represents a directed relationship between two nodes.
 */
export interface GraphEdge {
    /**
     * Unique edge identifier
     */
    id: string;
    /**
     * ID of the source node
     */
    sourceId: string;
    /**
     * ID of the target node
     */
    targetId: string;
    /**
     * Relationship type
     * @example 'REFERENCES', 'AUTHORED_BY', 'BELONGS_TO'
     */
    type: string;
    /**
     * Optional relationship properties
     */
    properties?: Record<string, unknown>;
}
/**
 * Cypher query result
 *
 * Result from executing a Cypher query against the graph database.
 */
export interface CypherQueryResult {
    /**
     * Query result records
     * Each record is a map of variable names to values
     */
    records: Array<Record<string, unknown>>;
    /**
     * Summary of write operations performed
     */
    summary: {
        /**
         * Number of nodes created
         */
        nodesCreated: number;
        /**
         * Number of nodes deleted
         */
        nodesDeleted: number;
        /**
         * Number of relationships created
         */
        relationshipsCreated: number;
        /**
         * Number of relationships deleted
         */
        relationshipsDeleted: number;
        /**
         * Number of properties set
         */
        propertiesSet: number;
    };
}
/**
 * Vector update operation
 */
export interface VectorUpdateOperation {
    /**
     * ID of the vector to update
     */
    id: string;
    /**
     * New vector values (optional, keep existing if not provided)
     */
    vector?: number[];
    /**
     * Metadata updates (merged with existing)
     */
    metadata?: Record<string, unknown>;
    /**
     * Replace all metadata instead of merging
     * @default false
     */
    replaceMetadata?: boolean;
}
/**
 * Vector delete operation
 */
export interface VectorDeleteOperation {
    /**
     * IDs of vectors to delete
     */
    ids: string[];
}
/**
 * Vector delete result
 */
export interface VectorDeleteResult {
    /**
     * Number of vectors successfully deleted
     */
    deleted: number;
    /**
     * IDs that were not found
     */
    notFound: string[];
}
/**
 * Namespace for organizing vectors
 */
export interface VectorNamespace {
    /**
     * Namespace name
     */
    name: string;
    /**
     * Number of vectors in this namespace
     */
    vectorCount: number;
    /**
     * When the namespace was created
     */
    createdAt: Date;
    /**
     * Optional description
     */
    description?: string;
}
/**
 * Options for vector search operations
 */
export interface VectorSearchOptions {
    /** Number of results to return */
    k: number;
    /** Metadata filters */
    filter?: Record<string, unknown>;
    /** Minimum similarity score */
    minScore?: number;
    /** Include vector data in results */
    includeVectors?: boolean;
    /** Namespace filter */
    namespace?: string;
    /** HNSW ef parameter for search quality/speed tradeoff */
    efSearch?: number;
}
/**
 * Configuration for vector index building
 */
export interface VectorIndexConfig {
    /** Number of vector dimensions */
    dimensions: number;
    /** Index type to use */
    indexType: IndexType;
    /** Distance metric for similarity */
    distanceMetric: DistanceMetric;
    /** HNSW-specific configuration */
    hnswConfig?: {
        /** Maximum number of connections per node */
        m: number;
        /** Size of dynamic candidate list during construction */
        efConstruction: number;
        /** Size of dynamic candidate list during search */
        efSearch: number;
    };
    /** IVF-specific configuration */
    ivfConfig?: {
        /** Number of clusters */
        nlist: number;
        /** Number of clusters to search */
        nprobe: number;
    };
    /** Product quantization configuration */
    pqConfig?: {
        /** Number of subquantizers */
        m: number;
        /** Number of bits per subquantizer */
        nbits: number;
    };
}
/**
 * Vector store event types for monitoring
 */
export type VectorStoreEvent = {
    type: 'insert';
    id: string;
    timestamp: Date;
} | {
    type: 'delete';
    id: string;
    timestamp: Date;
} | {
    type: 'search';
    queryId: string;
    resultCount: number;
    durationMs: number;
    timestamp: Date;
} | {
    type: 'rebuild';
    reason: string;
    timestamp: Date;
} | {
    type: 'error';
    error: Error;
    operation: string;
    timestamp: Date;
};
/**
 * Listener for vector store events
 */
export type VectorStoreEventListener = (event: VectorStoreEvent) => void;
/**
 * Interface for vector store implementations
 */
export interface IVectorStore {
    /** Initialize the store */
    initialize(): Promise<void>;
    /** Insert a single vector */
    insert(entry: {
        id: string;
        vector: number[];
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    /** Batch insert multiple vectors */
    batchInsert(operation: BatchInsertOperation): Promise<BatchInsertResult>;
    /** Search for similar vectors */
    search(query: {
        vector: number[];
        k?: number;
        filter?: Record<string, unknown>;
        minScore?: number;
    }): Promise<SearchResult[]>;
    /** Hybrid search combining vectors and graph */
    hybridSearch(query: HybridSearchQuery): Promise<HybridSearchResult[]>;
    /** Get a vector by ID */
    get(id: string): Promise<VectorEntry | null>;
    /** Delete a vector by ID */
    delete(id: string): Promise<boolean>;
    /** Get index statistics */
    getStats(): VectorIndexStats;
    /** Clear all vectors */
    clear(): Promise<void>;
    /** Add event listener */
    on?(event: string, listener: VectorStoreEventListener): void;
    /** Remove event listener */
    off?(event: string, listener: VectorStoreEventListener): void;
}
//# sourceMappingURL=types.d.ts.map