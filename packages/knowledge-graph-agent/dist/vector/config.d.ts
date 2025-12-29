/**
 * Vector Configuration
 *
 * Configuration types and defaults for RuVector-compatible vector storage.
 * Supports multiple backends (memory, postgres, standalone) with HNSW indexing.
 *
 * @module vector/config
 */
import type { VectorIndexConfig } from './types.js';
/**
 * Backend storage type for vectors
 */
export type VectorBackend = 'memory' | 'postgres' | 'standalone' | 'sqlite' | 'cloud';
/**
 * HNSW (Hierarchical Navigable Small World) index configuration
 *
 * HNSW provides fast approximate nearest neighbor search with
 * configurable accuracy/speed tradeoffs.
 */
export interface HNSWConfig {
    /**
     * Maximum number of connections per layer
     * Higher values improve recall but increase memory usage
     * @default 16
     */
    m: number;
    /**
     * Size of dynamic candidate list for construction
     * Higher values improve index quality but slow down construction
     * @default 200
     */
    efConstruction: number;
    /**
     * Size of dynamic candidate list for search
     * Higher values improve recall but slow down search
     * @default 100
     */
    efSearch: number;
}
/**
 * Re-export VectorIndexConfig from types for convenience
 */
export type { VectorIndexConfig } from './types.js';
/**
 * PostgreSQL backend configuration
 */
export interface PostgresBackendConfig {
    /**
     * PostgreSQL connection string
     * @example 'postgres://user:pass@localhost:5432/dbname'
     */
    connectionString: string;
    /**
     * Database schema for vector tables
     * @default 'ruvector'
     */
    schema: string;
}
/**
 * Cloud backend configuration
 */
export interface CloudBackendConfig {
    /**
     * Cloud vector database endpoint URL
     */
    url: string;
    /**
     * API key for authentication
     */
    apiKey?: string;
}
/**
 * Standalone backend configuration
 */
export interface StandaloneBackendConfig {
    /**
     * Directory for vector data storage
     * @default '.ruvector'
     */
    dataDir: string;
}
/**
 * RuVector configuration
 *
 * Main configuration interface for the vector database system.
 */
export interface RuVectorConfig {
    /**
     * Storage backend type
     */
    backend: VectorBackend;
    /**
     * Vector index configuration
     */
    index: VectorIndexConfig;
    /**
     * PostgreSQL connection configuration
     * Required when backend is 'postgres'
     */
    postgres?: PostgresBackendConfig;
    /**
     * Cloud endpoint configuration
     * Required when backend is 'cloud'
     */
    cloud?: CloudBackendConfig;
    /**
     * Standalone file path configuration
     * Required when backend is 'standalone'
     */
    standalone?: StandaloneBackendConfig;
    /**
     * Enable self-learning SONA (Self-Optimizing Neural Architecture) engine
     * When enabled, the system learns from agent trajectories to improve performance
     * @default false
     */
    enableSona?: boolean;
    /**
     * Enable trajectory tracking for agents
     * Records agent actions for analysis and learning
     * @default false
     */
    enableTrajectoryTracking?: boolean;
    /**
     * Cache configuration
     */
    cache?: {
        /** Enable result caching */
        enabled: boolean;
        /** Maximum cache size in entries */
        maxSize: number;
        /** Cache TTL in seconds */
        ttlSeconds: number;
    };
    /**
     * Performance tuning
     */
    performance?: {
        /** Batch size for bulk operations */
        batchSize: number;
        /** Enable parallel processing */
        parallelProcessing: boolean;
        /** Maximum concurrent operations */
        maxConcurrency: number;
        /** Memory limit in MB for index */
        memoryLimitMb?: number;
    };
    /**
     * Hybrid search configuration
     */
    hybrid?: {
        /** Enable hybrid search */
        enabled: boolean;
        /** Default vector weight (0-1) */
        defaultVectorWeight: number;
        /** Graph database connection (for Cypher queries) */
        graphConnection?: {
            type: 'neo4j' | 'memgraph' | 'sqlite';
            uri?: string;
            database?: string;
            auth?: {
                user: string;
                password: string;
            };
        };
    };
    /**
     * Namespace configuration for multi-tenant support
     */
    namespace?: {
        /** Default namespace */
        defaultNamespace: string;
        /** Namespace isolation level */
        isolation: 'soft' | 'hard';
    };
}
/**
 * Default HNSW configuration
 * Balanced settings for most use cases
 */
export declare const DEFAULT_HNSW_CONFIG: HNSWConfig;
/**
 * Default vector index configuration
 * Optimized for OpenAI/Claude embeddings (1536 dimensions)
 */
export declare const DEFAULT_INDEX_CONFIG: VectorIndexConfig;
/**
 * Default cache configuration
 */
export declare const DEFAULT_CACHE_CONFIG: {
    readonly enabled: true;
    readonly maxSize: 1000;
    readonly ttlSeconds: 300;
};
/**
 * Default performance configuration
 */
export declare const DEFAULT_PERFORMANCE_CONFIG: {
    readonly batchSize: 100;
    readonly parallelProcessing: true;
    readonly maxConcurrency: 4;
};
/**
 * Create RuVector configuration from environment variables
 *
 * Reads configuration from the following environment variables:
 * - RUVECTOR_BACKEND: Storage backend type (default: 'memory')
 * - RUVECTOR_DIMENSIONS: Vector dimensions (default: 384)
 * - RUVECTOR_ENABLE_SONA: Enable SONA learning (default: false)
 * - RUVECTOR_ENABLE_TRAJECTORY: Enable trajectory tracking (default: false)
 * - DATABASE_URL: PostgreSQL connection string (for postgres backend)
 * - RUVECTOR_SCHEMA: PostgreSQL schema (default: 'ruvector')
 * - RUVECTOR_CLOUD_URL: Cloud endpoint URL (for cloud backend)
 * - RUVECTOR_API_KEY: Cloud API key (for cloud backend)
 * - RUVECTOR_DATA_DIR: Data directory (for standalone backend)
 *
 * @returns RuVectorConfig configured from environment
 *
 * @example
 * ```typescript
 * // Set environment variables
 * process.env.RUVECTOR_BACKEND = 'postgres';
 * process.env.DATABASE_URL = 'postgres://localhost:5432/mydb';
 *
 * // Create configuration
 * const config = createRuVectorConfig();
 * ```
 */
export declare function createRuVectorConfig(): RuVectorConfig;
/**
 * Validation result for RuVector configuration
 */
export interface ConfigValidationResult {
    /**
     * Whether the configuration is valid
     */
    valid: boolean;
    /**
     * List of validation errors (empty if valid)
     */
    errors: string[];
    /**
     * List of validation warnings
     */
    warnings: string[];
}
/**
 * Legacy alias for backwards compatibility
 */
export type ValidationResult = ConfigValidationResult;
/**
 * Validate RuVector configuration
 *
 * Checks that all required fields are present and valid based on
 * the selected backend type.
 *
 * @param config - Configuration to validate
 * @returns Validation result with errors if invalid
 *
 * @example
 * ```typescript
 * const config = createRuVectorConfig();
 * const result = validateRuVectorConfig(config);
 *
 * if (!result.valid) {
 *   console.error('Configuration errors:', result.errors);
 *   process.exit(1);
 * }
 * ```
 */
export declare function validateRuVectorConfig(config: RuVectorConfig): ConfigValidationResult;
/**
 * Default configuration instance
 * Created from environment variables at module load time
 */
export declare const defaultConfig: RuVectorConfig;
/**
 * Create configuration for high-performance scenarios
 *
 * Optimized for large-scale deployments with many vectors
 */
export declare function createHighPerformanceConfig(dimensions?: number): RuVectorConfig;
/**
 * Create configuration for memory-constrained environments
 *
 * Optimized for minimal memory usage
 */
export declare function createLowMemoryConfig(dimensions?: number): RuVectorConfig;
/**
 * Create configuration for hybrid search with graph integration
 */
export declare function createHybridSearchConfig(dimensions?: number, graphType?: 'neo4j' | 'memgraph' | 'sqlite'): RuVectorConfig;
/**
 * Get recommended configuration based on vector count
 *
 * @param estimatedVectorCount - Estimated number of vectors to store
 * @param dimensions - Vector dimensions
 * @returns Recommended configuration
 */
export declare function getRecommendedConfig(estimatedVectorCount: number, dimensions?: number): RuVectorConfig;
//# sourceMappingURL=config.d.ts.map