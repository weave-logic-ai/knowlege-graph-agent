# MCP Tools Reference

Complete reference documentation for all MCP (Model Context Protocol) tools available in the Knowledge Graph Agent.

**Version:** 0.4.0
**Module:** `@weave-nn/knowledge-graph-agent/mcp`

---

## Overview

The Knowledge Graph Agent exposes a comprehensive set of MCP tools for interacting with the knowledge graph, managing agents, orchestrating workflows, performing semantic searches, and auditing operations. All tools follow a consistent request/response pattern and provide detailed execution metadata.

### Tool Naming Convention

All tools use the `kg_` prefix to identify them as Knowledge Graph Agent tools:

| Prefix | Purpose |
|--------|---------|
| `kg_query`, `kg_stats` | Core graph queries |
| `kg_graph_*` | Graph operations |
| `kg_search_*` | Search operations |
| `kg_agent_*` | Agent management |
| `kg_workflow_*` | Workflow orchestration |
| `kg_vector_*` | Vector operations |
| `kg_audit_*` | Audit and compliance |

---

## Tool Categories

| Category | Description | Tool Count |
|----------|-------------|------------|
| [Graph](#graph-tools) | Knowledge graph queries and management | 7 |
| [Search](#search-tools) | Full-text and tag-based search | 2 |
| [Agents](#agent-tools) | Agent spawning and lifecycle | 2 |
| [System](#system-tools) | Health checks and cache stats | 3 |
| [Workflow](#workflow-tools) | Workflow orchestration | 3 |
| [Vector](#vector-tools) | Semantic search and vectors | 3 |
| [Audit](#audit-tools) | Event logging and sync | 3 |

**Total Tools:** 23

---

## Graph Tools

### kg_query

Query the knowledge graph for nodes matching criteria.

```typescript
// Tool Definition
name: 'kg_query'
description: 'Query the knowledge graph for nodes matching criteria'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | `string` | No | - | Search query string |
| `type` | `NodeType` | No | - | Filter by node type |
| `status` | `NodeStatus` | No | - | Filter by node status |
| `tag` | `string` | No | - | Filter by tag |
| `limit` | `number` | No | `50` | Maximum results to return |
| `includeContent` | `boolean` | No | `false` | Include full content in results |

#### Output Schema

```typescript
interface KGQueryResult {
  success: boolean;
  data: Array<{
    id: string;
    path: string;
    title: string;
    type: NodeType;
    status: NodeStatus;
    tags: string[];
    wordCount: number;
    outgoingLinkCount: number;
    incomingLinkCount: number;
    content?: string; // Only if includeContent=true
  }>;
  metadata: {
    itemCount: number;
  };
}
```

#### Example

```javascript
// Query by search term
await callTool('kg_query', { query: 'authentication', limit: 10 });

// Query by type
await callTool('kg_query', { type: 'primitive', limit: 20 });

// Query by tag with content
await callTool('kg_query', { tag: 'security', includeContent: true });
```

---

### kg_stats

Get statistics about the knowledge graph.

```typescript
// Tool Definition
name: 'kg_stats'
description: 'Get comprehensive statistics about the knowledge graph'
```

#### Input Schema

No parameters required.

#### Output Schema

```typescript
interface KGStatsResult {
  success: boolean;
  data: {
    totalNodes: number;
    totalEdges: number;
    orphanNodes: number;
    avgLinksPerNode: number;
    nodesByType: Record<NodeType, number>;
    nodesByStatus: Record<NodeStatus, number>;
  };
}
```

#### Example

```javascript
const stats = await callTool('kg_stats', {});
console.log(`Total nodes: ${stats.data.totalNodes}`);
console.log(`Total edges: ${stats.data.totalEdges}`);
```

---

### kg_get_node

Get a specific node by ID or path.

```typescript
// Tool Definition
name: 'kg_get_node'
description: 'Retrieve a specific node from the knowledge graph'
```

#### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | No* | Node ID |
| `path` | `string` | No* | Node path (alternative to ID) |

*One of `id` or `path` is required.

#### Output Schema

```typescript
interface KGGetNodeResult {
  success: boolean;
  data: {
    id: string;
    path: string;
    title: string;
    type: NodeType;
    status: NodeStatus;
    tags: string[];
    content: string;
    frontmatter: Record<string, unknown>;
    outgoingLinks: Link[];
    incomingLinks: Link[];
    wordCount: number;
    lastModified: string;
  };
}
```

#### Example

```javascript
// Get by ID
await callTool('kg_get_node', { id: 'node-123' });

// Get by path
await callTool('kg_get_node', { path: 'docs/concepts/auth.md' });
```

#### Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Either id or path required` | No identifier provided | Provide either id or path |
| `Node not found` | Node doesn't exist | Verify the ID/path is correct |

---

### kg_list_tags

List all tags with their usage counts.

```typescript
// Tool Definition
name: 'kg_list_tags'
description: 'Get a list of all tags used in the knowledge graph'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | `number` | No | `100` | Maximum tags to return |

#### Output Schema

```typescript
interface KGListTagsResult {
  success: boolean;
  data: Array<{
    tag: string;
    count: number;
  }>;
  metadata: {
    itemCount: number;
  };
}
```

---

### kg_graph_query

Query the knowledge graph for nodes and relationships.

```typescript
// Tool Definition
name: 'kg_graph_query'
description: 'Query the knowledge graph with full-text search and relation traversal'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | `string` | **Yes** | - | Search query string |
| `type` | `NodeType` | No | - | Filter by node type |
| `limit` | `number` | No | `10` | Maximum results (max: 100) |
| `includeRelations` | `boolean` | No | `false` | Include related nodes |

#### Output Schema

```typescript
interface KGGraphQueryResult {
  success: boolean;
  data: {
    nodes: Array<{
      id: string;
      title: string;
      type: NodeType;
      status: NodeStatus;
      path: string;
      tags: string[];
      wordCount: number;
      lastModified: string;
      outgoingLinks?: Link[];
      incomingLinks?: Link[];
    }>;
    count: number;
    query: string;
    type: NodeType | null;
    totalAvailable: number;
  };
  metadata: {
    executionTime: number;
    cached: boolean;
  };
}
```

#### Example

```javascript
// Basic search
await callTool('kg_graph_query', {
  query: 'authentication',
  limit: 20
});

// Search with type filter and relations
await callTool('kg_graph_query', {
  query: 'user management',
  type: 'service',
  includeRelations: true
});
```

---

### kg_graph_stats

Get comprehensive statistics about the knowledge graph.

```typescript
// Tool Definition
name: 'kg_graph_stats'
description: 'Get detailed statistics including distribution metrics'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `detailed` | `boolean` | No | `false` | Include detailed breakdown |

#### Output Schema

```typescript
interface KGGraphStatsResult {
  success: boolean;
  data: {
    totalNodes: number;
    totalEdges: number;
    averageLinksPerNode: number;
    orphanNodes: number;
    // Detailed fields (when detailed=true):
    nodesByType?: Record<NodeType, number>;
    nodesByStatus?: Record<NodeStatus, number>;
    mostConnected?: Array<{ id: string; links: number }>;
    topTags?: Array<{ tag: string; count: number }>;
    totalTags?: number;
    lastGenerated?: string;
    lastUpdated?: string;
    version?: string;
  };
  metadata: {
    executionTime: number;
    cached: boolean;
  };
}
```

---

### kg_graph_generate

Generate or regenerate the knowledge graph from documentation.

```typescript
// Tool Definition
name: 'kg_graph_generate'
description: 'Generate or regenerate the knowledge graph from markdown files'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `docsPath` | `string` | No | `"docs"` | Path to documentation directory |
| `force` | `boolean` | No | `false` | Force regeneration |
| `incremental` | `boolean` | No | `false` | Perform incremental update |

#### Output Schema

```typescript
interface KGGraphGenerateResult {
  success: boolean;
  data: {
    mode: 'full' | 'incremental';
    filesProcessed: number;
    nodesGenerated: number;
    edgesCreated: number;
    // Incremental mode fields:
    nodesAdded?: number;
    nodesUpdated?: number;
    nodesRemoved?: number;
    errors: string[];
    errorCount: number;
  };
  metadata: {
    executionTime: number;
    projectRoot: string;
    docsPath: string;
  };
}
```

#### Example

```javascript
// Full regeneration
await callTool('kg_graph_generate', { force: true });

// Incremental update
await callTool('kg_graph_generate', { incremental: true });

// Generate from custom path
await callTool('kg_graph_generate', { docsPath: 'documentation' });
```

---

## Search Tools

### kg_search_nodes

Search for nodes in the knowledge graph by content or metadata.

```typescript
// Tool Definition
name: 'kg_search_nodes'
description: 'Full-text search with filtering options'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | `string` | **Yes** | - | Search query |
| `type` | `NodeType` | No | - | Filter by node type |
| `status` | `NodeStatus` | No | - | Filter by node status |
| `limit` | `number` | No | `20` | Maximum results (max: 100) |

#### Output Schema

```typescript
interface KGSearchNodesResult {
  success: boolean;
  data: {
    nodes: Array<{
      id: string;
      title: string;
      type: NodeType;
      status: NodeStatus;
      path: string;
      tags: string[];
      description: string;
      wordCount: number;
      lastModified: string;
      snippet: string;
    }>;
    count: number;
    query: string;
    filters: {
      type: NodeType | null;
      status: NodeStatus | null;
    };
  };
  metadata: {
    executionTime: number;
    cached: boolean;
  };
}
```

---

### kg_search_tags

Search for nodes by tags.

```typescript
// Tool Definition
name: 'kg_search_tags'
description: 'Search for nodes by tags with match options'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tags` | `string[]` | **Yes** | - | Array of tags to search for |
| `matchAll` | `boolean` | No | `false` | Require ALL tags to match |
| `limit` | `number` | No | `20` | Maximum results (max: 100) |

#### Output Schema

```typescript
interface KGSearchTagsResult {
  success: boolean;
  data: {
    nodes: Array<{
      id: string;
      title: string;
      type: NodeType;
      status: NodeStatus;
      path: string;
      tags: string[];
      matchedTags: string[];
      lastModified: string;
    }>;
    count: number;
    tags: string[];
    matchAll: boolean;
    totalMatching: number;
  };
  metadata: {
    executionTime: number;
    cached: boolean;
  };
}
```

#### Example

```javascript
// Find nodes with ANY of the tags
await callTool('kg_search_tags', {
  tags: ['security', 'authentication'],
  matchAll: false
});

// Find nodes with ALL tags
await callTool('kg_search_tags', {
  tags: ['api', 'v2'],
  matchAll: true,
  limit: 50
});
```

---

## Agent Tools

### kg_agent_spawn

Spawn a specialized agent to perform a task.

```typescript
// Tool Definition
name: 'kg_agent_spawn'
description: 'Spawn a specialized agent to perform a task'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | `AgentType` | **Yes** | - | Agent type |
| `name` | `string` | No | - | Custom agent name |
| `task` | `string` | **Yes** | - | Task for the agent |
| `options.timeout` | `number` | No | - | Task timeout in ms |
| `options.maxRetries` | `number` | No | - | Maximum retries |
| `options.priority` | `Priority` | No | `'medium'` | Task priority |

**Agent Types:**
- `researcher` - Code research, pattern detection
- `coder` - Code generation and modification
- `tester` - Test generation and validation
- `analyst` - Code quality analysis
- `architect` - Architecture analysis and design

**Priority Levels:**
- `low`, `medium`, `high`, `critical`

#### Output Schema

```typescript
interface KGAgentSpawnResult {
  success: boolean;
  data: {
    agentId: string;
    agentType: AgentType;
    agentName: string;
    taskId: string;
    taskResult: {
      findings?: unknown[];
      recommendations?: unknown[];
      [key: string]: unknown;
    };
    metrics: {
      duration: number;
      tokensUsed?: number;
    };
    artifacts: ResultArtifact[];
  };
  metadata: {
    executionTime: number;
    status: AgentStatus;
  };
}
```

#### Example

```javascript
// Spawn a researcher agent
await callTool('kg_agent_spawn', {
  type: 'researcher',
  task: 'Analyze API design patterns in the codebase',
  options: {
    priority: 'high',
    timeout: 30000
  }
});

// Spawn an architect agent
await callTool('kg_agent_spawn', {
  type: 'architect',
  name: 'system-architect-1',
  task: 'Design microservices architecture for user management',
  options: {
    maxRetries: 3
  }
});
```

#### Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Agent type is required` | Missing type parameter | Provide agent type |
| `Task description is required` | Missing task parameter | Provide task description |
| `Agent type 'X' is not registered` | Invalid agent type | Use a registered agent type |

---

### kg_agent_list

List all active agents and their status.

```typescript
// Tool Definition
name: 'kg_agent_list'
description: 'List all active agents and their status'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | `AgentType` | No | - | Filter by agent type |
| `status` | `AgentStatus` | No | - | Filter by status |

**Agent Status Values:**
- `idle` - Agent ready for tasks
- `running` - Agent executing a task
- `completed` - Task completed successfully
- `failed` - Task failed
- `paused` - Agent paused
- `terminated` - Agent terminated

#### Output Schema

```typescript
interface KGAgentListResult {
  success: boolean;
  data: {
    agents: Array<{
      id: string;
      type: AgentType;
      name: string;
      status: AgentStatus;
      currentTask: string | null;
      queuedTasks: number;
      completedTasks: number;
      errorCount: number;
      lastActivity: string;
    }>;
    count: number;
    registeredTypes: Array<{
      type: AgentType;
      instanceCount: number;
      capabilities: string[];
    }>;
    stats: {
      totalInstances: number;
      instancesByType: Record<AgentType, number>;
      instancesByStatus: Record<AgentStatus, number>;
    };
  };
  metadata: {
    executionTime: number;
    filters: {
      type: AgentType | 'all';
      status: AgentStatus | 'all';
    };
  };
}
```

---

## System Tools

### kg_health

Check basic health status of knowledge graph components.

```typescript
// Tool Definition
name: 'kg_health'
description: 'Quick health check for database, cache, and tool registry'
```

#### Input Schema

No parameters required.

#### Output Schema

```typescript
interface KGHealthResult {
  success: boolean;
  data: {
    database: boolean;
    cache: boolean;
    projectRoot: string;
    toolCount: number;
  };
}
```

---

### kg_health_check

Check comprehensive health status of the knowledge graph server.

```typescript
// Tool Definition
name: 'kg_health_check'
description: 'Detailed diagnostics about all server components'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `detailed` | `boolean` | No | `false` | Include detailed diagnostics |
| `components` | `string[]` | No | - | Specific components to check |

**Available Components:**
- `database` - SQLite database
- `cache` - Shadow cache
- `agents` - Agent registry
- `memory` - Memory usage

#### Output Schema

```typescript
interface KGHealthCheckResult {
  success: boolean;
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
      database: 'healthy' | 'degraded' | 'unhealthy';
      cache: 'healthy' | 'degraded' | 'unhealthy';
      agents: 'healthy' | 'degraded' | 'unhealthy';
      memory: 'healthy' | 'degraded' | 'unhealthy';
    };
    timestamp: string;
    // Detailed fields (when detailed=true):
    memory?: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    uptime?: number;
    nodeVersion?: string;
    platform?: string;
    arch?: string;
    pid?: number;
  };
  metadata: {
    executionTime: number;
    componentsChecked: string[];
  };
}
```

#### Health Status Values

| Status | Meaning |
|--------|---------|
| `healthy` | All systems operational |
| `degraded` | Some issues but functional |
| `unhealthy` | Critical issues detected |

---

### kg_cache_stats

Get cache statistics.

```typescript
// Tool Definition
name: 'kg_cache_stats'
description: 'Get statistics about the shadow cache'
```

#### Input Schema

No parameters required.

#### Output Schema

```typescript
interface KGCacheStatsResult {
  success: boolean;
  data: {
    totalEntries: number;
    staleEntries: number;
    hitRate: number;
    sizeBytes: number;
    hits: number;
    misses: number;
  };
}
```

---

## Workflow Tools

### kg_workflow_start

Start a new workflow for knowledge graph operations.

```typescript
// Tool Definition
name: 'kg_workflow_start'
description: 'Start a new workflow with agent coordination'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `workflowId` | `WorkflowType` | **Yes** | - | Workflow type to start |
| `input.graphId` | `string` | No | - | Knowledge graph identifier |
| `input.docPath` | `string` | No | - | Path to source document |
| `input.options.autoStart` | `boolean` | No | - | Auto-start development |
| `input.options.watchPaths` | `string[]` | No | - | Paths to watch for changes |
| `input.options.threshold` | `number` | No | - | Completeness threshold (0-1) |

**Workflow Types:**

| Type | Description |
|------|-------------|
| `collaboration` | Real-time collaboration with agent coordination |
| `analysis` | Gap analysis for documentation completeness |
| `sync` | File watching and synchronization |
| `custom` | Custom workflow using GOAP planning |

#### Output Schema

```typescript
interface KGWorkflowStartResult {
  success: boolean;
  data: {
    workflowId: string;
    type: WorkflowType;
    startedAt: string;
    completedAt?: string;
    outcome: 'completed' | 'running' | 'failed';
    artifacts: ResultArtifact[];
  };
  metadata: {
    executionTime: number;
    serviceStatus: 'running' | 'stopped';
  };
}
```

#### Example

```javascript
// Start collaboration workflow
await callTool('kg_workflow_start', {
  workflowId: 'collaboration',
  input: {
    graphId: 'main-graph',
    docPath: './docs/spec.md'
  }
});

// Start sync workflow with watched paths
await callTool('kg_workflow_start', {
  workflowId: 'sync',
  input: {
    options: {
      watchPaths: ['./docs', './specs']
    }
  }
});
```

---

### kg_workflow_status

Check the status of a workflow or the workflow service.

```typescript
// Tool Definition
name: 'kg_workflow_status'
description: 'Check status of a specific workflow or service'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `workflowId` | `string` | No | - | Specific workflow ID |
| `includeMetrics` | `boolean` | No | `false` | Include execution metrics |
| `includeConfig` | `boolean` | No | `false` | Include service configuration |

#### Output Schema

```typescript
interface KGWorkflowStatusResult {
  success: boolean;
  data: {
    found: boolean;
    workflow?: {
      id: string;
      type: WorkflowType;
      status: 'running' | 'completed' | 'failed' | 'suspended';
      currentStep: string;
      startedAt: string;
      lastEventAt: string;
    };
    service: {
      isRunning: boolean;
      activeWorkflowCount: number;
      watchedPaths: string[];
      lastActivity: string;
    };
    // When includeMetrics=true:
    stats?: {
      totalExecutions: number;
      successfulExecutions: number;
      failedExecutions: number;
      averageDuration: number;
      successRate: number;
    };
    // When includeConfig=true:
    config?: {
      inactivityTimeout: number;
      autoStartThreshold: number;
      watchPaths: string[];
      debug: boolean;
    };
  };
  metadata: {
    executionTime: number;
    requestedWorkflowId?: string;
  };
}
```

---

### kg_workflow_list

List all active workflows with optional filtering.

```typescript
// Tool Definition
name: 'kg_workflow_list'
description: 'List all active workflows with filtering and pagination'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | `WorkflowStatus` | No | `'all'` | Filter by status |
| `type` | `WorkflowType` | No | `'all'` | Filter by type |
| `limit` | `number` | No | `50` | Maximum results |
| `offset` | `number` | No | `0` | Skip results (pagination) |
| `sortBy` | `string` | No | `'startedAt'` | Field to sort by |
| `sortOrder` | `'asc' \| 'desc'` | No | `'desc'` | Sort order |

**Sort Fields:** `startedAt`, `lastEventAt`, `status`, `type`

#### Output Schema

```typescript
interface KGWorkflowListResult {
  success: boolean;
  data: {
    workflows: Array<{
      id: string;
      type: WorkflowType;
      status: WorkflowStatus;
      currentStep: string;
      startedAt: string;
      lastEventAt: string;
      duration: number;
      isActive: boolean;
    }>;
    summary: {
      total: number;
      filtered: number;
      returned: number;
      byStatus: Record<WorkflowStatus, number>;
      byType: Record<WorkflowType, number>;
    };
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
      nextOffset: number | null;
    };
    serviceStatus: {
      isRunning: boolean;
      watchedPaths: number;
      lastActivity: string;
    };
  };
  metadata: {
    executionTime: number;
    filters: Record<string, unknown>;
    itemCount: number;
  };
}
```

---

## Vector Tools

### kg_vector_search

Perform semantic vector search on the knowledge graph.

```typescript
// Tool Definition
name: 'kg_vector_search'
description: 'Semantic search with optional hybrid keyword matching'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | `string` | **Yes** | - | Search query string |
| `k` | `number` | No | `10` | Number of results (max: 100) |
| `type` | `NodeType` | No | - | Filter by node type |
| `hybrid` | `boolean` | No | `false` | Enable hybrid search |
| `minScore` | `number` | No | `0` | Minimum similarity score (0-1) |
| `includeVectors` | `boolean` | No | `false` | Include raw vector data |
| `namespace` | `string` | No | - | Filter by vector namespace |

#### Output Schema

```typescript
interface KGVectorSearchResult {
  success: boolean;
  data: {
    results: Array<{
      id: string;
      score: number;
      metadata: {
        title: string;
        type: NodeType;
        path: string;
        tags: string[];
      };
      // Hybrid search fields:
      combinedScore?: number;
      keywordScore?: number;
      source?: 'vector' | 'keyword' | 'merged';
      // When includeVectors=true:
      vector?: number[];
    }>;
    count: number;
    query: string;
    searchMode: 'vector' | 'hybrid';
    filters: {
      type: NodeType | null;
      minScore: number;
      namespace: string | null;
    };
  };
  metadata: {
    executionTime: number;
    totalVectors: number;
    indexType: string;
    cached: boolean;
  };
}
```

#### Example

```javascript
// Pure vector search
await callTool('kg_vector_search', {
  query: 'machine learning optimization techniques',
  k: 10,
  minScore: 0.7
});

// Hybrid search with type filter
await callTool('kg_vector_search', {
  query: 'API authentication patterns',
  k: 20,
  hybrid: true,
  type: 'guide'
});
```

---

### kg_vector_upsert

Insert or update a vector in the knowledge graph.

```typescript
// Tool Definition
name: 'kg_vector_upsert'
description: 'Insert or update a vector with metadata'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | `string` | **Yes** | - | Unique vector identifier |
| `vector` | `number[]` | **Yes** | - | Embedding vector (1536 dimensions) |
| `metadata` | `VectorMetadata` | No | - | Associated metadata |
| `namespace` | `string` | No | `'default'` | Vector namespace |

**VectorMetadata:**

```typescript
interface VectorMetadata {
  title?: string;
  content?: string;
  type?: NodeType;
  path?: string;
  tags?: string[];
  sourceId?: string;
  [key: string]: unknown;
}
```

#### Output Schema

```typescript
interface KGVectorUpsertResult {
  success: boolean;
  data: {
    id: string;
    operation: 'created' | 'updated';
    dimensions: number;
    hasMetadata: boolean;
    namespace: string;
  };
  metadata: {
    executionTime: number;
    totalVectors: number;
    wasUpdate: boolean;
  };
}
```

#### Example

```javascript
await callTool('kg_vector_upsert', {
  id: 'doc-neural-networks',
  vector: [0.1, 0.2, ...], // 1536 dimensions
  metadata: {
    title: 'Neural Networks',
    type: 'concept',
    tags: ['AI', 'ML', 'deep-learning'],
    path: 'docs/concepts/neural.md'
  },
  namespace: 'concepts'
});
```

#### Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `ID must be a string` | Invalid ID type | Provide a string ID |
| `ID cannot be empty` | Empty ID string | Provide a non-empty ID |
| `Vector dimension mismatch` | Wrong vector size | Match configured dimensions (1536) |
| `Invalid vector element` | Non-numeric elements | Ensure all elements are finite numbers |

---

### kg_trajectory_list

List agent operation trajectories from the trajectory tracker.

```typescript
// Tool Definition
name: 'kg_trajectory_list'
description: 'List agent trajectories for pattern learning'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `agentId` | `string` | No | - | Filter by agent ID |
| `limit` | `number` | No | `20` | Maximum results (max: 100) |
| `includeSteps` | `boolean` | No | `false` | Include detailed steps |
| `workflowId` | `string` | No | - | Filter by workflow ID |
| `successOnly` | `boolean` | No | `false` | Only successful trajectories |
| `includeStats` | `boolean` | No | `true` | Include aggregate statistics |

#### Output Schema

```typescript
interface KGTrajectoryListResult {
  success: boolean;
  data: {
    trajectories: Array<{
      id: string;
      agentId: string;
      success: boolean;
      stepCount: number;
      totalDuration: number;
      totalDurationFormatted: string;
      startedAt: string;
      completedAt: string;
      workflowId?: string;
      actionSummary: string[];
      // When includeSteps=true:
      steps?: Array<{
        action: string;
        outcome: string;
        duration: number;
        durationFormatted: string;
        timestamp: string;
        state: Record<string, unknown>;
        metadata: Record<string, unknown>;
      }>;
    }>;
    count: number;
    filters: {
      agentId: string | null;
      workflowId: string | null;
      successOnly: boolean;
    };
    // When includeStats=true:
    stats?: {
      totalTrajectories: number;
      activeTrajectories: number;
      successRate: number;
      avgDuration: number;
      avgDurationFormatted: string;
      detectedPatterns: number;
      learningRecords: number;
    };
  };
  metadata: {
    executionTime: number;
    includeSteps: boolean;
  };
}
```

---

## Audit Tools

### kg_audit_query

Query the audit log for events.

```typescript
// Tool Definition
name: 'kg_audit_query'
description: 'Query the deterministic append-only audit log'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `eventType` | `string` | No | - | Filter by event type |
| `startTime` | `string` | No | - | Start time (ISO 8601) |
| `endTime` | `string` | No | - | End time (ISO 8601) |
| `limit` | `number` | No | `50` | Maximum results (max: 1000) |
| `includePayload` | `boolean` | No | `false` | Include full event payload |

**Common Event Types:**

| Event Type | Description |
|------------|-------------|
| `NodeCreated` | A new node was added |
| `NodeUpdated` | An existing node was modified |
| `NodeDeleted` | A node was removed |
| `WorkflowStarted` | A workflow began |
| `WorkflowCompleted` | A workflow finished successfully |
| `WorkflowFailed` | A workflow encountered an error |
| `SyncStarted` | Peer synchronization began |
| `SyncCompleted` | Peer synchronization finished |
| `CheckpointCreated` | A state checkpoint was created |

#### Output Schema

```typescript
interface KGAuditQueryResult {
  success: boolean;
  data: {
    events: Array<{
      id: string;
      type: string;
      author: string;
      timestamp: string;
      hlc: {
        physicalMs: number;
        logical: number;
      };
      parentCount: number;
      // When includePayload=true:
      payload?: Record<string, unknown>;
      signature?: string;
      parents?: string[];
    }>;
    count: number;
    totalCount: number;
    hasMore: boolean;
    filters: {
      eventType: string | null;
      startTime: string | null;
      endTime: string | null;
    };
  };
  metadata: {
    executionTime: number;
    itemCount: number;
  };
}
```

#### Example

```javascript
// Query recent events
await callTool('kg_audit_query', {
  limit: 100,
  includePayload: true
});

// Query by type and time range
await callTool('kg_audit_query', {
  eventType: 'NodeCreated',
  startTime: '2024-12-01T00:00:00Z',
  endTime: '2024-12-31T23:59:59Z'
});
```

---

### kg_audit_checkpoint

Create a checkpoint in the audit chain.

```typescript
// Tool Definition
name: 'kg_audit_checkpoint'
description: 'Create a checkpoint for verification and recovery'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | `string` | No | - | Optional checkpoint name |
| `tags` | `string[]` | No | - | Optional categorization tags |

#### Output Schema

```typescript
interface KGAuditCheckpointResult {
  success: boolean;
  data: {
    height: number;
    eventRoot: string;
    stateRoot: string;
    timestamp: string;
    validatorCount: number;
    metadata: {
      name?: string;
      tags?: string[];
    };
    stats: {
      totalEventsAtCheckpoint: number;
      eventsSincePreviousCheckpoint: number;
      previousCheckpointHeight: number;
    };
  };
  metadata: {
    executionTime: number;
  };
}
```

#### Example

```javascript
// Create named checkpoint
await callTool('kg_audit_checkpoint', {
  name: 'pre-migration-backup',
  tags: ['migration', 'critical', 'v2.0']
});

// Create simple checkpoint
await callTool('kg_audit_checkpoint', {});
```

---

### kg_sync_status

Check the syndication status of the audit chain across peer environments.

```typescript
// Tool Definition
name: 'kg_sync_status'
description: 'Check peer connections and sync status'
```

#### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `peerId` | `string` | No | - | Specific peer ID to check |
| `detailed` | `boolean` | No | `false` | Include detailed metrics |

#### Output Schema

```typescript
interface KGSyncStatusResult {
  success: boolean;
  data: {
    peers: Array<{
      id: string;
      endpoint: string;
      status: PeerStatus;
      lastSyncTime: string;
      errorCount: number;
      lastError: string | null;
      // When detailed=true:
      metrics?: {
        eventsReceived: number;
        eventsSent: number;
        latency: number;
        lastCheckpointHeight: number;
      };
    }>;
    peersByStatus: {
      connected: Peer[];
      syncing: Peer[];
      disconnected: Peer[];
      error: Peer[];
    };
    summary: {
      totalPeers: number;
      connectedPeers: number;
      syncingPeers: number;
      errorPeers: number;
    };
    serviceStatus: {
      running: boolean;
      autoSyncEnabled: boolean;
      syncInterval: number;
      syncing: boolean;
    };
    // When detailed=true:
    aggregateMetrics?: {
      totalEventsReceived: number;
      totalEventsSent: number;
      totalErrors: number;
    };
  };
  metadata: {
    executionTime: number;
    itemCount: number;
  };
}
```

**Peer Status Values:**

| Status | Description |
|--------|-------------|
| `connected` | Peer is connected and ready |
| `syncing` | Currently synchronizing |
| `disconnected` | Peer is not connected |
| `error` | Connection or sync error |

---

## Common Response Format

All tools return responses following a consistent format:

```typescript
interface MCPToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTime: number;
    cached?: boolean;
    itemCount?: number;
    [key: string]: unknown;
  };
}
```

### Success Response

```json
{
  "success": true,
  "data": {
    // Tool-specific response data
  },
  "metadata": {
    "executionTime": 45,
    "cached": false
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Description of what went wrong",
  "metadata": {
    "executionTime": 5
  }
}
```

---

## Error Handling

### Common Errors

| Error | Description | Resolution |
|-------|-------------|------------|
| `Database not initialized` | Knowledge graph database not loaded | Run `kg_graph_generate` first |
| `Cache not initialized` | Shadow cache not configured | Check MCP server configuration |
| `Vector store not initialized` | Vector storage not configured | Configure vector storage |
| `Audit chain not initialized` | Exochain audit system not available | Configure audit chain |
| `Syndication service not initialized` | Peer sync not configured | Configure syndication service |
| `Trajectory tracker not initialized` | Trajectory tracking not enabled | Configure trajectory tracker |

### Validation Errors

Tools validate input parameters and return descriptive error messages:

```json
{
  "success": false,
  "error": "Query parameter is required and must be a string",
  "metadata": {
    "executionTime": 2
  }
}
```

### Network/System Errors

System-level errors are captured and returned:

```json
{
  "success": false,
  "error": "Connection timeout after 30000ms",
  "metadata": {
    "executionTime": 30005
  }
}
```

---

## Type Definitions

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

### AgentType

```typescript
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
```

### AgentStatus

```typescript
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

## MCP Client Integration

### Using the MCP Client Adapter

```typescript
import { MCPClientAdapter } from '@weave-nn/knowledge-graph-agent/mcp';

// Create adapter
const adapter = new MCPClientAdapter({
  serverUrl: 'http://localhost:3001',
  timeout: 30000,
});

// Call a tool
const result = await adapter.callTool('kg_graph_query', {
  query: 'authentication',
  limit: 10,
});

if (result.success) {
  console.log('Found nodes:', result.data.nodes);
}
```

### Using Claude-Flow Memory Client

```typescript
import { ClaudeFlowMemoryClient } from '@weave-nn/knowledge-graph-agent/mcp';

// Create memory client
const memoryClient = new ClaudeFlowMemoryClient({
  namespace: 'knowledge-graph',
});

// Store value
await memoryClient.store('key', 'value', { ttl: 3600 });

// Retrieve value
const value = await memoryClient.retrieve('key');
```

---

## See Also

- [API Reference](../api/index.md) - TypeScript API documentation
- [CLI Commands](../cli/commands.md) - Command-line interface
- [Core Module](../api/core.md) - Core module API
- [Agents API](../api/agents.md) - Agent system documentation

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.4.0 | 2024-12-29 | Added Workflow, Vector, and Audit tools |
| 0.3.0 | 2024-12-15 | Added Agent tools, enhanced Graph tools |
| 0.2.0 | 2024-12-01 | Added Search tools, health checks |
| 0.1.0 | 2024-11-15 | Initial release with core Graph tools |
