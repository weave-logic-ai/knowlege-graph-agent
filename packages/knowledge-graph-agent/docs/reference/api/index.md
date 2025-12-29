# API Reference

Complete API reference documentation for the Knowledge Graph Agent package.

**Version:** 0.4.0
**Module:** `@weave-nn/knowledge-graph-agent`

---

## Overview

The Knowledge Graph Agent provides a comprehensive TypeScript API for building, managing, and querying knowledge graphs with intelligent agent capabilities. The API is organized into several core modules:

| Module | Description |
|--------|-------------|
| [Core](./core.md) | Knowledge graph management, database operations, and caching |
| [Agents](./agents.md) | Specialized agents for research, analysis, architecture, and testing |
| [Graph](./graph.md) | Graph operations, traversal, and analysis |

---

## Quick Start

```typescript
import {
  KnowledgeGraphManager,
  KnowledgeGraphDatabase,
  createKnowledgeGraph,
  createDatabase,
} from '@weave-nn/knowledge-graph-agent/core';

import {
  BaseAgent,
  ResearcherAgent,
  AnalystAgent,
  ArchitectAgent,
  TesterAgent,
} from '@weave-nn/knowledge-graph-agent/agents';

// Create a knowledge graph
const graph = createKnowledgeGraph('my-project', '/path/to/project');

// Initialize database
const db = createDatabase('/path/to/.kg/knowledge.db');

// Create an agent
const researcher = new ResearcherAgent({
  name: 'project-researcher',
  type: AgentType.RESEARCHER,
});
```

---

## Module Structure

### Core Module

Core infrastructure for knowledge graph operations:

- **`KnowledgeGraphManager`** - In-memory graph management with node/edge operations
- **`KnowledgeGraphDatabase`** - SQLite persistence with full-text search
- **`ShadowCache`** - File metadata caching for incremental updates

### Agents Module

Specialized agents for different tasks:

- **`BaseAgent`** - Abstract base class with common agent functionality
- **`ResearcherAgent`** - Code research, pattern detection, reference finding
- **`AnalystAgent`** - Code quality analysis, metrics, issue detection
- **`ArchitectAgent`** - Architecture analysis, design suggestions, dependency mapping
- **`TesterAgent`** - Test generation, coverage analysis, test suggestions
- **`RulesEngine`** - Event-driven rule execution engine

### Type Definitions

Core type definitions used throughout the API:

```typescript
// Node types
type NodeType =
  | 'concept'
  | 'technical'
  | 'feature'
  | 'primitive'
  | 'service'
  | 'guide'
  | 'standard'
  | 'integration';

// Node status
type NodeStatus = 'draft' | 'active' | 'deprecated' | 'archived';

// Agent types
enum AgentType {
  RESEARCHER = 'researcher',
  ANALYST = 'analyst',
  ARCHITECT = 'architect',
  TESTER = 'tester',
  CODER = 'coder',
  REVIEWER = 'reviewer',
  COORDINATOR = 'coordinator',
  OPTIMIZER = 'optimizer',
  DOCUMENTER = 'documenter',
}

// Agent status
enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TERMINATED = 'terminated',
}
```

---

## Installation

```bash
npm install @weave-nn/knowledge-graph-agent
```

Or with yarn:

```bash
yarn add @weave-nn/knowledge-graph-agent
```

---

## Usage Patterns

### Creating a Knowledge Graph

```typescript
import { createKnowledgeGraph, createDatabase } from '@weave-nn/knowledge-graph-agent/core';

// Create in-memory graph
const graph = createKnowledgeGraph('my-project', '/path/to/project');

// Create persistent database
const db = createDatabase('.kg/knowledge.db');

// Add a node
graph.addNode({
  id: 'auth-service',
  path: 'docs/services/auth.md',
  filename: 'auth.md',
  title: 'Authentication Service',
  type: 'service',
  status: 'active',
  content: 'Service documentation...',
  frontmatter: {},
  tags: ['security', 'auth'],
  outgoingLinks: [],
  incomingLinks: [],
  wordCount: 500,
  lastModified: new Date(),
});
```

### Using Agents

```typescript
import { ResearcherAgent, createTask } from '@weave-nn/knowledge-graph-agent/agents';

// Create a researcher agent
const researcher = new ResearcherAgent({
  name: 'code-researcher',
  type: AgentType.RESEARCHER,
});

// Set knowledge graph for context
researcher.setKnowledgeGraph(graph);

// Create and execute a task
const task = createTask('Analyze authentication patterns in codebase');
const result = await researcher.execute(task);

if (result.success) {
  console.log('Research findings:', result.data);
}
```

### Querying the Graph

```typescript
// Search nodes
const results = db.searchNodes('authentication', 20);

// Get nodes by type
const services = db.getNodesByType('service');

// Get nodes by tag
const securityDocs = db.getNodesByTag('security');

// Get graph statistics
const stats = graph.getStats();
console.log(`Total nodes: ${stats.totalNodes}`);
console.log(`Total edges: ${stats.totalEdges}`);
```

---

## Error Handling

All agent operations return an `AgentResult` object:

```typescript
interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: AgentError;
  artifacts?: ResultArtifact[];
  metrics?: ExecutionMetrics;
  metadata?: Record<string, unknown>;
}

interface AgentError {
  code: string;
  message: string;
  stack?: string;
  retryable?: boolean;
}
```

Example error handling:

```typescript
const result = await agent.execute(task);

if (!result.success) {
  console.error(`Error: ${result.error?.message}`);
  console.error(`Code: ${result.error?.code}`);

  if (result.error?.retryable) {
    // Retry logic
  }
}
```

---

## Configuration

### Knowledge Graph Configuration

```typescript
interface KGConfig {
  projectRoot: string;
  docsRoot: string;
  vaultName?: string;

  graph: {
    includePatterns: string[];
    excludePatterns: string[];
    maxDepth: number;
  };

  database: {
    path: string;
    enableWAL: boolean;
  };

  claudeFlow: {
    enabled: boolean;
    namespace: string;
    syncOnChange: boolean;
  };

  templates: {
    customPath?: string;
    defaultType: NodeType;
  };
}
```

### Agent Configuration

```typescript
interface AgentConfig {
  id?: string;
  name: string;
  type: AgentType;
  capabilities?: string[];
  taskTimeout?: number;

  retry?: {
    maxRetries: number;
    backoffMs: number;
    backoffMultiplier?: number;
  };

  claudeFlow?: {
    enabled: boolean;
    namespace?: string;
    hooks?: {
      preTask?: boolean;
      postTask?: boolean;
      postEdit?: boolean;
    };
  };
}
```

---

## See Also

- [Core Module API](./core.md) - Detailed core module documentation
- [Agents API](./agents.md) - Agent system documentation
- [Graph Operations](./graph.md) - Graph operations reference
- [CLI Commands](../cli/commands.md) - Command-line interface
- [MCP Tools](../mcp/tools.md) - Model Context Protocol tools
