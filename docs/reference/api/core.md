# Core Module API

Core infrastructure for knowledge graph operations including graph management, database persistence, type definitions, and caching.

**Module:** `@weave-nn/knowledge-graph-agent/core`

---

## Table of Contents

- [KnowledgeGraphManager](#knowledgegraphmanager)
- [KnowledgeGraphDatabase](#knowledgegraphdatabase)
- [ShadowCache](#shadowcache)
- [Types](#types)
- [Factory Functions](#factory-functions)

---

## KnowledgeGraphManager

In-memory knowledge graph with efficient operations for node/edge management, traversal, and analysis.

### Constructor

```typescript
constructor(name: string, rootPath: string)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Name of the knowledge graph |
| `rootPath` | `string` | Root path of the project |

**Example:**

```typescript
import { KnowledgeGraphManager } from '@weave-nn/knowledge-graph-agent/core';

const graph = new KnowledgeGraphManager('my-project', '/path/to/project');
```

### Node Operations

#### addNode

Add a node to the graph.

```typescript
addNode(node: KnowledgeNode): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `node` | `KnowledgeNode` | The node to add |

**Example:**

```typescript
graph.addNode({
  id: 'auth-service',
  path: 'docs/services/auth.md',
  filename: 'auth.md',
  title: 'Authentication Service',
  type: 'service',
  status: 'active',
  content: 'Service documentation...',
  frontmatter: { description: 'Auth service docs' },
  tags: ['security', 'auth'],
  outgoingLinks: [{ target: 'user-model', type: 'wikilink' }],
  incomingLinks: [],
  wordCount: 500,
  lastModified: new Date(),
});
```

#### getNode

Get a node by ID.

```typescript
getNode(id: string): KnowledgeNode | undefined
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | The node ID |

**Returns:** `KnowledgeNode | undefined`

#### getAllNodes

Get all nodes in the graph.

```typescript
getAllNodes(): KnowledgeNode[]
```

**Returns:** `KnowledgeNode[]`

#### getNodesByType

Get nodes filtered by type.

```typescript
getNodesByType(type: NodeType): KnowledgeNode[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `NodeType` | Node type to filter by |

**Returns:** `KnowledgeNode[]`

#### getNodesByStatus

Get nodes filtered by status.

```typescript
getNodesByStatus(status: NodeStatus): KnowledgeNode[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | `NodeStatus` | Node status to filter by |

**Returns:** `KnowledgeNode[]`

#### getNodesByTag

Get nodes filtered by tag.

```typescript
getNodesByTag(tag: string): KnowledgeNode[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tag` | `string` | Tag to filter by |

**Returns:** `KnowledgeNode[]`

#### updateNode

Update an existing node.

```typescript
updateNode(id: string, updates: Partial<KnowledgeNode>): boolean
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Node ID to update |
| `updates` | `Partial<KnowledgeNode>` | Partial updates to apply |

**Returns:** `boolean` - `true` if node was found and updated

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

### Edge Operations

#### addEdge

Add an edge to the graph.

```typescript
addEdge(edge: GraphEdge): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `edge` | `GraphEdge` | The edge to add |

**Example:**

```typescript
graph.addEdge({
  source: 'auth-service',
  target: 'user-model',
  type: 'link',
  weight: 1,
  context: 'Referenced in authentication flow',
});
```

#### getIncomingEdges

Get edges pointing to a node.

```typescript
getIncomingEdges(nodeId: string): GraphEdge[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `nodeId` | `string` | Target node ID |

**Returns:** `GraphEdge[]`

#### getOutgoingEdges

Get edges originating from a node.

```typescript
getOutgoingEdges(nodeId: string): GraphEdge[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `nodeId` | `string` | Source node ID |

**Returns:** `GraphEdge[]`

#### getAllEdges

Get all edges in the graph.

```typescript
getAllEdges(): GraphEdge[]
```

**Returns:** `GraphEdge[]`

### Graph Analysis

#### findOrphanNodes

Find nodes with no connections.

```typescript
findOrphanNodes(): KnowledgeNode[]
```

**Returns:** `KnowledgeNode[]` - Nodes with no incoming or outgoing edges

#### findMostConnected

Find the most connected nodes.

```typescript
findMostConnected(limit?: number): Array<{ node: KnowledgeNode; connections: number }>
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | `number` | `10` | Maximum nodes to return |

**Returns:** `Array<{ node: KnowledgeNode; connections: number }>`

#### findPath

Find a path between two nodes using BFS.

```typescript
findPath(sourceId: string, targetId: string): string[] | null
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sourceId` | `string` | Starting node ID |
| `targetId` | `string` | Destination node ID |

**Returns:** `string[] | null` - Array of node IDs representing the path, or null if no path exists

**Example:**

```typescript
const path = graph.findPath('auth-service', 'user-model');
if (path) {
  console.log('Path:', path.join(' -> '));
}
```

#### findRelated

Find nodes related within N hops.

```typescript
findRelated(nodeId: string, maxHops?: number): KnowledgeNode[]
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `nodeId` | `string` | - | Starting node ID |
| `maxHops` | `number` | `2` | Maximum hops to traverse |

**Returns:** `KnowledgeNode[]`

#### getStats

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

### Serialization

#### toJSON

Export graph to JSON format.

```typescript
toJSON(): KnowledgeGraph
```

**Returns:** `KnowledgeGraph`

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

#### getMetadata

Get graph metadata.

```typescript
getMetadata(): GraphMetadata
```

**Returns:** `GraphMetadata`

---

## KnowledgeGraphDatabase

SQLite database for persistent storage of knowledge graph data with full-text search support.

### Constructor

```typescript
constructor(dbPath: string)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `dbPath` | `string` | Path to SQLite database file |

**Example:**

```typescript
import { KnowledgeGraphDatabase } from '@weave-nn/knowledge-graph-agent/core';

const db = new KnowledgeGraphDatabase('.kg/knowledge.db');
```

### Node Operations

#### upsertNode

Insert or update a node.

```typescript
upsertNode(node: KnowledgeNode): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `node` | `KnowledgeNode` | Node to insert or update |

#### getNode

Get a node by ID.

```typescript
getNode(id: string): KnowledgeNode | null
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Node ID |

**Returns:** `KnowledgeNode | null`

#### getNodeByPath

Get a node by file path.

```typescript
getNodeByPath(path: string): KnowledgeNode | null
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | File path |

**Returns:** `KnowledgeNode | null`

#### getAllNodes

Get all nodes.

```typescript
getAllNodes(): KnowledgeNode[]
```

**Returns:** `KnowledgeNode[]`

#### getNodesByType

Get nodes by type.

```typescript
getNodesByType(type: NodeType): KnowledgeNode[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `NodeType` | Node type filter |

**Returns:** `KnowledgeNode[]`

#### getNodesByStatus

Get nodes by status.

```typescript
getNodesByStatus(status: NodeStatus): KnowledgeNode[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | `NodeStatus` | Status filter |

**Returns:** `KnowledgeNode[]`

#### getNodesByTag

Get nodes by tag.

```typescript
getNodesByTag(tag: string): KnowledgeNode[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tag` | `string` | Tag filter |

**Returns:** `KnowledgeNode[]`

#### searchNodes

Full-text search across nodes.

```typescript
searchNodes(query: string, limit?: number): KnowledgeNode[]
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | `string` | - | Search query |
| `limit` | `number` | `50` | Maximum results |

**Returns:** `KnowledgeNode[]`

**Example:**

```typescript
const results = db.searchNodes('authentication service', 20);
for (const node of results) {
  console.log(`${node.title} (${node.type})`);
}
```

#### deleteNode

Delete a node.

```typescript
deleteNode(id: string): boolean
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Node ID to delete |

**Returns:** `boolean` - `true` if deleted

### Tag Operations

#### getNodeTags

Get tags for a node.

```typescript
getNodeTags(nodeId: string): string[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `nodeId` | `string` | Node ID |

**Returns:** `string[]`

#### getAllTags

Get all tags with counts.

```typescript
getAllTags(): Array<{ name: string; count: number }>
```

**Returns:** `Array<{ name: string; count: number }>`

### Edge Operations

#### addEdge

Add an edge.

```typescript
addEdge(edge: GraphEdge): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `edge` | `GraphEdge` | Edge to add |

#### getOutgoingEdges

Get outgoing edges for a node.

```typescript
getOutgoingEdges(nodeId: string): GraphEdge[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `nodeId` | `string` | Source node ID |

**Returns:** `GraphEdge[]`

#### getIncomingEdges

Get incoming edges for a node.

```typescript
getIncomingEdges(nodeId: string): GraphEdge[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `nodeId` | `string` | Target node ID |

**Returns:** `GraphEdge[]`

#### deleteNodeEdges

Delete all edges for a node.

```typescript
deleteNodeEdges(nodeId: string): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `nodeId` | `string` | Node ID |

### Statistics

#### getStats

Get graph statistics.

```typescript
getStats(): GraphStats
```

**Returns:** `GraphStats`

### Metadata

#### getMetadata

Get a metadata value.

```typescript
getMetadata(key: string): string | null
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | Metadata key |

**Returns:** `string | null`

#### setMetadata

Set a metadata value.

```typescript
setMetadata(key: string, value: string): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | Metadata key |
| `value` | `string` | Metadata value |

### Utilities

#### close

Close the database connection.

```typescript
close(): void
```

#### getDatabase

Get the raw database instance.

```typescript
getDatabase(): Database.Database
```

**Returns:** `Database.Database` - better-sqlite3 database instance

---

## ShadowCache

File metadata caching layer for incremental updates and improved performance.

### Constructor

```typescript
constructor(options: ShadowCacheOptions)
```

**Parameters:**

```typescript
interface ShadowCacheOptions {
  projectRoot: string;
  cacheDir?: string;      // Default: '.kg'
  defaultTTL?: number;    // Default: 3600000 (1 hour)
  maxEntries?: number;    // Default: 10000
  persist?: boolean;      // Default: true
}
```

**Example:**

```typescript
import { ShadowCache } from '@weave-nn/knowledge-graph-agent/core';

const cache = new ShadowCache({
  projectRoot: '/path/to/project',
  defaultTTL: 3600000,
  maxEntries: 10000,
});
```

### Loading and Saving

#### load

Load cache from disk.

```typescript
async load(): Promise<boolean>
```

**Returns:** `Promise<boolean>` - `true` if cache was loaded successfully

#### save

Save cache to disk.

```typescript
async save(): Promise<boolean>
```

**Returns:** `Promise<boolean>` - `true` if cache was saved successfully

### Cache Operations

#### get

Get cached metadata for a file.

```typescript
get(filePath: string): FileMetadata | undefined
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filePath` | `string` | File path |

**Returns:** `FileMetadata | undefined`

```typescript
interface FileMetadata {
  path: string;
  size: number;
  mtime: number;
  hash: string;
  type: FileType;
  cachedAt: number;
}
```

#### set

Set cached metadata for a file.

```typescript
set(filePath: string, metadata: Partial<FileMetadata>): FileMetadata
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filePath` | `string` | File path |
| `metadata` | `Partial<FileMetadata>` | Metadata to cache |

**Returns:** `FileMetadata`

#### delete

Remove a file from cache.

```typescript
delete(filePath: string): boolean
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filePath` | `string` | File path |

**Returns:** `boolean` - `true` if entry was deleted

#### has

Check if a file is in the cache.

```typescript
has(filePath: string): boolean
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filePath` | `string` | File path |

**Returns:** `boolean`

#### hasChanged

Check if a file has changed since caching.

```typescript
hasChanged(filePath: string): boolean
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filePath` | `string` | File path |

**Returns:** `boolean` - `true` if file has changed or is not cached

### Change Detection

#### detectChanges

Detect changes for a list of files.

```typescript
async detectChanges(filePaths: string[]): Promise<FileChange[]>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filePaths` | `string[]` | File paths to check |

**Returns:** `Promise<FileChange[]>`

```typescript
interface FileChange {
  path: string;
  change: ChangeType;  // 'added' | 'modified' | 'deleted' | 'unchanged'
  oldMeta?: FileMetadata;
  newMeta?: FileMetadata;
}
```

#### applyChanges

Update cache with detected changes.

```typescript
applyChanges(changes: FileChange[]): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `changes` | `FileChange[]` | Changes to apply |

### Statistics and Maintenance

#### getStats

Get cache statistics.

```typescript
getStats(): CacheStats
```

**Returns:** `CacheStats`

```typescript
interface CacheStats {
  totalEntries: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  sizeBytes: number;
  lastUpdated: number | null;
  staleEntries: number;
}
```

#### clear

Clear all cache entries.

```typescript
clear(): void
```

#### prune

Prune stale entries.

```typescript
async prune(): Promise<number>
```

**Returns:** `Promise<number>` - Number of entries pruned

### Query Methods

#### getAllPaths

Get all cached file paths.

```typescript
getAllPaths(): string[]
```

**Returns:** `string[]`

#### getByType

Get files by type.

```typescript
getByType(type: FileType): FileMetadata[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `FileType` | File type |

**Returns:** `FileMetadata[]`

#### invalidate

Invalidate entries matching a pattern.

```typescript
invalidate(pattern: RegExp): number
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `pattern` | `RegExp` | Pattern to match |

**Returns:** `number` - Number of entries invalidated

---

## Types

### KnowledgeNode

```typescript
interface KnowledgeNode {
  id: string;
  path: string;
  filename: string;
  title: string;
  type: NodeType;
  status: NodeStatus;
  content: string;
  frontmatter: NodeFrontmatter;
  tags: string[];
  outgoingLinks: NodeLink[];
  incomingLinks: NodeLink[];
  wordCount: number;
  lastModified: Date;
}
```

### NodeType

```typescript
type NodeType =
  | 'concept'
  | 'technical'
  | 'feature'
  | 'primitive'
  | 'service'
  | 'guide'
  | 'standard'
  | 'integration';
```

### NodeStatus

```typescript
type NodeStatus = 'draft' | 'active' | 'deprecated' | 'archived';
```

### NodeLink

```typescript
interface NodeLink {
  target: string;
  type: 'wikilink' | 'markdown' | 'backlink';
  text?: string;
  context?: string;
}
```

### NodeFrontmatter

```typescript
interface NodeFrontmatter {
  title?: string;
  type?: NodeType;
  status?: NodeStatus;
  tags?: string[];
  category?: string;
  description?: string;
  created?: string;
  updated?: string;
  aliases?: string[];
  related?: string[];
  [key: string]: unknown;
}
```

### GraphEdge

```typescript
interface GraphEdge {
  source: string;
  target: string;
  type: 'link' | 'reference' | 'parent' | 'related';
  weight: number;
  context?: string;
}
```

### KnowledgeGraph

```typescript
interface KnowledgeGraph {
  nodes: Map<string, KnowledgeNode>;
  edges: GraphEdge[];
  metadata: GraphMetadata;
}
```

### GraphMetadata

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

### FileType

```typescript
type FileType =
  | 'markdown'
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'rust'
  | 'go'
  | 'java'
  | 'php'
  | 'ruby'
  | 'yaml'
  | 'json'
  | 'toml'
  | 'config'
  | 'docker'
  | 'other';
```

---

## Factory Functions

### createKnowledgeGraph

Create a new knowledge graph manager.

```typescript
function createKnowledgeGraph(name: string, rootPath: string): KnowledgeGraphManager
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Graph name |
| `rootPath` | `string` | Project root path |

**Returns:** `KnowledgeGraphManager`

### createDatabase

Create a knowledge graph database instance.

```typescript
function createDatabase(dbPath: string): KnowledgeGraphDatabase
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `dbPath` | `string` | Database file path |

**Returns:** `KnowledgeGraphDatabase`

### createShadowCache

Create a shadow cache for a project.

```typescript
function createShadowCache(options: ShadowCacheOptions): ShadowCache
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `ShadowCacheOptions` | Cache options |

**Returns:** `ShadowCache`

### loadShadowCache

Load or create shadow cache for a project.

```typescript
async function loadShadowCache(projectRoot: string): Promise<ShadowCache>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `projectRoot` | `string` | Project root path |

**Returns:** `Promise<ShadowCache>`

---

## See Also

- [API Overview](./index.md)
- [Agents API](./agents.md)
- [Graph Operations](./graph.md)
