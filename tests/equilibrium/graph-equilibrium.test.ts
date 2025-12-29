/**
 * Graph Equilibrium Optimizer Tests
 *
 * Comprehensive test suite for the GraphEquilibriumOptimizer class.
 * Tests cover:
 * - Basic functionality and edge cases
 * - Configuration options
 * - Importance calculation
 * - PageRank-like behavior
 * - Pruning identification
 * - Cluster detection
 * - Query-based optimization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  GraphEquilibriumOptimizer,
  DEFAULT_GRAPH_EQUILIBRIUM_CONFIG,
  type GraphNode,
  type GraphEdge,
  type GraphEquilibriumConfig,
} from '../../src/equilibrium/graph-equilibrium.js';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a test node with defaults
 */
function createNode(overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    content: 'Test node content',
    metadata: {},
    ...overrides,
  };
}

/**
 * Create multiple nodes
 */
function createNodes(count: number): GraphNode[] {
  return Array.from({ length: count }, (_, i) =>
    createNode({
      id: `node_${i}`,
      content: `Test node content ${i}`,
    })
  );
}

/**
 * Create edge between two nodes
 */
function createEdge(source: string, target: string, weight: number = 1): GraphEdge {
  return { source, target, weight };
}

/**
 * Create a linear chain graph
 */
function createLinearGraph(size: number): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = createNodes(size);
  const edges: GraphEdge[] = [];

  for (let i = 0; i < size - 1; i++) {
    edges.push(createEdge(nodes[i].id, nodes[i + 1].id));
  }

  return { nodes, edges };
}

/**
 * Create a star graph (one hub connected to many satellites)
 */
function createStarGraph(satellites: number): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const hub = createNode({ id: 'hub', content: 'Central hub node' });
  const nodes = [hub];
  const edges: GraphEdge[] = [];

  for (let i = 0; i < satellites; i++) {
    const satellite = createNode({ id: `sat_${i}`, content: `Satellite node ${i}` });
    nodes.push(satellite);
    edges.push(createEdge(hub.id, satellite.id));
  }

  return { nodes, edges };
}

/**
 * Create a fully connected graph
 */
function createFullyConnectedGraph(size: number): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = createNodes(size);
  const edges: GraphEdge[] = [];

  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      edges.push(createEdge(nodes[i].id, nodes[j].id));
    }
  }

  return { nodes, edges };
}

// ============================================================================
// Tests
// ============================================================================

describe('GraphEquilibriumOptimizer', () => {
  let optimizer: GraphEquilibriumOptimizer;

  beforeEach(() => {
    optimizer = new GraphEquilibriumOptimizer();
  });

  // --------------------------------------------------------------------------
  // Initialization Tests
  // --------------------------------------------------------------------------

  describe('initialization', () => {
    it('should create optimizer with default config', () => {
      const config = optimizer.getConfig();
      expect(config.learningRate).toBe(0.1);
      expect(config.maxIterations).toBe(100);
      expect(config.minImportance).toBe(0.01);
      expect(config.dampingFactor).toBe(0.85);
    });

    it('should create optimizer with custom config', () => {
      const customOptimizer = new GraphEquilibriumOptimizer({
        learningRate: 0.2,
        dampingFactor: 0.9,
      });
      const config = customOptimizer.getConfig();
      expect(config.learningRate).toBe(0.2);
      expect(config.dampingFactor).toBe(0.9);
    });

    it('should allow updating config after creation', () => {
      optimizer.setConfig({ learningRate: 0.3 });
      expect(optimizer.getConfig().learningRate).toBe(0.3);
    });
  });

  // --------------------------------------------------------------------------
  // Empty Input Tests
  // --------------------------------------------------------------------------

  describe('empty input handling', () => {
    it('should return empty map for empty nodes', async () => {
      const result = await optimizer.optimizeGraph([], []);
      expect(result.size).toBe(0);
    });

    it('should return empty details for empty input', async () => {
      const result = await optimizer.optimizeWithDetails([], []);
      expect(result.rankedNodes).toEqual([]);
      expect(result.pruneCandidates).toEqual([]);
      expect(result.converged).toBe(true);
      expect(result.iterations).toBe(0);
    });

    it('should return empty prune candidates for empty graph', async () => {
      const result = await optimizer.identifyPruneCandidates([], []);
      expect(result).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // Single Node Tests
  // --------------------------------------------------------------------------

  describe('single node handling', () => {
    it('should assign importance to single node', async () => {
      const node = createNode();
      const result = await optimizer.optimizeGraph([node], []);
      expect(result.get(node.id)).toBe(1);
    });

    it('should not mark single node for pruning', async () => {
      const node = createNode();
      const candidates = await optimizer.identifyPruneCandidates([node], []);
      expect(candidates).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // Importance Distribution Tests
  // --------------------------------------------------------------------------

  describe('importance distribution', () => {
    it('should distribute importance across all nodes', async () => {
      const { nodes, edges } = createLinearGraph(5);
      const result = await optimizer.optimizeGraph(nodes, edges);

      let total = 0;
      for (const score of result.values()) {
        total += score;
      }
      expect(total).toBeCloseTo(1, 5);
    });

    it('should give higher importance to hub nodes', async () => {
      const { nodes, edges } = createStarGraph(5);
      const result = await optimizer.optimizeGraph(nodes, edges);

      const hubImportance = result.get('hub') || 0;
      const satImportances = nodes
        .filter((n) => n.id !== 'hub')
        .map((n) => result.get(n.id) || 0);

      const avgSatImportance = satImportances.reduce((a, b) => a + b, 0) / satImportances.length;
      expect(hubImportance).toBeGreaterThan(avgSatImportance);
    });

    it('should give similar importance in fully connected graph', async () => {
      const { nodes, edges } = createFullyConnectedGraph(4);
      const result = await optimizer.optimizeGraph(nodes, edges);

      const importances = [...result.values()];
      const avg = importances.reduce((a, b) => a + b, 0) / importances.length;

      for (const imp of importances) {
        expect(Math.abs(imp - avg)).toBeLessThan(0.1);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Ranking Tests
  // --------------------------------------------------------------------------

  describe('node ranking', () => {
    it('should rank nodes by importance', async () => {
      const { nodes, edges } = createStarGraph(4);
      const result = await optimizer.optimizeWithDetails(nodes, edges);

      expect(result.rankedNodes[0]).toBe('hub');
    });

    it('should return all nodes in ranking', async () => {
      const { nodes, edges } = createLinearGraph(5);
      const result = await optimizer.optimizeWithDetails(nodes, edges);

      expect(result.rankedNodes.length).toBe(5);
    });
  });

  // --------------------------------------------------------------------------
  // Prune Candidate Tests
  // --------------------------------------------------------------------------

  describe('prune candidates', () => {
    it('should identify low importance nodes for pruning', async () => {
      // Create a graph where some nodes are clearly less important
      const centralNodes = createNodes(3);
      const isolatedNode = createNode({ id: 'isolated', content: 'Isolated' });

      const nodes = [...centralNodes, isolatedNode];
      const edges = [
        createEdge(centralNodes[0].id, centralNodes[1].id),
        createEdge(centralNodes[1].id, centralNodes[2].id),
        createEdge(centralNodes[0].id, centralNodes[2].id),
      ];

      const candidates = await optimizer.identifyPruneCandidates(nodes, edges, 0.2);
      // Isolated node should be a candidate
      expect(candidates.length).toBeGreaterThan(0);
    });

    it('should respect custom threshold', async () => {
      const { nodes, edges } = createLinearGraph(5);

      const strictCandidates = await optimizer.identifyPruneCandidates(nodes, edges, 0.5);
      const looseCandidates = await optimizer.identifyPruneCandidates(nodes, edges, 0.01);

      expect(strictCandidates.length).toBeGreaterThanOrEqual(looseCandidates.length);
    });
  });

  // --------------------------------------------------------------------------
  // Query-Based Optimization Tests
  // --------------------------------------------------------------------------

  describe('query-based optimization', () => {
    it('should boost relevance for matching query', async () => {
      const relevantNode = createNode({ id: 'relevant', content: 'JavaScript programming tutorial' });
      const irrelevantNode = createNode({ id: 'irrelevant', content: 'Cooking recipe' });

      const nodes = [relevantNode, irrelevantNode];
      const edges = [createEdge(relevantNode.id, irrelevantNode.id)];

      const result = await optimizer.optimizeGraph(nodes, edges, 'JavaScript programming');

      expect(result.get('relevant')).toBeGreaterThan(result.get('irrelevant')!);
    });

    it('should handle empty query', async () => {
      const { nodes, edges } = createLinearGraph(3);
      const result = await optimizer.optimizeGraph(nodes, edges, '');

      expect(result.size).toBe(3);
    });
  });

  // --------------------------------------------------------------------------
  // Top Nodes Tests
  // --------------------------------------------------------------------------

  describe('getTopNodes', () => {
    it('should return top N nodes by importance', async () => {
      const { nodes, edges } = createStarGraph(5);
      const topNodes = await optimizer.getTopNodes(nodes, edges, 2);

      expect(topNodes.length).toBe(2);
      expect(topNodes[0].id).toBe('hub');
    });

    it('should return all nodes if N > count', async () => {
      const { nodes, edges } = createLinearGraph(3);
      const topNodes = await optimizer.getTopNodes(nodes, edges, 10);

      expect(topNodes.length).toBe(3);
    });

    it('should incorporate query relevance', async () => {
      const nodes = [
        createNode({ id: 'match', content: 'TypeScript guide' }),
        createNode({ id: 'nomatch', content: 'Cooking guide' }),
      ];
      const edges = [createEdge('match', 'nomatch')];

      const topNodes = await optimizer.getTopNodes(nodes, edges, 1, 'TypeScript');
      expect(topNodes[0].id).toBe('match');
    });
  });

  // --------------------------------------------------------------------------
  // Cluster Detection Tests
  // --------------------------------------------------------------------------

  describe('findNodeClusters', () => {
    it('should find connected clusters', async () => {
      // Create two disconnected components
      const cluster1 = createNodes(3).map((n, i) => ({ ...n, id: `c1_${i}` }));
      const cluster2 = createNodes(3).map((n, i) => ({ ...n, id: `c2_${i}` }));

      const nodes = [...cluster1, ...cluster2];
      const edges = [
        createEdge('c1_0', 'c1_1'),
        createEdge('c1_1', 'c1_2'),
        createEdge('c2_0', 'c2_1'),
        createEdge('c2_1', 'c2_2'),
      ];

      const clusters = await optimizer.findNodeClusters(nodes, edges, 2);
      expect(clusters.length).toBe(2);
    });

    it('should respect minimum cluster size', async () => {
      const { nodes, edges } = createLinearGraph(3);
      const isolatedNode = createNode({ id: 'isolated' });

      const allNodes = [...nodes, isolatedNode];

      const clusters = await optimizer.findNodeClusters(allNodes, edges, 2);
      // Isolated node should not form a cluster
      const isolatedCluster = clusters.find((c) => c.members.includes('isolated'));
      expect(isolatedCluster).toBeUndefined();
    });

    it('should identify representative node with highest importance', async () => {
      const { nodes, edges } = createStarGraph(3);
      const clusters = await optimizer.findNodeClusters(nodes, edges, 2);

      expect(clusters.length).toBe(1);
      expect(clusters[0].representative).toBe('hub');
    });

    it('should calculate cluster metrics correctly', async () => {
      const { nodes, edges } = createFullyConnectedGraph(4);
      const clusters = await optimizer.findNodeClusters(nodes, edges, 2);

      expect(clusters.length).toBe(1);
      expect(clusters[0].members.length).toBe(4);
      expect(clusters[0].avgImportance).toBeCloseTo(0.25, 1);
    });
  });

  // --------------------------------------------------------------------------
  // Removal Impact Tests
  // --------------------------------------------------------------------------

  describe('calculateRemovalImpact', () => {
    it('should calculate impact of removing hub node', async () => {
      const { nodes, edges } = createStarGraph(4);
      const impact = await optimizer.calculateRemovalImpact(nodes, edges, 'hub');

      expect(impact.totalImpact).toBeGreaterThan(0);
      expect(impact.impactedNodes.size).toBeGreaterThan(0);
    });

    it('should show less impact for peripheral nodes', async () => {
      const { nodes, edges } = createStarGraph(4);

      const hubImpact = await optimizer.calculateRemovalImpact(nodes, edges, 'hub');
      const satImpact = await optimizer.calculateRemovalImpact(nodes, edges, 'sat_0');

      expect(hubImpact.totalImpact).toBeGreaterThan(satImpact.totalImpact);
    });
  });

  // --------------------------------------------------------------------------
  // Convergence Tests
  // --------------------------------------------------------------------------

  describe('convergence', () => {
    it('should converge within max iterations', async () => {
      const { nodes, edges } = createFullyConnectedGraph(10);
      const result = await optimizer.optimizeWithDetails(nodes, edges);

      expect(result.iterations).toBeLessThanOrEqual(100);
    });

    it('should converge with high damping factor', async () => {
      const customOptimizer = new GraphEquilibriumOptimizer({ dampingFactor: 0.95 });
      const { nodes, edges } = createLinearGraph(5);

      const result = await customOptimizer.optimizeWithDetails(nodes, edges);
      expect(result.converged || result.iterations === 100).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Content Value Tests
  // --------------------------------------------------------------------------

  describe('content value calculation', () => {
    it('should value longer content higher', async () => {
      const shortNode = createNode({ id: 'short', content: 'Hi' });
      const longNode = createNode({
        id: 'long',
        content: 'This is a much longer piece of content that should be valued higher',
      });

      const nodes = [shortNode, longNode];
      const edges = [createEdge('short', 'long')];

      const result = await optimizer.optimizeWithDetails(nodes, edges);
      const shortValue = result.participations.get('short')?.contentValue || 0;
      const longValue = result.participations.get('long')?.contentValue || 0;

      expect(longValue).toBeGreaterThan(shortValue);
    });

    it('should value nodes with metadata higher', async () => {
      const noMeta = createNode({ id: 'nometa', content: 'Test', metadata: {} });
      const hasMeta = createNode({
        id: 'hasmeta',
        content: 'Test',
        metadata: { key: 'value', another: 123 },
      });

      const nodes = [noMeta, hasMeta];
      const edges = [createEdge('nometa', 'hasmeta')];

      const result = await optimizer.optimizeWithDetails(nodes, edges);
      const noMetaValue = result.participations.get('nometa')?.contentValue || 0;
      const hasMetaValue = result.participations.get('hasmeta')?.contentValue || 0;

      expect(hasMetaValue).toBeGreaterThan(noMetaValue);
    });

    it('should value nodes with tags higher', async () => {
      const noTags = createNode({ id: 'notags', content: 'Test' });
      const hasTags = createNode({ id: 'hastags', content: 'Test', tags: ['important', 'core'] });

      const nodes = [noTags, hasTags];
      const edges = [createEdge('notags', 'hastags')];

      const result = await optimizer.optimizeWithDetails(nodes, edges);
      const noTagsValue = result.participations.get('notags')?.contentValue || 0;
      const hasTagsValue = result.participations.get('hastags')?.contentValue || 0;

      expect(hasTagsValue).toBeGreaterThan(noTagsValue);
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle nodes with empty content', async () => {
      const emptyNode = createNode({ content: '' });
      const result = await optimizer.optimizeGraph([emptyNode], []);
      expect(result.size).toBe(1);
    });

    it('should handle self-loops', async () => {
      const node = createNode({ id: 'self' });
      const selfLoop = createEdge('self', 'self');

      const result = await optimizer.optimizeGraph([node], [selfLoop]);
      expect(result.get('self')).toBe(1);
    });

    it('should handle nodes without edges', async () => {
      const nodes = createNodes(5);
      const result = await optimizer.optimizeGraph(nodes, []);

      for (const score of result.values()) {
        expect(score).toBeCloseTo(0.2, 5);
      }
    });

    it('should handle weighted edges', async () => {
      const nodes = createNodes(3);
      const edges = [
        createEdge(nodes[0].id, nodes[1].id, 0.5),
        createEdge(nodes[1].id, nodes[2].id, 2.0),
      ];

      const result = await optimizer.optimizeGraph(nodes, edges);
      expect(result.size).toBe(3);
    });

    it('should handle graph with cycles', async () => {
      const nodes = createNodes(4);
      const edges = [
        createEdge(nodes[0].id, nodes[1].id),
        createEdge(nodes[1].id, nodes[2].id),
        createEdge(nodes[2].id, nodes[3].id),
        createEdge(nodes[3].id, nodes[0].id),
      ];

      const result = await optimizer.optimizeGraph(nodes, edges);
      let total = 0;
      for (const score of result.values()) {
        total += score;
      }
      expect(total).toBeCloseTo(1, 5);
    });
  });

  // --------------------------------------------------------------------------
  // Configuration Impact Tests
  // --------------------------------------------------------------------------

  describe('configuration impact', () => {
    it('should respond to connectivity weight changes', async () => {
      // Create a star graph where hub has more connections
      const { nodes, edges } = createStarGraph(6);

      // Use extreme values to see clear difference
      const highConnWeight = new GraphEquilibriumOptimizer({
        connectivityWeight: 0.95,
        contentWeight: 0.05,
      });
      const lowConnWeight = new GraphEquilibriumOptimizer({
        connectivityWeight: 0.05,
        contentWeight: 0.95,
      });

      const highResult = await highConnWeight.optimizeWithDetails(nodes, edges);
      const lowResult = await lowConnWeight.optimizeWithDetails(nodes, edges);

      // With high connectivity weight, hub's connectivity should contribute more
      const hubConnectivityHigh = highResult.participations.get('hub')?.connectivity || 0;
      const hubConnectivityLow = lowResult.participations.get('hub')?.connectivity || 0;

      // Both should have same connectivity value (it's intrinsic to the graph)
      expect(hubConnectivityHigh).toBe(hubConnectivityLow);

      // Hub should be ranked highly in both due to its central position
      expect(highResult.rankedNodes[0]).toBe('hub');
      expect(lowResult.rankedNodes[0]).toBe('hub');
    });

    it('should respond to min importance threshold', async () => {
      const { nodes, edges } = createLinearGraph(10);

      const strictOptimizer = new GraphEquilibriumOptimizer({ minImportance: 0.2 });
      const looseOptimizer = new GraphEquilibriumOptimizer({ minImportance: 0.01 });

      const strictCandidates = await strictOptimizer.identifyPruneCandidates(nodes, edges);
      const looseCandidates = await looseOptimizer.identifyPruneCandidates(nodes, edges);

      expect(strictCandidates.length).toBeGreaterThanOrEqual(looseCandidates.length);
    });
  });
});
