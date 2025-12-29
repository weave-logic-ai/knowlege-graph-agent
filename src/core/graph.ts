/**
 * Knowledge Graph Core
 *
 * Core graph data structure and operations for managing knowledge nodes.
 */

import type {
  KnowledgeNode,
  KnowledgeGraph,
  GraphEdge,
  GraphMetadata,
  GraphStats,
  NodeType,
  NodeStatus,
  NodeLink,
} from './types.js';

/**
 * Knowledge Graph Manager
 *
 * Manages the in-memory knowledge graph with efficient operations
 * for node/edge management, traversal, and analysis.
 */
export class KnowledgeGraphManager {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private edges: GraphEdge[] = [];
  private incomingIndex: Map<string, GraphEdge[]> = new Map();
  private outgoingIndex: Map<string, GraphEdge[]> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private metadata: GraphMetadata;

  constructor(name: string, rootPath: string) {
    this.metadata = {
      name,
      version: '1.0.0',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      nodeCount: 0,
      edgeCount: 0,
      rootPath,
    };
  }

  // ========================================================================
  // Node Operations
  // ========================================================================

  /**
   * Add a node to the graph
   */
  addNode(node: KnowledgeNode): void {
    this.nodes.set(node.id, node);
    this.metadata.nodeCount = this.nodes.size;
    this.metadata.updated = new Date().toISOString();

    // Index tags
    for (const tag of node.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(node.id);
    }

    // Create edges from outgoing links
    for (const link of node.outgoingLinks) {
      this.addEdge({
        source: node.id,
        target: link.target,
        type: 'link',
        weight: 1,
        context: link.context,
      });
    }
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): KnowledgeNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all nodes
   */
  getAllNodes(): KnowledgeNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get nodes by type
   */
  getNodesByType(type: NodeType): KnowledgeNode[] {
    return this.getAllNodes().filter(node => node.type === type);
  }

  /**
   * Get nodes by status
   */
  getNodesByStatus(status: NodeStatus): KnowledgeNode[] {
    return this.getAllNodes().filter(node => node.status === status);
  }

  /**
   * Get nodes by tag
   */
  getNodesByTag(tag: string): KnowledgeNode[] {
    const nodeIds = this.tagIndex.get(tag);
    if (!nodeIds) return [];
    return Array.from(nodeIds)
      .map(id => this.nodes.get(id))
      .filter((n): n is KnowledgeNode => n !== undefined);
  }

  /**
   * Update a node
   */
  updateNode(id: string, updates: Partial<KnowledgeNode>): boolean {
    const existing = this.nodes.get(id);
    if (!existing) return false;

    // Handle tag changes
    if (updates.tags) {
      // Remove old tags from index
      for (const tag of existing.tags) {
        this.tagIndex.get(tag)?.delete(id);
      }
      // Add new tags to index
      for (const tag of updates.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(id);
      }
    }

    const updated: KnowledgeNode = {
      ...existing,
      ...updates,
      lastModified: new Date(),
    };
    this.nodes.set(id, updated);
    this.metadata.updated = new Date().toISOString();
    return true;
  }

  /**
   * Remove a node
   */
  removeNode(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;

    // Remove from tag index
    for (const tag of node.tags) {
      this.tagIndex.get(tag)?.delete(id);
    }

    // Remove related edges
    this.edges = this.edges.filter(e => e.source !== id && e.target !== id);
    this.incomingIndex.delete(id);
    this.outgoingIndex.delete(id);

    // Update indices for remaining edges
    for (const [targetId, edges] of this.incomingIndex) {
      this.incomingIndex.set(targetId, edges.filter(e => e.source !== id));
    }
    for (const [sourceId, edges] of this.outgoingIndex) {
      this.outgoingIndex.set(sourceId, edges.filter(e => e.target !== id));
    }

    this.nodes.delete(id);
    this.metadata.nodeCount = this.nodes.size;
    this.metadata.edgeCount = this.edges.length;
    this.metadata.updated = new Date().toISOString();
    return true;
  }

  // ========================================================================
  // Edge Operations
  // ========================================================================

  /**
   * Add an edge to the graph
   */
  addEdge(edge: GraphEdge): void {
    // Check for duplicates
    const exists = this.edges.some(
      e => e.source === edge.source && e.target === edge.target && e.type === edge.type
    );
    if (exists) return;

    this.edges.push(edge);

    // Update incoming index
    if (!this.incomingIndex.has(edge.target)) {
      this.incomingIndex.set(edge.target, []);
    }
    this.incomingIndex.get(edge.target)!.push(edge);

    // Update outgoing index
    if (!this.outgoingIndex.has(edge.source)) {
      this.outgoingIndex.set(edge.source, []);
    }
    this.outgoingIndex.get(edge.source)!.push(edge);

    this.metadata.edgeCount = this.edges.length;
    this.metadata.updated = new Date().toISOString();
  }

  /**
   * Get incoming edges for a node
   */
  getIncomingEdges(nodeId: string): GraphEdge[] {
    return this.incomingIndex.get(nodeId) || [];
  }

  /**
   * Get outgoing edges for a node
   */
  getOutgoingEdges(nodeId: string): GraphEdge[] {
    return this.outgoingIndex.get(nodeId) || [];
  }

  /**
   * Get all edges
   */
  getAllEdges(): GraphEdge[] {
    return [...this.edges];
  }

  // ========================================================================
  // Graph Analysis
  // ========================================================================

  /**
   * Find orphan nodes (no incoming or outgoing links)
   */
  findOrphanNodes(): KnowledgeNode[] {
    return this.getAllNodes().filter(node => {
      const incoming = this.getIncomingEdges(node.id);
      const outgoing = this.getOutgoingEdges(node.id);
      return incoming.length === 0 && outgoing.length === 0;
    });
  }

  /**
   * Find most connected nodes
   */
  findMostConnected(limit = 10): Array<{ node: KnowledgeNode; connections: number }> {
    const connections = new Map<string, number>();

    for (const node of this.nodes.keys()) {
      const incoming = this.getIncomingEdges(node).length;
      const outgoing = this.getOutgoingEdges(node).length;
      connections.set(node, incoming + outgoing);
    }

    return Array.from(connections.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, count]) => ({
        node: this.nodes.get(id)!,
        connections: count,
      }));
  }

  /**
   * Find path between two nodes (BFS)
   */
  findPath(sourceId: string, targetId: string): string[] | null {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return null;
    }

    if (sourceId === targetId) {
      return [sourceId];
    }

    const visited = new Set<string>();
    const queue: Array<{ node: string; path: string[] }> = [
      { node: sourceId, path: [sourceId] },
    ];

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;

      if (visited.has(node)) continue;
      visited.add(node);

      const outgoing = this.getOutgoingEdges(node);
      for (const edge of outgoing) {
        if (edge.target === targetId) {
          return [...path, targetId];
        }
        if (!visited.has(edge.target)) {
          queue.push({ node: edge.target, path: [...path, edge.target] });
        }
      }
    }

    return null;
  }

  /**
   * Find related nodes (nodes connected within n hops)
   */
  findRelated(nodeId: string, maxHops = 2): KnowledgeNode[] {
    const related = new Set<string>();
    const visited = new Set<string>();
    const queue: Array<{ node: string; hops: number }> = [{ node: nodeId, hops: 0 }];

    while (queue.length > 0) {
      const { node, hops } = queue.shift()!;

      if (visited.has(node) || hops > maxHops) continue;
      visited.add(node);

      if (node !== nodeId) {
        related.add(node);
      }

      if (hops < maxHops) {
        const outgoing = this.getOutgoingEdges(node);
        const incoming = this.getIncomingEdges(node);

        for (const edge of [...outgoing, ...incoming]) {
          const neighbor = edge.source === node ? edge.target : edge.source;
          if (!visited.has(neighbor)) {
            queue.push({ node: neighbor, hops: hops + 1 });
          }
        }
      }
    }

    return Array.from(related)
      .map(id => this.nodes.get(id))
      .filter((n): n is KnowledgeNode => n !== undefined);
  }

  /**
   * Get graph statistics
   */
  getStats(): GraphStats {
    const nodesByType: Record<NodeType, number> = {
      concept: 0,
      technical: 0,
      feature: 0,
      primitive: 0,
      service: 0,
      guide: 0,
      standard: 0,
      integration: 0,
    };

    const nodesByStatus: Record<NodeStatus, number> = {
      draft: 0,
      active: 0,
      deprecated: 0,
      archived: 0,
    };

    for (const node of this.nodes.values()) {
      nodesByType[node.type]++;
      nodesByStatus[node.status]++;
    }

    const orphanNodes = this.findOrphanNodes().length;
    const avgLinksPerNode = this.nodes.size > 0
      ? this.edges.length / this.nodes.size
      : 0;

    const mostConnected = this.findMostConnected(5).map(({ node, connections }) => ({
      id: node.id,
      connections,
    }));

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      nodesByType,
      nodesByStatus,
      orphanNodes,
      avgLinksPerNode: Math.round(avgLinksPerNode * 100) / 100,
      mostConnected,
    };
  }

  // ========================================================================
  // Serialization
  // ========================================================================

  /**
   * Export graph to JSON
   */
  toJSON(): KnowledgeGraph {
    return {
      nodes: this.nodes,
      edges: [...this.edges],
      metadata: { ...this.metadata },
    };
  }

  /**
   * Import graph from JSON
   */
  static fromJSON(data: KnowledgeGraph): KnowledgeGraphManager {
    const manager = new KnowledgeGraphManager(
      data.metadata.name,
      data.metadata.rootPath
    );

    // Add nodes (this will also create edges from outgoing links)
    for (const [id, node] of data.nodes) {
      manager.nodes.set(id, node);

      // Index tags
      for (const tag of node.tags) {
        if (!manager.tagIndex.has(tag)) {
          manager.tagIndex.set(tag, new Set());
        }
        manager.tagIndex.get(tag)!.add(id);
      }
    }

    // Add edges
    for (const edge of data.edges) {
      manager.addEdge(edge);
    }

    manager.metadata = { ...data.metadata };
    return manager;
  }

  /**
   * Get graph metadata
   */
  getMetadata(): GraphMetadata {
    return { ...this.metadata };
  }
}

/**
 * Create a new knowledge graph manager
 */
export function createKnowledgeGraph(name: string, rootPath: string): KnowledgeGraphManager {
  return new KnowledgeGraphManager(name, rootPath);
}
