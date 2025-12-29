import { createRuVectorConfig, validateRuVectorConfig } from "../config.js";
import { createLogger } from "../../utils/logger.js";
const logger = createLogger("vector-store");
class EnhancedVectorStore {
  /** Store configuration */
  config;
  /** In-memory node storage */
  nodes = /* @__PURE__ */ new Map();
  /** Entry point node ID for HNSW search */
  entryPoint = null;
  /** Maximum level in the current index */
  maxLevel = 0;
  /** Level generation multiplier (1/ln(M)) */
  levelMultiplier;
  /** Initialization state */
  isInitialized = false;
  /** Event listeners */
  eventListeners = /* @__PURE__ */ new Map();
  /**
   * Create a new EnhancedVectorStore
   *
   * @param config - Optional configuration overrides
   */
  constructor(config) {
    const baseConfig = createRuVectorConfig();
    this.config = { ...baseConfig, ...config };
    const m = this.config.index.hnswConfig?.m || 16;
    this.levelMultiplier = 1 / Math.log(m);
    const validation = validateRuVectorConfig(this.config);
    if (!validation.valid) {
      logger.warn("Invalid configuration", { errors: validation.errors });
    }
    if (validation.warnings.length > 0) {
      logger.debug("Configuration warnings", { warnings: validation.warnings });
    }
  }
  /**
   * Initialize the vector store
   *
   * Sets up the storage backend and prepares the index for operations.
   * Must be called before any other operations.
   *
   * @throws Error if initialization fails
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }
    logger.info("Initializing vector store", {
      backend: this.config.backend,
      dimensions: this.config.index.dimensions,
      indexType: this.config.index.indexType,
      distanceMetric: this.config.index.distanceMetric
    });
    switch (this.config.backend) {
      case "memory":
        break;
      case "postgres":
        logger.warn("PostgreSQL backend not yet implemented, using memory");
        break;
      case "standalone":
        logger.warn("Standalone backend not yet implemented, using memory");
        break;
      case "sqlite":
        logger.warn("SQLite backend not yet implemented, using memory");
        break;
    }
    this.isInitialized = true;
    logger.info("Vector store initialized");
  }
  /**
   * Calculate distance between two vectors
   *
   * @param a - First vector
   * @param b - Second vector
   * @returns Distance value (lower = more similar for most metrics)
   * @throws Error if vectors have different dimensions
   */
  calculateDistance(a, b) {
    if (a.length !== b.length) {
      throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }
    switch (this.config.index.distanceMetric) {
      case "cosine":
        return this.cosineDistance(a, b);
      case "euclidean":
        return this.euclideanDistance(a, b);
      case "dotProduct":
        return this.dotProductDistance(a, b);
      case "manhattan":
        return this.manhattanDistance(a, b);
      default:
        return this.cosineDistance(a, b);
    }
  }
  /**
   * Calculate cosine distance (1 - cosine similarity)
   *
   * @param a - First vector
   * @param b - Second vector
   * @returns Cosine distance (0 = identical, 2 = opposite)
   */
  cosineDistance(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return 1;
    }
    const similarity = dotProduct / denominator;
    return 1 - similarity;
  }
  /**
   * Calculate Euclidean (L2) distance
   *
   * @param a - First vector
   * @param b - Second vector
   * @returns Euclidean distance
   */
  euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }
  /**
   * Calculate negative dot product distance
   *
   * Higher dot product means more similar, so we negate for distance.
   *
   * @param a - First vector
   * @param b - Second vector
   * @returns Negative dot product
   */
  dotProductDistance(a, b) {
    let dotProduct = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
    }
    return -dotProduct;
  }
  /**
   * Calculate Manhattan (L1) distance
   *
   * @param a - First vector
   * @param b - Second vector
   * @returns Manhattan distance
   */
  manhattanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.abs(a[i] - b[i]);
    }
    return sum;
  }
  /**
   * Generate random level for new node (HNSW algorithm)
   *
   * Uses exponential distribution to generate levels.
   * Most nodes will be at level 0, with exponentially fewer at higher levels.
   *
   * @returns Generated level (0 or higher)
   */
  generateLevel() {
    const random = Math.random();
    return Math.floor(-Math.log(random) * this.levelMultiplier);
  }
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
  async insert(entry) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (entry.vector.length !== this.config.index.dimensions) {
      throw new Error(
        `Vector dimension mismatch: expected ${this.config.index.dimensions}, got ${entry.vector.length}`
      );
    }
    const level = this.generateLevel();
    const node = {
      id: entry.id,
      vector: entry.vector,
      neighbors: /* @__PURE__ */ new Map(),
      metadata: entry.metadata || {},
      level,
      createdAt: /* @__PURE__ */ new Date()
    };
    for (let l = 0; l <= level; l++) {
      node.neighbors.set(l, []);
    }
    if (!this.entryPoint) {
      this.entryPoint = entry.id;
      this.maxLevel = level;
      this.nodes.set(entry.id, node);
      this.emitEvent({ type: "insert", id: entry.id, timestamp: /* @__PURE__ */ new Date() });
      return;
    }
    let currentId = this.entryPoint;
    const m = this.config.index.hnswConfig?.m || 16;
    const efConstruction = this.config.index.hnswConfig?.efConstruction || 200;
    for (let l = this.maxLevel; l > level; l--) {
      currentId = this.greedySearch(entry.vector, currentId, l);
    }
    for (let l = Math.min(level, this.maxLevel); l >= 0; l--) {
      const neighbors = this.searchLayer(entry.vector, currentId, efConstruction, l);
      const selected = neighbors.slice(0, m);
      node.neighbors.set(l, selected.map((n) => n.id));
      for (const neighbor of selected) {
        const neighborNode = this.nodes.get(neighbor.id);
        if (neighborNode) {
          const neighborList = neighborNode.neighbors.get(l) || [];
          neighborList.push(entry.id);
          const maxConnections = l === 0 ? m * 2 : m;
          if (neighborList.length > maxConnections) {
            const pruned = this.pruneNeighbors(neighborNode.vector, neighborList, m);
            neighborNode.neighbors.set(l, pruned);
          } else {
            neighborNode.neighbors.set(l, neighborList);
          }
        }
      }
      if (neighbors.length > 0) {
        currentId = neighbors[0].id;
      }
    }
    if (level > this.maxLevel) {
      this.entryPoint = entry.id;
      this.maxLevel = level;
    }
    this.nodes.set(entry.id, node);
    this.emitEvent({ type: "insert", id: entry.id, timestamp: /* @__PURE__ */ new Date() });
    logger.debug("Inserted vector", { id: entry.id, level });
  }
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
  greedySearch(query, startId, level) {
    let currentId = startId;
    const currentNode = this.nodes.get(currentId);
    if (!currentNode) {
      return startId;
    }
    let currentDist = this.calculateDistance(query, currentNode.vector);
    let improved = true;
    while (improved) {
      improved = false;
      const node = this.nodes.get(currentId);
      if (!node) break;
      const neighbors = node.neighbors.get(level) || [];
      for (const neighborId of neighbors) {
        const neighborNode = this.nodes.get(neighborId);
        if (!neighborNode) continue;
        const dist = this.calculateDistance(query, neighborNode.vector);
        if (dist < currentDist) {
          currentId = neighborId;
          currentDist = dist;
          improved = true;
        }
      }
    }
    return currentId;
  }
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
  searchLayer(query, startId, ef, level) {
    const visited = /* @__PURE__ */ new Set();
    const candidates = [];
    const results = [];
    const startNode = this.nodes.get(startId);
    if (!startNode) return [];
    const startDist = this.calculateDistance(query, startNode.vector);
    candidates.push({ id: startId, distance: startDist });
    results.push({ id: startId, distance: startDist });
    visited.add(startId);
    while (candidates.length > 0) {
      candidates.sort((a, b) => a.distance - b.distance);
      const current = candidates.shift();
      results.sort((a, b) => a.distance - b.distance);
      const furthestResult = results[results.length - 1];
      if (current.distance > furthestResult.distance && results.length >= ef) {
        break;
      }
      const node = this.nodes.get(current.id);
      if (!node) continue;
      const neighbors = node.neighbors.get(level) || [];
      for (const neighborId of neighbors) {
        if (visited.has(neighborId)) continue;
        visited.add(neighborId);
        const neighborNode = this.nodes.get(neighborId);
        if (!neighborNode) continue;
        const dist = this.calculateDistance(query, neighborNode.vector);
        if (results.length < ef || dist < furthestResult.distance) {
          candidates.push({ id: neighborId, distance: dist });
          results.push({ id: neighborId, distance: dist });
          results.sort((a, b) => a.distance - b.distance);
          if (results.length > ef) {
            results.pop();
          }
        }
      }
    }
    return results;
  }
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
  pruneNeighbors(nodeVector, neighborIds, m) {
    const distances = neighborIds.map((id) => {
      const node = this.nodes.get(id);
      if (!node) return { id, distance: Infinity };
      return { id, distance: this.calculateDistance(nodeVector, node.vector) };
    });
    distances.sort((a, b) => a.distance - b.distance);
    return distances.slice(0, m).map((d) => d.id);
  }
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
  async search(query) {
    const startTime = Date.now();
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.entryPoint) {
      return [];
    }
    const k = query.k || 10;
    const efSearch = this.config.index.hnswConfig?.efSearch || 100;
    let currentId = this.entryPoint;
    for (let l = this.maxLevel; l > 0; l--) {
      currentId = this.greedySearch(query.vector, currentId, l);
    }
    const candidates = this.searchLayer(query.vector, currentId, Math.max(efSearch, k), 0);
    const results = candidates.slice(0, k * 2).map((c) => {
      const node = this.nodes.get(c.id);
      const score = this.distanceToScore(c.distance);
      return {
        id: c.id,
        score,
        metadata: node.metadata,
        distance: c.distance
      };
    }).filter((r) => {
      if (query.minScore !== void 0 && r.score < query.minScore) {
        return false;
      }
      if (query.filter) {
        for (const [key, value] of Object.entries(query.filter)) {
          if (r.metadata[key] !== value) {
            return false;
          }
        }
      }
      return true;
    }).slice(0, k);
    const durationMs = Date.now() - startTime;
    this.emitEvent({
      type: "search",
      queryId: crypto.randomUUID?.() || `search-${Date.now()}`,
      resultCount: results.length,
      durationMs,
      timestamp: /* @__PURE__ */ new Date()
    });
    return results;
  }
  /**
   * Convert distance to similarity score
   *
   * @param distance - Distance value
   * @returns Similarity score between 0 and 1
   */
  distanceToScore(distance) {
    switch (this.config.index.distanceMetric) {
      case "cosine":
        return Math.max(0, Math.min(1, 1 - distance));
      case "euclidean":
        return Math.exp(-distance);
      case "dotProduct":
        return 1 / (1 + Math.exp(distance));
      case "manhattan":
        return Math.exp(-distance / 10);
      default:
        return Math.max(0, Math.min(1, 1 - distance));
    }
  }
  /**
   * Hybrid search combining vectors and graph queries
   *
   * Performs vector similarity search and optionally enriches
   * results with data from graph queries (Cypher).
   *
   * @param query - Hybrid search query
   * @returns Array of hybrid search results
   */
  async hybridSearch(query) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    const limit = query.limit || 10;
    const vectorResults = await this.search({
      vector: query.embedding,
      k: limit * 2,
      // Get more candidates for merging
      filter: query.filters,
      minScore: query.minScore
    });
    if (!query.cypher) {
      return vectorResults.map((r) => ({
        ...r,
        source: "vector"
      }));
    }
    logger.debug("Hybrid search with Cypher query", {
      cypher: query.cypher,
      vectorResultCount: vectorResults.length
    });
    const hybridResults = vectorResults.slice(0, limit).map((r) => ({
      ...r,
      source: "merged",
      graphData: {
        cypherQuery: query.cypher,
        cypherParams: query.cypherParams,
        note: "Graph query execution pending integration"
      }
    }));
    return hybridResults;
  }
  /**
   * Batch insert vectors
   *
   * Efficiently inserts multiple vectors in a single operation.
   * Supports progress callbacks and duplicate handling.
   *
   * @param operation - Batch insert operation configuration
   * @returns Result with counts of inserted, skipped, and errors
   */
  async batchInsert(operation) {
    const startTime = Date.now();
    const result = {
      inserted: 0,
      skipped: 0,
      errors: []
    };
    const total = operation.entries.length;
    for (let i = 0; i < operation.entries.length; i++) {
      const entry = operation.entries[i];
      try {
        if (this.nodes.has(entry.id)) {
          if (operation.skipDuplicates) {
            result.skipped++;
            continue;
          }
          throw new Error(`Duplicate ID: ${entry.id}`);
        }
        await this.insert(entry);
        result.inserted++;
        if (operation.onProgress) {
          operation.onProgress(result.inserted + result.skipped, total);
        }
      } catch (error) {
        result.errors.push({
          id: entry.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    result.durationMs = Date.now() - startTime;
    logger.info("Batch insert completed", {
      inserted: result.inserted,
      skipped: result.skipped,
      errors: result.errors.length,
      durationMs: result.durationMs
    });
    return result;
  }
  /**
   * Get a vector by ID
   *
   * @param id - Vector ID to retrieve
   * @returns Vector entry or null if not found
   */
  async get(id) {
    const node = this.nodes.get(id);
    if (!node) return null;
    return {
      id: node.id,
      vector: node.vector,
      metadata: node.metadata,
      createdAt: node.createdAt
    };
  }
  /**
   * Delete a vector by ID
   *
   * Removes the vector from the index and updates neighbor connections.
   *
   * @param id - Vector ID to delete
   * @returns True if deleted, false if not found
   */
  async delete(id) {
    const node = this.nodes.get(id);
    if (!node) return false;
    for (const [level, neighbors] of node.neighbors) {
      for (const neighborId of neighbors) {
        const neighborNode = this.nodes.get(neighborId);
        if (neighborNode) {
          const neighborList = neighborNode.neighbors.get(level) || [];
          const idx = neighborList.indexOf(id);
          if (idx !== -1) {
            neighborList.splice(idx, 1);
          }
        }
      }
    }
    if (this.entryPoint === id) {
      const nodeIterator = this.nodes.keys();
      let nextEntry = nodeIterator.next();
      while (!nextEntry.done && nextEntry.value === id) {
        nextEntry = nodeIterator.next();
      }
      this.entryPoint = nextEntry.done ? null : nextEntry.value;
      if (this.entryPoint) {
        const newEntry = this.nodes.get(this.entryPoint);
        this.maxLevel = newEntry?.level || 0;
      } else {
        this.maxLevel = 0;
      }
    }
    this.nodes.delete(id);
    this.emitEvent({ type: "delete", id, timestamp: /* @__PURE__ */ new Date() });
    logger.debug("Deleted vector", { id });
    return true;
  }
  /**
   * Get index statistics
   *
   * @returns Current statistics about the vector index
   */
  getStats() {
    return {
      totalVectors: this.nodes.size,
      dimensions: this.config.index.dimensions,
      indexType: this.config.index.indexType,
      memoryUsage: this.estimateMemoryUsage(),
      lastUpdated: /* @__PURE__ */ new Date(),
      indexStats: {
        levels: this.maxLevel + 1,
        entryPoint: this.entryPoint || void 0,
        avgConnections: this.calculateAverageConnections()
      }
    };
  }
  /**
   * Estimate memory usage in bytes
   *
   * Provides rough estimate of memory consumption.
   *
   * @returns Estimated memory usage in bytes
   */
  estimateMemoryUsage() {
    const vectorSize = this.config.index.dimensions * 4;
    const metadataSize = 100;
    const neighborsSize = 50 * 8;
    const nodeOverhead = 64;
    return this.nodes.size * (vectorSize + metadataSize + neighborsSize + nodeOverhead);
  }
  /**
   * Calculate average number of connections per node
   *
   * @returns Average connection count
   */
  calculateAverageConnections() {
    if (this.nodes.size === 0) return 0;
    let totalConnections = 0;
    for (const node of this.nodes.values()) {
      for (const neighbors of node.neighbors.values()) {
        totalConnections += neighbors.length;
      }
    }
    return totalConnections / this.nodes.size;
  }
  /**
   * Clear all vectors
   *
   * Removes all vectors from the index and resets state.
   */
  async clear() {
    this.nodes.clear();
    this.entryPoint = null;
    this.maxLevel = 0;
    logger.info("Vector store cleared");
  }
  /**
   * Get configuration
   *
   * @returns Copy of current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Check if store is initialized
   *
   * @returns True if initialized
   */
  isReady() {
    return this.isInitialized;
  }
  /**
   * Get total vector count
   *
   * @returns Number of vectors in the store
   */
  size() {
    return this.nodes.size;
  }
  /**
   * Check if a vector exists
   *
   * @param id - Vector ID to check
   * @returns True if exists
   */
  has(id) {
    return this.nodes.has(id);
  }
  /**
   * Get all vector IDs
   *
   * @returns Array of all vector IDs
   */
  getAllIds() {
    return Array.from(this.nodes.keys());
  }
  /**
   * Add event listener
   *
   * @param event - Event type to listen for
   * @param listener - Callback function
   */
  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, /* @__PURE__ */ new Set());
    }
    this.eventListeners.get(event).add(listener);
  }
  /**
   * Remove event listener
   *
   * @param event - Event type
   * @param listener - Callback function to remove
   */
  off(event, listener) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }
  /**
   * Emit an event to all registered listeners
   *
   * @param event - Event to emit
   */
  emitEvent(event) {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          logger.error("Event listener error", error instanceof Error ? error : void 0, {
            eventType: event.type
          });
        }
      }
    }
    const wildcardListeners = this.eventListeners.get("*");
    if (wildcardListeners) {
      for (const listener of wildcardListeners) {
        try {
          listener(event);
        } catch (error) {
          logger.error("Wildcard listener error", error instanceof Error ? error : void 0, {
            eventType: event.type
          });
        }
      }
    }
  }
}
function createVectorStore(config) {
  return new EnhancedVectorStore(config);
}
export {
  EnhancedVectorStore,
  createVectorStore
};
//# sourceMappingURL=vector-store.js.map
