# @weavelogic/knowledge-graph-agent Architecture

## SPARC Methodology Architecture Document

**Version:** 0.3.0 (Planned)
**Status:** Architecture Design Phase
**Author:** System Architecture Designer
**Date:** 2025-12-28

---

## 1. Executive Summary

The `@weavelogic/knowledge-graph-agent` package is a comprehensive NPM module for AI-assisted knowledge graph generation, documentation management, and codebase cultivation. It provides CLI tools, programmatic APIs, and integration points for claude-flow orchestration.

### Key Objectives

1. **Knowledge Graph Management** - Create, analyze, and traverse knowledge graphs
2. **Documentation Generation** - Auto-generate docs from codebase analysis
3. **Cultivation System** - Intelligent vault cultivation with seed generation
4. **Agent Orchestration** - Multi-agent coordination via claude-flow
5. **Standards Validation** - Ensure documentation quality and consistency

---

## 2. C4 Model Architecture

### 2.1 Context Diagram (Level 1)

```
                                   +------------------+
                                   |    Developer     |
                                   |     (User)       |
                                   +--------+---------+
                                            |
                                            v
                     +----------------------+----------------------+
                     |                                             |
                     |    @weavelogic/knowledge-graph-agent        |
                     |                                             |
                     |  - CLI (kg, knowledge-graph)                |
                     |  - Programmatic API                         |
                     |  - MCP Server Integration                   |
                     |                                             |
                     +----------------------+----------------------+
                                            |
            +-------------------------------+-------------------------------+
            |                               |                               |
            v                               v                               v
   +----------------+            +------------------+             +------------------+
   |   File System  |            |   claude-flow    |             |  Obsidian Vault  |
   |   (Codebase)   |            |   MCP Server     |             |  (Knowledge Base)|
   +----------------+            +------------------+             +------------------+
```

### 2.2 Container Diagram (Level 2)

```
+-----------------------------------------------------------------------------------+
|                         @weavelogic/knowledge-graph-agent                          |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +-------------+  +---------------+  +---------------+  +------------------+      |
|  |    CLI      |  |  Core Engine  |  |   Generators  |  |   Integrations   |      |
|  | (Commander) |->| (Graph/DB)    |->| (Docs/Seed)   |->| (Claude-Flow)    |      |
|  +-------------+  +---------------+  +---------------+  +------------------+      |
|        |                 |                 |                    |                 |
|        v                 v                 v                    v                 |
|  +-------------+  +---------------+  +---------------+  +------------------+      |
|  |  Analyzers  |  | Shadow Cache  |  | Cultivation   |  |  Orchestration   |      |
|  | (Deep/Std)  |  | (SQLite)      |  | (Engine)      |  |  (Agents)        |      |
|  +-------------+  +---------------+  +---------------+  +------------------+      |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### 2.3 Component Diagram (Level 3)

```
src/
+-- core/                    # Core functionality (existing)
|   +-- graph.ts            # KnowledgeGraphManager class
|   +-- database.ts         # KnowledgeGraphDatabase (SQLite)
|   +-- types.ts            # Core type definitions
|   +-- index.ts            # Public exports
|
+-- generators/              # Document generation (existing + new)
|   +-- docs-init.ts        # Docs directory initializer
|   +-- template-engine.ts  # Handlebars template processing
|   +-- primitives.ts       # PRIMITIVES.md generator
|   +-- moc.ts              # Map of Content generator
|   +-- frontmatter.ts      # Frontmatter generation
|   +-- footer.ts           # Footer/backlink builder
|
+-- analyzers/               # Analysis engines (NEW)
|   +-- deep-analyzer.ts    # AI-powered deep codebase analysis
|   +-- standards.ts        # Standards validation engine
|   +-- dependency.ts       # Dependency graph analyzer
|   +-- pattern.ts          # Code pattern recognition
|   +-- gap.ts              # Documentation gap analysis
|   +-- metrics.ts          # Quality metrics calculator
|
+-- cultivation/             # Cultivation system (PORT from weaver)
|   +-- engine.ts           # CultivationEngine class
|   +-- seed-generator.ts   # Bootstrap vault from codebase
|   +-- seed-enhancer.ts    # Enhance generated seeds
|   +-- context-loader.ts   # Load vault context
|   +-- document-generator.ts # AI document generation
|   +-- frontmatter-generator.ts # Intelligent frontmatter
|   +-- footer-builder.ts   # Backlink footer construction
|   +-- agent-orchestrator.ts # Multi-agent coordination
|   +-- types.ts            # Cultivation type definitions
|
+-- integrations/            # External integrations (existing + new)
|   +-- claude-flow.ts      # Claude-flow memory/hooks
|   +-- mcp-client.ts       # MCP protocol client
|   +-- obsidian.ts         # Obsidian vault integration
|   +-- git.ts              # Git operations
|   +-- package-managers.ts # npm/pip/cargo detection
|
+-- shadow-cache/            # Shadow cache system (PORT from weaver)
|   +-- index.ts            # ShadowCache main class
|   +-- database.ts         # SQLite operations
|   +-- parser.ts           # Markdown file parser
|   +-- types.ts            # Cache type definitions
|
+-- agents/                  # Agent system (NEW)
|   +-- registry.ts         # Agent type registry
|   +-- spawner.ts          # Agent spawning logic
|   +-- coordinator.ts      # Multi-agent coordination
|   +-- prompts/            # Agent prompt templates
|   |   +-- researcher.ts
|   |   +-- coder.ts
|   |   +-- analyst.ts
|   |   +-- architect.ts
|
+-- workflows/               # Workflow automation (NEW)
|   +-- engine.ts           # WorkflowEngine class
|   +-- registry.ts         # Workflow registry
|   +-- steps/              # Workflow step definitions
|   |   +-- analyze.ts
|   |   +-- generate.ts
|   |   +-- validate.ts
|   |   +-- cultivate.ts
|
+-- cli/                     # CLI commands (existing + new)
|   +-- bin.ts              # CLI entry point
|   +-- index.ts            # CLI program factory
|   +-- commands/           # Command implementations
|       +-- init.ts         # Initialize docs/vault
|       +-- generate.ts     # Generate documentation
|       +-- analyze.ts      # Analyze codebase
|       +-- cultivate.ts    # Cultivate knowledge graph
|       +-- seed.ts         # Seed primitives
|       +-- validate.ts     # Validate standards
|       +-- sync.ts         # Sync to claude-flow
|       +-- graph.ts        # Graph operations
|       +-- agents.ts       # Agent management
|       +-- workflow.ts     # Workflow commands
|
+-- index.ts                 # Main package exports
```

---

## 3. Module Architecture

### 3.1 Core Module (`src/core/`)

The core module provides foundational knowledge graph operations.

```typescript
// src/core/types.ts
export interface KnowledgeNode {
  id: string;
  title: string;
  path: string;
  type: NodeType;
  status: NodeStatus;
  tags: string[];
  content: string;
  frontmatter: DocumentMetadata;
  outgoingLinks: NodeLink[];
  incomingLinks: NodeLink[];
  created: Date;
  lastModified: Date;
}

export type NodeType =
  | 'concept'
  | 'technical'
  | 'feature'
  | 'primitive'
  | 'service'
  | 'guide'
  | 'standard'
  | 'integration'
  | 'pattern'
  | 'protocol'
  | 'schema';

export type NodeStatus = 'draft' | 'active' | 'deprecated' | 'archived';

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
  context?: string;
}

export type EdgeType = 'link' | 'reference' | 'dependency' | 'related' | 'parent';

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<NodeType, number>;
  nodesByStatus: Record<NodeStatus, number>;
  orphanNodes: number;
  avgLinksPerNode: number;
  mostConnected: Array<{ id: string; connections: number }>;
}
```

**Key Classes:**
- `KnowledgeGraphManager` - In-memory graph operations
- `KnowledgeGraphDatabase` - SQLite persistence layer

### 3.2 Generators Module (`src/generators/`)

Document and content generation utilities.

```typescript
// src/generators/types.ts
export interface DocsInitOptions {
  projectRoot: string;
  docsPath?: string;
  includeExamples?: boolean;
  detectFramework?: boolean;
  templateSet?: 'minimal' | 'standard' | 'comprehensive';
}

export interface DocsInitResult {
  success: boolean;
  docsPath: string;
  filesCreated: string[];
  errors: string[];
}

export interface TemplateContext {
  projectName: string;
  date: string;
  frameworks: FrameworkInfo[];
  languages: string[];
  dependencies: DependencyInfo[];
  concepts: string[];
  components: string[];
  services: string[];
  features: string[];
}
```

**Key Functions:**
- `initDocs()` - Initialize docs directory structure
- `generatePrimitives()` - Generate PRIMITIVES.md
- `generateMOC()` - Generate Map of Content
- `generateFrontmatter()` - AI-powered frontmatter generation

### 3.3 Analyzers Module (`src/analyzers/`)

Analysis and validation engines (NEW).

```typescript
// src/analyzers/types.ts
export interface DeepAnalysisResult {
  primitives: PrimitiveDiscovery[];
  totalCount: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  patterns: PatternDiscovery[];
  gaps: DocumentationGap[];
}

export interface PrimitiveDiscovery {
  category: string;
  name: string;
  description: string;
  files: string[];
  dependencies?: string[];
  usage?: string;
  type: PrimitiveType;
  priority: Priority;
}

export type PrimitiveType =
  | 'pattern'
  | 'protocol'
  | 'standard'
  | 'integration'
  | 'schema'
  | 'service'
  | 'guide'
  | 'component';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface StandardsValidationResult {
  passed: boolean;
  score: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  details: {
    naming: ValidationCategory;
    dataFormats: ValidationCategory;
    documentation: ValidationCategory;
    testing: ValidationCategory;
  };
}
```

**Key Classes:**
- `DeepAnalyzer` - AI-powered codebase analysis
- `StandardsValidator` - Documentation standards validation
- `DependencyAnalyzer` - Package dependency graph
- `PatternRecognizer` - Code pattern detection
- `GapAnalyzer` - Documentation gap identification

### 3.4 Cultivation Module (`src/cultivation/`)

Knowledge graph cultivation system (PORT from weaver).

```typescript
// src/cultivation/types.ts
export interface CultivationOptions {
  targetDirectory: string;
  dryRun: boolean;
  force: boolean;
  skipUnmodified: boolean;
  generateMissing: boolean;
  buildFooters: boolean;
  useAgents: boolean;
  agentMode: AgentMode;
  maxAgents: number;
  verbose: boolean;
  seed: boolean;
  projectRoot?: string;
  deepAnalysis: boolean;
}

export type AgentMode = 'sequential' | 'parallel' | 'adaptive';

export interface VaultContext {
  primitives?: string;
  features?: string;
  techSpecs?: string;
  vaultRoot: string;
  allFiles: string[];
}

export interface CultivationReport {
  filesProcessed: number;
  frontmatterAdded: number;
  documentsGenerated: number;
  footersUpdated: number;
  warnings: string[];
  errors: string[];
  generatedDocuments: GeneratedDocument[];
  processingTime: number;
}

export interface SeedAnalysis {
  dependencies: DependencyInfo[];
  services: ServiceInfo[];
  frameworks: DependencyInfo[];
  languages: string[];
  deployments: string[];
  existingConcepts: string[];
  existingFeatures: string[];
}
```

**Key Classes:**
- `CultivationEngine` - Main cultivation orchestrator
- `SeedGenerator` - Bootstrap vault from codebase
- `SeedEnhancer` - Enhance generated seeds with AI
- `ContextLoader` - Load vault context files
- `DocumentGenerator` - Generate missing documentation
- `FrontmatterGenerator` - Generate YAML frontmatter
- `FooterBuilder` - Build backlink footers
- `AgentOrchestrator` - Coordinate multi-agent tasks

### 3.5 Shadow Cache Module (`src/shadow-cache/`)

SQLite-based file caching system (PORT from weaver).

```typescript
// src/shadow-cache/types.ts
export interface CachedFile {
  id: number;
  path: string;
  filename: string;
  directory: string;
  size: number;
  content_hash: string;
  frontmatter: Frontmatter | null;
  type: string | null;
  status: string | null;
  title: string | null;
  created_at: Date;
  modified_at: Date;
  cache_updated_at: Date;
}

export interface FileUpdate {
  path: string;
  filename: string;
  directory: string;
  size: number;
  content_hash: string;
  frontmatter: Frontmatter | null;
  title: string;
  tags: string[];
  links: LinkInfo[];
  created_at: Date;
  modified_at: Date;
}

export interface CacheStats {
  totalFiles: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byDirectory: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  orphanedFiles: number;
  lastSync: string | null;
}
```

**Key Classes:**
- `ShadowCache` - Main cache interface
- `ShadowCacheDatabase` - SQLite operations
- File parser with content hashing and change detection

### 3.6 Agents Module (`src/agents/`)

AI agent management system (NEW).

```typescript
// src/agents/types.ts
export interface AgentConfig {
  type: AgentType;
  name?: string;
  capabilities: string[];
  maxConcurrency: number;
  timeout: number;
  retries: number;
}

export type AgentType =
  | 'researcher'
  | 'coder'
  | 'analyst'
  | 'architect'
  | 'tester'
  | 'reviewer'
  | 'documenter'
  | 'optimizer';

export interface AgentTask {
  id: string;
  type: TaskType;
  agent: AgentType;
  description: string;
  input: unknown;
  priority: Priority;
  status: TaskStatus;
  result?: unknown;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

export type TaskType = 'analyze' | 'generate' | 'enhance' | 'validate' | 'coordinate';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AgentOrchestrationResult {
  tasksCompleted: number;
  tasksFailed: number;
  totalTime: number;
  results: Map<string, unknown>;
  errors: Array<{ taskId: string; error: string }>;
}
```

**Key Classes:**
- `AgentRegistry` - Agent type management
- `AgentSpawner` - Agent lifecycle management
- `AgentCoordinator` - Multi-agent orchestration
- `PromptBuilder` - Agent prompt construction

### 3.7 Workflows Module (`src/workflows/`)

Workflow automation system (NEW).

```typescript
// src/workflows/types.ts
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  errorHandling: ErrorHandlingStrategy;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  config: StepConfig;
  dependencies: string[];
  timeout: number;
  retries: number;
}

export type StepType =
  | 'analyze'
  | 'generate'
  | 'validate'
  | 'transform'
  | 'notify'
  | 'agent';

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  stepResults: Map<string, StepResult>;
  error?: string;
}

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled';
```

**Key Classes:**
- `WorkflowEngine` - Workflow execution engine
- `WorkflowRegistry` - Workflow definition storage
- `StepExecutor` - Individual step execution

### 3.8 Integrations Module (`src/integrations/`)

External system integrations.

```typescript
// src/integrations/types.ts
export interface ClaudeFlowConfig {
  namespace: string;
  defaultTTL?: number;
  syncOnChange?: boolean;
  hooks: HooksConfig;
}

export interface HooksConfig {
  preTask: boolean;
  postTask: boolean;
  postEdit: boolean;
  sessionRestore: boolean;
}

export interface MemoryEntry {
  key: string;
  value: unknown;
  namespace: string;
  ttl?: number;
}

export interface SyncResult {
  synced: number;
  failed: number;
  errors: Array<{ key: string; error: string }>;
}

export interface ObsidianVaultConfig {
  vaultPath: string;
  createIfMissing: boolean;
  configurePlugins: boolean;
}
```

**Key Classes:**
- `ClaudeFlowIntegration` - Memory/hooks integration
- `MCPClient` - MCP protocol communication
- `ObsidianIntegration` - Vault management
- `GitIntegration` - Git operations
- `PackageManagerDetector` - Detect npm/pip/cargo/etc.

---

## 4. CLI Command Structure

### 4.1 Command Groups

```
kg (knowledge-graph)
+-- init                  # Initialize knowledge base
|   +-- docs              # Initialize docs directory
|   +-- vault             # Initialize Obsidian vault
|   +-- primitives        # Initialize PRIMITIVES.md
|
+-- generate              # Document generation
|   +-- docs              # Generate documentation
|   +-- primitives        # Generate primitive nodes
|   +-- moc               # Generate Map of Content
|   +-- frontmatter       # Generate frontmatter
|
+-- analyze               # Analysis commands
|   +-- codebase          # Deep codebase analysis
|   +-- dependencies      # Dependency analysis
|   +-- patterns          # Pattern recognition
|   +-- gaps              # Documentation gap analysis
|   +-- standards         # Standards validation
|
+-- cultivate             # Cultivation commands
|   +-- seed              # Seed primitives from codebase
|   +-- enhance           # Enhance existing docs
|   +-- connect           # Connect orphaned documents
|   +-- icons             # Apply visual icons
|   +-- footers           # Build backlink footers
|   +-- all               # Run all cultivation tasks
|
+-- graph                 # Graph operations
|   +-- stats             # Show graph statistics
|   +-- orphans           # List orphaned nodes
|   +-- connections       # Show connection analysis
|   +-- path              # Find path between nodes
|   +-- export            # Export graph data
|
+-- sync                  # Synchronization
|   +-- memory            # Sync to claude-flow memory
|   +-- cache             # Sync shadow cache
|   +-- vault             # Sync vault files
|
+-- agents                # Agent management
|   +-- list              # List available agents
|   +-- spawn             # Spawn agent(s)
|   +-- status            # Check agent status
|   +-- coordinate        # Run coordinated task
|
+-- workflow              # Workflow automation
|   +-- list              # List workflows
|   +-- run               # Execute workflow
|   +-- status            # Check execution status
|   +-- create            # Create custom workflow
```

### 4.2 Command Specifications

#### `kg init docs`
```
Usage: kg init docs [path] [options]

Initialize documentation directory structure

Arguments:
  path                         Target directory (default: ".")

Options:
  --template <type>            Template set: minimal|standard|comprehensive (default: "standard")
  --detect-framework           Auto-detect project frameworks (default: true)
  --include-examples           Include example documentation files (default: true)
  --obsidian                   Configure as Obsidian vault (default: true)
  -f, --force                  Overwrite existing files
  -v, --verbose                Verbose output
```

#### `kg cultivate seed`
```
Usage: kg cultivate seed [path] [options]

Bootstrap vault with primitives from codebase analysis

Arguments:
  path                         Project root directory (default: ".")

Options:
  --vault <path>               Target vault directory (default: "docs")
  --deep                       Use AI for deep analysis (requires claude-flow)
  --ecosystems <list>          Ecosystems to analyze: nodejs,python,rust,go,java,php
  --skip <patterns>            Patterns to skip (glob patterns)
  --dry-run                    Preview without making changes
  -v, --verbose                Verbose output
```

#### `kg analyze standards`
```
Usage: kg analyze standards [path] [options]

Validate documentation against established standards

Arguments:
  path                         Directory to validate (default: ".")

Options:
  --config <file>              Custom standards configuration
  --fix                        Auto-fix issues where possible
  --report <format>            Output format: text|json|markdown (default: "text")
  --strict                     Fail on warnings
  -v, --verbose                Detailed output
```

#### `kg agents coordinate`
```
Usage: kg agents coordinate [task] [options]

Run coordinated multi-agent task

Arguments:
  task                         Task description or task file

Options:
  --agents <types>             Agent types: researcher,coder,analyst,architect (default: "adaptive")
  --mode <mode>                Execution mode: parallel|sequential|adaptive (default: "adaptive")
  --max <number>               Maximum concurrent agents (default: 5)
  --timeout <seconds>          Task timeout (default: 300)
  --memory <namespace>         Memory namespace for coordination
  -v, --verbose                Show agent output
```

---

## 5. API Design

### 5.1 Public Exports (`src/index.ts`)

```typescript
// Core exports
export {
  KnowledgeGraphManager,
  createKnowledgeGraph,
} from './core/graph.js';

export {
  KnowledgeGraphDatabase,
  createKnowledgeGraphDatabase,
} from './core/database.js';

export type {
  KnowledgeNode,
  KnowledgeGraph,
  GraphEdge,
  GraphMetadata,
  GraphStats,
  NodeType,
  NodeStatus,
  NodeLink,
} from './core/types.js';

// Generator exports
export {
  initDocs,
  docsExist,
  getDocsPath,
} from './generators/docs-init.js';

export {
  generatePrimitives,
  generateMOC,
  generateFrontmatter,
} from './generators/index.js';

export type {
  DocsInitOptions,
  DocsInitResult,
  TemplateContext,
} from './generators/types.js';

// Analyzer exports
export {
  DeepAnalyzer,
  createDeepAnalyzer,
} from './analyzers/deep-analyzer.js';

export {
  StandardsValidator,
  createStandardsValidator,
} from './analyzers/standards.js';

export type {
  DeepAnalysisResult,
  PrimitiveDiscovery,
  StandardsValidationResult,
  ValidationCategory,
} from './analyzers/types.js';

// Cultivation exports
export {
  CultivationEngine,
  createCultivationEngine,
} from './cultivation/engine.js';

export {
  SeedGenerator,
  createSeedGenerator,
} from './cultivation/seed-generator.js';

export type {
  CultivationOptions,
  CultivationReport,
  VaultContext,
  SeedAnalysis,
  GeneratedDocument,
} from './cultivation/types.js';

// Shadow Cache exports
export {
  ShadowCache,
  createShadowCache,
} from './shadow-cache/index.js';

export type {
  CachedFile,
  FileUpdate,
  CacheStats,
  Frontmatter,
} from './shadow-cache/types.js';

// Agent exports
export {
  AgentRegistry,
  AgentSpawner,
  AgentCoordinator,
} from './agents/index.js';

export type {
  AgentConfig,
  AgentType,
  AgentTask,
  AgentOrchestrationResult,
} from './agents/types.js';

// Workflow exports
export {
  WorkflowEngine,
  WorkflowRegistry,
} from './workflows/index.js';

export type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowExecution,
} from './workflows/types.js';

// Integration exports
export {
  ClaudeFlowIntegration,
  createClaudeFlowIntegration,
  generateMcpConfig,
} from './integrations/claude-flow.js';

export type {
  ClaudeFlowConfig,
  MemoryEntry,
  SyncResult,
} from './integrations/types.js';

// CLI exports
export {
  createCLI,
  runCLI,
} from './cli/index.js';
```

### 5.2 Configuration Schema

```typescript
// src/config/schema.ts
import { z } from 'zod';

export const KGAgentConfigSchema = z.object({
  // Core settings
  vaultPath: z.string().default('docs'),
  cacheDbPath: z.string().default('.kg-cache.db'),
  graphDbPath: z.string().default('.kg-graph.db'),

  // Generation settings
  generation: z.object({
    detectFramework: z.boolean().default(true),
    includeExamples: z.boolean().default(true),
    templateSet: z.enum(['minimal', 'standard', 'comprehensive']).default('standard'),
  }).default({}),

  // Cultivation settings
  cultivation: z.object({
    minConnections: z.number().default(2),
    deepAnalysis: z.boolean().default(false),
    agentMode: z.enum(['sequential', 'parallel', 'adaptive']).default('adaptive'),
    maxAgents: z.number().default(5),
    buildFooters: z.boolean().default(true),
    applyIcons: z.boolean().default(true),
  }).default({}),

  // Standards settings
  standards: z.object({
    strict: z.boolean().default(false),
    customRules: z.string().optional(),
    categories: z.array(z.string()).default(['naming', 'dataFormats', 'documentation', 'testing']),
  }).default({}),

  // Claude-flow integration
  claudeFlow: z.object({
    enabled: z.boolean().default(true),
    namespace: z.string().default('knowledge-graph'),
    defaultTTL: z.number().default(0),
    syncOnChange: z.boolean().default(true),
    hooks: z.object({
      preTask: z.boolean().default(true),
      postTask: z.boolean().default(true),
      postEdit: z.boolean().default(true),
      sessionRestore: z.boolean().default(true),
    }).default({}),
  }).default({}),

  // Ecosystem detection
  ecosystems: z.object({
    nodejs: z.boolean().default(true),
    python: z.boolean().default(true),
    rust: z.boolean().default(true),
    go: z.boolean().default(true),
    java: z.boolean().default(true),
    php: z.boolean().default(true),
  }).default({}),

  // Ignore patterns
  ignore: z.array(z.string()).default([
    'node_modules',
    '.git',
    'dist',
    'build',
    '__pycache__',
    'target',
    'vendor',
  ]),
});

export type KGAgentConfig = z.infer<typeof KGAgentConfigSchema>;
```

---

## 6. Data Flow Architecture

### 6.1 Seed Generation Flow

```
+------------------+      +------------------+      +------------------+
|   Codebase       |      |  SeedGenerator   |      |  Vault           |
|   Analysis       |----->|  Engine          |----->|  (Markdown)      |
+------------------+      +------------------+      +------------------+
        |                         |                         |
        v                         v                         v
+------------------+      +------------------+      +------------------+
| package.json     |      | DependencyInfo   |      | primitives/      |
| requirements.txt |      | FrameworkInfo    |      | services/        |
| Cargo.toml       |      | ServiceInfo      |      | integrations/    |
| go.mod           |      | LanguageInfo     |      | standards/       |
+------------------+      +------------------+      +------------------+
```

### 6.2 Deep Analysis Flow

```
+------------------+      +------------------+      +------------------+
|   Source Files   |      |  DeepAnalyzer    |      |  Analysis        |
|   (Code)         |----->|  (AI-powered)    |----->|  Results         |
+------------------+      +------------------+      +------------------+
        |                         |                         |
        v                         v                         v
+------------------+      +------------------+      +------------------+
| API patterns     |      | claude-flow      |      | PrimitiveDiscovery|
| Data schemas     |      | researcher agent |      | PatternDiscovery  |
| Integrations     |      |                  |      | GapAnalysis       |
+------------------+      +------------------+      +------------------+
```

### 6.3 Cultivation Flow

```
+------------------+      +------------------+      +------------------+
|   Vault Files    |      | CultivationEngine|      |  Enhanced        |
|   (Markdown)     |----->|                  |----->|  Documents       |
+------------------+      +------------------+      +------------------+
        |                         |                         |
        +----------+--------------+                         |
                   |                                        |
        +----------v----------+                             |
        |                     |                             |
+-------v-------+  +----------v---------+  +----------------v------+
| Frontmatter   |  |  Document          |  |  Footer                |
| Generator     |  |  Generator         |  |  Builder               |
+---------------+  +--------------------+  +-----------------------+
```

---

## 7. Integration Architecture

### 7.1 Claude-Flow Integration

```
+---------------------------+          +---------------------------+
|  knowledge-graph-agent    |          |  claude-flow MCP Server   |
+---------------------------+          +---------------------------+
|                           |          |                           |
|  +-------------------+    |   MCP    |  +-------------------+    |
|  | ClaudeFlowClient  |<---|--------->|  | Memory Store      |    |
|  +-------------------+    |          |  +-------------------+    |
|          |                |          |          |                |
|          v                |          |          v                |
|  +-------------------+    |          |  +-------------------+    |
|  | Sync Manager      |    |          |  | Session Persist   |    |
|  +-------------------+    |          |  +-------------------+    |
|          |                |          |          |                |
|          v                |          |          v                |
|  +-------------------+    |          |  +-------------------+    |
|  | Hooks Runner      |<---|--------->|  | Hooks Handler     |    |
|  +-------------------+    |          |  +-------------------+    |
|                           |          |                           |
+---------------------------+          +---------------------------+
```

### 7.2 Memory Namespace Structure

```
knowledge-graph/
+-- metadata                    # Graph metadata
+-- stats                       # Graph statistics
+-- index/
|   +-- nodes                   # Node index for lookup
|   +-- tags                    # Tag-to-node index
|   +-- types                   # Type-to-node index
+-- node/
|   +-- <node-id>              # Individual node data
+-- changes/
|   +-- pending                 # Pending changes queue
|   +-- history                 # Change history
+-- agents/
    +-- <agent-id>             # Agent state/context
```

---

## 8. Technology Stack

### 8.1 Runtime Requirements

- **Node.js**: >= 20.0.0
- **TypeScript**: 5.x
- **Build Tool**: Vite (library mode)

### 8.2 Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| commander | ^14.0.0 | CLI framework |
| chalk | ^5.3.0 | Terminal styling |
| ora | ^8.1.0 | Spinner/progress |
| inquirer | ^12.0.0 | Interactive prompts |
| better-sqlite3 | ^11.0.0 | SQLite database |
| gray-matter | ^4.0.3 | Frontmatter parsing |
| handlebars | ^4.7.8 | Template engine |
| fast-glob | ^3.3.0 | File globbing |
| zod | ^3.23.0 | Schema validation |
| cosmiconfig | ^9.0.0 | Configuration loading |
| simple-git | ^3.28.0 | Git operations |
| @anthropic-ai/sdk | ^0.32.0 | AI integration |

### 8.3 Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.7.0 | TypeScript compiler |
| vite | ^6.3.0 | Build tool |
| vitest | ^3.0.0 | Testing framework |
| tsx | ^4.19.0 | TypeScript execution |
| eslint | ^9.0.0 | Linting |

---

## 9. Architecture Decision Records

### ADR-001: SQLite for Local Caching

**Status:** Accepted

**Context:** Need persistent storage for knowledge graph and shadow cache that works offline and doesn't require external services.

**Decision:** Use better-sqlite3 for local SQLite databases.

**Rationale:**
- Zero-configuration, embedded database
- High performance for local operations
- Single-file storage, easy to backup/sync
- No network dependency
- Excellent for read-heavy workloads

**Consequences:**
- Positive: Fast, reliable local storage
- Negative: Limited concurrent write access
- Mitigation: Single-process design with transaction batching

---

### ADR-002: Port Cultivation System from Weaver

**Status:** Accepted

**Context:** The weaver package has a mature cultivation system that should be available in the standalone NPM package.

**Decision:** Port seed generation, deep analysis, and standards validation from weaver to knowledge-graph-agent.

**Rationale:**
- Leverage tested, working code
- Provide complete functionality in single package
- Enable independent usage without weaver
- Maintain compatibility with existing workflows

**Consequences:**
- Positive: Feature parity with weaver
- Positive: Smaller deployment for standalone use
- Negative: Code duplication between packages
- Mitigation: Consider shared core package in future

---

### ADR-003: Lazy Command Loading

**Status:** Accepted

**Context:** CLI startup time is critical for developer experience.

**Decision:** Implement lazy loading for CLI commands using dynamic imports.

**Rationale:**
- Fast initial startup (< 100ms target)
- Only load code needed for specific command
- Reduce memory footprint for simple operations

**Consequences:**
- Positive: Fast CLI startup
- Positive: Lower memory usage
- Negative: Slightly more complex initialization
- Mitigation: Clear caching strategy

---

### ADR-004: Claude-Flow Agent Integration

**Status:** Accepted

**Context:** Deep analysis and document generation benefit from AI assistance via claude-flow agents.

**Decision:** Integrate with claude-flow MCP server for agent coordination and memory persistence.

**Rationale:**
- Leverage existing agent infrastructure
- Cross-session memory persistence
- Multi-agent coordination patterns
- Established hook system for workflow integration

**Consequences:**
- Positive: Powerful AI-assisted features
- Positive: Memory persistence across sessions
- Negative: Optional runtime dependency
- Mitigation: Graceful fallback when claude-flow unavailable

---

## 10. Quality Attributes

### 10.1 Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| CLI startup | < 100ms | Cold start to prompt |
| Init docs | < 2s | Create full directory structure |
| Cache sync (100 files) | < 5s | Parse and cache markdown files |
| Graph query | < 50ms | Find related nodes |
| Seed generation | < 30s | Full codebase analysis |

### 10.2 Scalability Requirements

| Dimension | Target |
|-----------|--------|
| Vault size | 10,000+ documents |
| Graph nodes | 50,000+ nodes |
| Concurrent agents | 10 agents |
| Cache database | 100MB+ |

### 10.3 Reliability Requirements

- Graceful degradation when optional dependencies unavailable
- Transaction safety for database operations
- Automatic recovery from interrupted operations
- Data validation at all input boundaries

---

## 11. Migration Path

### 11.1 From Weaver

Users of `weaver cultivate` commands can migrate to:

| Weaver Command | knowledge-graph-agent Equivalent |
|----------------|----------------------------------|
| `weaver cultivate --seed` | `kg cultivate seed` |
| `weaver cultivate --icons` | `kg cultivate icons` |
| `weaver cultivate --connections` | `kg cultivate connect` |
| `weaver cultivate --frontmatter` | `kg generate frontmatter` |
| `weaver cultivate --parse` | `kg cultivate all` |
| `weaver analyze-standards` | `kg analyze standards` |

### 11.2 Breaking Changes

None expected for initial release. Package is additive to existing ecosystem.

---

## 12. Future Considerations

### 12.1 Potential Extensions

1. **Web Dashboard** - Visual graph exploration UI
2. **VS Code Extension** - IDE integration
3. **Graph Visualization** - D3.js-based graph rendering
4. **AI Model Flexibility** - Support for multiple AI providers
5. **Team Collaboration** - Multi-user sync via cloud backend

### 12.2 Scalability Path

1. **Phase 1** (Current) - Single-user local operation
2. **Phase 2** - Optional cloud sync for persistence
3. **Phase 3** - Team features with shared graphs
4. **Phase 4** - Enterprise features with access control

---

## 13. Appendix

### 13.1 File Structure Summary

```
packages/knowledge-graph-agent/
+-- src/
|   +-- core/           # Core graph operations
|   +-- generators/     # Document generators
|   +-- analyzers/      # Analysis engines
|   +-- cultivation/    # Cultivation system
|   +-- shadow-cache/   # File caching
|   +-- agents/         # Agent management
|   +-- workflows/      # Workflow automation
|   +-- integrations/   # External integrations
|   +-- cli/            # CLI implementation
|   +-- config/         # Configuration schemas
|   +-- index.ts        # Main exports
+-- tests/
|   +-- unit/
|   +-- integration/
|   +-- fixtures/
+-- docs/
|   +-- ARCHITECTURE.md # This document
|   +-- API.md          # API documentation
|   +-- CLI.md          # CLI documentation
+-- templates/          # Handlebars templates
+-- package.json
+-- tsconfig.json
+-- vite.config.ts
+-- vitest.config.ts
```

### 13.2 Related Documents

- `/docs/standards/api-coding-standards.md` - API and coding standards
- `/docs/standards/data-documentation-standards.md` - Data format standards
- `/docs/standards/implementation-naming-standards.md` - Naming conventions
- `/weaver/docs/standards/testing-guidelines.md` - Testing guidelines

---

*Document generated following SPARC methodology.*
*Last updated: 2025-12-28*
