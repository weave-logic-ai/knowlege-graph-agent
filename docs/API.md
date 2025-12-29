# API Reference

Comprehensive API documentation for `@weavelogic/knowledge-graph-agent`.

## Table of Contents

- [Core Classes](#core-classes)
  - [KnowledgeGraphManager](#knowledgegraphmanager)
  - [KnowledgeGraphDatabase](#knowledgegraphdatabase)
- [Generator Functions](#generator-functions)
  - [Graph Generation](#graph-generation)
  - [Docs Initialization](#docs-initialization)
  - [CLAUDE.md Generation](#claudemd-generation)
- [Integration Classes](#integration-classes)
  - [ClaudeFlowIntegration](#claudeflowintegration)
- [Type Definitions](#type-definitions)
- [CLI Commands](#cli-commands)

---

## Core Classes

### KnowledgeGraphManager

In-memory knowledge graph manager with graph traversal and analysis capabilities.

```typescript
import { createKnowledgeGraph, KnowledgeGraphManager } from '@weavelogic/knowledge-graph-agent';
```

#### Constructor

```typescript
const graph = createKnowledgeGraph(name: string, rootPath: string): KnowledgeGraphManager;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Unique identifier for the graph |
| `rootPath` | `string` | Project root path |

#### Methods

##### `addNode(node: KnowledgeNode): void`

Add a node to the graph.

```typescript
graph.addNode({
  id: 'architecture-overview',
  path: 'docs/concepts/architecture.md',
  title: 'Architecture Overview',
  type: 'concept',
  status: 'active',
  content: '# Architecture...',
  frontmatter: { title: 'Architecture Overview', type: 'concept' },
  tags: ['architecture', 'design'],
  outgoingLinks: [{ targetId: 'api-design', type: 'reference' }],
  incomingLinks: [],
});
```

##### `getNode(id: string): KnowledgeNode | undefined`

Retrieve a node by ID.

```typescript
const node = graph.getNode('architecture-overview');
```

##### `updateNode(id: string, updates: Partial<KnowledgeNode>): boolean`

Update an existing node.

```typescript
graph.updateNode('architecture-overview', {
  status: 'deprecated',
  tags: ['architecture', 'legacy'],
});
```

##### `removeNode(id: string): boolean`

Remove a node and its associated edges.

```typescript
graph.removeNode('old-document');
```

##### `addEdge(edge: GraphEdge): void`

Add an edge between nodes.

```typescript
graph.addEdge({
  source: 'architecture-overview',
  target: 'api-design',
  type: 'reference',
  weight: 1,
});
```

##### `getOutgoingEdges(nodeId: string): GraphEdge[]`

Get all outgoing edges from a node.

```typescript
const edges = graph.getOutgoingEdges('architecture-overview');
```

##### `getIncomingEdges(nodeId: string): GraphEdge[]`

Get all incoming edges to a node.

```typescript
const edges = graph.getIncomingEdges('api-design');
```

##### `findPath(sourceId: string, targetId: string): string[] | null`

Find shortest path between two nodes using BFS.

```typescript
const path = graph.findPath('getting-started', 'advanced-config');
// Returns: ['getting-started', 'basic-setup', 'configuration', 'advanced-config']
```

##### `findOrphanNodes(): KnowledgeNode[]`

Find nodes with no incoming or outgoing connections.

```typescript
const orphans = graph.findOrphanNodes();
```

##### `getConnectedNodes(nodeId: string, depth?: number): KnowledgeNode[]`

Get all nodes connected within a specified depth.

```typescript
const connected = graph.getConnectedNodes('architecture-overview', 2);
```

##### `getStats(): GraphStats`

Get graph statistics.

```typescript
const stats = graph.getStats();
// {
//   totalNodes: 42,
//   totalEdges: 128,
//   nodesByType: { concept: 12, technical: 18, ... },
//   nodesByStatus: { active: 35, draft: 5, ... },
//   orphanNodes: 3,
//   avgLinksPerNode: 3.05,
//   mostConnected: [{ id: 'api-reference', connections: 24 }, ...]
// }
```

##### `toJSON(): KnowledgeGraph`

Export graph to JSON-serializable format.

```typescript
const json = graph.toJSON();
```

---

### KnowledgeGraphDatabase

SQLite-backed persistent storage for knowledge graphs.

```typescript
import { createDatabase, KnowledgeGraphDatabase } from '@weavelogic/knowledge-graph-agent';
```

#### Constructor

```typescript
const db = createDatabase(dbPath: string): KnowledgeGraphDatabase;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `dbPath` | `string` | Path to SQLite database file |

#### Methods

##### `upsertNode(node: KnowledgeNode): void`

Insert or update a node.

```typescript
db.upsertNode(node);
```

##### `getNode(id: string): KnowledgeNode | null`

Retrieve a node by ID.

```typescript
const node = db.getNode('my-document');
```

##### `getAllNodes(): KnowledgeNode[]`

Get all nodes in the database.

```typescript
const nodes = db.getAllNodes();
```

##### `getNodesByType(type: NodeType): KnowledgeNode[]`

Get nodes filtered by type.

```typescript
const concepts = db.getNodesByType('concept');
```

##### `getNodesByStatus(status: NodeStatus): KnowledgeNode[]`

Get nodes filtered by status.

```typescript
const drafts = db.getNodesByStatus('draft');
```

##### `getNodesByTag(tag: string): KnowledgeNode[]`

Get nodes with a specific tag.

```typescript
const apiDocs = db.getNodesByTag('api');
```

##### `searchNodes(query: string, limit?: number): KnowledgeNode[]`

Full-text search across nodes using SQLite FTS5.

```typescript
const results = db.searchNodes('authentication flow', 10);
```

##### `upsertEdge(edge: GraphEdge): void`

Insert or update an edge.

```typescript
db.upsertEdge({
  source: 'doc-a',
  target: 'doc-b',
  type: 'reference',
  weight: 1,
});
```

##### `getEdgesFrom(nodeId: string): GraphEdge[]`

Get outgoing edges from a node.

```typescript
const edges = db.getEdgesFrom('my-document');
```

##### `getEdgesTo(nodeId: string): GraphEdge[]`

Get incoming edges to a node.

```typescript
const edges = db.getEdgesTo('my-document');
```

##### `deleteNode(id: string): void`

Delete a node and its edges.

```typescript
db.deleteNode('old-document');
```

##### `getStats(): GraphStats`

Get database statistics.

```typescript
const stats = db.getStats();
```

##### `setMetadata(key: string, value: string): void`

Store metadata in the database.

```typescript
db.setMetadata('lastGenerated', new Date().toISOString());
```

##### `getMetadata(key: string): string | null`

Retrieve metadata.

```typescript
const lastGen = db.getMetadata('lastGenerated');
```

##### `close(): void`

Close the database connection.

```typescript
db.close();
```

---

## Generator Functions

### Graph Generation

```typescript
import { generateGraph, generateAndSave, updateGraph } from '@weavelogic/knowledge-graph-agent';
```

#### `generateGraph(options: GeneratorOptions): Promise<KnowledgeGraphManager>`

Generate a knowledge graph from markdown files.

```typescript
const graph = await generateGraph({
  projectRoot: '/path/to/project',
  docsPath: 'docs',
  includePatterns: ['**/*.md'],
  excludePatterns: ['node_modules/**', 'dist/**'],
});
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectRoot` | `string` | Required | Project root path |
| `docsPath` | `string` | `'docs'` | Relative path to docs |
| `includePatterns` | `string[]` | `['**/*.md']` | Glob patterns to include |
| `excludePatterns` | `string[]` | `['node_modules/**']` | Glob patterns to exclude |
| `parseWikilinks` | `boolean` | `true` | Parse `[[wikilinks]]` |
| `parseFrontmatter` | `boolean` | `true` | Parse YAML frontmatter |
| `inferTypes` | `boolean` | `true` | Infer node types from paths |

#### `generateAndSave(options, dbPath): Promise<GeneratedDocument>`

Generate graph and save to database.

```typescript
const result = await generateAndSave(
  { projectRoot: '/project', docsPath: 'docs' },
  '/project/.kg/knowledge.db'
);

console.log(result.stats);
// { nodesCreated: 42, edgesCreated: 128, errors: [] }
```

#### `updateGraph(options, dbPath): Promise<GeneratedDocument>`

Incrementally update existing graph (only changed files).

```typescript
const result = await updateGraph(
  { projectRoot: '/project' },
  '/project/.kg/knowledge.db'
);
```

---

### Docs Initialization

```typescript
import { initDocs, docsExist, getDocsPath } from '@weavelogic/knowledge-graph-agent';
```

#### `initDocs(options: DocsInitOptions): Promise<DocsInitResult>`

Initialize a docs directory with weave-nn structure.

```typescript
const result = await initDocs({
  projectRoot: '/path/to/project',
  docsPath: 'docs',
  includeExamples: true,
  detectFramework: true,
  overwrite: false,
});

console.log(result);
// {
//   success: true,
//   created: ['docs/README.md', 'docs/PRIMITIVES.md', ...],
//   errors: [],
// }
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectRoot` | `string` | Required | Project root path |
| `docsPath` | `string` | `'docs'` | Docs directory name |
| `includeExamples` | `boolean` | `true` | Include example documents |
| `detectFramework` | `boolean` | `true` | Auto-detect project framework |
| `overwrite` | `boolean` | `false` | Overwrite existing files |

#### `docsExist(projectRoot: string, docsPath?: string): boolean`

Check if docs directory exists.

```typescript
if (!docsExist('/project', 'docs')) {
  await initDocs({ projectRoot: '/project' });
}
```

#### `getDocsPath(projectRoot: string, docsPath?: string): string`

Get absolute path to docs directory.

```typescript
const fullPath = getDocsPath('/project', 'docs');
// '/project/docs'
```

---

### CLAUDE.md Generation

```typescript
import {
  generateClaudeMd,
  updateClaudeMd,
  addSection,
  getSectionTemplate,
  listSectionTemplates,
} from '@weavelogic/knowledge-graph-agent';
```

#### `generateClaudeMd(options: ClaudeMdGeneratorOptions): string`

Generate CLAUDE.md content.

```typescript
const content = generateClaudeMd({
  projectRoot: '/project',
  template: 'full',
  includeKnowledgeGraph: true,
  includeClaudeFlow: true,
  customSections: [
    { id: 'custom', title: 'Custom Section', content: 'Custom content...' }
  ],
});
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectRoot` | `string` | Required | Project root path |
| `template` | `'minimal' \| 'standard' \| 'full'` | `'standard'` | Template to use |
| `includeKnowledgeGraph` | `boolean` | `true` | Add KG integration section |
| `includeClaudeFlow` | `boolean` | `true` | Add claude-flow section |
| `customSections` | `ClaudeMdSection[]` | `[]` | Additional sections |

#### `updateClaudeMd(options): Promise<{ created: boolean; updated: boolean }>`

Create or update CLAUDE.md file.

```typescript
const result = await updateClaudeMd({
  projectRoot: '/project',
  includeKnowledgeGraph: true,
});

if (result.created) {
  console.log('Created new CLAUDE.md');
} else if (result.updated) {
  console.log('Updated existing CLAUDE.md');
}
```

#### `addSection(projectRoot: string, section: ClaudeMdSection): boolean`

Add a section to existing CLAUDE.md.

```typescript
addSection('/project', {
  id: 'testing',
  title: 'Testing Guidelines',
  content: '## Testing\n\nRun tests with `npm test`...',
  position: 'after:overview',
});
```

#### `getSectionTemplate(templateId: string): ClaudeMdSection | undefined`

Get a predefined section template.

```typescript
const sparcSection = getSectionTemplate('sparc');
```

#### `listSectionTemplates(): string[]`

List available section templates.

```typescript
const templates = listSectionTemplates();
// ['sparc', 'testing', 'security', 'agents', 'memory', 'hooks']
```

---

## Integration Classes

### ClaudeFlowIntegration

Integration with claude-flow memory system.

```typescript
import {
  ClaudeFlowIntegration,
  createClaudeFlowIntegration,
  generateMcpConfig,
} from '@weavelogic/knowledge-graph-agent';
```

#### Constructor

```typescript
const integration = createClaudeFlowIntegration({
  namespace: 'knowledge-graph',
  syncOnChange: true,
  ttl: 86400, // 24 hours
});
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `namespace` | `string` | `'knowledge-graph'` | Memory namespace |
| `syncOnChange` | `boolean` | `true` | Auto-sync on changes |
| `ttl` | `number` | `86400` | Time-to-live in seconds |

#### Methods

##### `syncToMemory(db: KnowledgeGraphDatabase): Promise<SyncResult>`

Sync database contents to claude-flow memory.

```typescript
const result = await integration.syncToMemory(db);
console.log(result);
// { synced: 42, failed: 0, errors: [] }
```

##### `generateStoreCommands(nodes: KnowledgeNode[]): string[]`

Generate MCP commands for storing nodes.

```typescript
const commands = integration.generateStoreCommands(nodes);
// [
//   'mcp__claude-flow__memory_usage { action: "store", key: "node/...", ... }',
//   ...
// ]
```

##### `generateRetrievalCommands(): string[]`

Generate MCP commands for retrieving data.

```typescript
const commands = integration.generateRetrievalCommands();
```

##### `generateHookCommands(): string[]`

Generate hook commands for automation.

```typescript
const commands = integration.generateHookCommands();
```

#### `generateMcpConfig(namespace?: string): string`

Generate MCP configuration section for CLAUDE.md.

```typescript
const config = generateMcpConfig('my-namespace');
```

---

## Type Definitions

### NodeType

```typescript
type NodeType =
  | 'concept'      // Abstract concepts and ideas
  | 'technical'    // Technical components
  | 'feature'      // Product features
  | 'primitive'    // Base technology primitives
  | 'service'      // Backend services
  | 'guide'        // How-to guides
  | 'standard'     // Coding standards
  | 'integration'; // External integrations
```

### NodeStatus

```typescript
type NodeStatus =
  | 'active'      // Currently in use
  | 'draft'       // Work in progress
  | 'deprecated'  // No longer recommended
  | 'archived';   // Historical reference
```

### KnowledgeNode

```typescript
interface KnowledgeNode {
  id: string;
  path: string;
  title: string;
  type: NodeType;
  status: NodeStatus;
  content: string;
  frontmatter: NodeFrontmatter;
  tags: string[];
  outgoingLinks: NodeLink[];
  incomingLinks: NodeLink[];
  created?: string;
  updated?: string;
}
```

### NodeFrontmatter

```typescript
interface NodeFrontmatter {
  title?: string;
  type?: NodeType;
  status?: NodeStatus;
  tags?: string[];
  created?: string;
  updated?: string;
  aliases?: string[];
  related?: string[];
  [key: string]: unknown;
}
```

### NodeLink

```typescript
interface NodeLink {
  targetId: string;
  type: 'wikilink' | 'reference' | 'embed' | 'parent' | 'child';
  label?: string;
}
```

### GraphEdge

```typescript
interface GraphEdge {
  source: string;
  target: string;
  type: 'wikilink' | 'reference' | 'embed' | 'parent' | 'child';
  weight?: number;
  metadata?: Record<string, unknown>;
}
```

### GraphStats

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

### KGConfig

```typescript
interface KGConfig {
  projectRoot: string;
  docsRoot: string;
  graph: {
    includePatterns: string[];
    excludePatterns: string[];
  };
  database: {
    path: string;
  };
  claudeFlow: {
    enabled: boolean;
    namespace: string;
    syncOnChange: boolean;
  };
}
```

### ClaudeMdSection

```typescript
interface ClaudeMdSection {
  id: string;
  title: string;
  content: string;
  position?: 'start' | 'end' | `before:${string}` | `after:${string}`;
}
```

---

## CLI Commands

### `kg init`

Initialize knowledge graph in a project.

```bash
kg init [options]

Options:
  -p, --path <path>   Project root path (default: ".")
  -d, --docs <path>   Docs directory path (default: "docs")
  --no-graph          Skip graph generation
  --no-claude         Skip CLAUDE.md update
```

### `kg graph`

Generate or update knowledge graph.

```bash
kg graph [options]

Options:
  -p, --path <path>   Project root path (default: ".")
  -u, --update        Incremental update only
  --json              Output as JSON
```

### `kg docs init`

Initialize docs directory.

```bash
kg docs init [options]

Options:
  -p, --path <path>   Project root path (default: ".")
  --no-examples       Skip example documents
  --overwrite         Overwrite existing files
```

### `kg docs status`

Show documentation status.

```bash
kg docs status [options]

Options:
  -p, --path <path>   Project root path (default: ".")
  --json              Output as JSON
```

### `kg claude update`

Update CLAUDE.md file.

```bash
kg claude update [options]

Options:
  -p, --path <path>       Project root path (default: ".")
  -t, --template <type>   Template: minimal, standard, full (default: "standard")
  --no-kg                 Skip knowledge graph section
  --no-flow               Skip claude-flow section
```

### `kg claude preview`

Preview CLAUDE.md content.

```bash
kg claude preview [options]

Options:
  -p, --path <path>       Project root path (default: ".")
  -t, --template <type>   Template type (default: "standard")
```

### `kg sync`

Sync with claude-flow memory.

```bash
kg sync [options]

Options:
  -p, --path <path>           Project root path (default: ".")
  -n, --namespace <namespace> Memory namespace (default: "knowledge-graph")
  --show-commands             Show MCP commands instead of executing
  --hooks                     Show hook configuration commands
```

### `kg sync config`

Show MCP configuration.

```bash
kg sync config [options]

Options:
  -n, --namespace <namespace> Memory namespace (default: "knowledge-graph")
```

### `kg stats`

Display graph statistics.

```bash
kg stats [options]

Options:
  -p, --path <path>   Project root path (default: ".")
  --json              Output as JSON
```

### `kg search`

Search the knowledge graph.

```bash
kg search <query> [options]

Options:
  -p, --path <path>     Project root path (default: ".")
  -t, --type <type>     Filter by node type
  -g, --tag <tag>       Filter by tag
  -l, --limit <number>  Limit results (default: 20)
  --json                Output as JSON
```

---

## Quick Start Example

```typescript
import {
  quickInit,
  createDatabase,
  generateGraph,
  updateClaudeMd,
  createClaudeFlowIntegration,
} from '@weavelogic/knowledge-graph-agent';

async function setup() {
  // Option 1: Quick initialization (all-in-one)
  const result = await quickInit({
    projectRoot: '/my/project',
    docsPath: 'docs',
    generateGraph: true,
    updateClaudeMd: true,
  });

  console.log('Setup complete:', result);

  // Option 2: Manual step-by-step
  const db = createDatabase('/my/project/.kg/knowledge.db');
  const graph = await generateGraph({
    projectRoot: '/my/project',
    docsPath: 'docs',
  });

  // Save to database
  for (const [, node] of graph.nodes) {
    db.upsertNode(node);
  }
  for (const edge of graph.edges) {
    db.upsertEdge(edge);
  }

  // Sync to claude-flow
  const integration = createClaudeFlowIntegration({
    namespace: 'my-project-kg',
  });
  await integration.syncToMemory(db);

  // Update CLAUDE.md
  await updateClaudeMd({
    projectRoot: '/my/project',
    includeKnowledgeGraph: true,
    includeClaudeFlow: true,
  });

  db.close();
}

setup();
```
