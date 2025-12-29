# @weavelogic/knowledge-graph-agent

A powerful NPM library for creating and managing knowledge graphs for Claude Code. Integrates with Obsidian-style documentation, claude-flow for AI coordination, and provides enterprise-grade features for production deployments.

[![npm version](https://img.shields.io/npm/v/@weavelogic/knowledge-graph-agent.svg)](https://www.npmjs.com/package/@weavelogic/knowledge-graph-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

| Category | Features |
|----------|----------|
| **Core** | Knowledge graph generation, Obsidian integration, CLAUDE.md management |
| **Cultivation** | Codebase analysis, seed generation, deep analysis with claude-flow |
| **Agents** | Multi-agent system, rules engine, workflows, MCP server with 30+ tools |
| **Services** | Service management, config migrations, health monitoring |
| **Enterprise** | Chunking, backup/recovery, advanced caching, diagnostics |
| **Integrations** | Workflow DevKit, RuVector semantic search, Exochain audit trail |
| **API & UI** | Plugin system, GraphQL API, Web dashboard, concurrent servers |

## Installation

```bash
npm install @weavelogic/knowledge-graph-agent
```

Or use directly with npx:

```bash
npx @weavelogic/knowledge-graph-agent init
```

## Quick Start

```bash
# Initialize knowledge graph in project
kg init

# Bootstrap primitives from codebase analysis
kg init-primitives

# Generate knowledge graph
kg graph

# Start all servers (MCP, GraphQL, Dashboard)
kg serve --all
```

---

## Cultivation System

### SeedGenerator

Analyzes codebases to bootstrap knowledge graphs with primitive nodes.

**Supported Ecosystems:**
- **Node.js**: `package.json` dependencies
- **Python**: `requirements.txt`, `pyproject.toml`
- **PHP**: `composer.json`
- **Rust**: `Cargo.toml`
- **Go**: `go.mod`
- **Java**: `pom.xml`, `build.gradle`

```typescript
import { SeedGenerator, analyzeSeed, initPrimitives } from '@weavelogic/knowledge-graph-agent';

// Full analysis
const analysis = await analyzeSeed('/project', 'docs');
console.log(`Found ${analysis.frameworks.length} frameworks`);
console.log(`Found ${analysis.dependencies.length} dependencies`);
console.log(`Found ${analysis.services.length} services`);

// Generate primitive nodes
const result = await initPrimitives('/project', 'docs', { dryRun: false });
console.log(`Generated ${result.documentsGenerated.length} documents`);
```

### DeepAnalyzer with claude-flow Integration

Advanced codebase analysis using multi-agent orchestration.

```bash
# Deep analysis with claude-flow agents
kg analyze deep

# Generate analysis report
kg analyze report --json
```

### Shadow Cache for File Tracking

Tracks file changes efficiently using SHA-256 hashing.

```typescript
import { ShadowCache } from '@weavelogic/knowledge-graph-agent';

const cache = new ShadowCache('/project/.kg');
const changed = await cache.getChangedFiles('/project/docs');
console.log(`${changed.length} files changed since last sync`);
```

---

## Agent System

A comprehensive agent framework with specialized agents for different tasks.

**Agent Types:**
- `ResearcherAgent` - Research and information gathering
- `CoderAgent` - Code generation and modification
- `TesterAgent` - Test creation and validation
- `AnalystAgent` - Analysis and recommendations
- `ArchitectAgent` - System design and architecture

```typescript
import {
  BaseAgent,
  getRegistry,
  AgentType,
  createTask
} from '@weavelogic/knowledge-graph-agent';

// Get the agent registry
const registry = getRegistry();

// Spawn a researcher agent
const agent = await registry.spawn(AgentType.RESEARCHER, {
  name: 'docs-researcher',
  claudeFlow: { enabled: true, namespace: 'kg' },
});

// Execute a task
const task = createTask('Research authentication patterns', {
  priority: TaskPriority.HIGH,
  input: { topic: 'OAuth2' },
});

const result = await agent.execute(task);
console.log(result.data);
```

### RulesEngine for Automation

```typescript
import { RulesEngine, RuleType, TriggerType } from '@weavelogic/knowledge-graph-agent';

const engine = new RulesEngine();

engine.registerRule({
  id: 'auto-tag',
  name: 'Auto-tag documentation',
  type: RuleType.TRANSFORM,
  trigger: { type: TriggerType.FILE_CHANGE, pattern: 'docs/**/*.md' },
  condition: (context) => context.file.endsWith('.md'),
  action: async (context) => { /* auto-tag logic */ },
});

engine.start();
```

### Workflow Registry

```typescript
import { WorkflowRegistry } from '@weavelogic/knowledge-graph-agent';

const registry = new WorkflowRegistry();

registry.register({
  id: 'documentation-sync',
  name: 'Documentation Sync',
  steps: [
    { id: 'analyze', action: 'analyze-docs' },
    { id: 'generate', action: 'generate-graph', dependsOn: ['analyze'] },
    { id: 'sync', action: 'sync-memory', dependsOn: ['generate'] },
  ],
});

await registry.execute('documentation-sync', { projectRoot: '/project' });
```

---

## Plugin System

Extensible plugin architecture for custom analyzers with 13 lifecycle hooks.

### Built-in Plugins

| Plugin | Description |
|--------|-------------|
| `code-complexity` | Cyclomatic, cognitive, and Halstead complexity metrics |
| `dependency-health` | Vulnerability scanning, outdated detection, health scores |

### Plugin CLI

```bash
# List installed plugins
kg plugin list

# Install a plugin
kg plugin install <source>

# Run an analyzer
kg plugin run code-complexity src/index.ts

# Show plugin details
kg plugin info dependency-health

# Create a plugin from template
kg plugin create my-analyzer
```

### Custom Plugin Development

```typescript
import { AnalyzerPlugin, PluginContext } from '@weavelogic/knowledge-graph-agent';

export class MyAnalyzerPlugin implements AnalyzerPlugin {
  name = 'my-analyzer';
  version = '1.0.0';
  supportedContentTypes = ['text/typescript', 'text/javascript'];

  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    // Analysis logic
    return {
      success: true,
      analysisType: 'my-analyzer',
      entities: [...],
      relationships: [...],
      tags: [...],
    };
  }

  // Streaming support
  async *analyzeStream(input: AnalysisInput): AsyncIterable<AnalysisStreamChunk> {
    yield { type: 'progress', progress: 50 };
    yield { type: 'entity', data: { id: '...', type: '...' } };
    yield { type: 'complete', data: { message: 'Done' } };
  }
}
```

---

## GraphQL API

Full-featured GraphQL API with real-time subscriptions.

### Start GraphQL Server

```bash
# Start GraphQL server on port 4000
kg serve --graphql

# Custom port
kg serve --graphql --port-graphql 8080
```

### Query Examples

```graphql
# Get all nodes
query {
  nodes(filter: { type: CONCEPT }, pagination: { first: 10 }) {
    edges {
      node {
        id
        title
        type
        tags
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

# Search nodes
query {
  searchNodes(query: "authentication", options: { limit: 5 }) {
    id
    title
    score
    snippet
  }
}

# Get graph structure
query {
  graph {
    nodes { id title type }
    edges { source target type }
    stats { nodeCount edgeCount }
  }
}
```

### Subscriptions

```graphql
# Real-time node updates
subscription {
  nodeCreated {
    id
    title
    createdAt
  }
}

subscription {
  analysisProgress(analysisId: "abc123") {
    progress
    phase
    message
  }
}
```

### Custom Scalars

- `DateTime` - ISO 8601 timestamps
- `JSON` - Arbitrary JSON data
- `UUID` - RFC 4122 UUIDs
- `FilePath` - Validated file paths

---

## Web Dashboard

Interactive visualization dashboard built with Next.js 14.

### Start Dashboard

```bash
# Start dashboard on port 3000
kg serve --dashboard

# Development mode with hot reload
kg dashboard start

# Build for production
kg dashboard build

# Serve production build
kg dashboard serve
```

### Features

- **Graph Visualization**: Interactive cytoscape.js graph with zoom, pan, and node selection
- **Data Tables**: Sortable, filterable tables with TanStack Table
- **Search**: Full-text and semantic search with filters
- **Real-time Updates**: WebSocket subscriptions for live data
- **Agent Monitoring**: View agent status and execution history
- **Workflow Tracking**: Monitor workflow progress and results

### Dashboard CLI

```bash
kg dashboard start               # Start dev server
kg dashboard start --port 8080   # Custom port
kg dashboard start --open        # Open in browser
kg dashboard build               # Production build
kg dashboard serve               # Serve production
kg dashboard status              # Check status
kg dashboard open                # Open in browser
```

---

## Concurrent Server Execution

Run multiple servers simultaneously with the `serve` command.

```bash
# Start all servers
kg serve --all

# Start specific servers
kg serve --mcp --graphql
kg serve --graphql --dashboard

# Custom ports
kg serve --all --port-graphql 4001 --port-dashboard 3001

# With custom database
kg serve --all --db ./data/knowledge.db
```

### Server Options

| Flag | Description | Default |
|------|-------------|---------|
| `--mcp` | Enable MCP server (stdio) | Enabled by default |
| `--graphql` | Enable GraphQL server | Port 4000 |
| `--dashboard` | Enable web dashboard | Port 3000 |
| `--all` | Enable all servers | - |
| `--port-graphql <port>` | GraphQL port | 4000 |
| `--port-dashboard <port>` | Dashboard port | 3000 |
| `--db <path>` | Database path | .kg/knowledge.db |

---

## MCP Server

Model Context Protocol server for Claude integration with 30+ tools.

```bash
# Start MCP server
kg serve --mcp

# Or via npx
npx @weavelogic/knowledge-graph-agent mcp start
```

**Available MCP Tools:**

| Category | Tools |
|----------|-------|
| Graph | `kg_query`, `kg_stats`, `kg_get_node`, `kg_list_tags` |
| Cache | `kg_cache_stats` |
| Agents | `kg_agent_spawn`, `kg_agent_list` |
| System | `kg_health`, `kg_health_check` |
| Search | `kg_search_nodes`, `kg_search_tags` |
| Workflow | `kg_workflow_start`, `kg_workflow_status`, `kg_workflow_list` |
| Vector | `kg_vector_search`, `kg_vector_upsert` |
| Trajectory | `kg_trajectory_list` |
| Audit | `kg_audit_query`, `kg_audit_checkpoint` |

---

## Enterprise Features

### Chunker for Large Documents

```typescript
import { createChunker, chunkDocument } from '@weavelogic/knowledge-graph-agent';

const result = chunkDocument(largeMarkdownContent, {
  strategy: 'adaptive', // fixed, semantic, markdown, code, adaptive
  maxSize: 2000,
  overlap: 50,
});

console.log(`Split into ${result.chunks.length} chunks`);
```

### BackupManager

```typescript
import { createBackupManager } from '@weavelogic/knowledge-graph-agent';

const backup = createBackupManager('/project/.kg/knowledge.db', {
  enabled: true,
  interval: 86400000, // 24 hours
  maxBackups: 5,
  compress: true,
});

await backup.createBackup();
backup.startAutoBackup();
```

### AdvancedCache

```typescript
import { createAdvancedCache } from '@weavelogic/knowledge-graph-agent';

const cache = createAdvancedCache<User>({
  maxSize: 50 * 1024 * 1024,
  maxEntries: 1000,
  defaultTTL: 300000,
  evictionPolicy: 'lru', // lru, lfu, fifo, ttl
});

cache.set('user:123', userData, { tags: ['user'] });
const user = cache.get<User>('user:123');
```

### HealthMonitor

```typescript
import { createHealthMonitor, createMemoryCheck } from '@weavelogic/knowledge-graph-agent';

const monitor = createHealthMonitor({ checkInterval: 30000 });
monitor.registerCheck(createMemoryCheck(85));
monitor.on('alert', (alert) => console.error(alert));
monitor.start();
```

---

## External Integrations

### RuVector Semantic Search

```typescript
import { VectorStore, TrajectoryTracker } from '@weavelogic/knowledge-graph-agent';

const vectors = new VectorStore({
  dimensions: 1536,
  metric: 'cosine',
});

await vectors.upsert([
  { id: 'doc-1', values: embedding, metadata: { type: 'concept' } },
]);

const results = await vectors.search(queryEmbedding, { topK: 10 });
```

### Exochain Audit Trail

```typescript
import { AuditTrail } from '@weavelogic/knowledge-graph-agent';

const audit = new AuditTrail({
  signingKey: process.env.AGENT_PRIVATE_KEY,
  hlcEnabled: true,
});

const checkpoint = await audit.checkpoint({
  operation: 'node_created',
  nodeId: 'concept-123',
  agent: 'coder-agent',
});
```

### Workflow DevKit

```typescript
import { WorkflowManager } from '@weavelogic/knowledge-graph-agent';

const workflow = new WorkflowManager({
  postgres: process.env.DATABASE_URL,
  durableAgents: true,
});

const execution = await workflow.start('document-analysis', {
  input: { path: '/docs' },
  resumable: true,
});
```

---

## CLI Commands Reference

### Initialization

| Command | Description |
|---------|-------------|
| `kg init` | Initialize knowledge graph in project |
| `kg init-primitives` | Bootstrap primitives from codebase |
| `kg analyze-codebase` | Analyze dependencies and services |

### Knowledge Graph

| Command | Description |
|---------|-------------|
| `kg graph` | Generate/update knowledge graph |
| `kg stats` | Display graph statistics |
| `kg search <query>` | Search the knowledge graph |

### Servers

| Command | Description |
|---------|-------------|
| `kg serve` | Start MCP server (default) |
| `kg serve --all` | Start all servers |
| `kg serve --graphql` | Start GraphQL server |
| `kg serve --dashboard` | Start web dashboard |

### Plugin Management

| Command | Description |
|---------|-------------|
| `kg plugin list` | List installed plugins |
| `kg plugin install <source>` | Install a plugin |
| `kg plugin run <name> [file]` | Run an analyzer |
| `kg plugin info <name>` | Show plugin details |
| `kg plugin create <name>` | Create plugin from template |

### Dashboard

| Command | Description |
|---------|-------------|
| `kg dashboard start` | Start dashboard dev server |
| `kg dashboard build` | Build for production |
| `kg dashboard serve` | Serve production build |
| `kg dashboard status` | Check dashboard status |

### Documentation

| Command | Description |
|---------|-------------|
| `kg docs init` | Initialize docs directory |
| `kg analyze` | Analyze & migrate to knowledge graph |
| `kg convert docs` | Convert docs/ to docs-nn/ |

### Configuration

| Command | Description |
|---------|-------------|
| `kg config show` | Show current configuration |
| `kg config set <key> <value>` | Set configuration value |

### Diagnostics

| Command | Description |
|---------|-------------|
| `kg diag run` | Run full diagnostics |
| `kg diag health` | Check system health |
| `kg diag repair` | Repair database issues |
| `kg diag backup` | Create database backup |

### Workflows & Vectors

| Command | Description |
|---------|-------------|
| `kg workflow start <name>` | Start a workflow |
| `kg workflow status <id>` | Get workflow status |
| `kg vector search <query>` | Semantic search |
| `kg trajectory list` | List trajectories |
| `kg audit query` | Query audit trail |

---

## Configuration

Create `.kg/config.json` to customize behavior:

```json
{
  "version": "1.0.0",
  "projectRoot": ".",
  "docsPath": "docs",
  "database": {
    "path": ".kg/knowledge.db",
    "autoBackup": true,
    "backupInterval": 86400000,
    "maxBackups": 5
  },
  "cache": {
    "enabled": true,
    "maxSize": 1000,
    "ttl": 3600000,
    "evictionPolicy": "lru"
  },
  "agents": {
    "maxConcurrent": 5,
    "defaultTimeout": 30000,
    "retryAttempts": 3,
    "claudeFlowEnabled": true
  },
  "graphql": {
    "port": 4000,
    "cors": true,
    "playground": true
  },
  "dashboard": {
    "port": 3000
  },
  "plugins": {
    "autoLoad": true,
    "searchPaths": ["./plugins", "./node_modules"]
  }
}
```

---

## Programmatic Usage

```typescript
import {
  // Core
  createKnowledgeGraph,
  createDatabase,
  quickInit,

  // Analysis
  analyzeSeed,
  initPrimitives,
  analyzeDocs,

  // Agents
  BaseAgent,
  getRegistry,
  AgentType,

  // Services
  createServiceManager,
  createConfigManager,
  createHealthMonitor,

  // Enterprise
  createChunker,
  createBackupManager,
  createAdvancedCache,

  // Plugins
  createPluginManager,
  CodeComplexityPlugin,
  DependencyHealthPlugin,

  // GraphQL
  createGraphQLServer,

  // Server
  createServerManager,
  ServiceContainer,

  // Integrations
  VectorStore,
  AuditTrail,
  WorkflowManager,
} from '@weavelogic/knowledge-graph-agent';
```

---

## Changelog

### v0.7.0

- **Documentation overhaul** with Diátaxis framework (tutorials, guides, reference, explanation)
- 5 Architecture Decision Records (ADRs) from SPEC files
- Comprehensive API/CLI/MCP reference documentation
- Enterprise guides (chunking, backup, caching, health monitoring)
- Integration architecture docs (claude-flow, ruvector, exochain, agentic-flow)
- Getting started tutorials (installation, quick-start, configuration)
- MIT License added to project root
- Dependencies documentation with licenses
- 68 markdown documentation files

### v0.6.0

- Plugin system with custom analyzers (13 lifecycle hooks, async streaming)
- Code Complexity Analyzer plugin (cyclomatic, cognitive, Halstead metrics)
- Dependency Health Analyzer plugin (vulnerability scanning, health scores)
- GraphQL API with graphql-yoga server and WebSocket subscriptions
- Custom GraphQL scalars (DateTime, JSON, UUID, FilePath)
- Web dashboard with Next.js 14, cytoscape.js visualization
- Dashboard CLI commands (start, build, serve, status)
- Concurrent server execution (`kg serve --all`)
- ServiceContainer singleton for dependency injection
- TypedEventBus for cross-service communication
- Plugin CLI commands (list, install, run, info, create)

### v0.5.0

- Workflow DevKit integration with MCP tools
- RuVector semantic search with trajectory tracking
- Exochain audit trail with DAG-BFT consensus
- 9 MCP tools for workflows, vectors, and audit
- 22 CLI subcommands for external integrations

### v0.4.0

- Chunker with 5 chunking strategies
- BackupManager with gzip compression
- IntegrityChecker for database validation
- AdvancedCache with LRU/LFU/FIFO/TTL eviction
- Diagnostics CLI commands

### v0.3.0

- ServiceManager for background processes
- ConfigManager with migrations
- HealthMonitor with alerts
- DecisionTracker for AI explainability

### v0.2.0

- Agent system with specialized agents
- RulesEngine for automation
- WorkflowRegistry for multi-step workflows
- VaultMemorySync for memory synchronization
- Git integration with auto-commit
- MCP Server with 20+ tools

### v0.1.0

- SeedGenerator for codebase analysis
- DeepAnalyzer with claude-flow
- Shadow Cache for file tracking
- Initial knowledge graph generation

---

## Documentation

Comprehensive documentation is available in the [docs/](./docs/) directory, organized using the [Diátaxis framework](https://diataxis.fr/):

### Getting Started

- [Installation Guide](./docs/getting-started/installation.md) - Set up your environment
- [Quick Start](./docs/getting-started/quick-start.md) - Build your first knowledge graph
- [Configuration](./docs/getting-started/configuration.md) - Configure for your project

### Guides

- [Knowledge Graph Management](./docs/guides/knowledge-graph.md) - Create, query, and traverse graphs
- [Cultivation System](./docs/guides/cultivation.md) - Analyze codebases and generate primitives
- [Agent System](./docs/guides/agents.md) - Work with AI agents and rules engine

### Enterprise Features

- [Document Chunking](./docs/guides/enterprise/chunking.md) - Split large documents efficiently
- [Backup & Recovery](./docs/guides/enterprise/backup-recovery.md) - Protect your data
- [Cache Configuration](./docs/guides/enterprise/caching.md) - Optimize performance
- [Health Monitoring](./docs/guides/enterprise/health-monitoring.md) - Monitor production systems

### Reference

- [API Reference](./docs/API.md) - Complete API surface
- [CLI Commands](./docs/CLI-COMMANDS-REFERENCE.md) - All CLI commands
- [MCP Tools](./docs/MCP-TOOLS-REFERENCE.md) - MCP server tools
- [Architecture](./docs/ARCHITECTURE.md) - System architecture overview

### Architecture Decisions

Technical decisions documented as ADRs:

- [ADR Index](./docs/architecture/decisions/README.md) - All architecture decisions
- [Dependencies](./docs/DEPENDENCIES.md) - Package dependencies and licenses

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./docs/CONTRIBUTING.md).

## License

MIT - See [LICENSE](./LICENSE) for details.
