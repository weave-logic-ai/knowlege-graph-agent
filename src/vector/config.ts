/**
 * Vector Configuration
 *
 * Configuration types and defaults for RuVector-compatible vector storage.
 * Supports multiple backends (memory, postgres, standalone) with HNSW indexing.
 *
 * @module vector/config
 */

import type { DistanceMetric, IndexType, VectorIndexConfig } from './types.js';

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
export const DEFAULT_HNSW_CONFIG: HNSWConfig = {
  m: 16,
  efConstruction: 200,
  efSearch: 100,
};

/**
 * Default vector index configuration
 * Optimized for OpenAI/Claude embeddings (1536 dimensions)
 */
export const DEFAULT_INDEX_CONFIG: VectorIndexConfig = {
  dimensions: 1536,
  distanceMetric: 'cosine',
  indexType: 'hnsw',
  hnswConfig: DEFAULT_HNSW_CONFIG,
};

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG = {
  enabled: true,
  maxSize: 1000,
  ttlSeconds: 300, // 5 minutes
} as const;

/**
 * Default performance configuration
 */
export const DEFAULT_PERFORMANCE_CONFIG = {
  batchSize: 100,
  parallelProcessing: true,
  maxConcurrency: 4,
} as const;

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
export function createRuVectorConfig(): RuVectorConfig {
  const backend = (process.env.RUVECTOR_BACKEND || 'memory') as VectorBackend;
  const dimensions = parseInt(process.env.RUVECTOR_DIMENSIONS || '384', 10);

  const baseConfig: RuVectorConfig = {
    backend,
    index: {
      ...DEFAULT_INDEX_CONFIG,
      dimensions,
    },
    enableSona: process.env.RUVECTOR_ENABLE_SONA === 'true',
    enableTrajectoryTracking: process.env.RUVECTOR_ENABLE_TRAJECTORY === 'true',
  };

  switch (backend) {
    case 'postgres':
      return {
        ...baseConfig,
        postgres: {
          connectionString:
            process.env.DATABASE_URL || 'postgres://localhost:5432/kg_agent',
          schema: process.env.RUVECTOR_SCHEMA || 'ruvector',
        },
      };
    case 'cloud':
      return {
        ...baseConfig,
        cloud: {
          url: process.env.RUVECTOR_CLOUD_URL || '',
          apiKey: process.env.RUVECTOR_API_KEY,
        },
      };
    case 'standalone':
      return {
        ...baseConfig,
        standalone: {
          dataDir: process.env.RUVECTOR_DATA_DIR || '.ruvector',
        },
      };
    default:
      return baseConfig;
  }
}

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
export function validateRuVectorConfig(config: RuVectorConfig): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate dimensions
  if (config.index.dimensions < 1) {
    errors.push('Dimensions must be at least 1');
  }
  if (config.index.dimensions > 4096) {
    warnings.push('Dimensions > 4096 may impact performance');
  }

  if (!Number.isInteger(config.index.dimensions)) {
    errors.push('Vector dimensions must be an integer');
  }

  // Validate backend-specific configuration
  if (config.backend === 'postgres' && !config.postgres?.connectionString) {
    errors.push('PostgreSQL connection string required for postgres backend');
  }

  if (config.backend === 'cloud' && !config.cloud?.url) {
    errors.push('Cloud URL required for cloud backend');
  }

  if (config.backend === 'standalone' && !config.standalone?.dataDir) {
    errors.push('Data directory required for standalone backend');
  }

  // Validate HNSW configuration
  if (config.index.indexType === 'hnsw' && config.index.hnswConfig) {
    const { m, efConstruction, efSearch } = config.index.hnswConfig;

    if (m < 2 || m > 100) {
      errors.push('HNSW m must be between 2 and 100');
    }

    if (efConstruction < m) {
      warnings.push('efConstruction should be >= m for good index quality');
    }

    if (efSearch < 10) {
      warnings.push('efSearch < 10 may result in poor recall');
    }
  }

  // Validate cache config
  if (config.cache?.enabled) {
    if (config.cache.maxSize < 1) {
      errors.push('Cache maxSize must be at least 1');
    }
    if (config.cache.ttlSeconds < 1) {
      errors.push('Cache TTL must be at least 1 second');
    }
  }

  // Validate performance config
  if (config.performance) {
    if (config.performance.batchSize < 1) {
      errors.push('Batch size must be at least 1');
    }
    if (config.performance.maxConcurrency < 1) {
      errors.push('Max concurrency must be at least 1');
    }
    if (config.performance.memoryLimitMb && config.performance.memoryLimitMb < 64) {
      warnings.push('Memory limit < 64MB may cause issues');
    }
  }

  // Validate hybrid config
  if (config.hybrid?.enabled && !config.hybrid.graphConnection) {
    warnings.push('Hybrid search enabled but no graph connection configured');
  }

  // Validate distance metric
  const validMetrics: DistanceMetric[] = ['cosine', 'euclidean', 'dotProduct', 'manhattan'];
  if (!validMetrics.includes(config.index.distanceMetric)) {
    errors.push(`Invalid distance metric: ${config.index.distanceMetric}`);
  }

  // Validate index type
  const validIndexTypes = ['hnsw', 'flat', 'ivf', 'pq'];
  if (!validIndexTypes.includes(config.index.indexType)) {
    errors.push(`Invalid index type: ${config.index.indexType}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Default configuration instance
 * Created from environment variables at module load time
 */
export const defaultConfig = createRuVectorConfig();

/**
 * Create configuration for high-performance scenarios
 *
 * Optimized for large-scale deployments with many vectors
 */
export function createHighPerformanceConfig(
  dimensions: number = 1536
): RuVectorConfig {
  return {
    ...createRuVectorConfig(),
    backend: 'memory',
    index: {
      dimensions,
      indexType: 'hnsw',
      distanceMetric: 'cosine',
      hnswConfig: {
        m: 32, // More connections for better recall
        efConstruction: 400, // Higher quality index
        efSearch: 200, // Better search accuracy
      },
    },
    cache: {
      enabled: true,
      maxSize: 10000,
      ttlSeconds: 600,
    },
    performance: {
      batchSize: 500,
      parallelProcessing: true,
      maxConcurrency: 8,
    },
  };
}

/**
 * Create configuration for memory-constrained environments
 *
 * Optimized for minimal memory usage
 */
export function createLowMemoryConfig(
  dimensions: number = 1536
): RuVectorConfig {
  return {
    ...createRuVectorConfig(),
    backend: 'memory',
    index: {
      dimensions,
      indexType: 'hnsw',
      distanceMetric: 'cosine',
      hnswConfig: {
        m: 8, // Fewer connections
        efConstruction: 100, // Faster construction
        efSearch: 50, // Faster search
      },
    },
    cache: {
      enabled: false,
      maxSize: 100,
      ttlSeconds: 60,
    },
    performance: {
      batchSize: 50,
      parallelProcessing: false,
      maxConcurrency: 2,
      memoryLimitMb: 256,
    },
  };
}

/**
 * Create configuration for hybrid search with graph integration
 */
export function createHybridSearchConfig(
  dimensions: number = 1536,
  graphType: 'neo4j' | 'memgraph' | 'sqlite' = 'sqlite'
): RuVectorConfig {
  return {
    ...createRuVectorConfig(),
    backend: 'memory',
    index: {
      dimensions,
      indexType: 'hnsw',
      distanceMetric: 'cosine',
      hnswConfig: DEFAULT_HNSW_CONFIG,
    },
    hybrid: {
      enabled: true,
      defaultVectorWeight: 0.7,
      graphConnection: {
        type: graphType,
      },
    },
  };
}

/**
 * Get recommended configuration based on vector count
 *
 * @param estimatedVectorCount - Estimated number of vectors to store
 * @param dimensions - Vector dimensions
 * @returns Recommended configuration
 */
export function getRecommendedConfig(
  estimatedVectorCount: number,
  dimensions: number = 1536
): RuVectorConfig {
  if (estimatedVectorCount < 1000) {
    // Small scale - flat index is fine
    return createLowMemoryConfig(dimensions);
  } else if (estimatedVectorCount < 100000) {
    // Medium scale - standard HNSW
    return {
      ...createRuVectorConfig(),
      index: { ...DEFAULT_INDEX_CONFIG, dimensions },
    };
  } else {
    // Large scale - optimized HNSW
    return createHighPerformanceConfig(dimensions);
  }
}
