/**
 * AgentDB Adapter
 *
 * Bridges knowledge-graph-agent vector operations with AgentDB's
 * GNN-enhanced vector database for 150x faster semantic search.
 *
 * @module integrations/agentic-flow/adapters/agentdb-adapter
 */
import { BaseAdapter } from './base-adapter.js';
import type { IVectorStore, SearchResult, BatchInsertOperation, BatchInsertResult, VectorEntry, VectorIndexStats, HybridSearchQuery, HybridSearchResult } from '../../../vector/types.js';
/**
 * Configuration for AgentDB adapter
 */
export interface AgentDBConfig {
    /**
     * Backend selection strategy
     * - auto: Automatically select best available backend
     * - ruvector: Use RuVector (Rust-based, highest performance)
     * - hnswlib: Use hnswlib-node (good performance, wider compatibility)
     * - sqlite: Use SQLite-based storage (fallback, lower performance)
     */
    backend: 'auto' | 'ruvector' | 'hnswlib' | 'sqlite';
    /**
     * Vector dimensions (must match embedding model output)
     */
    dimensions: number;
    /**
     * Enable GNN (Graph Neural Network) enhanced search
     * Leverages graph structure for better semantic understanding
     */
    enableGNN: boolean;
    /**
     * Path to database file (for persistent storage)
     */
    dbPath?: string;
    /**
     * HNSW index parameters
     */
    hnswParams?: {
        /** Maximum connections per node (default: 16) */
        m: number;
        /** Size of candidate list during construction (default: 200) */
        efConstruction: number;
        /** Size of candidate list during search (default: 50) */
        efSearch: number;
    };
    /**
     * Enable quantization for memory efficiency
     */
    quantization?: {
        enabled: boolean;
        /** Bits per dimension (4, 8, or 16) */
        bits: 4 | 8 | 16;
    };
}
/**
 * Default AgentDB configuration
 */
export declare const defaultAgentDBConfig: AgentDBConfig;
/**
 * AgentDB vector store interface (from agentic-flow)
 *
 * This interface represents the expected AgentDB API.
 * The actual implementation comes from the agentic-flow package.
 */
interface AgentDBVectors {
    upsert(entry: {
        id: string;
        vector: Float32Array | number[];
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    search(query: Float32Array | number[], options: {
        limit: number;
        useGNN?: boolean;
        filter?: Record<string, unknown>;
    }): Promise<Array<{
        id: string;
        score: number;
        metadata?: Record<string, unknown>;
    }>>;
    delete(id: string): Promise<void>;
    get(id: string): Promise<{
        id: string;
        vector: number[];
        metadata?: Record<string, unknown>;
    } | null>;
    batchUpsert(entries: Array<{
        id: string;
        vector: Float32Array | number[];
        metadata?: Record<string, unknown>;
    }>): Promise<{
        inserted: number;
        errors: Array<{
            id: string;
            error: string;
        }>;
    }>;
    count(): number;
    clear(): Promise<void>;
}
/**
 * AgentDB instance interface
 */
interface AgentDBInstance {
    vectors: AgentDBVectors;
    initialize(): Promise<void>;
    close(): Promise<void>;
}
/**
 * AgentDB Adapter
 *
 * Provides a bridge between knowledge-graph-agent's vector operations
 * and AgentDB's high-performance vector database with GNN enhancements.
 */
export declare class AgentDBAdapter extends BaseAdapter<AgentDBInstance> implements IVectorStore {
    private config;
    private stats;
    constructor(config?: Partial<AgentDBConfig>);
    /**
     * Get the feature name for feature flag lookup
     */
    getFeatureName(): string;
    /**
     * Check if AgentDB module is available
     */
    isAvailable(): boolean;
    /**
     * Initialize the AgentDB adapter
     */
    initialize(): Promise<void>;
    /**
     * Insert a single vector entry
     */
    insert(entry: {
        id: string;
        vector: number[];
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    /**
     * Upsert a vector (insert or update)
     */
    upsert(nodeId: string, content: string, embedding: Float32Array): Promise<void>;
    /**
     * Batch insert multiple vectors
     */
    batchInsert(operation: BatchInsertOperation): Promise<BatchInsertResult>;
    /**
     * Search for similar vectors
     */
    search(query: {
        vector: number[];
        k?: number;
        filter?: Record<string, unknown>;
        minScore?: number;
    }): Promise<SearchResult[]>;
    /**
     * Hybrid search combining vectors and graph
     */
    hybridSearch(query: HybridSearchQuery): Promise<HybridSearchResult[]>;
    /**
     * Get a vector by ID
     */
    get(id: string): Promise<VectorEntry | null>;
    /**
     * Delete a vector by ID
     */
    delete(id: string): Promise<boolean>;
    /**
     * Get index statistics
     */
    getStats(): VectorIndexStats;
    /**
     * Clear all vectors
     */
    clear(): Promise<void>;
    /**
     * Dispose and close the database
     */
    dispose(): Promise<void>;
    /**
     * Get the current configuration
     */
    getConfig(): AgentDBConfig;
    /**
     * Update configuration (requires reinitialization)
     */
    updateConfig(config: Partial<AgentDBConfig>): void;
}
/**
 * Create a new AgentDB adapter instance
 *
 * @param config - Adapter configuration
 * @returns Configured adapter
 */
export declare function createAgentDBAdapter(config?: Partial<AgentDBConfig>): AgentDBAdapter;
export {};
//# sourceMappingURL=agentdb-adapter.d.ts.map