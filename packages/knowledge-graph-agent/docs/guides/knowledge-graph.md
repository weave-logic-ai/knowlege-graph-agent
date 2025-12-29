# Knowledge Graph Guide

The Knowledge Graph system provides a structured way to organize, connect, and query documentation and code knowledge. It supports wiki-style linking, full-text search, and graph traversal.

## Core Concepts

### Nodes

Nodes are the fundamental units of the knowledge graph. Each node represents a piece of knowledge such as a concept, feature, or technical component.

#### Node Types

| Type | Description | Use Case |
|------|-------------|----------|
| `concept` | Abstract concepts and ideas | Design patterns, principles |
| `technical` | Technical components | Classes, modules, APIs |
| `feature` | Product features | User-facing capabilities |
| `primitive` | Base technology | Frameworks, libraries |
| `service` | Backend services | APIs, microservices |
| `guide` | How-to guides | Tutorials, walkthroughs |
| `standard` | Coding standards | Conventions, style guides |
| `integration` | External integrations | Third-party services |

#### Node Status

| Status | Description |
|--------|-------------|
| `draft` | Work in progress |
| `active` | Current and maintained |
| `deprecated` | Superseded, avoid use |
| `archived` | Historical reference only |

### Edges

Edges represent relationships between nodes. They have types and weights indicating relationship strength.

#### Edge Types

| Type | Description | Weight Range |
|------|-------------|--------------|
| `link` | Direct reference | 0.7 - 1.0 |
| `reference` | Contextual mention | 0.3 - 0.7 |
| `parent` | Hierarchical parent | 0.9 - 1.0 |
| `related` | Semantic similarity | 0.1 - 0.9 |

## Basic Operations

### Creating a Knowledge Graph

```typescript
import { KnowledgeGraph } from '@knowledge-graph-agent/core';

// Initialize graph from a docs directory
const graph = new KnowledgeGraph({
  projectRoot: '/path/to/project',
  docsRoot: '/path/to/docs'
});

// Load existing nodes
await graph.load();

console.log(`Loaded ${graph.nodeCount} nodes`);
```

### Creating Nodes

```typescript
// Create a concept node
const conceptNode = await graph.createNode({
  type: 'concept',
  title: 'Event Sourcing',
  content: `
# Event Sourcing

Event sourcing is an architectural pattern...
  `,
  frontmatter: {
    status: 'active',
    tags: ['architecture', 'patterns'],
    category: 'Design Patterns',
    related: ['CQRS', 'Domain Events']
  }
});

// Create a technical node
const technicalNode = await graph.createNode({
  type: 'technical',
  title: 'EventStore',
  content: `
# EventStore Class

Implementation of the event store...
  `,
  frontmatter: {
    status: 'active',
    tags: ['implementation', 'storage'],
    category: 'Infrastructure'
  }
});
```

### Retrieving Nodes

```typescript
// Get by ID
const node = await graph.getNode('event-sourcing');

// Get by path
const nodeByPath = await graph.getNodeByPath('docs/concepts/event-sourcing.md');

// Get all nodes of a type
const concepts = await graph.getNodesByType('concept');

// Get nodes by status
const activeNodes = await graph.getNodesByStatus('active');

// Get nodes by tag
const patternNodes = await graph.getNodesByTag('patterns');
```

### Updating Nodes

```typescript
// Update node content
await graph.updateNode('event-sourcing', {
  content: 'Updated content...',
  frontmatter: {
    ...node.frontmatter,
    updated: new Date().toISOString()
  }
});

// Update status
await graph.updateNodeStatus('event-sourcing', 'deprecated');

// Add tags
await graph.addTags('event-sourcing', ['legacy', 'migration-needed']);
```

### Deleting Nodes

```typescript
// Delete a node (also removes associated edges)
await graph.deleteNode('event-sourcing');

// Soft delete (archive)
await graph.archiveNode('event-sourcing');
```

## Working with Edges

### Creating Edges

```typescript
// Create a direct link
await graph.createEdge({
  source: 'event-sourcing',
  target: 'cqrs',
  type: 'related',
  weight: 0.8,
  context: 'Often used together'
});

// Create a parent relationship
await graph.createEdge({
  source: 'event-store-implementation',
  target: 'event-sourcing',
  type: 'parent',
  weight: 1.0
});
```

### Querying Edges

```typescript
// Get outgoing links
const outgoing = await graph.getOutgoingEdges('event-sourcing');

// Get incoming links (backlinks)
const incoming = await graph.getIncomingEdges('event-sourcing');

// Get all connected nodes
const connected = await graph.getConnectedNodes('event-sourcing');

// Get edges by type
const related = await graph.getEdgesByType('related');
```

## Wiki-Link Parsing

The system supports Obsidian-style wiki-links for connecting nodes.

### Link Syntax

```markdown
# Basic wiki-link
[[Node Title]]

# Wiki-link with display text
[[node-id|Display Text]]

# Wiki-link with header reference
[[Node Title#Section]]

# Wiki-link with block reference
[[Node Title#^block-id]]
```

### Parsing Links

```typescript
import { parseWikiLinks } from '@knowledge-graph-agent/core';

const content = `
This relates to [[Event Sourcing]] and [[CQRS|Command Query Separation]].
See [[Architecture Guide#Event-Driven]] for more details.
`;

const links = parseWikiLinks(content);
// [
//   { target: 'Event Sourcing', type: 'wikilink' },
//   { target: 'CQRS', text: 'Command Query Separation', type: 'wikilink' },
//   { target: 'Architecture Guide', section: 'Event-Driven', type: 'wikilink' }
// ]
```

### Auto-Linking

```typescript
// Enable auto-linking during node creation
await graph.createNode({
  type: 'concept',
  title: 'CQRS',
  content: 'CQRS works well with [[Event Sourcing]]...',
  autoLink: true // Automatically creates edges for wiki-links
});
```

## Tag Management

### Working with Tags

```typescript
// Get all tags
const allTags = await graph.getAllTags();

// Get tag counts
const tagCounts = await graph.getTagCounts();
// { 'architecture': 15, 'patterns': 12, ... }

// Get nodes by multiple tags (AND)
const nodes = await graph.getNodesByTags(['architecture', 'patterns']);

// Get nodes by any tag (OR)
const nodes = await graph.getNodesByAnyTag(['architecture', 'patterns']);

// Rename a tag across all nodes
await graph.renameTag('old-tag', 'new-tag');

// Merge tags
await graph.mergeTags(['pattern', 'patterns'], 'patterns');
```

### Tag Hierarchies

```typescript
// Create hierarchical tags
await graph.createNode({
  type: 'concept',
  title: 'Repository Pattern',
  frontmatter: {
    tags: ['patterns/ddd', 'patterns/repository']
  }
});

// Query hierarchical tags
const dddPatterns = await graph.getNodesByTagPrefix('patterns/ddd');
```

## Full-Text Search (FTS5)

The knowledge graph uses SQLite FTS5 for powerful full-text search.

### Basic Search

```typescript
// Simple search
const results = await graph.search('event sourcing');

// Search with options
const results = await graph.search('event sourcing', {
  types: ['concept', 'technical'],
  status: 'active',
  limit: 20,
  offset: 0
});
```

### Advanced Search

```typescript
// Phrase search
const results = await graph.search('"event sourcing pattern"');

// Boolean operators
const results = await graph.search('event AND sourcing NOT legacy');

// Prefix search
const results = await graph.search('event*');

// Column-specific search
const results = await graph.search('title:event content:sourcing');

// Proximity search (words within N tokens)
const results = await graph.search('NEAR(event sourcing, 5)');
```

### Search Results

```typescript
interface SearchResult {
  node: KnowledgeNode;
  score: number;        // Relevance score
  highlights: string[]; // Matched snippets
  matchedFields: string[];
}

const results = await graph.search('event sourcing');
for (const result of results) {
  console.log(`${result.node.title} (score: ${result.score})`);
  console.log(`Highlights: ${result.highlights.join('...')}`);
}
```

## Graph Statistics

### Getting Statistics

```typescript
const stats = await graph.getStatistics();

console.log(`Total nodes: ${stats.totalNodes}`);
console.log(`Total edges: ${stats.totalEdges}`);
console.log(`Orphan nodes: ${stats.orphanNodes}`);
console.log(`Avg links per node: ${stats.avgLinksPerNode}`);

// Nodes by type
for (const [type, count] of Object.entries(stats.nodesByType)) {
  console.log(`${type}: ${count}`);
}

// Most connected nodes
for (const node of stats.mostConnected) {
  console.log(`${node.id}: ${node.connections} connections`);
}
```

### GraphStats Structure

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

## Import and Export

### Exporting the Graph

```typescript
// Export to JSON
const json = await graph.exportJSON();
await fs.writeFile('graph-export.json', JSON.stringify(json, null, 2));

// Export specific nodes
const partial = await graph.exportJSON({
  types: ['concept', 'technical'],
  status: 'active'
});

// Export to GraphML (for visualization tools)
const graphml = await graph.exportGraphML();
await fs.writeFile('graph.graphml', graphml);

// Export to DOT (for Graphviz)
const dot = await graph.exportDOT();
await fs.writeFile('graph.dot', dot);
```

### Importing Data

```typescript
// Import from JSON
const json = JSON.parse(await fs.readFile('graph-export.json', 'utf-8'));
await graph.importJSON(json);

// Import with merge strategy
await graph.importJSON(json, {
  strategy: 'merge',      // 'replace' | 'merge' | 'skip'
  conflictResolution: 'newer' // 'source' | 'target' | 'newer'
});

// Import from markdown files
await graph.importMarkdownDirectory('/path/to/docs', {
  recursive: true,
  patterns: ['**/*.md'],
  exclude: ['node_modules/**']
});
```

## Graph Traversal

### Path Finding

```typescript
// Find shortest path between nodes
const path = await graph.findPath('event-sourcing', 'microservices');
console.log(path.nodes.map(n => n.title).join(' -> '));

// Find all paths (up to max depth)
const allPaths = await graph.findAllPaths('event-sourcing', 'microservices', {
  maxDepth: 5
});
```

### Neighborhood Queries

```typescript
// Get immediate neighbors
const neighbors = await graph.getNeighbors('event-sourcing');

// Get neighbors within N hops
const extended = await graph.getNeighborhood('event-sourcing', {
  depth: 2,
  edgeTypes: ['link', 'related']
});

// Get subgraph around a node
const subgraph = await graph.getSubgraph('event-sourcing', {
  depth: 3,
  includeEdges: true
});
```

### Graph Algorithms

```typescript
// Find clusters
const clusters = await graph.findClusters();
for (const cluster of clusters) {
  console.log(`Cluster: ${cluster.nodes.length} nodes`);
}

// Calculate centrality
const centrality = await graph.calculateCentrality();
const mostCentral = centrality.sort((a, b) => b.score - a.score).slice(0, 10);

// Find orphan nodes
const orphans = await graph.findOrphanNodes();

// Find broken links
const broken = await graph.findBrokenLinks();
```

## Configuration

### Graph Configuration

```typescript
import { KnowledgeGraph, ConfigSchema } from '@knowledge-graph-agent/core';

const config = ConfigSchema.parse({
  projectRoot: '/path/to/project',
  docsRoot: '/path/to/docs',
  vaultName: 'My Knowledge Base',

  graph: {
    includePatterns: ['**/*.md'],
    excludePatterns: ['node_modules/**', 'dist/**', '.git/**'],
    maxDepth: 10
  },

  database: {
    path: './.kg/knowledge.db',
    enableWAL: true
  },

  claudeFlow: {
    enabled: true,
    namespace: 'knowledge-graph',
    syncOnChange: true
  },

  templates: {
    customPath: './templates',
    defaultType: 'concept'
  }
});

const graph = new KnowledgeGraph(config);
```

## Event Handling

### Subscribing to Events

```typescript
// Node events
graph.on('node:created', (node) => {
  console.log(`Created: ${node.title}`);
});

graph.on('node:updated', (node, changes) => {
  console.log(`Updated: ${node.title}`, changes);
});

graph.on('node:deleted', (nodeId) => {
  console.log(`Deleted: ${nodeId}`);
});

// Edge events
graph.on('edge:created', (edge) => {
  console.log(`Linked: ${edge.source} -> ${edge.target}`);
});

// Search events
graph.on('search:executed', (query, resultCount) => {
  console.log(`Search: "${query}" returned ${resultCount} results`);
});
```

## Best Practices

1. **Use consistent naming** - Follow naming conventions for node IDs
2. **Tag appropriately** - Use meaningful, hierarchical tags
3. **Maintain relationships** - Keep edges updated when content changes
4. **Regular maintenance** - Run orphan detection and link validation
5. **Backup regularly** - Export graph periodically for backup
6. **Use status effectively** - Mark deprecated content instead of deleting

## Troubleshooting

### Common Issues

**Slow searches**
- Ensure FTS5 index is built: `await graph.rebuildSearchIndex()`
- Use more specific search terms
- Add type/status filters to narrow scope

**Broken links**
- Run `await graph.findBrokenLinks()` to identify issues
- Use `await graph.repairLinks()` to auto-fix where possible

**Duplicate nodes**
- Use `await graph.findDuplicates()` to identify
- Merge duplicates with `await graph.mergeNodes(ids)`

**Performance issues**
- Enable WAL mode in database config
- Consider partitioning large graphs
- Use pagination for large result sets

## Related Guides

- [Cultivation Guide](./cultivation.md) - Automated knowledge extraction
- [Agents Guide](./agents.md) - Agent-assisted graph building
- [GraphQL API Guide](./graphql-api.md) - Querying via GraphQL
