/**
 * AgentDB Adapter
 *
 * Bridges knowledge-graph-agent vector operations with AgentDB's
 * GNN-enhanced vector database for 150x faster semantic search.
 *
 * @module integrations/agentic-flow/adapters/agentdb-adapter
 */

import { BaseAdapter, AdapterStatus } from './base-adapter.js';
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
export const defaultAgentDBConfig: AgentDBConfig = {
  backend: 'auto',
  dimensions: 384,
  enableGNN: true,
  hnswParams: {
    m: 16,
    efConstruction: 200,
    efSearch: 50,
  },
};

/**
 * AgentDB vector store interface (from agentic-flow)
 *
 * This interface represents the expected AgentDB API.
 * The actual implementation comes from the agentic-flow package.
 */
interface AgentDBVectors {
  upsert(entry: { id: string; vector: Float32Array | number[]; metadata?: Record<string, unknown> }): Promise<void>;
  search(query: Float32Array | number[], options: { limit: number; useGNN?: boolean; filter?: Record<string, unknown> }): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>>;
  delete(id: string): Promise<void>;
  get(id: string): Promise<{ id: string; vector: number[]; metadata?: Record<string, unknown> } | null>;
  batchUpsert(entries: Array<{ id: string; vector: Float32Array | number[]; metadata?: Record<string, unknown> }>): Promise<{ inserted: number; errors: Array<{ id: string; error: string }> }>;
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
export class AgentDBAdapter extends BaseAdapter<AgentDBInstance> implements IVectorStore {
  private config: AgentDBConfig;
  private stats: VectorIndexStats;

  constructor(config: Partial<AgentDBConfig> = {}) {
    super();
    this.config = { ...defaultAgentDBConfig, ...config };
    this.stats = {
      totalVectors: 0,
      dimensions: this.config.dimensions,
      indexType: 'hnsw',
      memoryUsage: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get the feature name for feature flag lookup
   */
  getFeatureName(): string {
    return 'agentdb';
  }

  /**
   * Check if AgentDB module is available
   */
  isAvailable(): boolean {
    return this.canResolve('agentdb') || this.canResolve('agentic-flow');
  }

  /**
   * Initialize the AgentDB adapter
   */
  async initialize(): Promise<void> {
    try {
      // Try to load AgentDB from agentic-flow
      const module = await this.tryLoad<{ AgentDB: new (config: AgentDBConfig) => AgentDBInstance }>('agentdb');

      if (!module) {
        // Try alternative import path
        const agenticFlow = await this.tryLoad<{ AgentDB: new (config: AgentDBConfig) => AgentDBInstance }>('agentic-flow');
        if (!agenticFlow?.AgentDB) {
          throw new Error('AgentDB not available from agentdb or agentic-flow packages');
        }
        this.instance = new agenticFlow.AgentDB(this.config);
      } else if (module.AgentDB) {
        this.instance = new module.AgentDB(this.config);
      } else {
        throw new Error('AgentDB class not found in module');
      }

      await this.instance!.initialize();
      this.markInitialized();
    } catch (error) {
      this.markFailed(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Insert a single vector entry
   */
  async insert(entry: { id: string; vector: number[]; metadata?: Record<string, unknown> }): Promise<void> {
    this.ensureInitialized();
    await this.instance!.vectors.upsert({
      id: entry.id,
      vector: entry.vector,
      metadata: entry.metadata,
    });
    this.stats.totalVectors++;
    this.stats.lastUpdated = new Date();
  }

  /**
   * Upsert a vector (insert or update)
   */
  async upsert(nodeId: string, content: string, embedding: Float32Array): Promise<void> {
    this.ensureInitialized();
    await this.instance!.vectors.upsert({
      id: nodeId,
      vector: embedding,
      metadata: { content },
    });
    this.stats.lastUpdated = new Date();
  }

  /**
   * Batch insert multiple vectors
   */
  async batchInsert(operation: BatchInsertOperation): Promise<BatchInsertResult> {
    this.ensureInitialized();

    const entries = operation.entries.map(entry => ({
      id: entry.id,
      vector: entry.vector,
      metadata: {
        ...entry.metadata,
        namespace: operation.namespace,
      },
    }));

    const result = await this.instance!.vectors.batchUpsert(entries);

    this.stats.totalVectors += result.inserted;
    this.stats.lastUpdated = new Date();

    return {
      inserted: result.inserted,
      skipped: operation.skipDuplicates ? operation.entries.length - result.inserted - result.errors.length : 0,
      errors: result.errors,
    };
  }

  /**
   * Search for similar vectors
   */
  async search(query: { vector: number[]; k?: number; filter?: Record<string, unknown>; minScore?: number }): Promise<SearchResult[]> {
    this.ensureInitialized();

    const results = await this.instance!.vectors.search(query.vector, {
      limit: query.k ?? 10,
      useGNN: this.config.enableGNN,
      filter: query.filter,
    });

    // Filter by minimum score if specified
    let filtered = results;
    if (query.minScore !== undefined) {
      filtered = results.filter(r => r.score >= query.minScore!);
    }

    return filtered.map(r => ({
      id: r.id,
      score: r.score,
      metadata: r.metadata ?? {},
    }));
  }

  /**
   * Hybrid search combining vectors and graph
   */
  async hybridSearch(query: HybridSearchQuery): Promise<HybridSearchResult[]> {
    // For now, delegate to vector search
    // Full hybrid search with graph integration would be implemented
    // when the graph component is available
    const vectorResults = await this.search({
      vector: query.embedding,
      k: query.limit,
      filter: query.filters,
      minScore: query.minScore,
    });

    return vectorResults.map(r => ({
      ...r,
      source: 'vector' as const,
    }));
  }

  /**
   * Get a vector by ID
   */
  async get(id: string): Promise<VectorEntry | null> {
    this.ensureInitialized();

    const result = await this.instance!.vectors.get(id);
    if (!result) return null;

    return {
      id: result.id,
      vector: result.vector,
      metadata: result.metadata ?? {},
      createdAt: new Date(),
    };
  }

  /**
   * Delete a vector by ID
   */
  async delete(id: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      await this.instance!.vectors.delete(id);
      this.stats.totalVectors = Math.max(0, this.stats.totalVectors - 1);
      this.stats.lastUpdated = new Date();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get index statistics
   */
  getStats(): VectorIndexStats {
    if (this.instance) {
      this.stats.totalVectors = this.instance.vectors.count();
    }
    return { ...this.stats };
  }

  /**
   * Clear all vectors
   */
  async clear(): Promise<void> {
    this.ensureInitialized();
    await this.instance!.vectors.clear();
    this.stats.totalVectors = 0;
    this.stats.lastUpdated = new Date();
  }

  /**
   * Dispose and close the database
   */
  async dispose(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
    }
    await super.dispose();
  }

  /**
   * Get the current configuration
   */
  getConfig(): AgentDBConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (requires reinitialization)
   */
  updateConfig(config: Partial<AgentDBConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Create a new AgentDB adapter instance
 *
 * @param config - Adapter configuration
 * @returns Configured adapter
 */
export function createAgentDBAdapter(config?: Partial<AgentDBConfig>): AgentDBAdapter {
  return new AgentDBAdapter(config);
}
