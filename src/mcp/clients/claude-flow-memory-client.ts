/**
 * Claude-Flow Memory Client
 *
 * High-level memory client that wraps McpClientAdapter with
 * knowledge-graph-specific functionality and type safety.
 *
 * @module mcp/clients/claude-flow-memory-client
 */

import { createLogger } from '../../utils/index.js';
import { McpClientAdapter, createMcpClientAdapter, type McpClientConfig } from './mcp-client-adapter.js';

const logger = createLogger('claude-flow-memory-client');

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
  errors: Array<{ key: string; error: string }>;
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
export class ClaudeFlowMemoryClient {
  private adapter: McpClientAdapter;
  private namespace: string;
  private nodeKeyPrefix: string;
  private indexKeyPrefix: string;

  constructor(config: ClaudeFlowMemoryClientConfig = {}) {
    this.adapter = createMcpClientAdapter({
      maxRetries: config.maxRetries,
      retryDelayMs: config.retryDelayMs,
      timeoutMs: config.timeoutMs,
      fallbackEnabled: config.fallbackEnabled,
      cliCommand: config.cliCommand,
    });
    this.namespace = config.namespace ?? 'knowledge-graph';
    this.nodeKeyPrefix = config.nodeKeyPrefix ?? 'node/';
    this.indexKeyPrefix = config.indexKeyPrefix ?? 'index/';
  }

  /**
   * Store a knowledge node in memory
   *
   * @param node - The node to store
   * @param ttl - Optional TTL in seconds
   * @returns Whether the operation succeeded
   */
  async storeNode(node: MemoryNodeEntry, ttl?: number): Promise<boolean> {
    const key = `${this.nodeKeyPrefix}${node.id}`;
    const success = await this.adapter.memoryStore(key, node, this.namespace, ttl);

    if (success) {
      logger.debug('Stored node in memory', { nodeId: node.id });
    } else {
      logger.error('Failed to store node in memory', undefined, { nodeId: node.id });
    }

    return success;
  }

  /**
   * Retrieve a knowledge node from memory
   *
   * @param nodeId - The node ID
   * @returns The node or null if not found
   */
  async getNode(nodeId: string): Promise<MemoryNodeEntry | null> {
    const key = `${this.nodeKeyPrefix}${nodeId}`;
    const value = await this.adapter.memoryRetrieve(key, this.namespace);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as MemoryNodeEntry;
    } catch {
      logger.warn('Failed to parse node from memory', { nodeId, value: value.substring(0, 100) });
      return null;
    }
  }

  /**
   * Delete a knowledge node from memory
   *
   * @param nodeId - The node ID to delete
   * @returns Whether the operation succeeded
   */
  async deleteNode(nodeId: string): Promise<boolean> {
    const key = `${this.nodeKeyPrefix}${nodeId}`;
    return this.adapter.memoryDelete(key, this.namespace);
  }

  /**
   * Store multiple nodes in batch
   *
   * @param nodes - Array of nodes to store
   * @param ttl - Optional TTL in seconds
   * @returns Batch operation result
   */
  async storeNodesBatch(nodes: MemoryNodeEntry[], ttl?: number): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      total: nodes.length,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    // Process in batches to avoid overwhelming the CLI
    const batchSize = 10;
    for (let i = 0; i < nodes.length; i += batchSize) {
      const batch = nodes.slice(i, i + batchSize);
      const promises = batch.map(async (node) => {
        const success = await this.storeNode(node, ttl);
        if (success) {
          result.succeeded++;
        } else {
          result.failed++;
          result.errors.push({ key: node.id, error: 'Failed to store' });
        }
      });
      await Promise.all(promises);
    }

    return result;
  }

  /**
   * Search for nodes by pattern
   *
   * @param pattern - Search pattern (e.g., 'node/*', 'node/abc*')
   * @param limit - Maximum results
   * @returns Array of matching node keys
   */
  async searchNodes(pattern: string, limit: number = 100): Promise<string[]> {
    const fullPattern = pattern.startsWith(this.nodeKeyPrefix)
      ? pattern
      : `${this.nodeKeyPrefix}${pattern}`;

    return this.adapter.memorySearch(fullPattern, this.namespace, limit);
  }

  /**
   * Store the node index
   *
   * @param entries - Index entries
   * @returns Whether the operation succeeded
   */
  async storeNodeIndex(entries: MemoryIndexEntry[]): Promise<boolean> {
    const key = `${this.indexKeyPrefix}nodes`;
    return this.adapter.memoryStore(key, entries, this.namespace);
  }

  /**
   * Retrieve the node index
   *
   * @returns Array of index entries or null
   */
  async getNodeIndex(): Promise<MemoryIndexEntry[] | null> {
    const key = `${this.indexKeyPrefix}nodes`;
    const value = await this.adapter.memoryRetrieve(key, this.namespace);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as MemoryIndexEntry[];
    } catch {
      logger.warn('Failed to parse node index from memory');
      return null;
    }
  }

  /**
   * Store the tag index
   *
   * @param tagIndex - Map of tags to node IDs
   * @returns Whether the operation succeeded
   */
  async storeTagIndex(tagIndex: Record<string, string[]>): Promise<boolean> {
    const key = `${this.indexKeyPrefix}tags`;
    return this.adapter.memoryStore(key, tagIndex, this.namespace);
  }

  /**
   * Retrieve the tag index
   *
   * @returns Tag index or null
   */
  async getTagIndex(): Promise<Record<string, string[]> | null> {
    const key = `${this.indexKeyPrefix}tags`;
    const value = await this.adapter.memoryRetrieve(key, this.namespace);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as Record<string, string[]>;
    } catch {
      logger.warn('Failed to parse tag index from memory');
      return null;
    }
  }

  /**
   * Store graph statistics
   *
   * @param stats - Graph stats
   * @returns Whether the operation succeeded
   */
  async storeStats(stats: MemoryGraphStats): Promise<boolean> {
    return this.adapter.memoryStore('stats', stats, this.namespace);
  }

  /**
   * Retrieve graph statistics
   *
   * @returns Graph stats or null
   */
  async getStats(): Promise<MemoryGraphStats | null> {
    const value = await this.adapter.memoryRetrieve('stats', this.namespace);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as MemoryGraphStats;
    } catch {
      logger.warn('Failed to parse stats from memory');
      return null;
    }
  }

  /**
   * Store metadata
   *
   * @param metadata - Metadata to store
   * @returns Whether the operation succeeded
   */
  async storeMetadata(metadata: MemoryMetadata): Promise<boolean> {
    return this.adapter.memoryStore('metadata', metadata, this.namespace);
  }

  /**
   * Retrieve metadata
   *
   * @returns Metadata or null
   */
  async getMetadata(): Promise<MemoryMetadata | null> {
    const value = await this.adapter.memoryRetrieve('metadata', this.namespace);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as MemoryMetadata;
    } catch {
      logger.warn('Failed to parse metadata from memory');
      return null;
    }
  }

  /**
   * Store a custom key-value pair
   *
   * @param key - Storage key
   * @param value - Value to store
   * @param ttl - Optional TTL in seconds
   * @returns Whether the operation succeeded
   */
  async store(key: string, value: unknown, ttl?: number): Promise<boolean> {
    return this.adapter.memoryStore(key, value as object, this.namespace, ttl);
  }

  /**
   * Retrieve a custom key
   *
   * @param key - Storage key
   * @returns Value or null
   */
  async retrieve<T = unknown>(key: string): Promise<T | null> {
    const value = await this.adapter.memoryRetrieve(key, this.namespace);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /**
   * Delete a custom key
   *
   * @param key - Storage key
   * @returns Whether the operation succeeded
   */
  async delete(key: string): Promise<boolean> {
    return this.adapter.memoryDelete(key, this.namespace);
  }

  /**
   * Search for keys by pattern
   *
   * @param pattern - Search pattern
   * @param limit - Maximum results
   * @returns Array of matching keys
   */
  async search(pattern: string, limit: number = 100): Promise<string[]> {
    return this.adapter.memorySearch(pattern, this.namespace, limit);
  }

  /**
   * List all keys in the namespace
   *
   * @returns Array of keys
   */
  async listKeys(): Promise<string[]> {
    return this.adapter.memoryList(this.namespace);
  }

  /**
   * Check if CLI is available
   *
   * @returns Whether CLI is available
   */
  async isCliAvailable(): Promise<boolean> {
    return this.adapter.isCliAvailable();
  }

  /**
   * Get the configured namespace
   */
  getNamespace(): string {
    return this.namespace;
  }

  /**
   * Get the underlying adapter (for advanced usage)
   */
  getAdapter(): McpClientAdapter {
    return this.adapter;
  }

  /**
   * Clear all fallback storage
   */
  clearFallback(): void {
    this.adapter.clearFallback(this.namespace);
  }
}

/**
 * Create a configured Claude-Flow memory client
 */
export function createClaudeFlowMemoryClient(
  config?: ClaudeFlowMemoryClientConfig
): ClaudeFlowMemoryClient {
  return new ClaudeFlowMemoryClient(config);
}
