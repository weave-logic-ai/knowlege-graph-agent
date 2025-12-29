/**
 * Graph Equilibrium Optimization
 *
 * Implements game-theoretic equilibrium for graph node importance and pruning.
 * Nodes compete for relevance based on content value, connectivity, and
 * inverse redundancy with neighbors.
 *
 * Uses PageRank-inspired dynamics combined with content-based scoring
 * to identify the most important nodes in a knowledge graph.
 *
 * @module equilibrium/graph-equilibrium
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Graph node representation
 */
export interface GraphNode {
  /** Unique node identifier */
  id: string;
  /** Node content/text */
  content: string;
  /** Node type (optional) */
  type?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Creation timestamp */
  createdAt?: Date;
  /** Last update timestamp */
  updatedAt?: Date;
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Graph edge representation
 */
export interface GraphEdge {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Edge weight (default: 1.0) */
  weight?: number;
  /** Edge type/relationship */
  type?: string;
  /** Edge metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Node participation metrics in equilibrium calculation
 */
export interface NodeParticipation {
  /** Node identifier */
  nodeId: string;
  /** Importance score (0-1) */
  importance: number;
  /** Normalized connectivity score */
  connectivity: number;
  /** Content value score */
  contentValue: number;
  /** Redundancy penalty */
  redundancy: number;
}

/**
 * Configuration for graph equilibrium optimizer
 */
export interface GraphEquilibriumConfig {
  /** Learning rate for importance updates (default: 0.1) */
  learningRate: number;
  /** Maximum iterations to find equilibrium (default: 100) */
  maxIterations: number;
  /** Minimum importance to retain node (default: 0.01) */
  minImportance: number;
  /** Convergence threshold (default: 0.0001) */
  convergenceThreshold: number;
  /** Damping factor for PageRank-like calculation (default: 0.85) */
  dampingFactor: number;
  /** Weight for connectivity in utility (default: 0.3) */
  connectivityWeight: number;
  /** Weight for content in utility (default: 0.7) */
  contentWeight: number;
  /** Redundancy penalty factor (default: 0.3) */
  redundancyPenalty: number;
}

/**
 * Result of graph optimization
 */
export interface GraphOptimizationResult {
  /** Node importance scores */
  importanceScores: Map<string, number>;
  /** Ordered list of nodes by importance */
  rankedNodes: string[];
  /** Nodes below minimum importance (prune candidates) */
  pruneCandidates: string[];
  /** Number of iterations */
  iterations: number;
  /** Whether equilibrium was reached */
  converged: boolean;
  /** Participation details for each node */
  participations: Map<string, NodeParticipation>;
}

/**
 * Cluster of similar nodes
 */
export interface NodeCluster {
  /** Representative node ID */
  representative: string;
  /** Member node IDs */
  members: string[];
  /** Average importance of cluster */
  avgImportance: number;
  /** Combined connectivity */
  totalConnectivity: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: GraphEquilibriumConfig = {
  learningRate: 0.1,
  maxIterations: 100,
  minImportance: 0.01,
  convergenceThreshold: 0.0001,
  dampingFactor: 0.85,
  connectivityWeight: 0.3,
  contentWeight: 0.7,
  redundancyPenalty: 0.3,
};

// ============================================================================
// Graph Equilibrium Optimizer
// ============================================================================

/**
 * Optimizes graph structure using game-theoretic equilibrium.
 *
 * The algorithm:
 * 1. Builds adjacency structure from edges
 * 2. Initializes equal importance for all nodes
 * 3. Computes content value and connectivity for each node
 * 4. Updates importance based on utility (content + connectivity) minus redundancy
 * 5. Propagates importance from neighbors (PageRank-inspired)
 * 6. Normalizes and checks convergence
 * 7. Identifies prune candidates below threshold
 */
export class GraphEquilibriumOptimizer {
  private config: GraphEquilibriumConfig;

  constructor(config: Partial<GraphEquilibriumConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): GraphEquilibriumConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<GraphEquilibriumConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Calculate equilibrium importance scores for graph nodes
   * Nodes compete for relevance based on content and connections
   *
   * @param nodes - Graph nodes
   * @param edges - Graph edges
   * @param query - Optional query for relevance-based scoring
   * @returns Map of node ID to importance score
   */
  async optimizeGraph(
    nodes: GraphNode[],
    edges: GraphEdge[],
    query?: string
  ): Promise<Map<string, number>> {
    const result = await this.optimizeWithDetails(nodes, edges, query);
    return result.importanceScores;
  }

  /**
   * Optimize graph and return detailed results
   */
  async optimizeWithDetails(
    nodes: GraphNode[],
    edges: GraphEdge[],
    query?: string
  ): Promise<GraphOptimizationResult> {
    if (nodes.length === 0) {
      return {
        importanceScores: new Map(),
        rankedNodes: [],
        pruneCandidates: [],
        iterations: 0,
        converged: true,
        participations: new Map(),
      };
    }

    // Build adjacency structure
    const adjacency = this.buildAdjacency(edges);
    const participations = new Map<string, NodeParticipation>();

    // Initialize participations
    for (const node of nodes) {
      participations.set(node.id, {
        nodeId: node.id,
        importance: 1.0 / nodes.length,
        connectivity: this.calculateConnectivity(node.id, adjacency),
        contentValue: query
          ? this.calculateRelevance(node, query)
          : this.calculateIntrinsicValue(node),
        redundancy: 0,
      });
    }

    let converged = false;
    let iterations = 0;

    // Find equilibrium
    for (let iter = 0; iter < this.config.maxIterations; iter++) {
      iterations = iter + 1;
      let maxDelta = 0;

      for (const node of nodes) {
        const p = participations.get(node.id)!;
        const neighbors = adjacency.get(node.id) || [];

        // Calculate redundancy with neighbors
        p.redundancy = this.calculateNodeRedundancy(p, neighbors, participations);

        // Calculate utility
        const utility =
          this.config.contentWeight * p.contentValue +
          this.config.connectivityWeight * p.connectivity;

        // Calculate neighbor contribution (PageRank-inspired)
        let neighborContribution = 0;
        for (const neighborId of neighbors) {
          const neighbor = participations.get(neighborId);
          if (neighbor) {
            const neighborDegree = adjacency.get(neighborId)?.length || 1;
            neighborContribution += neighbor.importance / neighborDegree;
          }
        }

        // Update importance
        const penalty = this.config.redundancyPenalty * p.redundancy;
        const oldImportance = p.importance;

        p.importance = Math.max(
          0,
          (1 - this.config.dampingFactor) / nodes.length +
            this.config.dampingFactor *
              (neighborContribution + this.config.learningRate * (utility - penalty))
        );

        maxDelta = Math.max(maxDelta, Math.abs(p.importance - oldImportance));
      }

      // Normalize
      const total = [...participations.values()].reduce((s, p) => s + p.importance, 0);
      if (total > 0) {
        for (const p of participations.values()) {
          p.importance /= total;
        }
      }

      // Check convergence
      if (maxDelta < this.config.convergenceThreshold) {
        converged = true;
        break;
      }
    }

    // Build results
    const importanceScores = new Map<string, number>();
    for (const [id, p] of participations) {
      importanceScores.set(id, p.importance);
    }

    // Rank nodes
    const rankedNodes = [...importanceScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    // Identify prune candidates
    const pruneCandidates = rankedNodes.filter(
      (id) => (importanceScores.get(id) || 0) < this.config.minImportance
    );

    return {
      importanceScores,
      rankedNodes,
      pruneCandidates,
      iterations,
      converged,
      participations,
    };
  }

  /**
   * Identify nodes that should be pruned based on importance threshold
   */
  async identifyPruneCandidates(
    nodes: GraphNode[],
    edges: GraphEdge[],
    threshold?: number
  ): Promise<string[]> {
    const effectiveThreshold = threshold ?? this.config.minImportance;
    const result = await this.optimizeWithDetails(nodes, edges);

    return [...result.importanceScores.entries()]
      .filter(([_, score]) => score < effectiveThreshold)
      .map(([id]) => id);
  }

  /**
   * Get top N most important nodes
   */
  async getTopNodes(
    nodes: GraphNode[],
    edges: GraphEdge[],
    n: number,
    query?: string
  ): Promise<GraphNode[]> {
    const result = await this.optimizeWithDetails(nodes, edges, query);
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    return result.rankedNodes.slice(0, n).map((id) => nodeMap.get(id)!).filter(Boolean);
  }

  /**
   * Find clusters of similar/related nodes
   */
  async findNodeClusters(
    nodes: GraphNode[],
    edges: GraphEdge[],
    minClusterSize: number = 2
  ): Promise<NodeCluster[]> {
    const result = await this.optimizeWithDetails(nodes, edges);
    const adjacency = this.buildAdjacency(edges);
    const visited = new Set<string>();
    const clusters: NodeCluster[] = [];

    // Find connected components with high similarity
    for (const node of nodes) {
      if (visited.has(node.id)) continue;

      const cluster: string[] = [];
      const queue = [node.id];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;

        visited.add(current);
        cluster.push(current);

        // Add strongly connected neighbors
        const neighbors = adjacency.get(current) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      if (cluster.length >= minClusterSize) {
        // Find representative (highest importance)
        const representative = cluster.reduce((best, id) => {
          const bestScore = result.importanceScores.get(best) || 0;
          const currentScore = result.importanceScores.get(id) || 0;
          return currentScore > bestScore ? id : best;
        }, cluster[0]);

        clusters.push({
          representative,
          members: cluster,
          avgImportance:
            cluster.reduce((sum, id) => sum + (result.importanceScores.get(id) || 0), 0) /
            cluster.length,
          totalConnectivity: cluster.reduce(
            (sum, id) => sum + (result.participations.get(id)?.connectivity || 0),
            0
          ),
        });
      }
    }

    return clusters.sort((a, b) => b.avgImportance - a.avgImportance);
  }

  /**
   * Calculate importance delta if a node were removed
   */
  async calculateRemovalImpact(
    nodes: GraphNode[],
    edges: GraphEdge[],
    nodeId: string
  ): Promise<{ impactedNodes: Map<string, number>; totalImpact: number }> {
    // Get baseline importance
    const baseline = await this.optimizeGraph(nodes, edges);

    // Remove node and recalculate
    const filteredNodes = nodes.filter((n) => n.id !== nodeId);
    const filteredEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);

    const withoutNode = await this.optimizeGraph(filteredNodes, filteredEdges);

    // Calculate impact
    const impactedNodes = new Map<string, number>();
    let totalImpact = 0;

    for (const [id, baselineScore] of baseline) {
      if (id === nodeId) continue;
      const newScore = withoutNode.get(id) || 0;
      const delta = Math.abs(newScore - baselineScore);
      if (delta > 0.001) {
        impactedNodes.set(id, delta);
        totalImpact += delta;
      }
    }

    return { impactedNodes, totalImpact };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private buildAdjacency(edges: GraphEdge[]): Map<string, string[]> {
    const adj = new Map<string, string[]>();

    for (const edge of edges) {
      if (!adj.has(edge.source)) adj.set(edge.source, []);
      if (!adj.has(edge.target)) adj.set(edge.target, []);

      adj.get(edge.source)!.push(edge.target);
      adj.get(edge.target)!.push(edge.source);
    }

    return adj;
  }

  private calculateConnectivity(nodeId: string, adjacency: Map<string, string[]>): number {
    const neighbors = adjacency.get(nodeId) || [];
    // Logarithmic scale for connectivity to prevent highly connected nodes from dominating
    return Math.log1p(neighbors.length) / 5;
  }

  private calculateRelevance(node: GraphNode, query: string): number {
    const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(Boolean));
    const contentWords = new Set(node.content.toLowerCase().split(/\s+/).filter(Boolean));

    if (queryWords.size === 0) return 0.5;

    let matches = 0;
    for (const word of queryWords) {
      if (contentWords.has(word)) matches++;
    }

    // Also check tags
    if (node.tags) {
      const tagSet = new Set(node.tags.map((t) => t.toLowerCase()));
      for (const word of queryWords) {
        if (tagSet.has(word)) matches += 0.5;
      }
    }

    return matches / queryWords.size;
  }

  private calculateIntrinsicValue(node: GraphNode): number {
    // Base value on content characteristics
    const lengthScore = Math.min(1, node.content.length / 1000);

    // Metadata richness
    const hasMetadata = node.metadata && Object.keys(node.metadata).length > 0 ? 0.2 : 0;

    // Tags bonus
    const hasTags = node.tags && node.tags.length > 0 ? 0.1 : 0;

    // Recency bonus
    let recencyBonus = 0;
    if (node.updatedAt || node.createdAt) {
      const date = node.updatedAt || node.createdAt!;
      const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      recencyBonus = 0.1 * Math.exp(-daysSince * 0.01);
    }

    return 0.3 + lengthScore * 0.4 + hasMetadata + hasTags + recencyBonus;
  }

  private calculateNodeRedundancy(
    target: NodeParticipation,
    neighborIds: string[],
    all: Map<string, NodeParticipation>
  ): number {
    let redundancy = 0;

    for (const neighborId of neighborIds) {
      const neighbor = all.get(neighborId);
      if (neighbor) {
        // Higher redundancy if neighbor has similar importance and content value
        const importanceSimilarity = 1 - Math.abs(target.importance - neighbor.importance);
        const valueSimilarity = 1 - Math.abs(target.contentValue - neighbor.contentValue);

        redundancy += importanceSimilarity * valueSimilarity * neighbor.importance;
      }
    }

    return redundancy;
  }
}

// ============================================================================
// Exports
// ============================================================================

export { DEFAULT_CONFIG as DEFAULT_GRAPH_EQUILIBRIUM_CONFIG };
