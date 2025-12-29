# Graph Operations API

Comprehensive reference for graph operations, traversal algorithms, and analysis functions.

**Module:** `@weave-nn/knowledge-graph-agent/core`

---

## Table of Contents

- [Node Operations](#node-operations)
- [Edge Operations](#edge-operations)
- [Search Operations](#search-operations)
- [Traversal Algorithms](#traversal-algorithms)
- [Analysis Functions](#analysis-functions)
- [Serialization](#serialization)
- [Statistics](#statistics)

---

## Node Operations

### Adding Nodes

#### addNode

Add a node to the knowledge graph.

```typescript
addNode(node: KnowledgeNode): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `node` | `KnowledgeNode` | Complete node object |

**Behavior:**
- Adds node to internal node map
- Indexes all tags for efficient tag-based queries
- Creates edges from outgoing links
- Updates graph metadata

**Example:**

```typescript
graph.addNode({
  id: 'auth-service',
  path: 'docs/services/auth.md',
  filename: 'auth.md',
  title: 'Authentication Service',
  type: 'service',
  status: 'active',
  content: '# Authentication Service\n\nHandles user authentication...',
  frontmatter: {
    description: 'User authentication service',
    version: '2.0.0',
  },
  tags: ['security', 'auth', 'core'],
  outgoingLinks: [
    { target: 'user-model', type: 'wikilink', context: 'References user model' },
    { target: 'jwt-token', type: 'wikilink', context: 'Uses JWT tokens' },
  ],
  incomingLinks: [],
  wordCount: 1500,
  lastModified: new Date(),
});
```

### Retrieving Nodes

#### getNode

Get a single node by ID.

```typescript
getNode(id: string): KnowledgeNode | undefined
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Unique node identifier |

**Returns:** `KnowledgeNode | undefined`

**Example:**

```typescript
const node = graph.getNode('auth-service');
if (node) {
  console.log(`Title: ${node.title}`);
  console.log(`Type: ${node.type}`);
  console.log(`Tags: ${node.tags.join(', ')}`);
}
```

#### getAllNodes

Get all nodes in the graph.

```typescript
getAllNodes(): KnowledgeNode[]
```

**Returns:** `KnowledgeNode[]` - Array of all nodes

**Example:**

```typescript
const allNodes = graph.getAllNodes();
console.log(`Total nodes: ${allNodes.length}`);
```

#### getNodesByType

Get nodes filtered by type.

```typescript
getNodesByType(type: NodeType): KnowledgeNode[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `NodeType` | Node type to filter |

**Returns:** `KnowledgeNode[]`

**Example:**

```typescript
const services = graph.getNodesByType('service');
const concepts = graph.getNodesByType('concept');
const guides = graph.getNodesByType('guide');

console.log(`Services: ${services.length}`);
console.log(`Concepts: ${concepts.length}`);
console.log(`Guides: ${guides.length}`);
```

#### getNodesByStatus

Get nodes filtered by status.

```typescript
getNodesByStatus(status: NodeStatus): KnowledgeNode[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | `NodeStatus` | Node status to filter |

**Returns:** `KnowledgeNode[]`

**Example:**

```typescript
const activeNodes = graph.getNodesByStatus('active');
const draftNodes = graph.getNodesByStatus('draft');
const deprecatedNodes = graph.getNodesByStatus('deprecated');
```

#### getNodesByTag

Get nodes with a specific tag.

```typescript
getNodesByTag(tag: string): KnowledgeNode[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tag` | `string` | Tag to filter by |

**Returns:** `KnowledgeNode[]`

**Example:**

```typescript
const securityDocs = graph.getNodesByTag('security');
const apiDocs = graph.getNodesByTag('api');
```

### Updating Nodes

#### updateNode

Update an existing node.

```typescript
updateNode(id: string, updates: Partial<KnowledgeNode>): boolean
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Node ID to update |
| `updates` | `Partial<KnowledgeNode>` | Fields to update |

**Returns:** `boolean` - `true` if node was found and updated

**Behavior:**
- Merges updates with existing node
- Re-indexes tags if tags are updated
- Updates `lastModified` timestamp
- Updates graph metadata

**Example:**

```typescript
const updated = graph.updateNode('auth-service', {
  status: 'deprecated',
  tags: ['security', 'auth', 'legacy'],
  frontmatter: {
    ...existingFrontmatter,
    deprecatedSince: '2024-01-01',
    replacedBy: 'auth-service-v2',
  },
});

if (updated) {
  console.log('Node updated successfully');
}
```

### Removing Nodes

#### removeNode

Remove a node from the graph.

```typescript
removeNode(id: string): boolean
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Node ID to remove |

**Returns:** `boolean` - `true` if node was found and removed

**Behavior:**
- Removes node from node map
- Removes from tag index
- Removes all edges where node is source or target
- Updates graph metadata

**Example:**

```typescript
const removed = graph.removeNode('deprecated-feature');
if (removed) {
  console.log('Node and all related edges removed');
}
```

---

## Edge Operations

### Adding Edges

#### addEdge

Add an edge to the graph.

```typescript
addEdge(edge: GraphEdge): void
```

**Parameters:**

```typescript
interface GraphEdge {
  source: string;      // Source node ID
  target: string;      // Target node ID
  type: EdgeType;      // 'link' | 'reference' | 'parent' | 'related'
  weight: number;      // Relationship strength 0-1
  context?: string;    // Context description
}
```

**Behavior:**
- Checks for duplicate edges (same source, target, type)
- Updates incoming and outgoing indices
- Updates graph metadata

**Example:**

```typescript
graph.addEdge({
  source: 'auth-service',
  target: 'user-model',
  type: 'link',
  weight: 1,
  context: 'Authentication service uses User model for validation',
});

graph.addEdge({
  source: 'auth-service',
  target: 'security-guide',
  type: 'related',
  weight: 0.8,
  context: 'Related security documentation',
});
```

### Retrieving Edges

#### getIncomingEdges

Get edges pointing to a node.

```typescript
getIncomingEdges(nodeId: string): GraphEdge[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `nodeId` | `string` | Target node ID |

**Returns:** `GraphEdge[]` - Edges where `target === nodeId`

**Example:**

```typescript
const incoming = graph.getIncomingEdges('user-model');
console.log(`${incoming.length} nodes reference User Model`);

for (const edge of incoming) {
  console.log(`  ${edge.source} -> user-model (${edge.type})`);
}
```

#### getOutgoingEdges

Get edges originating from a node.

```typescript
getOutgoingEdges(nodeId: string): GraphEdge[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `nodeId` | `string` | Source node ID |

**Returns:** `GraphEdge[]` - Edges where `source === nodeId`

**Example:**

```typescript
const outgoing = graph.getOutgoingEdges('auth-service');
console.log(`Auth Service references ${outgoing.length} nodes`);

for (const edge of outgoing) {
  console.log(`  auth-service -> ${edge.target} (${edge.type})`);
}
```

#### getAllEdges

Get all edges in the graph.

```typescript
getAllEdges(): GraphEdge[]
```

**Returns:** `GraphEdge[]` - Copy of all edges

---

## Search Operations

### Database Search

#### searchNodes

Full-text search across node titles and content.

```typescript
searchNodes(query: string, limit?: number): KnowledgeNode[]
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | `string` | - | Search query |
| `limit` | `number` | `50` | Maximum results |

**Returns:** `KnowledgeNode[]` - Matching nodes sorted by relevance

**Example:**

```typescript
// Search for authentication-related content
const results = db.searchNodes('authentication jwt token', 20);

for (const node of results) {
  console.log(`${node.title} (${node.type})`);
}
```

### Tag-Based Search

#### getNodesByTag (Database)

Get nodes with a specific tag.

```typescript
getNodesByTag(tag: string): KnowledgeNode[]
```

**Example:**

```typescript
// Find all security-related documentation
const securityDocs = db.getNodesByTag('security');
```

### Multi-Tag Search

For complex tag queries, combine results:

```typescript
// Find nodes with ALL tags
function getNodesWithAllTags(tags: string[]): KnowledgeNode[] {
  if (tags.length === 0) return [];

  const sets = tags.map(tag => new Set(
    graph.getNodesByTag(tag).map(n => n.id)
  ));

  const intersection = [...sets[0]].filter(id =>
    sets.every(set => set.has(id))
  );

  return intersection.map(id => graph.getNode(id)!);
}

// Find nodes with ANY tag
function getNodesWithAnyTag(tags: string[]): KnowledgeNode[] {
  const nodeIds = new Set<string>();

  for (const tag of tags) {
    for (const node of graph.getNodesByTag(tag)) {
      nodeIds.add(node.id);
    }
  }

  return [...nodeIds].map(id => graph.getNode(id)!);
}
```

---

## Traversal Algorithms

### Path Finding

#### findPath

Find the shortest path between two nodes using BFS.

```typescript
findPath(sourceId: string, targetId: string): string[] | null
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sourceId` | `string` | Starting node ID |
| `targetId` | `string` | Destination node ID |

**Returns:** `string[] | null` - Array of node IDs in path order, or `null` if no path exists

**Algorithm:** Breadth-First Search (BFS)

**Example:**

```typescript
const path = graph.findPath('user-login', 'database-schema');

if (path) {
  console.log('Path found:');
  console.log(path.join(' -> '));
  // Output: user-login -> auth-service -> user-model -> database-schema
} else {
  console.log('No path exists between these nodes');
}
```

### Related Node Discovery

#### findRelated

Find nodes within N hops of a source node.

```typescript
findRelated(nodeId: string, maxHops?: number): KnowledgeNode[]
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `nodeId` | `string` | - | Starting node ID |
| `maxHops` | `number` | `2` | Maximum traversal depth |

**Returns:** `KnowledgeNode[]` - Related nodes (excluding source)

**Behavior:**
- Traverses both incoming and outgoing edges
- Uses BFS to maintain hop distance
- Excludes the source node from results

**Example:**

```typescript
// Find directly connected nodes (1 hop)
const directlyRelated = graph.findRelated('auth-service', 1);
console.log(`Directly connected: ${directlyRelated.length} nodes`);

// Find extended network (2 hops)
const extendedNetwork = graph.findRelated('auth-service', 2);
console.log(`Extended network: ${extendedNetwork.length} nodes`);

// Find broader context (3 hops)
const broaderContext = graph.findRelated('auth-service', 3);
console.log(`Broader context: ${broaderContext.length} nodes`);
```

### Custom Traversal

Implement custom traversal using edge methods:

```typescript
// Depth-first traversal
function dfsTraversal(
  graph: KnowledgeGraphManager,
  startId: string,
  visitor: (node: KnowledgeNode, depth: number) => boolean
): void {
  const visited = new Set<string>();

  function visit(nodeId: string, depth: number): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = graph.getNode(nodeId);
    if (!node) return;

    const continueTraversal = visitor(node, depth);
    if (!continueTraversal) return;

    for (const edge of graph.getOutgoingEdges(nodeId)) {
      visit(edge.target, depth + 1);
    }
  }

  visit(startId, 0);
}

// Usage
dfsTraversal(graph, 'root-node', (node, depth) => {
  console.log(`${'  '.repeat(depth)}${node.title}`);
  return depth < 5; // Max depth of 5
});
```

---

## Analysis Functions

### Orphan Detection

#### findOrphanNodes

Find nodes with no connections.

```typescript
findOrphanNodes(): KnowledgeNode[]
```

**Returns:** `KnowledgeNode[]` - Nodes with no incoming or outgoing edges

**Example:**

```typescript
const orphans = graph.findOrphanNodes();

if (orphans.length > 0) {
  console.log(`Found ${orphans.length} orphan nodes:`);
  for (const node of orphans) {
    console.log(`  - ${node.title} (${node.path})`);
  }
}
```

### Hub Detection

#### findMostConnected

Find the most connected nodes (hubs).

```typescript
findMostConnected(limit?: number): Array<{ node: KnowledgeNode; connections: number }>
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | `number` | `10` | Maximum nodes to return |

**Returns:** `Array<{ node: KnowledgeNode; connections: number }>`

**Example:**

```typescript
const hubs = graph.findMostConnected(5);

console.log('Top 5 most connected nodes:');
for (const { node, connections } of hubs) {
  console.log(`  ${node.title}: ${connections} connections`);
}
```

### Connectivity Analysis

```typescript
// Calculate connectivity metrics for a node
function analyzeNodeConnectivity(graph: KnowledgeGraphManager, nodeId: string) {
  const incoming = graph.getIncomingEdges(nodeId);
  const outgoing = graph.getOutgoingEdges(nodeId);

  return {
    inDegree: incoming.length,
    outDegree: outgoing.length,
    totalDegree: incoming.length + outgoing.length,
    isHub: incoming.length + outgoing.length > 10,
    isOrphan: incoming.length === 0 && outgoing.length === 0,
    isSource: incoming.length === 0 && outgoing.length > 0,
    isSink: outgoing.length === 0 && incoming.length > 0,
  };
}

// Find clusters
function findClusters(graph: KnowledgeGraphManager): string[][] {
  const visited = new Set<string>();
  const clusters: string[][] = [];

  for (const node of graph.getAllNodes()) {
    if (!visited.has(node.id)) {
      const cluster: string[] = [];
      const queue = [node.id];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;

        visited.add(current);
        cluster.push(current);

        const neighbors = [
          ...graph.getOutgoingEdges(current).map(e => e.target),
          ...graph.getIncomingEdges(current).map(e => e.source),
        ];

        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      clusters.push(cluster);
    }
  }

  return clusters;
}
```

---

## Serialization

### Export

#### toJSON

Export graph to JSON format.

```typescript
toJSON(): KnowledgeGraph
```

**Returns:** `KnowledgeGraph`

```typescript
interface KnowledgeGraph {
  nodes: Map<string, KnowledgeNode>;
  edges: GraphEdge[];
  metadata: GraphMetadata;
}
```

**Example:**

```typescript
const graphData = graph.toJSON();

// Save to file
import { writeFileSync } from 'fs';
writeFileSync(
  'graph-backup.json',
  JSON.stringify({
    nodes: Object.fromEntries(graphData.nodes),
    edges: graphData.edges,
    metadata: graphData.metadata,
  }, null, 2)
);
```

### Import

#### fromJSON (static)

Import graph from JSON.

```typescript
static fromJSON(data: KnowledgeGraph): KnowledgeGraphManager
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `KnowledgeGraph` | Serialized graph data |

**Returns:** `KnowledgeGraphManager`

**Example:**

```typescript
import { readFileSync } from 'fs';

const rawData = JSON.parse(readFileSync('graph-backup.json', 'utf-8'));
const graphData: KnowledgeGraph = {
  nodes: new Map(Object.entries(rawData.nodes)),
  edges: rawData.edges,
  metadata: rawData.metadata,
};

const restoredGraph = KnowledgeGraphManager.fromJSON(graphData);
console.log(`Restored ${restoredGraph.getStats().totalNodes} nodes`);
```

### Metadata

#### getMetadata

Get graph metadata.

```typescript
getMetadata(): GraphMetadata
```

**Returns:** `GraphMetadata`

```typescript
interface GraphMetadata {
  name: string;
  version: string;
  created: string;
  updated: string;
  nodeCount: number;
  edgeCount: number;
  rootPath: string;
}
```

**Example:**

```typescript
const meta = graph.getMetadata();
console.log(`Graph: ${meta.name}`);
console.log(`Version: ${meta.version}`);
console.log(`Nodes: ${meta.nodeCount}`);
console.log(`Edges: ${meta.edgeCount}`);
console.log(`Last updated: ${meta.updated}`);
```

---

## Statistics

### getStats

Get comprehensive graph statistics.

```typescript
getStats(): GraphStats
```

**Returns:** `GraphStats`

```typescript
interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<NodeType, number>;
  nodesByStatus: Record<NodeStatus, number>;
  orphanNodes: number;
  avgLinksPerNode: number;
  mostConnected: Array<{ id: string; connections: number }>;
}
```

**Example:**

```typescript
const stats = graph.getStats();

console.log('=== Graph Statistics ===');
console.log(`Total Nodes: ${stats.totalNodes}`);
console.log(`Total Edges: ${stats.totalEdges}`);
console.log(`Orphan Nodes: ${stats.orphanNodes}`);
console.log(`Avg Links/Node: ${stats.avgLinksPerNode.toFixed(2)}`);

console.log('\nNodes by Type:');
for (const [type, count] of Object.entries(stats.nodesByType)) {
  if (count > 0) {
    console.log(`  ${type}: ${count}`);
  }
}

console.log('\nNodes by Status:');
for (const [status, count] of Object.entries(stats.nodesByStatus)) {
  if (count > 0) {
    console.log(`  ${status}: ${count}`);
  }
}

console.log('\nMost Connected:');
for (const { id, connections } of stats.mostConnected.slice(0, 5)) {
  const node = graph.getNode(id);
  console.log(`  ${node?.title || id}: ${connections} connections`);
}
```

### Database Statistics

The database provides the same statistics with SQL-optimized queries:

```typescript
const dbStats = db.getStats();

// Same structure as graph.getStats()
console.log(`Total nodes in database: ${dbStats.totalNodes}`);
```

### Tag Statistics

#### getAllTags (Database)

Get tag usage statistics.

```typescript
getAllTags(): Array<{ name: string; count: number }>
```

**Returns:** `Array<{ name: string; count: number }>`

**Example:**

```typescript
const tags = db.getAllTags();

console.log('Tag Cloud:');
for (const { name, count } of tags.slice(0, 20)) {
  console.log(`  #${name}: ${count} nodes`);
}
```

---

## See Also

- [API Overview](./index.md)
- [Core Module API](./core.md)
- [Agents API](./agents.md)
