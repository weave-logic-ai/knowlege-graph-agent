# Knowledge Graph Agent Architecture

## Executive Summary

This document defines the architecture for `@weave-nn/knowledge-graph-agent`, an NPM library providing CLI and programmatic interfaces for knowledge graph management, Obsidian integration, CLAUDE.md generation, and claude-flow memory coordination.

**Version**: 1.0.0
**Last Updated**: 2025-12-28
**Status**: Architecture Design

---

## Table of Contents

1. [Package Structure](#1-package-structure)
2. [Core Components](#2-core-components)
3. [CLI Commands](#3-cli-commands)
4. [Integration Points](#4-integration-points)
5. [TypeScript Interfaces](#5-typescript-interfaces)
6. [Configuration Schema](#6-configuration-schema)
7. [Data Flow Diagrams](#7-data-flow-diagrams)
8. [File Structure](#8-file-structure)

---

## 1. Package Structure

### 1.1 Package Metadata

```json
{
  "name": "@weave-nn/knowledge-graph-agent",
  "version": "1.0.0",
  "description": "Knowledge graph engine with Obsidian integration and Claude-Flow coordination",
  "type": "module",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "bin": {
    "kg": "./dist/cli/bin.js"
  },
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./graph": {
      "import": "./dist/graph/index.mjs",
      "types": "./dist/graph/index.d.ts"
    },
    "./obsidian": {
      "import": "./dist/obsidian/index.mjs",
      "types": "./dist/obsidian/index.d.ts"
    },
    "./claude-md": {
      "import": "./dist/claude-md/index.mjs",
      "types": "./dist/claude-md/index.d.ts"
    },
    "./memory": {
      "import": "./dist/memory/index.mjs",
      "types": "./dist/memory/index.d.ts"
    }
  }
}
```

### 1.2 Entry Points

| Entry Point | Purpose | Export Path |
|-------------|---------|-------------|
| `kg` (CLI) | Command-line interface | `./dist/cli/bin.js` |
| Main | Core library exports | `./dist/index.js` |
| Graph | Knowledge graph engine | `./dist/graph/index.js` |
| Obsidian | Vault integration | `./dist/obsidian/index.js` |
| Claude-MD | CLAUDE.md generator | `./dist/claude-md/index.js` |
| Memory | Claude-Flow memory | `./dist/memory/index.js` |

---

## 2. Core Components

### 2.1 Component Architecture (C4 Level 2)

```
+------------------------------------------------------------------+
|                     Knowledge Graph Agent                         |
+------------------------------------------------------------------+
|                                                                    |
|  +-------------------+   +-------------------+   +---------------+ |
|  |   CLI Interface   |   |   Programmatic    |   |   MCP Server  | |
|  |                   |   |       API         |   |   (Optional)  | |
|  +--------+----------+   +--------+----------+   +-------+-------+ |
|           |                       |                      |         |
|           v                       v                      v         |
|  +------------------------------------------------------------------+
|  |                    Core Engine Layer                             |
|  +------------------------------------------------------------------+
|  |                                                                  |
|  |  +------------------+  +------------------+  +------------------+ |
|  |  |  Graph Engine    |  | Obsidian Module  |  | CLAUDE.md Gen   | |
|  |  |                  |  |                  |  |                  | |
|  |  | - Node Manager   |  | - Vault Detector |  | - Template Eng  | |
|  |  | - Edge Manager   |  | - MD Parser      |  | - Project Det   | |
|  |  | - Traversal      |  | - Frontmatter    |  | - Section Gen   | |
|  |  | - Metrics        |  | - Link Resolver  |  | - Config Merge  | |
|  |  +------------------+  +------------------+  +------------------+ |
|  |                                                                  |
|  |  +------------------+  +------------------+  +------------------+ |
|  |  |  Docs Init       |  | Memory Module    |  | Hook System     | |
|  |  |                  |  |                  |  |                  | |
|  |  | - Dir Structure  |  | - Claude-Flow    |  | - Pre/Post Ops  | |
|  |  | - Templates      |  | - Namespace Mgr  |  | - Event System  | |
|  |  | - Scaffolding    |  | - Sync Engine    |  | - Automation    | |
|  |  +------------------+  +------------------+  +------------------+ |
|  |                                                                  |
|  +------------------------------------------------------------------+
|                                                                    |
|  +------------------------------------------------------------------+
|  |                    Storage Layer                                 |
|  +------------------------------------------------------------------+
|  |                                                                  |
|  |  +------------------+  +------------------+  +------------------+ |
|  |  | SQLite (Shadow   |  | File System      |  | Claude-Flow DB  | |
|  |  |   Cache)         |  | (Markdown)       |  | (Memory Store)  | |
|  |  +------------------+  +------------------+  +------------------+ |
|  |                                                                  |
|  +------------------------------------------------------------------+
+------------------------------------------------------------------+
```

### 2.2 Knowledge Graph Engine

The graph engine manages nodes (documents), edges (links), and provides traversal algorithms.

**Responsibilities:**
- Node CRUD operations with frontmatter metadata
- Edge management (wikilinks, markdown links)
- Graph traversal (BFS, DFS, shortest path)
- Metrics calculation (density, clusters, orphans)
- Query interface for pattern matching

**Key Classes:**
```typescript
class KnowledgeGraphEngine {
  // Node operations
  addNode(node: GraphNode): void;
  getNode(id: string): GraphNode | undefined;
  updateNode(id: string, updates: Partial<GraphNode>): void;
  removeNode(id: string): void;

  // Edge operations
  addEdge(edge: GraphEdge): void;
  getEdges(nodeId: string, direction?: 'in' | 'out' | 'both'): GraphEdge[];
  removeEdge(sourceId: string, targetId: string): void;

  // Traversal
  traverse(startId: string, algorithm: TraversalAlgorithm): TraversalResult;
  findPath(sourceId: string, targetId: string): GraphNode[];
  findClusters(): Cluster[];

  // Metrics
  calculateMetrics(): GraphMetrics;
  getOrphans(): GraphNode[];
  getHubs(threshold: number): GraphNode[];
}
```

### 2.3 Obsidian Integration Module

Handles vault detection, markdown parsing, and Obsidian-specific features.

**Responsibilities:**
- Vault detection via `.obsidian` folder
- Markdown file parsing with gray-matter
- Frontmatter extraction and validation
- Wikilink resolution
- Tag extraction and management

**Key Classes:**
```typescript
class ObsidianVault {
  constructor(vaultPath: string);

  // Detection
  static detect(searchPath: string): string | null;
  static isVault(path: string): boolean;

  // File operations
  getFiles(pattern?: string): VaultFile[];
  getFile(relativePath: string): VaultFile | null;
  writeFile(relativePath: string, content: string): void;

  // Parsing
  parseFile(file: VaultFile): ParsedDocument;
  extractLinks(content: string): Link[];
  extractTags(content: string): string[];

  // Resolution
  resolveWikilink(wikilink: string, fromFile: string): string | null;
}
```

### 2.4 CLAUDE.md Generator

Generates and maintains CLAUDE.md files with project-specific configurations.

**Responsibilities:**
- Project type detection (Next.js, React, Node.js, etc.)
- Template-based generation with Handlebars
- Section management (commands, style, rules)
- Configuration merging from multiple sources
- Hierarchical inheritance (global -> project -> local)

**Key Classes:**
```typescript
class ClaudeMdGenerator {
  constructor(config: ClaudeMdConfig);

  // Detection
  detectProjectType(projectPath: string): ProjectType;
  detectFrameworks(projectPath: string): Framework[];

  // Generation
  generate(projectPath: string, options?: GenerateOptions): string;
  generateSection(section: SectionType, context: SectionContext): string;

  // Management
  update(claudeMdPath: string, updates: Partial<ClaudeMdContent>): void;
  merge(base: ClaudeMdContent, overlay: ClaudeMdContent): ClaudeMdContent;
  validate(content: string): ValidationResult;
}
```

### 2.5 Docs Initializer

Creates standardized documentation directory structures.

**Responsibilities:**
- Directory structure creation
- Template-based file scaffolding
- README and index file generation
- ADR (Architecture Decision Records) setup
- API documentation scaffolding

**Key Classes:**
```typescript
class DocsInitializer {
  constructor(config: DocsConfig);

  // Initialization
  init(projectPath: string, options?: InitOptions): InitResult;
  createStructure(basePath: string, structure: DirectoryStructure): void;

  // Templates
  applyTemplate(templateName: string, targetPath: string, context: TemplateContext): void;
  listTemplates(): Template[];

  // Scaffolding
  createADR(title: string, context: ADRContext): string;
  createAPIDoc(apiSpec: APISpec): string;
}
```

### 2.6 Claude-Flow Memory Integration

Coordinates with claude-flow for persistent memory and cross-session state.

**Responsibilities:**
- Namespace management for knowledge graph data
- Graph state synchronization
- Memory-based caching for performance
- Hook integration for automated sync
- Batch operations for bulk updates

**Key Classes:**
```typescript
class GraphMemoryClient {
  constructor(config: MemoryConfig);

  // Namespace operations
  createNamespace(name: string): void;
  getNamespace(name: string): NamespaceInfo;

  // Graph sync
  syncGraph(graph: KnowledgeGraphEngine): SyncResult;
  loadGraph(): GraphSnapshot;

  // Node operations
  storeNode(node: GraphNode): void;
  retrieveNode(nodeId: string): GraphNode | null;

  // Batch operations
  batchStore(items: MemoryEntry[]): BatchResult;
  batchRetrieve(keys: string[]): Map<string, unknown>;
}
```

---

## 3. CLI Commands

### 3.1 Command Tree

```
kg
├── init           # Initialize knowledge graph in project
│   ├── --vault    # Initialize as Obsidian vault
│   ├── --force    # Force overwrite existing config
│   └── --template # Use specific template
│
├── graph          # Knowledge graph operations
│   ├── build      # Build/rebuild the graph
│   ├── analyze    # Analyze graph metrics
│   ├── orphans    # Find orphaned nodes
│   ├── hubs       # Find hub documents
│   ├── suggest    # Suggest connections
│   └── export     # Export graph (JSON, DOT, Mermaid)
│
├── docs           # Documentation management
│   ├── init       # Initialize docs directory
│   ├── scaffold   # Create documentation scaffold
│   ├── adr        # Create ADR document
│   └── validate   # Validate documentation
│
├── claude         # CLAUDE.md management
│   ├── init       # Create CLAUDE.md
│   ├── update     # Update existing CLAUDE.md
│   ├── merge      # Merge configurations
│   └── validate   # Validate CLAUDE.md
│
├── sync           # Claude-flow synchronization
│   ├── push       # Push graph to memory
│   ├── pull       # Pull graph from memory
│   ├── status     # Show sync status
│   └── reset      # Reset sync state
│
└── config         # Configuration management
    ├── show       # Show current config
    ├── set        # Set configuration value
    └── init       # Initialize configuration
```

### 3.2 Command Specifications

#### `kg init`

Initializes knowledge graph in the current or specified project.

```bash
kg init [path] [options]

Options:
  --vault, -v        Initialize as Obsidian vault
  --force, -f        Force overwrite existing configuration
  --template, -t     Template to use (default, obsidian, minimal)
  --no-docs          Skip docs directory creation
  --no-claude        Skip CLAUDE.md creation

Examples:
  kg init                          # Initialize in current directory
  kg init ./my-project --vault     # Initialize with Obsidian vault
  kg init . --template obsidian    # Use Obsidian template
```

#### `kg graph`

Generate and analyze knowledge graph.

```bash
kg graph <subcommand> [options]

Subcommands:
  build              Build knowledge graph from files
  analyze            Analyze graph metrics and health
  orphans            List orphaned documents
  hubs               List hub documents (high connectivity)
  suggest            Suggest new connections
  export             Export graph to various formats

Options:
  --path, -p         Path to scan (default: current directory)
  --output, -o       Output path for results
  --format, -f       Output format (json, markdown, dot, mermaid)
  --include          Glob patterns to include
  --exclude          Glob patterns to exclude

Examples:
  kg graph build                        # Build graph
  kg graph analyze --format markdown    # Analyze and output markdown
  kg graph export --format mermaid      # Export as Mermaid diagram
```

#### `kg docs`

Documentation directory management.

```bash
kg docs <subcommand> [options]

Subcommands:
  init               Initialize docs directory structure
  scaffold           Create documentation scaffold
  adr                Create Architecture Decision Record
  validate           Validate documentation completeness

Options:
  --path, -p         Target path (default: ./docs)
  --template, -t     Template to use
  --title            Document title (for adr)

Examples:
  kg docs init                              # Initialize docs directory
  kg docs adr --title "Use React Query"     # Create ADR
  kg docs scaffold --template api           # Create API documentation
```

#### `kg claude`

CLAUDE.md file management.

```bash
kg claude <subcommand> [options]

Subcommands:
  init               Create CLAUDE.md file
  update             Update existing CLAUDE.md
  merge              Merge configurations from multiple sources
  validate           Validate CLAUDE.md syntax and structure

Options:
  --path, -p         Target path (default: current directory)
  --global, -g       Include global ~/.claude/CLAUDE.md
  --detect, -d       Auto-detect project type and frameworks
  --template, -t     Template to use

Examples:
  kg claude init --detect              # Create with auto-detection
  kg claude update --merge-global      # Update with global merge
  kg claude validate                   # Validate current CLAUDE.md
```

#### `kg sync`

Claude-flow memory synchronization.

```bash
kg sync <subcommand> [options]

Subcommands:
  push               Push graph state to claude-flow memory
  pull               Pull graph state from claude-flow memory
  status             Show synchronization status
  reset              Reset sync state (clear memory namespace)

Options:
  --namespace, -n    Memory namespace (default: kg-graph)
  --force, -f        Force operation (overwrite conflicts)
  --dry-run          Show what would happen without executing

Examples:
  kg sync push                         # Push graph to memory
  kg sync pull --namespace project-a   # Pull from specific namespace
  kg sync status                       # Show sync status
```

---

## 4. Integration Points

### 4.1 Claude-Flow Database Integration

The library integrates with claude-flow's existing database infrastructure:

```
+-------------------+     +----------------------+     +------------------+
|  Knowledge Graph  | --> |  Claude-Flow Client  | --> |  Claude-Flow DB  |
|      Engine       |     |                      |     |  (SQLite/Memory) |
+-------------------+     +----------------------+     +------------------+
        |                          |
        v                          v
+-------------------+     +----------------------+
|  Local Shadow     |     |  MCP Memory Tools    |
|     Cache         |     |  (store/retrieve)    |
+-------------------+     +----------------------+
```

**Database Schema Extensions:**

```sql
-- Knowledge graph nodes stored in claude-flow memory
-- Namespace: kg-graph/nodes/{nodeId}

-- Node data structure
{
  "id": "string",
  "path": "string",
  "title": "string",
  "type": "concept|technical|feature",
  "tags": ["string"],
  "frontmatter": {},
  "contentHash": "string",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}

-- Edge data structure
-- Namespace: kg-graph/edges/{sourceId}/{targetId}
{
  "source": "string",
  "target": "string",
  "type": "wikilink|markdown|reference",
  "weight": "number",
  "metadata": {}
}

-- Graph metadata
-- Namespace: kg-graph/meta
{
  "lastSync": "ISO8601",
  "nodeCount": "number",
  "edgeCount": "number",
  "version": "string"
}
```

### 4.2 Memory Coordination Patterns

**Namespace Strategy:**

```
kg-graph/
├── nodes/           # Individual node data
│   ├── {nodeId}     # Node object
│   └── ...
├── edges/           # Edge relationships
│   ├── {sourceId}/
│   │   └── {targetId}
│   └── ...
├── meta/            # Graph metadata
├── cache/           # Query result cache
│   ├── orphans
│   ├── hubs
│   └── metrics
└── sync/            # Sync state
    ├── lastPush
    ├── lastPull
    └── conflicts
```

**Coordination Protocol:**

```typescript
interface SyncProtocol {
  // Before any graph operation
  preOperation(operation: GraphOperation): void;

  // After graph modification
  postOperation(operation: GraphOperation, result: OperationResult): void;

  // Conflict resolution
  resolveConflict(local: GraphState, remote: GraphState): GraphState;

  // Background sync
  scheduleSync(interval: number): void;
}
```

### 4.3 Hook System for Automation

**Available Hooks:**

| Hook | Trigger | Purpose |
|------|---------|---------|
| `pre-graph-build` | Before graph build | Validate files, prepare caches |
| `post-graph-build` | After graph build | Sync to memory, generate reports |
| `pre-node-add` | Before adding node | Validate frontmatter |
| `post-node-add` | After adding node | Update edges, trigger sync |
| `pre-sync` | Before memory sync | Backup current state |
| `post-sync` | After memory sync | Update local caches |
| `on-orphan-detected` | Orphan found | Notify, suggest connections |
| `on-conflict` | Sync conflict | Trigger resolution |

**Hook Configuration:**

```yaml
# kg.hooks.yaml
hooks:
  post-graph-build:
    - action: sync
      namespace: kg-graph
    - action: report
      format: markdown
      output: ./docs/GRAPH-REPORT.md

  on-orphan-detected:
    - action: notify
      level: warning
    - action: suggest-connections
      min-similarity: 0.7

  pre-sync:
    - action: backup
      path: ./.kg-backup
```

---

## 5. TypeScript Interfaces

### 5.1 Core Types

```typescript
// /src/types/core.ts

/**
 * Graph node representing a document in the knowledge graph
 */
export interface GraphNode {
  /** Unique identifier (typically file path hash) */
  id: string;
  /** Relative file path from project root */
  path: string;
  /** Document title (from frontmatter or filename) */
  title: string;
  /** Node type classification */
  type: NodeType;
  /** Tags extracted from frontmatter */
  tags: string[];
  /** Full frontmatter object */
  frontmatter: DocumentFrontmatter;
  /** Content hash for change detection */
  contentHash: string;
  /** Outbound link count */
  outDegree: number;
  /** Inbound link count */
  inDegree: number;
  /** Is this node an orphan (no connections) */
  isOrphan: boolean;
  /** Creation timestamp */
  createdAt: Date;
  /** Last modification timestamp */
  updatedAt: Date;
}

/**
 * Node type classifications
 */
export type NodeType =
  | 'concept'      // Conceptual/theoretical document
  | 'technical'    // Technical specification
  | 'feature'      // Feature documentation
  | 'architecture' // Architecture document
  | 'guide'        // How-to guide
  | 'reference'    // Reference documentation
  | 'adr'          // Architecture Decision Record
  | 'unknown';     // Unclassified

/**
 * Graph edge representing a link between documents
 */
export interface GraphEdge {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Link type */
  type: LinkType;
  /** Link text/alias */
  text?: string;
  /** Edge weight (for weighted algorithms) */
  weight: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Link type classifications
 */
export type LinkType =
  | 'wikilink'     // [[link]] style
  | 'markdown'     // [text](url) style
  | 'reference'    // Implicit reference
  | 'tag'          // Tag-based connection
  | 'semantic';    // Semantic similarity

/**
 * Document frontmatter structure
 */
export interface DocumentFrontmatter {
  title?: string;
  type?: string;
  status?: 'draft' | 'review' | 'published' | 'archived';
  tags?: string[];
  created?: string;
  updated?: string;
  author?: string;
  phase?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  [key: string]: unknown;
}
```

### 5.2 Graph Engine Types

```typescript
// /src/types/graph.ts

/**
 * Graph metrics calculated from the knowledge graph
 */
export interface GraphMetrics {
  /** Total number of nodes */
  totalNodes: number;
  /** Total number of edges */
  totalEdges: number;
  /** Number of orphaned nodes */
  orphanCount: number;
  /** Average links per document */
  averageDegree: number;
  /** Graph density (edges / possible edges) */
  density: number;
  /** Number of disconnected clusters */
  clusterCount: number;
  /** Nodes with weak connectivity (<2 edges) */
  weaklyConnected: number;
  /** Nodes with strong connectivity (5+ edges) */
  wellConnected: number;
  /** Hub documents with high inbound links */
  hubs: HubInfo[];
  /** Tag distribution */
  tagDistribution: Map<string, number>;
  /** Type distribution */
  typeDistribution: Map<NodeType, number>;
}

/**
 * Hub document information
 */
export interface HubInfo {
  nodeId: string;
  path: string;
  title: string;
  inboundLinks: number;
  outboundLinks: number;
}

/**
 * Traversal algorithm options
 */
export type TraversalAlgorithm =
  | 'bfs'           // Breadth-first search
  | 'dfs'           // Depth-first search
  | 'dijkstra'      // Shortest path
  | 'pagerank';     // PageRank importance

/**
 * Traversal result
 */
export interface TraversalResult {
  visited: GraphNode[];
  path: string[];
  depth: number;
  algorithm: TraversalAlgorithm;
  startNode: string;
  endNode?: string;
}

/**
 * Cluster information
 */
export interface Cluster {
  id: number;
  nodes: string[];
  size: number;
  density: number;
  centralNode: string;
}

/**
 * Connection suggestion
 */
export interface ConnectionSuggestion {
  sourceId: string;
  targetId: string;
  confidence: number;
  reason: SuggestionReason;
  suggestedLinkText?: string;
}

export type SuggestionReason =
  | 'shared-tags'
  | 'similar-content'
  | 'same-directory'
  | 'referenced-topic'
  | 'orphan-rescue';
```

### 5.3 Obsidian Types

```typescript
// /src/types/obsidian.ts

/**
 * Obsidian vault file representation
 */
export interface VaultFile {
  /** Absolute file path */
  path: string;
  /** Relative path from vault root */
  relativePath: string;
  /** File name without extension */
  basename: string;
  /** File extension */
  extension: string;
  /** File size in bytes */
  size: number;
  /** Last modified timestamp */
  mtime: Date;
  /** Creation timestamp */
  ctime: Date;
}

/**
 * Parsed markdown document
 */
export interface ParsedDocument {
  /** Source file */
  file: VaultFile;
  /** Extracted frontmatter */
  frontmatter: DocumentFrontmatter;
  /** Markdown content (without frontmatter) */
  content: string;
  /** Extracted wikilinks */
  wikilinks: WikiLink[];
  /** Extracted markdown links */
  markdownLinks: MarkdownLink[];
  /** Extracted tags (including inline) */
  tags: string[];
  /** Headings structure */
  headings: Heading[];
}

/**
 * Wikilink structure
 */
export interface WikiLink {
  /** Original link text */
  original: string;
  /** Target file/path */
  target: string;
  /** Display alias (if any) */
  alias?: string;
  /** Anchor/heading reference */
  anchor?: string;
  /** Position in content */
  position: { start: number; end: number };
}

/**
 * Markdown link structure
 */
export interface MarkdownLink {
  /** Link text */
  text: string;
  /** Link URL/path */
  url: string;
  /** Title attribute */
  title?: string;
  /** Is external link */
  isExternal: boolean;
  /** Position in content */
  position: { start: number; end: number };
}

/**
 * Heading structure
 */
export interface Heading {
  /** Heading level (1-6) */
  level: number;
  /** Heading text */
  text: string;
  /** Generated slug/anchor */
  slug: string;
  /** Position in content */
  position: { start: number; end: number };
}

/**
 * Vault configuration
 */
export interface VaultConfig {
  /** Vault root path */
  path: string;
  /** Vault name */
  name: string;
  /** File patterns to include */
  include: string[];
  /** File patterns to exclude */
  exclude: string[];
  /** Watch for file changes */
  watch: boolean;
}
```

### 5.4 CLAUDE.md Types

```typescript
// /src/types/claude-md.ts

/**
 * CLAUDE.md content structure
 */
export interface ClaudeMdContent {
  /** Header section with project overview */
  header: HeaderSection;
  /** Build and development commands */
  commands: CommandsSection;
  /** Code style and conventions */
  codeStyle: CodeStyleSection;
  /** Project-specific rules */
  rules: RulesSection;
  /** Integration configurations */
  integrations: IntegrationsSection;
  /** Custom sections */
  customSections: CustomSection[];
}

/**
 * Header section
 */
export interface HeaderSection {
  title: string;
  description: string;
  version?: string;
  projectType: ProjectType;
  frameworks: Framework[];
}

/**
 * Commands section
 */
export interface CommandsSection {
  build: CommandInfo[];
  test: CommandInfo[];
  dev: CommandInfo[];
  lint: CommandInfo[];
  custom: CommandInfo[];
}

/**
 * Command information
 */
export interface CommandInfo {
  name: string;
  command: string;
  description: string;
  category: 'build' | 'test' | 'dev' | 'lint' | 'custom';
}

/**
 * Code style section
 */
export interface CodeStyleSection {
  language: string;
  style: string;
  conventions: string[];
  formatting: FormattingConfig;
}

/**
 * Formatting configuration
 */
export interface FormattingConfig {
  indentStyle: 'spaces' | 'tabs';
  indentSize: number;
  maxLineLength: number;
  trailingComma: boolean;
  semicolons: boolean;
  quotes: 'single' | 'double';
}

/**
 * Rules section
 */
export interface RulesSection {
  important: string[];
  guidelines: string[];
  restrictions: string[];
}

/**
 * Custom section
 */
export interface CustomSection {
  title: string;
  content: string;
  priority: number;
}

/**
 * Project type classification
 */
export type ProjectType =
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'angular'
  | 'node'
  | 'typescript'
  | 'python'
  | 'rust'
  | 'go'
  | 'unknown';

/**
 * Framework detection result
 */
export interface Framework {
  name: string;
  version?: string;
  detected: boolean;
  confidence: number;
}

/**
 * Generation options
 */
export interface GenerateOptions {
  /** Auto-detect project type */
  autoDetect: boolean;
  /** Merge with global CLAUDE.md */
  mergeGlobal: boolean;
  /** Template to use */
  template?: string;
  /** Override sections */
  overrides?: Partial<ClaudeMdContent>;
}
```

### 5.5 Memory Types

```typescript
// /src/types/memory.ts

/**
 * Memory client configuration
 */
export interface MemoryConfig {
  /** Default namespace for operations */
  defaultNamespace: string;
  /** Default TTL in seconds (0 = no expiry) */
  defaultTTL: number;
  /** Number of retry attempts */
  retryAttempts: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
  /** Enable automatic sync */
  autoSync: boolean;
  /** Sync interval in milliseconds */
  syncInterval: number;
}

/**
 * Memory entry for batch operations
 */
export interface MemoryEntry {
  key: string;
  value: unknown;
  namespace?: string;
  ttl?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Batch operation result
 */
export interface BatchResult {
  successful: number;
  failed: number;
  errors: Array<{ key: string; error: string }>;
  duration: number;
}

/**
 * Sync result
 */
export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: ConflictInfo[];
  duration: number;
  timestamp: Date;
}

/**
 * Conflict information
 */
export interface ConflictInfo {
  key: string;
  localValue: unknown;
  remoteValue: unknown;
  resolution: 'local' | 'remote' | 'merged' | 'unresolved';
}

/**
 * Namespace information
 */
export interface NamespaceInfo {
  name: string;
  keyCount: number;
  sizeBytes: number;
  lastModified: Date;
}

/**
 * Graph snapshot for memory storage
 */
export interface GraphSnapshot {
  version: string;
  timestamp: Date;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: GraphMetrics;
  checksum: string;
}
```

---

## 6. Configuration Schema

### 6.1 Main Configuration File

**Location:** `kg.config.yaml` or `kg.config.json`

```yaml
# kg.config.yaml

# Project information
project:
  name: my-project
  version: 1.0.0
  type: nextjs  # auto-detected or manual

# Graph configuration
graph:
  # File patterns
  include:
    - "**/*.md"
    - "docs/**/*"
  exclude:
    - "node_modules/**"
    - ".git/**"
    - "dist/**"

  # Node classification rules
  classification:
    rules:
      - pattern: "docs/adr/**"
        type: adr
      - pattern: "docs/architecture/**"
        type: architecture
      - pattern: "docs/guides/**"
        type: guide
    default: unknown

  # Link detection
  links:
    wikilinks: true
    markdownLinks: true
    implicitReferences: false

# Obsidian configuration
obsidian:
  enabled: true
  vaultPath: .

  # Frontmatter defaults
  frontmatter:
    required:
      - title
      - type
    defaults:
      status: draft

  # Tag management
  tags:
    caseSensitive: false
    normalize: lowercase

# CLAUDE.md configuration
claudeMd:
  enabled: true
  path: CLAUDE.md

  # Auto-generation settings
  autoGenerate: true
  mergeGlobal: true

  # Template settings
  template: default

  # Section overrides
  sections:
    commands:
      enabled: true
    codeStyle:
      enabled: true
    rules:
      enabled: true

# Memory/sync configuration
memory:
  enabled: true
  namespace: kg-graph

  # Sync settings
  sync:
    auto: true
    interval: 300000  # 5 minutes
    onModify: true

  # Cache settings
  cache:
    enabled: true
    ttl: 3600  # 1 hour

# Hooks configuration
hooks:
  enabled: true
  configPath: kg.hooks.yaml

# Output configuration
output:
  reportsDir: .kg/reports
  cacheDir: .kg/cache
  format: markdown  # json, markdown, both
```

### 6.2 JSON Schema for Validation

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://weave-nn.io/schemas/kg-config.json",
  "title": "Knowledge Graph Agent Configuration",
  "type": "object",
  "properties": {
    "project": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "version": { "type": "string" },
        "type": {
          "type": "string",
          "enum": ["nextjs", "react", "vue", "angular", "node", "typescript", "python", "rust", "go", "unknown"]
        }
      },
      "required": ["name"]
    },
    "graph": {
      "type": "object",
      "properties": {
        "include": {
          "type": "array",
          "items": { "type": "string" }
        },
        "exclude": {
          "type": "array",
          "items": { "type": "string" }
        },
        "classification": {
          "type": "object",
          "properties": {
            "rules": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "pattern": { "type": "string" },
                  "type": { "type": "string" }
                },
                "required": ["pattern", "type"]
              }
            },
            "default": { "type": "string" }
          }
        }
      }
    },
    "obsidian": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean" },
        "vaultPath": { "type": "string" }
      }
    },
    "claudeMd": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean" },
        "path": { "type": "string" },
        "autoGenerate": { "type": "boolean" },
        "mergeGlobal": { "type": "boolean" },
        "template": { "type": "string" }
      }
    },
    "memory": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean" },
        "namespace": { "type": "string" },
        "sync": {
          "type": "object",
          "properties": {
            "auto": { "type": "boolean" },
            "interval": { "type": "number" },
            "onModify": { "type": "boolean" }
          }
        }
      }
    },
    "hooks": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean" },
        "configPath": { "type": "string" }
      }
    }
  }
}
```

---

## 7. Data Flow Diagrams

### 7.1 Graph Build Flow

```
┌─────────────────┐
│  File System    │
│  (Markdown)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  File Scanner   │
│  (Glob Patterns)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MD Parser      │
│  (gray-matter)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│ Front │ │Content│
│ matter│ │Parser │
└───┬───┘ └───┬───┘
    │         │
    │    ┌────┴────┐
    │    │         │
    │    ▼         ▼
    │ ┌───────┐ ┌───────┐
    │ │WikiL. │ │  Tag  │
    │ │Extract│ │Extract│
    │ └───┬───┘ └───┬───┘
    │     │         │
    └─────┼─────────┘
          │
          ▼
┌─────────────────┐
│  Node Builder   │
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Graph Engine   │
│  (Add Nodes)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Link Resolver  │
│  (Build Edges)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Shadow │ │Claude │
│ Cache │ │ Flow  │
│(Local)│ │Memory │
└───────┘ └───────┘
```

### 7.2 Sync Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      PUSH OPERATION                          │
└─────────────────────────────────────────────────────────────┘

┌───────────┐     ┌───────────┐     ┌───────────────────────┐
│  Local    │     │  Sync     │     │   Claude-Flow         │
│  Graph    │────▶│  Engine   │────▶│   Memory Client       │
└───────────┘     └───────────┘     └───────────┬───────────┘
                        │                        │
                        ▼                        ▼
                  ┌───────────┐           ┌───────────┐
                  │  Diff     │           │  MCP Tool │
                  │  Calculator│           │  Calls    │
                  └─────┬─────┘           └───────────┘
                        │
                        ▼
                  ┌───────────┐
                  │ Changed   │
                  │ Nodes     │
                  └───────────┘


┌─────────────────────────────────────────────────────────────┐
│                      PULL OPERATION                          │
└─────────────────────────────────────────────────────────────┘

┌───────────────────────┐     ┌───────────┐     ┌───────────┐
│   Claude-Flow         │     │  Sync     │     │  Local    │
│   Memory              │────▶│  Engine   │────▶│  Graph    │
└───────────────────────┘     └───────────┘     └───────────┘
         │                          │
         ▼                          ▼
   ┌───────────┐            ┌─────────────┐
   │  Fetch    │            │  Conflict   │
   │  Remote   │            │  Resolution │
   └───────────┘            └─────────────┘
```

### 7.3 CLI Command Flow

```
┌─────────────────┐
│   User Input    │
│   (kg command)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Commander.js  │
│   (Parse Args)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Config Loader  │
│  (cosmiconfig)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Command Router │
└────────┬────────┘
         │
    ┌────┴────────┬────────────┬────────────┐
    │             │            │            │
    ▼             ▼            ▼            ▼
┌───────┐    ┌───────┐    ┌───────┐    ┌───────┐
│ graph │    │ docs  │    │claude │    │ sync  │
│handler│    │handler│    │handler│    │handler│
└───┬───┘    └───┬───┘    └───┬───┘    └───┬───┘
    │            │            │            │
    ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────┐
│              Core Engine Layer               │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Output Handler │
│  (Format/Print) │
└─────────────────┘
```

---

## 8. File Structure

### 8.1 Complete Package Structure

```
@weave-nn/knowledge-graph-agent/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── vite.config.ts
├── vitest.config.ts
├── .eslintrc.js
├── .prettierrc
├── README.md
├── CHANGELOG.md
├── LICENSE
│
├── bin/
│   └── kg.js                    # CLI entry point (shebang)
│
├── src/
│   ├── index.ts                 # Main library exports
│   │
│   ├── cli/
│   │   ├── index.ts             # CLI setup and configuration
│   │   ├── bin.ts               # CLI entry point
│   │   ├── commands/
│   │   │   ├── init.ts          # kg init command
│   │   │   ├── graph/
│   │   │   │   ├── index.ts     # Graph command group
│   │   │   │   ├── build.ts     # kg graph build
│   │   │   │   ├── analyze.ts   # kg graph analyze
│   │   │   │   ├── orphans.ts   # kg graph orphans
│   │   │   │   ├── hubs.ts      # kg graph hubs
│   │   │   │   ├── suggest.ts   # kg graph suggest
│   │   │   │   └── export.ts    # kg graph export
│   │   │   ├── docs/
│   │   │   │   ├── index.ts     # Docs command group
│   │   │   │   ├── init.ts      # kg docs init
│   │   │   │   ├── scaffold.ts  # kg docs scaffold
│   │   │   │   ├── adr.ts       # kg docs adr
│   │   │   │   └── validate.ts  # kg docs validate
│   │   │   ├── claude/
│   │   │   │   ├── index.ts     # Claude command group
│   │   │   │   ├── init.ts      # kg claude init
│   │   │   │   ├── update.ts    # kg claude update
│   │   │   │   ├── merge.ts     # kg claude merge
│   │   │   │   └── validate.ts  # kg claude validate
│   │   │   ├── sync/
│   │   │   │   ├── index.ts     # Sync command group
│   │   │   │   ├── push.ts      # kg sync push
│   │   │   │   ├── pull.ts      # kg sync pull
│   │   │   │   ├── status.ts    # kg sync status
│   │   │   │   └── reset.ts     # kg sync reset
│   │   │   └── config/
│   │   │       ├── index.ts     # Config command group
│   │   │       ├── show.ts      # kg config show
│   │   │       ├── set.ts       # kg config set
│   │   │       └── init.ts      # kg config init
│   │   └── utils/
│   │       ├── output.ts        # CLI output formatting
│   │       ├── progress.ts      # Progress indicators
│   │       └── prompts.ts       # Interactive prompts
│   │
│   ├── graph/
│   │   ├── index.ts             # Graph engine exports
│   │   ├── engine.ts            # KnowledgeGraphEngine class
│   │   ├── node.ts              # Node operations
│   │   ├── edge.ts              # Edge operations
│   │   ├── traversal.ts         # Traversal algorithms
│   │   ├── metrics.ts           # Metrics calculation
│   │   ├── cluster.ts           # Cluster detection
│   │   ├── suggestion.ts        # Connection suggestions
│   │   └── export/
│   │       ├── index.ts         # Export utilities
│   │       ├── json.ts          # JSON export
│   │       ├── dot.ts           # GraphViz DOT export
│   │       └── mermaid.ts       # Mermaid diagram export
│   │
│   ├── obsidian/
│   │   ├── index.ts             # Obsidian module exports
│   │   ├── vault.ts             # ObsidianVault class
│   │   ├── detector.ts          # Vault detection
│   │   ├── parser.ts            # Markdown parsing
│   │   ├── frontmatter.ts       # Frontmatter handling
│   │   ├── wikilink.ts          # Wikilink extraction/resolution
│   │   ├── tag.ts               # Tag extraction
│   │   └── watcher.ts           # File system watcher
│   │
│   ├── claude-md/
│   │   ├── index.ts             # CLAUDE.md module exports
│   │   ├── generator.ts         # ClaudeMdGenerator class
│   │   ├── detector.ts          # Project type detection
│   │   ├── templates/
│   │   │   ├── index.ts         # Template registry
│   │   │   ├── default.hbs      # Default template
│   │   │   ├── nextjs.hbs       # Next.js template
│   │   │   ├── react.hbs        # React template
│   │   │   ├── node.hbs         # Node.js template
│   │   │   └── python.hbs       # Python template
│   │   ├── sections/
│   │   │   ├── header.ts        # Header section generator
│   │   │   ├── commands.ts      # Commands section generator
│   │   │   ├── code-style.ts    # Code style section generator
│   │   │   └── rules.ts         # Rules section generator
│   │   ├── merger.ts            # Configuration merging
│   │   └── validator.ts         # CLAUDE.md validation
│   │
│   ├── docs/
│   │   ├── index.ts             # Docs module exports
│   │   ├── initializer.ts       # DocsInitializer class
│   │   ├── structure.ts         # Directory structure definitions
│   │   ├── templates/
│   │   │   ├── index.ts         # Template registry
│   │   │   ├── readme.hbs       # README template
│   │   │   ├── adr.hbs          # ADR template
│   │   │   ├── api.hbs          # API documentation template
│   │   │   └── guide.hbs        # Guide template
│   │   └── scaffolder.ts        # Documentation scaffolding
│   │
│   ├── memory/
│   │   ├── index.ts             # Memory module exports
│   │   ├── client.ts            # GraphMemoryClient class
│   │   ├── namespace.ts         # Namespace management
│   │   ├── sync.ts              # Sync engine
│   │   ├── conflict.ts          # Conflict resolution
│   │   ├── cache.ts             # Local caching
│   │   └── snapshot.ts          # Graph snapshots
│   │
│   ├── hooks/
│   │   ├── index.ts             # Hook system exports
│   │   ├── registry.ts          # Hook registry
│   │   ├── executor.ts          # Hook executor
│   │   ├── builtin/
│   │   │   ├── sync.ts          # Built-in sync hooks
│   │   │   ├── report.ts        # Built-in report hooks
│   │   │   └── notify.ts        # Built-in notification hooks
│   │   └── loader.ts            # Hook configuration loader
│   │
│   ├── config/
│   │   ├── index.ts             # Configuration exports
│   │   ├── loader.ts            # Config file loader (cosmiconfig)
│   │   ├── schema.ts            # Configuration schema
│   │   ├── defaults.ts          # Default configuration values
│   │   └── validator.ts         # Configuration validation
│   │
│   ├── types/
│   │   ├── index.ts             # Type exports
│   │   ├── core.ts              # Core types (GraphNode, GraphEdge)
│   │   ├── graph.ts             # Graph-specific types
│   │   ├── obsidian.ts          # Obsidian types
│   │   ├── claude-md.ts         # CLAUDE.md types
│   │   ├── memory.ts            # Memory types
│   │   └── config.ts            # Configuration types
│   │
│   └── utils/
│       ├── index.ts             # Utility exports
│       ├── logger.ts            # Logging utilities
│       ├── hash.ts              # Content hashing
│       ├── path.ts              # Path utilities
│       └── async.ts             # Async utilities
│
├── templates/
│   ├── claude-md/
│   │   ├── default.hbs
│   │   ├── nextjs.hbs
│   │   ├── react.hbs
│   │   └── node.hbs
│   └── docs/
│       ├── readme.hbs
│       ├── adr.hbs
│       └── api.hbs
│
├── schemas/
│   ├── kg-config.schema.json    # Configuration JSON schema
│   ├── hooks.schema.json        # Hooks configuration schema
│   └── claude-md.schema.json    # CLAUDE.md schema
│
├── tests/
│   ├── unit/
│   │   ├── graph/
│   │   │   ├── engine.test.ts
│   │   │   ├── node.test.ts
│   │   │   ├── edge.test.ts
│   │   │   └── traversal.test.ts
│   │   ├── obsidian/
│   │   │   ├── vault.test.ts
│   │   │   ├── parser.test.ts
│   │   │   └── wikilink.test.ts
│   │   ├── claude-md/
│   │   │   ├── generator.test.ts
│   │   │   └── detector.test.ts
│   │   └── memory/
│   │       ├── client.test.ts
│   │       └── sync.test.ts
│   ├── integration/
│   │   ├── cli.test.ts
│   │   ├── graph-build.test.ts
│   │   └── sync-flow.test.ts
│   └── fixtures/
│       ├── sample-vault/
│       ├── sample-project/
│       └── mock-data/
│
├── docs/
│   ├── README.md
│   ├── API.md
│   ├── CLI.md
│   ├── CONFIGURATION.md
│   └── INTEGRATION.md
│
└── dist/                        # Built output (gitignored)
    ├── index.js
    ├── index.mjs
    ├── index.d.ts
    ├── cli/
    ├── graph/
    ├── obsidian/
    ├── claude-md/
    ├── memory/
    └── types/
```

---

## Architecture Decision Records

### ADR-001: Use ESM Modules

**Status:** Accepted

**Context:** Modern Node.js ecosystem is moving toward ESM modules.

**Decision:** The package will use ES modules (`"type": "module"`) with dual CJS/ESM builds.

**Consequences:**
- Better tree-shaking support
- Native ESM imports
- Requires Node.js 18+

### ADR-002: CLI Framework Selection

**Status:** Accepted

**Context:** Need a robust CLI framework for the `kg` command.

**Decision:** Use Commander.js for CLI parsing.

**Alternatives Considered:**
- yargs: More complex API
- oclif: Too heavy for this use case
- cac: Less mature ecosystem

**Consequences:**
- Familiar API for developers
- Good TypeScript support
- Active maintenance

### ADR-003: Configuration Loading

**Status:** Accepted

**Context:** Need flexible configuration file support.

**Decision:** Use cosmiconfig for configuration loading.

**Consequences:**
- Supports YAML, JSON, JS, TS config files
- Standard discovery patterns (`kg.config.yaml`, `.kgrc`, etc.)
- Package.json support

### ADR-004: Memory Integration Strategy

**Status:** Accepted

**Context:** Need to integrate with claude-flow memory system.

**Decision:** Use namespace-based storage with MCP tool wrappers.

**Consequences:**
- Isolated namespace prevents conflicts
- Batch operations for performance
- Graceful degradation when claude-flow unavailable

---

## Related Documents

- [CLAUDE.md](/home/aepod/dev/weave-nn/CLAUDE.md) - Project CLAUDE.md example
- [Shadow Cache Types](/home/aepod/dev/weave-nn/weaver/src/shadow-cache/types.ts) - Existing cache implementation
- [Claude-Flow Client](/home/aepod/dev/weave-nn/weaver/src/memory/claude-flow-client.ts) - Memory client implementation
- [Graph Tools](/home/aepod/dev/weave-nn/weave-nn/scripts/graph-tools/) - Existing graph analysis scripts

---

## Implementation Phases

### Phase 1: Core Infrastructure
- Package setup with build tooling
- Type system implementation
- Configuration loader
- Basic CLI structure

### Phase 2: Graph Engine
- Node and edge management
- Traversal algorithms
- Metrics calculation
- Export functionality

### Phase 3: Obsidian Integration
- Vault detection
- Markdown parsing
- Wikilink resolution
- Frontmatter handling

### Phase 4: CLAUDE.md Generator
- Project detection
- Template system
- Section generators
- Merge functionality

### Phase 5: Memory Integration
- Claude-flow client
- Sync engine
- Conflict resolution
- Hook system

### Phase 6: Documentation & Polish
- API documentation
- CLI help improvements
- Example projects
- Performance optimization
