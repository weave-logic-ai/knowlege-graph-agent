class KnowledgeGraphManager {
  nodes = /* @__PURE__ */ new Map();
  edges = [];
  incomingIndex = /* @__PURE__ */ new Map();
  outgoingIndex = /* @__PURE__ */ new Map();
  tagIndex = /* @__PURE__ */ new Map();
  metadata;
  constructor(name, rootPath) {
    this.metadata = {
      name,
      version: "1.0.0",
      created: (/* @__PURE__ */ new Date()).toISOString(),
      updated: (/* @__PURE__ */ new Date()).toISOString(),
      nodeCount: 0,
      edgeCount: 0,
      rootPath
    };
  }
  // ========================================================================
  // Node Operations
  // ========================================================================
  /**
   * Add a node to the graph
   */
  addNode(node) {
    this.nodes.set(node.id, node);
    this.metadata.nodeCount = this.nodes.size;
    this.metadata.updated = (/* @__PURE__ */ new Date()).toISOString();
    for (const tag of node.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, /* @__PURE__ */ new Set());
      }
      this.tagIndex.get(tag).add(node.id);
    }
    for (const link of node.outgoingLinks) {
      this.addEdge({
        source: node.id,
        target: link.target,
        type: "link",
        weight: 1,
        context: link.context
      });
    }
  }
  /**
   * Get a node by ID
   */
  getNode(id) {
    return this.nodes.get(id);
  }
  /**
   * Get all nodes
   */
  getAllNodes() {
    return Array.from(this.nodes.values());
  }
  /**
   * Get nodes by type
   */
  getNodesByType(type) {
    return this.getAllNodes().filter((node) => node.type === type);
  }
  /**
   * Get nodes by status
   */
  getNodesByStatus(status) {
    return this.getAllNodes().filter((node) => node.status === status);
  }
  /**
   * Get nodes by tag
   */
  getNodesByTag(tag) {
    const nodeIds = this.tagIndex.get(tag);
    if (!nodeIds) return [];
    return Array.from(nodeIds).map((id) => this.nodes.get(id)).filter((n) => n !== void 0);
  }
  /**
   * Update a node
   */
  updateNode(id, updates) {
    const existing = this.nodes.get(id);
    if (!existing) return false;
    if (updates.tags) {
      for (const tag of existing.tags) {
        this.tagIndex.get(tag)?.delete(id);
      }
      for (const tag of updates.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, /* @__PURE__ */ new Set());
        }
        this.tagIndex.get(tag).add(id);
      }
    }
    const updated = {
      ...existing,
      ...updates,
      lastModified: /* @__PURE__ */ new Date()
    };
    this.nodes.set(id, updated);
    this.metadata.updated = (/* @__PURE__ */ new Date()).toISOString();
    return true;
  }
  /**
   * Remove a node
   */
  removeNode(id) {
    const node = this.nodes.get(id);
    if (!node) return false;
    for (const tag of node.tags) {
      this.tagIndex.get(tag)?.delete(id);
    }
    this.edges = this.edges.filter((e) => e.source !== id && e.target !== id);
    this.incomingIndex.delete(id);
    this.outgoingIndex.delete(id);
    for (const [targetId, edges] of this.incomingIndex) {
      this.incomingIndex.set(targetId, edges.filter((e) => e.source !== id));
    }
    for (const [sourceId, edges] of this.outgoingIndex) {
      this.outgoingIndex.set(sourceId, edges.filter((e) => e.target !== id));
    }
    this.nodes.delete(id);
    this.metadata.nodeCount = this.nodes.size;
    this.metadata.edgeCount = this.edges.length;
    this.metadata.updated = (/* @__PURE__ */ new Date()).toISOString();
    return true;
  }
  // ========================================================================
  // Edge Operations
  // ========================================================================
  /**
   * Add an edge to the graph
   */
  addEdge(edge) {
    const exists = this.edges.some(
      (e) => e.source === edge.source && e.target === edge.target && e.type === edge.type
    );
    if (exists) return;
    this.edges.push(edge);
    if (!this.incomingIndex.has(edge.target)) {
      this.incomingIndex.set(edge.target, []);
    }
    this.incomingIndex.get(edge.target).push(edge);
    if (!this.outgoingIndex.has(edge.source)) {
      this.outgoingIndex.set(edge.source, []);
    }
    this.outgoingIndex.get(edge.source).push(edge);
    this.metadata.edgeCount = this.edges.length;
    this.metadata.updated = (/* @__PURE__ */ new Date()).toISOString();
  }
  /**
   * Get incoming edges for a node
   */
  getIncomingEdges(nodeId) {
    return this.incomingIndex.get(nodeId) || [];
  }
  /**
   * Get outgoing edges for a node
   */
  getOutgoingEdges(nodeId) {
    return this.outgoingIndex.get(nodeId) || [];
  }
  /**
   * Get all edges
   */
  getAllEdges() {
    return [...this.edges];
  }
  // ========================================================================
  // Graph Analysis
  // ========================================================================
  /**
   * Find orphan nodes (no incoming or outgoing links)
   */
  findOrphanNodes() {
    return this.getAllNodes().filter((node) => {
      const incoming = this.getIncomingEdges(node.id);
      const outgoing = this.getOutgoingEdges(node.id);
      return incoming.length === 0 && outgoing.length === 0;
    });
  }
  /**
   * Find most connected nodes
   */
  findMostConnected(limit = 10) {
    const connections = /* @__PURE__ */ new Map();
    for (const node of this.nodes.keys()) {
      const incoming = this.getIncomingEdges(node).length;
      const outgoing = this.getOutgoingEdges(node).length;
      connections.set(node, incoming + outgoing);
    }
    return Array.from(connections.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id, count]) => ({
      node: this.nodes.get(id),
      connections: count
    }));
  }
  /**
   * Find path between two nodes (BFS)
   */
  findPath(sourceId, targetId) {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return null;
    }
    if (sourceId === targetId) {
      return [sourceId];
    }
    const visited = /* @__PURE__ */ new Set();
    const queue = [
      { node: sourceId, path: [sourceId] }
    ];
    while (queue.length > 0) {
      const { node, path } = queue.shift();
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
  findRelated(nodeId, maxHops = 2) {
    const related = /* @__PURE__ */ new Set();
    const visited = /* @__PURE__ */ new Set();
    const queue = [{ node: nodeId, hops: 0 }];
    while (queue.length > 0) {
      const { node, hops } = queue.shift();
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
    return Array.from(related).map((id) => this.nodes.get(id)).filter((n) => n !== void 0);
  }
  /**
   * Get graph statistics
   */
  getStats() {
    const nodesByType = {
      concept: 0,
      technical: 0,
      feature: 0,
      primitive: 0,
      service: 0,
      guide: 0,
      standard: 0,
      integration: 0
    };
    const nodesByStatus = {
      draft: 0,
      active: 0,
      deprecated: 0,
      archived: 0
    };
    for (const node of this.nodes.values()) {
      nodesByType[node.type]++;
      nodesByStatus[node.status]++;
    }
    const orphanNodes = this.findOrphanNodes().length;
    const avgLinksPerNode = this.nodes.size > 0 ? this.edges.length / this.nodes.size : 0;
    const mostConnected = this.findMostConnected(5).map(({ node, connections }) => ({
      id: node.id,
      connections
    }));
    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      nodesByType,
      nodesByStatus,
      orphanNodes,
      avgLinksPerNode: Math.round(avgLinksPerNode * 100) / 100,
      mostConnected
    };
  }
  // ========================================================================
  // Serialization
  // ========================================================================
  /**
   * Export graph to JSON
   */
  toJSON() {
    return {
      nodes: this.nodes,
      edges: [...this.edges],
      metadata: { ...this.metadata }
    };
  }
  /**
   * Import graph from JSON
   */
  static fromJSON(data) {
    const manager = new KnowledgeGraphManager(
      data.metadata.name,
      data.metadata.rootPath
    );
    for (const [id, node] of data.nodes) {
      manager.nodes.set(id, node);
      for (const tag of node.tags) {
        if (!manager.tagIndex.has(tag)) {
          manager.tagIndex.set(tag, /* @__PURE__ */ new Set());
        }
        manager.tagIndex.get(tag).add(id);
      }
    }
    for (const edge of data.edges) {
      manager.addEdge(edge);
    }
    manager.metadata = { ...data.metadata };
    return manager;
  }
  /**
   * Get graph metadata
   */
  getMetadata() {
    return { ...this.metadata };
  }
}
function createKnowledgeGraph(name, rootPath) {
  return new KnowledgeGraphManager(name, rootPath);
}
export {
  KnowledgeGraphManager,
  createKnowledgeGraph
};
//# sourceMappingURL=graph.js.map
