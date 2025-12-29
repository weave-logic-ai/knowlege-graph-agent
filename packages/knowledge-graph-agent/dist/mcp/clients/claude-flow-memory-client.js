import { createLogger } from "../../utils/logger.js";
import { createMcpClientAdapter } from "./mcp-client-adapter.js";
const logger = createLogger("claude-flow-memory-client");
class ClaudeFlowMemoryClient {
  adapter;
  namespace;
  nodeKeyPrefix;
  indexKeyPrefix;
  constructor(config = {}) {
    this.adapter = createMcpClientAdapter({
      maxRetries: config.maxRetries,
      retryDelayMs: config.retryDelayMs,
      timeoutMs: config.timeoutMs,
      fallbackEnabled: config.fallbackEnabled,
      cliCommand: config.cliCommand
    });
    this.namespace = config.namespace ?? "knowledge-graph";
    this.nodeKeyPrefix = config.nodeKeyPrefix ?? "node/";
    this.indexKeyPrefix = config.indexKeyPrefix ?? "index/";
  }
  /**
   * Store a knowledge node in memory
   *
   * @param node - The node to store
   * @param ttl - Optional TTL in seconds
   * @returns Whether the operation succeeded
   */
  async storeNode(node, ttl) {
    const key = `${this.nodeKeyPrefix}${node.id}`;
    const success = await this.adapter.memoryStore(key, node, this.namespace, ttl);
    if (success) {
      logger.debug("Stored node in memory", { nodeId: node.id });
    } else {
      logger.error("Failed to store node in memory", void 0, { nodeId: node.id });
    }
    return success;
  }
  /**
   * Retrieve a knowledge node from memory
   *
   * @param nodeId - The node ID
   * @returns The node or null if not found
   */
  async getNode(nodeId) {
    const key = `${this.nodeKeyPrefix}${nodeId}`;
    const value = await this.adapter.memoryRetrieve(key, this.namespace);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      logger.warn("Failed to parse node from memory", { nodeId, value: value.substring(0, 100) });
      return null;
    }
  }
  /**
   * Delete a knowledge node from memory
   *
   * @param nodeId - The node ID to delete
   * @returns Whether the operation succeeded
   */
  async deleteNode(nodeId) {
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
  async storeNodesBatch(nodes, ttl) {
    const result = {
      total: nodes.length,
      succeeded: 0,
      failed: 0,
      errors: []
    };
    const batchSize = 10;
    for (let i = 0; i < nodes.length; i += batchSize) {
      const batch = nodes.slice(i, i + batchSize);
      const promises = batch.map(async (node) => {
        const success = await this.storeNode(node, ttl);
        if (success) {
          result.succeeded++;
        } else {
          result.failed++;
          result.errors.push({ key: node.id, error: "Failed to store" });
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
  async searchNodes(pattern, limit = 100) {
    const fullPattern = pattern.startsWith(this.nodeKeyPrefix) ? pattern : `${this.nodeKeyPrefix}${pattern}`;
    return this.adapter.memorySearch(fullPattern, this.namespace, limit);
  }
  /**
   * Store the node index
   *
   * @param entries - Index entries
   * @returns Whether the operation succeeded
   */
  async storeNodeIndex(entries) {
    const key = `${this.indexKeyPrefix}nodes`;
    return this.adapter.memoryStore(key, entries, this.namespace);
  }
  /**
   * Retrieve the node index
   *
   * @returns Array of index entries or null
   */
  async getNodeIndex() {
    const key = `${this.indexKeyPrefix}nodes`;
    const value = await this.adapter.memoryRetrieve(key, this.namespace);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      logger.warn("Failed to parse node index from memory");
      return null;
    }
  }
  /**
   * Store the tag index
   *
   * @param tagIndex - Map of tags to node IDs
   * @returns Whether the operation succeeded
   */
  async storeTagIndex(tagIndex) {
    const key = `${this.indexKeyPrefix}tags`;
    return this.adapter.memoryStore(key, tagIndex, this.namespace);
  }
  /**
   * Retrieve the tag index
   *
   * @returns Tag index or null
   */
  async getTagIndex() {
    const key = `${this.indexKeyPrefix}tags`;
    const value = await this.adapter.memoryRetrieve(key, this.namespace);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      logger.warn("Failed to parse tag index from memory");
      return null;
    }
  }
  /**
   * Store graph statistics
   *
   * @param stats - Graph stats
   * @returns Whether the operation succeeded
   */
  async storeStats(stats) {
    return this.adapter.memoryStore("stats", stats, this.namespace);
  }
  /**
   * Retrieve graph statistics
   *
   * @returns Graph stats or null
   */
  async getStats() {
    const value = await this.adapter.memoryRetrieve("stats", this.namespace);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      logger.warn("Failed to parse stats from memory");
      return null;
    }
  }
  /**
   * Store metadata
   *
   * @param metadata - Metadata to store
   * @returns Whether the operation succeeded
   */
  async storeMetadata(metadata) {
    return this.adapter.memoryStore("metadata", metadata, this.namespace);
  }
  /**
   * Retrieve metadata
   *
   * @returns Metadata or null
   */
  async getMetadata() {
    const value = await this.adapter.memoryRetrieve("metadata", this.namespace);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      logger.warn("Failed to parse metadata from memory");
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
  async store(key, value, ttl) {
    return this.adapter.memoryStore(key, value, this.namespace, ttl);
  }
  /**
   * Retrieve a custom key
   *
   * @param key - Storage key
   * @returns Value or null
   */
  async retrieve(key) {
    const value = await this.adapter.memoryRetrieve(key, this.namespace);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  /**
   * Delete a custom key
   *
   * @param key - Storage key
   * @returns Whether the operation succeeded
   */
  async delete(key) {
    return this.adapter.memoryDelete(key, this.namespace);
  }
  /**
   * Search for keys by pattern
   *
   * @param pattern - Search pattern
   * @param limit - Maximum results
   * @returns Array of matching keys
   */
  async search(pattern, limit = 100) {
    return this.adapter.memorySearch(pattern, this.namespace, limit);
  }
  /**
   * List all keys in the namespace
   *
   * @returns Array of keys
   */
  async listKeys() {
    return this.adapter.memoryList(this.namespace);
  }
  /**
   * Check if CLI is available
   *
   * @returns Whether CLI is available
   */
  async isCliAvailable() {
    return this.adapter.isCliAvailable();
  }
  /**
   * Get the configured namespace
   */
  getNamespace() {
    return this.namespace;
  }
  /**
   * Get the underlying adapter (for advanced usage)
   */
  getAdapter() {
    return this.adapter;
  }
  /**
   * Clear all fallback storage
   */
  clearFallback() {
    this.adapter.clearFallback(this.namespace);
  }
}
function createClaudeFlowMemoryClient(config) {
  return new ClaudeFlowMemoryClient(config);
}
export {
  ClaudeFlowMemoryClient,
  createClaudeFlowMemoryClient
};
//# sourceMappingURL=claude-flow-memory-client.js.map
