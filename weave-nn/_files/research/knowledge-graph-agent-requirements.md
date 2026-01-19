# Knowledge Graph Agent NPM - Feature Requirements

**Document Version**: 1.0.0
**Generated**: 2025-12-28
**Source**: Analysis of weave-nn documentation and codebase
**Purpose**: Define feature requirements for knowledge-graph-agent NPM package based on weave-nn standards

---

## Executive Summary

This document extracts feature requirements from the weave-nn project documentation for implementing a knowledge-graph-agent NPM package. The requirements are derived from:

- PRIMITIVES.md alignment patterns
- weaver/docs/ implementation documentation
- docs/ root level standards and guides
- CLAUDE.md project configuration
- Existing TypeScript interfaces and types

---

## 1. Core Knowledge Graph Features

### 1.1 Graph Node Management

**Required Node Types** (from `cultivation/types.ts` and `vault-init/templates/types.ts`):

```typescript
type NodeType =
  | 'concept'          // High-level concepts and principles
  | 'feature'          // Feature documentation
  | 'technical'        // Technical specifications
  | 'architecture'     // System architecture
  | 'integration'      // Integration points
  | 'guide'            // User guides
  | 'decision'         // Decision records
  | 'planning'         // Planning documents
  | 'research'         // Research notes
  | 'api-reference'    // API documentation
  | 'code-example'     // Code snippets
  | 'documentation';   // General documentation
```

**Node Interface** (from `knowledge-graph/types.ts`):

```typescript
interface GraphNode {
  id: string;
  path: string;
  filename: string;
  content: string;
  frontmatter: Frontmatter;
  outgoingLinks: string[];
  incomingLinks: string[];
  wordCount: number;
  createdAt?: Date;
  modifiedAt?: Date;
}
```

### 1.2 Graph Edge Management

**Required Edge Types** (from `knowledge-graph/types.ts`):

```typescript
interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: 'explicit' | 'suggested' | 'metadata' | 'semantic';
}
```

**Link Types** (from `shadow-cache/types.ts`):

```typescript
type LinkType = 'wikilink' | 'markdown';
```

### 1.3 Graph Analysis

**Required Metrics** (from `knowledge-graph/types.ts`):

```typescript
interface GraphMetrics {
  totalNodes: number;
  totalEdges: number;
  connectedNodes: number;
  disconnectedNodes: number;
  orphanedNodes: number;
  averageDegree: number;
  density: number;
  clusters: number;
  largestComponentSize: number;
}
```

**Connection Suggestions**:

```typescript
interface ConnectionSuggestion {
  sourceFile: string;
  targetFile: string;
  score: number;
  reason: string;
  bidirectional: boolean;
  metadata: {
    sharedTags?: string[];
    sharedCategories?: string[];
    semanticSimilarity?: number;
    topicalRelevance?: string;
  };
}
```

---

## 2. Frontmatter Schema Requirements

### 2.1 Core Frontmatter Fields

**Standard Fields** (from `shadow-cache/types.ts` and `cultivation/types.ts`):

```typescript
interface Frontmatter {
  // Required fields
  title?: string;
  type?: string;

  // Status and tracking
  status?: 'draft' | 'active' | 'in-progress' | 'complete' | 'archived' | 'planned';
  priority?: 'low' | 'medium' | 'high' | 'critical';

  // Timestamps
  created?: string;        // ISO date: YYYY-MM-DD
  updated?: string;        // ISO timestamp
  created_date?: string;   // Alternate format

  // Classification
  tags?: string[];
  category?: string;
  phase?: string;          // e.g., "phase-12"

  // Additional metadata
  description?: string;
  aliases?: string[];

  // Visual enhancements (weave-nn specific)
  visual?: {
    icon?: string;         // Emoji or icon identifier
    cssclasses?: string[];
  };

  // Versioning
  version?: string;

  // Domain classification
  domain?: string;

  // Extensible
  [key: string]: unknown;
}
```

### 2.2 Document Metadata Types

**Document Generation Types** (from `cultivation/types.ts`):

```typescript
type DocumentType =
  | 'concept'
  | 'feature'
  | 'architecture'
  | 'integration'
  | 'technical'
  | 'guide';

type Priority = 'low' | 'medium' | 'high' | 'critical';
```

### 2.3 Frontmatter Inference Rules

**Path-based Type Inference** (from `frontmatter-generator.ts`):

| Path Pattern | Inferred Type |
|--------------|---------------|
| `/concepts/` | concept |
| `/features/` | feature |
| `/architecture/` | architecture |
| `/integrations/` | integration |
| `/guides/`, `/docs/` | guide |
| `/technical/` | technical |
| `/decisions/` | decision |
| `/planning/`, `/_planning/` | planning |
| `/research/` | research |

**Content-based Type Inference**:

| Content Pattern | Inferred Type |
|-----------------|---------------|
| Contains `## API` or `## Endpoint` | api-reference |
| Contains code blocks | code-example |
| Contains `## Installation` or `## Setup` | guide |
| Contains `## Architecture` or `## Design` | architecture |

---

## 3. Document Structure Requirements

### 3.1 Vault Directory Structure

**Standard Directory Layout** (from `PHASE-6-ARCHITECTURE.md`):

```
vault/
  README.md                    # Generated overview
  concept-map.md               # Mermaid diagram
  concepts/                    # High-level concepts
    app-router/
    server-components/
    data-flow/
  technical/                   # Technical details
    architecture/
    api-routes/
    components/
    database/
  features/                    # Feature documentation
    user-management/
    dashboard/
    settings/
  components/                  # Component docs (UI)
    ui/
    layout/
  .obsidian/                   # Obsidian config
    graph.json
```

### 3.2 Template System

**Node Template Structure** (from `vault-init/templates/types.ts`):

```typescript
interface NodeTemplate {
  type: 'concept' | 'technical' | 'feature';
  frontmatter: Record<string, any>;
  contentTemplate: string;  // Handlebars template
  description?: string;
}

interface VaultTemplate {
  id: string;
  name: string;
  framework: string;
  version: string;
  description: string;
  directories: DirectoryStructure;
  nodeTemplates: Map<string, NodeTemplate>;
  metadata?: {
    author?: string;
    tags?: string[];
    dependencies?: string[];
  };
}
```

---

## 4. Claude-Flow Integration Requirements

### 4.1 MCP Tool Interface

**Required MCP Tools** (from `CLAUDE-FLOW-INTEGRATION.md`):

```typescript
// Core vault operations
weaver_search_vault({ query, tags, limit })
weaver_get_file({ path })
weaver_update_metadata({ path, metadata })
weaver_search_tags({ tags, operator })

// Cultivation operations
weaver_cultivate({ path, mode, icons, connections, metadata, orphans_only, max })
weaver_init_vault({ project_path, output_path, template })

// Service management
weaver_service_start({ name })
weaver_service_health({ name })
weaver_service_status()
```

### 4.2 Agent Rules

**Automation Rules** (from `CLAUDE-FLOW-INTEGRATION.md`):

```yaml
rules:
  auto-cultivate:
    trigger: file_changed
    conditions:
      - path_matches: "**/*.md"
      - not_in_path: ".git"
    actions:
      - tool: weaver_cultivate
        args: { mode: incremental, icons: true, connections: true, metadata: true }

  enhance-metadata:
    trigger: file_created
    conditions:
      - path_matches: "**/*.md"
      - missing_frontmatter: true
    actions:
      - tool: weaver_update_metadata
        args: { auto: true }

  connect-orphans:
    trigger: scheduled
    schedule: "0 */6 * * *"
    actions:
      - tool: weaver_cultivate
        args: { orphans-only: true, connections: true, max: 10 }
```

---

## 5. Implementation Standards

### 5.1 Naming Conventions

**File Naming** (from `implementation-naming-standards.md`):
- Pattern: `kebab-case.ts`
- Examples: `deep-analyzer.ts`, `seed-generator.ts`

**Class Naming**: PascalCase
**Interface Naming**: PascalCase (no "I" prefix)
**Method Naming**: camelCase with action verbs
**Variable Naming**: camelCase
**Constants**: SCREAMING_SNAKE_CASE for true constants

### 5.2 TypeScript Patterns

**Required Patterns**:

1. **Constructor Dependency Injection**:
```typescript
export class DeepAnalyzer {
  constructor(
    private projectRoot: string,
    private vaultRoot: string
  ) {}
}
```

2. **Interface-First Design**:
```typescript
export interface PrimitiveDiscovery {
  category: string;
  name: string;
  description: string;
  files: string[];
  dependencies?: string[];
  type: 'pattern' | 'protocol' | 'standard' | 'integration' | 'schema' | 'service' | 'guide' | 'component';
  priority: 'critical' | 'high' | 'medium' | 'low';
}
```

3. **Async/Await with Explicit Return Types**:
```typescript
async analyze(): Promise<DeepAnalysisResult> {
  // Implementation
}
```

4. **Graceful Degradation**:
```typescript
async analyze(): Promise<DeepAnalysisResult> {
  try {
    return await this.claudeFlowAnalysis();
  } catch (error) {
    console.error('Deep analysis failed:', error);
    return this.shallowAnalysis();
  }
}
```

### 5.3 Error Handling

**Required Patterns**:

1. Try-catch with logging and context
2. AbortController for timeouts
3. Graceful fallback on failure
4. Error recovery with continue pattern

---

## 6. Shadow Cache Requirements

### 6.1 Database Schema

**Required Tables** (from `shadow-cache/types.ts`):

```typescript
interface CachedFile {
  id: number;
  path: string;
  filename: string;
  directory: string;
  size: number;
  created_at: string;
  modified_at: string;
  content_hash: string;
  frontmatter: string | null;
  type: string | null;
  status: string | null;
  title: string | null;
  cache_updated_at: string;
}

interface Tag {
  id: number;
  tag: string;
}

interface Link {
  id: number;
  source_file_id: number;
  target_path: string;
  link_type: 'wikilink' | 'markdown';
  link_text: string | null;
}

interface CacheStats {
  totalFiles: number;
  totalTags: number;
  totalLinks: number;
  lastFullSync: string | null;
  cacheVersion: string;
  databaseSize: number;
}
```

### 6.2 Cache Operations

**Required Operations**:
- `syncVault()`: Full vault synchronization
- `syncFile(absolutePath, relativePath)`: Single file sync
- `upsertFile(fileUpdate)`: Insert or update file
- `getFile(path)`: Get cached file
- `queryFiles(options)`: Query with filters
- `getStats()`: Get cache statistics

---

## 7. Graph Analysis Requirements

### 7.1 Connectivity Analysis

**Required Metrics** (from graph-structure-analysis.md):

- Total nodes/files count
- Connected vs disconnected files ratio
- Files with wikilinks percentage
- Total wikilinks count
- Unique link targets
- Average links per file
- Files with frontmatter percentage

### 7.2 Orphan Detection

**Required Features**:
- Identify files with no incoming links
- Identify files with no outgoing links
- Detect completely disconnected files
- Group orphans by directory
- Suggest connections for orphans

### 7.3 Hub Detection

**Required Features**:
- Identify hub files (high connection count)
- Track most referenced link targets
- Calculate centrality metrics
- Identify weakly connected files

---

## 8. Cultivation System Requirements

### 8.1 Seed Generation

**Required Capabilities** (from `seed-generator.ts` patterns):

1. **Dependency Analysis**:
   - Parse package.json (Node.js)
   - Parse requirements.txt, Pipfile, pyproject.toml (Python)
   - Parse composer.json (PHP)
   - Parse Cargo.toml (Rust)

2. **Framework Detection**:
   - Identify framework type (nextjs, react, express, django, etc.)
   - Extract version information
   - Detect package manager

3. **Primitive Discovery**:
   - Extract patterns from codebase
   - Map to PRIMITIVES.md taxonomy
   - Classify by priority

### 8.2 Deep Analysis

**Required Features** (from `deep-analyzer.ts`):

1. Claude-flow agent integration for intelligent analysis
2. Timeout handling with AbortController
3. Fallback to shallow analysis on failure
4. JSON response parsing
5. Priority classification

### 8.3 Document Generation

**Required Outputs**:
- Concept nodes
- Technical nodes
- Feature nodes
- Component nodes
- Architecture diagrams (Mermaid)
- Project overview (README.md)
- Concept maps

---

## 9. Wikilink Requirements

### 9.1 Link Formats

**Supported Formats**:
- Standard: `[[target]]`
- With alias: `[[target|display text]]`
- With heading: `[[target#heading]]`
- With block: `[[target^block-id]]`
- Relative paths: `[[../concepts/my-concept]]`

### 9.2 Link Generation

**Required Features**:
- Generate bidirectional links
- Preserve existing links
- Suggest new connections based on:
  - Shared tags
  - Shared categories
  - Semantic similarity
  - Topical relevance

---

## 10. Obsidian Integration Requirements

### 10.1 Vault Detection

**Detection Methods**:
- Check for `.obsidian` folder (primary)
- Check for configuration files
- Detect vault root correctly

### 10.2 Graph View Support

**Required Features**:
- Generate `.obsidian/graph.json` configuration
- Support visual grouping by type
- Support color coding by status

### 10.3 Visual Enhancement

**Required CSS Classes** (from graph-structure-analysis.md):

```yaml
visual:
  icon: "\U0001F4C4"
  cssclasses:
    - type-research-report
    - status-complete
    - domain-knowledge-graph
```

---

## 11. Performance Requirements

### 11.1 Targets

| Metric | Target |
|--------|--------|
| Analysis Time | < 30s for 1000 files |
| Generation Time | < 10s for 100 nodes |
| Memory Usage | < 200MB for large projects |
| Test Coverage | > 80% |

### 11.2 Optimization Strategies

- Streaming file processing
- Batch operations
- Shadow cache for fast queries
- Incremental updates vs full sync

---

## 12. API Surface

### 12.1 Core API

```typescript
// Main entry point
initializeVault(options: VaultInitOptions): Promise<VaultInitResult>

// Graph operations
analyzeGraph(vaultPath: string): Promise<AnalysisResult>
suggestConnections(nodeId: string): Promise<ConnectionSuggestion[]>
connectNodes(source: string, target: string): Promise<void>

// Cultivation
cultivate(options: CultivationOptions): Promise<CultivationReport>
generateFrontmatter(filePath: string): Promise<Frontmatter>
seedVault(projectPath: string, vaultPath: string): Promise<GeneratedDocument[]>

// Cache operations
syncVault(vaultPath: string): Promise<CacheStats>
queryFiles(options: QueryOptions): Promise<CachedFile[]>
```

### 12.2 CLI Commands

```bash
# Vault initialization
kg init --project <path> --output <vault-path> --template <template-id>

# Cultivation
kg cultivate --path <vault-path> --mode <incremental|full>
kg cultivate --orphans-only --max 10

# Analysis
kg analyze --path <vault-path> --output <report-path>
kg orphans --path <vault-path>
kg hubs --path <vault-path> --limit 20

# Cache
kg sync --path <vault-path>
kg stats --path <vault-path>
```

---

## 13. Extension Points

### 13.1 Template Registration

```typescript
templateLoader.registerTemplate(customTemplate);
templateLoader.extendTemplate(baseId, newId, overrides);
```

### 13.2 Custom Analyzers

```typescript
interface Analyzer {
  name: string;
  analyze(filePath: string): Promise<AnalysisResult>;
}

registerAnalyzer(analyzer: Analyzer): void;
```

### 13.3 Plugin Architecture

Support for:
- Custom frontmatter generators
- Custom link suggesters
- Custom template renderers
- Custom MCP tools

---

## 14. Testing Requirements

### 14.1 Unit Tests

- Test all public APIs
- Test type inference logic
- Test frontmatter generation
- Test link extraction
- Test graph metrics calculation

### 14.2 Integration Tests

- End-to-end vault generation
- Claude-flow integration
- Shadow cache synchronization
- File watcher events

### 14.3 E2E Tests

- Real project analysis (Next.js, React)
- Multi-language support
- Large vault performance

---

## 15. Documentation Requirements

### 15.1 API Documentation

- JSDoc comments on all public APIs
- TypeScript type definitions
- Example usage for each function

### 15.2 User Guides

- Quick start guide
- Configuration reference
- Template creation guide
- Claude-flow integration guide

---

## Summary

The knowledge-graph-agent NPM package should implement:

1. **Core Graph Operations**: Node and edge management, metrics calculation, orphan detection
2. **Frontmatter Management**: Schema validation, inference rules, generation
3. **Document Structure**: Vault templates, directory organization
4. **Claude-Flow Integration**: MCP tools, agent rules, automation
5. **Shadow Cache**: SQLite-based caching, fast queries
6. **Cultivation System**: Seed generation, deep analysis, document generation
7. **Wikilink Support**: Parsing, generation, suggestion
8. **Obsidian Integration**: Vault detection, graph view support
9. **Performance**: Targets for large vaults
10. **Extensibility**: Templates, analyzers, plugins

The implementation should follow weave-nn coding standards for TypeScript, including strict typing, async/await patterns, and graceful error handling.
