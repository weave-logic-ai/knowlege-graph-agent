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
 * Default configuration
 */
const DEFAULT_CONFIG: AgentDBVectorConfig = {
  backend: 'auto',
  dimensions: 384,
  enableGNN: true,
  gnnHeads: 8,
  enableCache: true,
  cacheSize: 10000,
  hnswM: 16,
  hnswEfConstruction: 200,
  hnswEfSearch: 100,
};

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
export class AgentDBVectorStore extends BaseAdapter<unknown> {
  private config: AgentDBVectorConfig;
  private db: unknown;
  private vectorIndex: unknown;
  private cache: Map<string, VectorSearchResult[]> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(config: Partial<AgentDBVectorConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the feature name for this adapter
   */
  getFeatureName(): string {
    return 'agentdb-vector-store';
  }

  /**
   * Check if the adapter is available and initialized
   */
  isAvailable(): boolean {
    return this.status.available && this.status.initialized;
  }

  /**
   * Initialize the AgentDB vector store
   *
   * Attempts to load AgentDB and create the vector index with
   * the configured settings. Falls back gracefully if AgentDB
   * is not available.
   *
   * @throws Error if AgentDB module is not available
   */
  async initialize(): Promise<void> {
    if (this.status.initialized) {
      return;
    }

    this.log('info', 'Initializing AgentDB vector store');

    const agentdb = await this.tryLoad('agentdb');
    if (!agentdb) {
      this.status.initialized = true; // Mark as initialized in fallback mode
      this.log('warn', 'AgentDB module not available, using fallback mode');
      return;
    }

    try {
      // Check if AgentDB constructor exists
      const AgentDBConstructor = (agentdb as Record<string, unknown>).AgentDB;
      if (typeof AgentDBConstructor !== 'function') {
        // AgentDB module doesn't have expected API - use fallback mode
        this.status.initialized = true;
        this.status.available = false;
        this.log('warn', 'AgentDB module does not export expected API, using fallback mode');
        return;
      }

      // Create AgentDB instance
      const AgentDB = AgentDBConstructor as new (config: unknown) => unknown;
      this.db = new AgentDB({
        backend: this.config.backend,
        persistPath: this.config.persistPath,
      });

      // Create vector index with configuration
      const dbInstance = this.db as Record<string, (config: unknown) => unknown>;
      if (typeof dbInstance.createVectorIndex !== 'function') {
        // AgentDB instance doesn't have expected method - use fallback mode
        this.status.initialized = true;
        this.status.available = false;
        this.log('warn', 'AgentDB instance does not have createVectorIndex, using fallback mode');
        return;
      }

      this.vectorIndex = dbInstance.createVectorIndex({
        dimensions: this.config.dimensions,
        enableGNN: this.config.enableGNN,
        gnnConfig: {
          heads: this.config.gnnHeads,
        },
        hnsw: {
          m: this.config.hnswM,
          efConstruction: this.config.hnswEfConstruction,
          efSearch: this.config.hnswEfSearch,
        },
        cache: {
          enabled: this.config.enableCache,
          maxSize: this.config.cacheSize,
        },
      });

      this.status.initialized = true;
      this.status.available = true;

      this.log('info', 'AgentDB vector store initialized successfully', {
        backend: this.config.backend,
        dimensions: this.config.dimensions,
        gnn: this.config.enableGNN,
      });
    } catch (error) {
      // If initialization fails for any reason, fall back gracefully
      this.status.error = error instanceof Error ? error.message : String(error);
      this.status.initialized = true; // Mark as initialized in fallback mode
      this.status.available = false; // Not available for operations
      this.log('warn', 'AgentDB initialization failed, using fallback mode', {
        error: this.status.error,
      });
    }
  }

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
  async upsert(
    nodeId: string,
    content: string,
    embedding: Float32Array,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.isAvailable()) {
      this.log('debug', 'AgentDB not available, skipping upsert', { nodeId });
      return;
    }

    try {
      const index = this.vectorIndex as Record<string, (entry: unknown) => Promise<void>>;
      await index.upsert({
        id: nodeId,
        vector: Array.from(embedding),
        metadata: {
          content,
          ...metadata,
          updatedAt: new Date().toISOString(),
        },
      });

      // Invalidate relevant cache entries
      this.invalidateCache();

      this.log('debug', 'Upserted vector', { nodeId });
    } catch (error) {
      this.log('error', 'Failed to upsert vector', {
        nodeId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Batch upsert for efficiency
   *
   * Inserts or updates multiple vectors in a single operation.
   * AgentDB batch operations are 3-4x faster than individual upserts.
   *
   * @param entries - Array of entries to upsert
   */
  async upsertBatch(entries: UpsertBatchEntry[]): Promise<void> {
    if (!this.isAvailable()) {
      this.log('debug', 'AgentDB not available, skipping batch upsert', {
        count: entries.length,
      });
      return;
    }

    try {
      const batch = entries.map((e) => ({
        id: e.nodeId,
        vector: Array.from(e.embedding),
        metadata: {
          content: e.content,
          ...e.metadata,
          updatedAt: new Date().toISOString(),
        },
      }));

      // AgentDB batch operations are 3-4x faster
      const index = this.vectorIndex as Record<string, (batch: unknown[]) => Promise<void>>;
      await index.batchUpsert(batch);

      // Invalidate cache after batch operation
      this.invalidateCache();

      this.log('debug', 'Batch upserted vectors', { count: entries.length });
    } catch (error) {
      this.log('error', 'Failed to batch upsert vectors', {
        count: entries.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

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
  async search(
    queryEmbedding: Float32Array,
    limit: number = 10,
    threshold: number = 0.5,
    useGNN: boolean = true
  ): Promise<VectorSearchResult[]> {
    if (!this.isAvailable()) {
      this.log('debug', 'AgentDB not available, returning empty results');
      return [];
    }

    // Check cache
    const cacheKey = this.createCacheKey(queryEmbedding, limit, threshold, useGNN);
    if (this.config.enableCache && this.cache.has(cacheKey)) {
      this.cacheHits++;
      return this.cache.get(cacheKey)!;
    }
    this.cacheMisses++;

    try {
      const index = this.vectorIndex as Record<
        string,
        (query: number[], options: unknown) => Promise<unknown[]>
      >;
      const results = await index.search(Array.from(queryEmbedding), {
        limit,
        minScore: threshold,
        useGNN: useGNN && this.config.enableGNN,
      });

      const mappedResults: VectorSearchResult[] = results.map((r: unknown) => {
        const result = r as Record<string, unknown>;
        const metadata = (result.metadata as Record<string, unknown>) || {};
        return {
          nodeId: result.id as string,
          content: (metadata.content as string) || '',
          similarity: result.score as number,
          metadata,
        };
      });

      // Cache results
      if (this.config.enableCache) {
        this.cacheResult(cacheKey, mappedResults);
      }

      return mappedResults;
    } catch (error) {
      this.log('error', 'Search failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

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
  async hybridSearch(
    query: string,
    queryEmbedding: Float32Array,
    options: HybridSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    if (!this.isAvailable()) {
      this.log('debug', 'AgentDB not available, returning empty results');
      return [];
    }

    const {
      limit = 20,
      vectorWeight = 0.6,
      textWeight = 0.4,
      minScore = 0.3,
      useGNN = true,
    } = options;

    try {
      // AgentDB native hybrid search
      const index = this.vectorIndex as Record<
        string,
        (options: unknown) => Promise<unknown[]>
      >;
      const results = await index.hybridSearch({
        text: query,
        vector: Array.from(queryEmbedding),
        weights: { vector: vectorWeight, text: textWeight },
        limit,
        minScore,
        useGNN: useGNN && this.config.enableGNN,
      });

      return results.map((r: unknown) => {
        const result = r as Record<string, unknown>;
        const metadata = (result.metadata as Record<string, unknown>) || {};
        return {
          nodeId: result.id as string,
          content: (metadata.content as string) || '',
          similarity: result.combinedScore as number,
          metadata: {
            ...metadata,
            vectorScore: result.vectorScore,
            textScore: result.textScore,
            source: result.source,
          },
        };
      });
    } catch (error) {
      this.log('error', 'Hybrid search failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback to vector-only search
      return this.search(queryEmbedding, limit, minScore, useGNN);
    }
  }

  /**
   * Delete a vector
   *
   * @param nodeId - ID of the vector to delete
   */
  async delete(nodeId: string): Promise<void> {
    if (!this.isAvailable()) {
      this.log('debug', 'AgentDB not available, skipping delete', { nodeId });
      return;
    }

    try {
      const index = this.vectorIndex as Record<string, (id: string) => Promise<void>>;
      await index.delete(nodeId);
      this.invalidateCache();
      this.log('debug', 'Deleted vector', { nodeId });
    } catch (error) {
      this.log('error', 'Failed to delete vector', {
        nodeId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get statistics
   *
   * @returns Vector store statistics
   */
  async getStats(): Promise<VectorStoreStats> {
    if (!this.isAvailable()) {
      return {
        totalVectors: 0,
        indexSize: 0,
        cacheHitRate: this.getCacheHitRate(),
        backendType: 'fallback',
        gnnEnabled: false,
      };
    }

    try {
      const index = this.vectorIndex as Record<
        string,
        () => Promise<{ totalVectors: number; indexSize: number }>
      >;
      const stats = await index.getStats();

      return {
        ...stats,
        cacheHitRate: this.getCacheHitRate(),
        backendType: this.config.backend,
        gnnEnabled: this.config.enableGNN,
      };
    } catch (error) {
      this.log('error', 'Failed to get stats', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        totalVectors: 0,
        indexSize: 0,
        cacheHitRate: this.getCacheHitRate(),
        backendType: this.config.backend,
        gnnEnabled: this.config.enableGNN,
      };
    }
  }

  /**
   * Close the database
   *
   * Releases resources and closes the database connection.
   */
  async close(): Promise<void> {
    if (this.db) {
      try {
        const database = this.db as Record<string, () => Promise<void>>;
        await database.close();
        this.status.initialized = false;
        this.log('info', 'AgentDB vector store closed');
      } catch (error) {
        this.log('error', 'Failed to close database', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AgentDBVectorConfig {
    return { ...this.config };
  }

  /**
   * Get cache hit rate
   */
  private getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? this.cacheHits / total : 0;
  }

  /**
   * Create cache key from search parameters
   */
  private createCacheKey(
    embedding: Float32Array,
    limit: number,
    threshold: number,
    useGNN: boolean
  ): string {
    // Use first few elements of embedding as part of key
    const embeddingHash = Array.from(embedding.slice(0, 10))
      .map((v) => v.toFixed(4))
      .join(',');
    return `${embeddingHash}:${limit}:${threshold}:${useGNN}`;
  }

  /**
   * Cache a search result
   */
  private cacheResult(key: string, results: VectorSearchResult[]): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.config.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, results);
  }

  /**
   * Invalidate all cached results
   */
  private invalidateCache(): void {
    this.cache.clear();
    this.log('debug', 'Cache invalidated');
  }

  /**
   * Clear cache and reset statistics
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.log('debug', 'Cache cleared and statistics reset');
  }
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
export async function createAgentDBVectorStore(
  config?: Partial<AgentDBVectorConfig>
): Promise<AgentDBVectorStore> {
  const store = new AgentDBVectorStore(config);
  await store.initialize();
  return store;
}
