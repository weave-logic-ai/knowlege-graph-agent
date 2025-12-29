# MCP Tools Reference

Complete reference documentation for all MCP (Model Context Protocol) tools available in the Knowledge Graph Agent.

**Version:** 0.4.0
**Last Updated:** 2024-12-29

---

## Table of Contents

- [Overview](#overview)
- [Tool Categories](#tool-categories)
- [Graph Tools](#graph-tools)
  - [kg_query](#kg_query)
  - [kg_stats](#kg_stats)
  - [kg_get_node](#kg_get_node)
  - [kg_list_tags](#kg_list_tags)
  - [kg_graph_query](#kg_graph_query)
  - [kg_graph_stats](#kg_graph_stats)
  - [kg_graph_generate](#kg_graph_generate)
- [Search Tools](#search-tools)
  - [kg_search_nodes](#kg_search_nodes)
  - [kg_search_tags](#kg_search_tags)
- [Agent Tools](#agent-tools)
  - [kg_agent_spawn](#kg_agent_spawn)
  - [kg_agent_list](#kg_agent_list)
- [System Tools](#system-tools)
  - [kg_health](#kg_health)
  - [kg_health_check](#kg_health_check)
  - [kg_cache_stats](#kg_cache_stats)
- [Workflow Tools](#workflow-tools) (NEW in v0.4.0)
  - [kg_workflow_start](#kg_workflow_start)
  - [kg_workflow_status](#kg_workflow_status)
  - [kg_workflow_list](#kg_workflow_list)
- [Vector Tools](#vector-tools) (NEW in v0.4.0)
  - [kg_vector_search](#kg_vector_search)
  - [kg_vector_upsert](#kg_vector_upsert)
  - [kg_trajectory_list](#kg_trajectory_list)
- [Audit Tools](#audit-tools) (NEW in v0.4.0)
  - [kg_audit_query](#kg_audit_query)
  - [kg_audit_checkpoint](#kg_audit_checkpoint)
  - [kg_sync_status](#kg_sync_status)
- [Common Response Format](#common-response-format)
- [Error Handling](#error-handling)

---

## Overview

The Knowledge Graph Agent exposes a comprehensive set of MCP tools for interacting with the knowledge graph, managing agents, orchestrating workflows, performing semantic searches, and auditing operations. All tools follow a consistent request/response pattern and provide detailed execution metadata.

### Tool Naming Convention

All tools use the `kg_` prefix to identify them as Knowledge Graph Agent tools:

- `kg_query` - Core graph queries
- `kg_agent_*` - Agent management
- `kg_workflow_*` - Workflow orchestration
- `kg_vector_*` - Vector operations
- `kg_audit_*` - Audit and compliance

---

## Tool Categories

| Category | Description | Tool Count |
|----------|-------------|------------|
| Graph | Knowledge graph queries and management | 7 |
| Search | Full-text and tag-based search | 2 |
| Agents | Agent spawning and lifecycle | 2 |
| System | Health checks and cache stats | 3 |
| Workflow | Workflow orchestration (v0.4.0) | 3 |
| Vector | Semantic search and vectors (v0.4.0) | 3 |
| Audit | Event logging and sync (v0.4.0) | 3 |

---

## Graph Tools

### kg_query

Query the knowledge graph for nodes matching criteria.

**Tool Name:** `kg_query`

**Description:** Query the knowledge graph for nodes matching criteria. Supports filtering by type, status, and tags.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query string"
    },
    "type": {
      "type": "string",
      "description": "Filter by node type",
      "enum": ["concept", "technical", "feature", "primitive", "service", "guide", "standard", "integration"]
    },
    "status": {
      "type": "string",
      "description": "Filter by node status",
      "enum": ["draft", "active", "deprecated", "archived"]
    },
    "tag": {
      "type": "string",
      "description": "Filter by tag"
    },
    "limit": {
      "type": "number",
      "description": "Maximum results to return",
      "default": 50
    },
    "includeContent": {
      "type": "boolean",
      "description": "Include full content in results",
      "default": false
    }
  }
}
```

#### Output Format

```json
{
  "success": true,
  "data": [
    {
      "id": "node-123",
      "path": "docs/concepts/example.md",
      "title": "Example Concept",
      "type": "concept",
      "status": "active",
      "tags": ["core", "fundamental"],
      "wordCount": 1500,
      "outgoingLinkCount": 5,
      "incomingLinkCount": 3,
      "content": "..." // Only if includeContent=true
    }
  ],
  "metadata": {
    "itemCount": 1
  }
}
```

#### Example Usage

```javascript
// Query by search term
await callTool('kg_query', { query: 'authentication', limit: 10 });

// Query by type
await callTool('kg_query', { type: 'primitive', limit: 20 });

// Query by tag with content
await callTool('kg_query', { tag: 'security', includeContent: true });
```

#### Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `Database not initialized` | Database not loaded | Run graph generation first |

---

### kg_stats

Get statistics about the knowledge graph.

**Tool Name:** `kg_stats`

**Description:** Get comprehensive statistics about the knowledge graph including node counts, edge counts, and distribution metrics.

#### Input Schema

```json
{
  "type": "object",
  "properties": {}
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "totalNodes": 150,
    "totalEdges": 420,
    "orphanNodes": 5,
    "avgLinksPerNode": 2.8,
    "nodesByType": {
      "concept": 45,
      "technical": 30,
      "feature": 25
    },
    "nodesByStatus": {
      "active": 140,
      "draft": 10
    }
  }
}
```

#### Example Usage

```javascript
await callTool('kg_stats', {});
```

---

### kg_get_node

Get a specific node by ID or path.

**Tool Name:** `kg_get_node`

**Description:** Retrieve a specific node from the knowledge graph by its unique ID or file path.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Node ID"
    },
    "path": {
      "type": "string",
      "description": "Node path (alternative to ID)"
    }
  }
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "id": "node-123",
    "path": "docs/concepts/example.md",
    "title": "Example Concept",
    "type": "concept",
    "status": "active",
    "tags": ["core"],
    "content": "Full markdown content...",
    "frontmatter": {
      "description": "Brief description"
    },
    "outgoingLinks": [...],
    "incomingLinks": [...],
    "wordCount": 1500,
    "lastModified": "2024-12-29T10:00:00Z"
  }
}
```

#### Example Usage

```javascript
// Get by ID
await callTool('kg_get_node', { id: 'node-123' });

// Get by path
await callTool('kg_get_node', { path: 'docs/concepts/auth.md' });
```

#### Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `Either id or path required` | No identifier provided | Provide either id or path |
| `Node not found` | Node doesn't exist | Verify the ID/path is correct |

---

### kg_list_tags

List all tags with their usage counts.

**Tool Name:** `kg_list_tags`

**Description:** Get a list of all tags used in the knowledge graph with their usage counts.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "number",
      "description": "Maximum tags to return",
      "default": 100
    }
  }
}
```

#### Output Format

```json
{
  "success": true,
  "data": [
    { "tag": "security", "count": 25 },
    { "tag": "api", "count": 18 },
    { "tag": "core", "count": 15 }
  ],
  "metadata": {
    "itemCount": 45
  }
}
```

---

### kg_graph_query

Query the knowledge graph for nodes and relationships.

**Tool Name:** `kg_graph_query`

**Description:** Query the knowledge graph for nodes and relationships. Supports full-text search across titles and content with optional type filtering.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query string to match against node titles and content"
    },
    "type": {
      "type": "string",
      "description": "Filter by node type",
      "enum": ["concept", "technical", "feature", "primitive", "service", "guide", "standard", "integration"]
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of results to return (default: 10, max: 100)",
      "default": 10,
      "minimum": 1,
      "maximum": 100
    },
    "includeRelations": {
      "type": "boolean",
      "description": "Include related nodes in the response (outgoing and incoming links)",
      "default": false
    }
  },
  "required": ["query"]
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "node-123",
        "title": "Authentication Service",
        "type": "service",
        "status": "active",
        "path": "docs/services/auth.md",
        "tags": ["security", "auth"],
        "wordCount": 2500,
        "lastModified": "2024-12-29T10:00:00Z",
        "outgoingLinks": [...], // Only if includeRelations=true
        "incomingLinks": [...]  // Only if includeRelations=true
      }
    ],
    "count": 1,
    "query": "authentication",
    "type": null,
    "totalAvailable": 1
  },
  "metadata": {
    "executionTime": 45,
    "cached": false
  }
}
```

#### Example Usage

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

**Tool Name:** `kg_graph_stats`

**Description:** Get comprehensive statistics about the knowledge graph including node counts, edge counts, and distribution by type and status.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "detailed": {
      "type": "boolean",
      "description": "Include detailed breakdown by type, status, and connectivity metrics",
      "default": false
    }
  }
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "totalNodes": 150,
    "totalEdges": 420,
    "averageLinksPerNode": 2.8,
    "orphanNodes": 5,
    // Detailed fields (when detailed=true):
    "nodesByType": {...},
    "nodesByStatus": {...},
    "mostConnected": [...],
    "topTags": [...],
    "totalTags": 45,
    "lastGenerated": "2024-12-29T10:00:00Z",
    "lastUpdated": "2024-12-29T12:00:00Z",
    "version": "1.0.0"
  },
  "metadata": {
    "executionTime": 12,
    "cached": false
  }
}
```

---

### kg_graph_generate

Generate or regenerate the knowledge graph from documentation.

**Tool Name:** `kg_graph_generate`

**Description:** Generate or regenerate the knowledge graph from documentation files. Scans markdown files and creates nodes with relationships based on wikilinks and markdown links.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "docsPath": {
      "type": "string",
      "description": "Path to documentation directory relative to project root (default: \"docs\")",
      "default": "docs"
    },
    "force": {
      "type": "boolean",
      "description": "Force regeneration even if the graph appears up to date",
      "default": false
    },
    "incremental": {
      "type": "boolean",
      "description": "Perform incremental update instead of full regeneration",
      "default": false
    }
  }
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "mode": "full",
    "filesProcessed": 150,
    "nodesGenerated": 150,
    "edgesCreated": 420,
    // Incremental mode fields:
    "nodesAdded": 5,
    "nodesUpdated": 10,
    "nodesRemoved": 2,
    // Error fields (if any):
    "errors": [],
    "errorCount": 0
  },
  "metadata": {
    "executionTime": 2500,
    "projectRoot": "/path/to/project",
    "docsPath": "docs"
  }
}
```

#### Example Usage

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

**Tool Name:** `kg_search_nodes`

**Description:** Search for nodes in the knowledge graph by content, metadata, type, or status. Supports full-text search with filtering options.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query to match against node content and titles"
    },
    "type": {
      "type": "string",
      "description": "Filter by node type",
      "enum": ["concept", "technical", "feature", "primitive", "service", "guide", "standard", "integration"]
    },
    "status": {
      "type": "string",
      "description": "Filter by node status",
      "enum": ["draft", "active", "deprecated", "archived"]
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of results to return (default: 20, max: 100)",
      "default": 20,
      "minimum": 1,
      "maximum": 100
    }
  },
  "required": ["query"]
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "node-123",
        "title": "Authentication API",
        "type": "service",
        "status": "active",
        "path": "docs/api/auth.md",
        "tags": ["api", "security"],
        "description": "Handles user authentication",
        "wordCount": 1200,
        "lastModified": "2024-12-29T10:00:00Z",
        "snippet": "The Authentication API provides secure token-based..."
      }
    ],
    "count": 1,
    "query": "authentication",
    "filters": {
      "type": null,
      "status": null
    }
  },
  "metadata": {
    "executionTime": 35,
    "cached": false
  }
}
```

---

### kg_search_tags

Search for nodes by tags.

**Tool Name:** `kg_search_tags`

**Description:** Search for nodes by tags. Can require all tags to match or any tag to match.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Array of tags to search for"
    },
    "matchAll": {
      "type": "boolean",
      "description": "If true, nodes must have ALL specified tags. If false, nodes with ANY of the tags are returned.",
      "default": false
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of results to return (default: 20, max: 100)",
      "default": 20,
      "minimum": 1,
      "maximum": 100
    }
  },
  "required": ["tags"]
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "node-123",
        "title": "Security Best Practices",
        "type": "guide",
        "status": "active",
        "path": "docs/guides/security.md",
        "tags": ["security", "best-practices", "api"],
        "matchedTags": ["security", "api"],
        "lastModified": "2024-12-29T10:00:00Z"
      }
    ],
    "count": 1,
    "tags": ["security", "api"],
    "matchAll": false,
    "totalMatching": 15
  },
  "metadata": {
    "executionTime": 25,
    "cached": false
  }
}
```

#### Example Usage

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

**Tool Name:** `kg_agent_spawn`

**Description:** Spawn a specialized agent to perform a task. Integrates with the agent registry for lifecycle management.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "description": "Agent type",
      "enum": ["researcher", "coder", "tester", "analyst", "architect"]
    },
    "name": {
      "type": "string",
      "description": "Custom agent name (optional)"
    },
    "task": {
      "type": "string",
      "description": "Task for the agent to perform"
    },
    "options": {
      "type": "object",
      "description": "Agent-specific options",
      "properties": {
        "timeout": {
          "type": "number",
          "description": "Task timeout in ms"
        },
        "maxRetries": {
          "type": "number",
          "description": "Maximum retries"
        },
        "priority": {
          "type": "string",
          "description": "Task priority",
          "enum": ["low", "medium", "high", "critical"]
        }
      }
    }
  },
  "required": ["type", "task"]
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "agentId": "agent-abc123",
    "agentType": "researcher",
    "agentName": "research-agent",
    "taskId": "task-xyz789",
    "taskResult": {
      "findings": [...],
      "recommendations": [...]
    },
    "metrics": {
      "duration": 5000,
      "tokensUsed": 1500
    },
    "artifacts": [...]
  },
  "metadata": {
    "executionTime": 5500,
    "status": "completed"
  }
}
```

#### Example Usage

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

#### Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `Agent type is required` | Missing type parameter | Provide agent type |
| `Task description is required` | Missing task parameter | Provide task description |
| `Agent type 'X' is not registered` | Invalid agent type | Use a registered agent type |

---

### kg_agent_list

List all active agents and their status.

**Tool Name:** `kg_agent_list`

**Description:** List all active agents and their status. Provides filtering by type and status.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "description": "Filter by agent type",
      "enum": ["researcher", "coder", "tester", "analyst", "architect", "reviewer", "coordinator", "optimizer", "documenter"]
    },
    "status": {
      "type": "string",
      "description": "Filter by status",
      "enum": ["idle", "running", "completed", "failed", "paused", "terminated"]
    }
  }
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "agent-abc123",
        "type": "researcher",
        "name": "research-agent",
        "status": "running",
        "currentTask": "task-xyz789",
        "queuedTasks": 2,
        "completedTasks": 5,
        "errorCount": 0,
        "lastActivity": "2024-12-29T10:30:00Z"
      }
    ],
    "count": 1,
    "registeredTypes": [
      {
        "type": "researcher",
        "instanceCount": 1,
        "capabilities": ["research", "analysis"]
      }
    ],
    "stats": {
      "totalInstances": 5,
      "instancesByType": {...},
      "instancesByStatus": {...}
    }
  },
  "metadata": {
    "executionTime": 15,
    "filters": {
      "type": "all",
      "status": "all"
    }
  }
}
```

---

## System Tools

### kg_health

Check basic health status of knowledge graph components.

**Tool Name:** `kg_health`

**Description:** Check health status of knowledge graph components. Quick health check for database, cache, and tool registry.

#### Input Schema

```json
{
  "type": "object",
  "properties": {}
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "database": true,
    "cache": true,
    "projectRoot": "/path/to/project",
    "toolCount": 23
  }
}
```

---

### kg_health_check

Check comprehensive health status of the knowledge graph server.

**Tool Name:** `kg_health_check`

**Description:** Check the health status of the knowledge graph server with detailed diagnostics about all server components.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "detailed": {
      "type": "boolean",
      "description": "Include detailed diagnostics",
      "default": false
    },
    "components": {
      "type": "array",
      "description": "Specific components to check",
      "items": {
        "type": "string",
        "enum": ["database", "cache", "agents", "memory"]
      }
    }
  }
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "components": {
      "database": "healthy",
      "cache": "healthy",
      "agents": "healthy",
      "memory": "healthy"
    },
    "timestamp": "2024-12-29T10:00:00Z",
    // Detailed fields (when detailed=true):
    "memory": {
      "rss": 150000000,
      "heapTotal": 100000000,
      "heapUsed": 75000000,
      "external": 5000000,
      "arrayBuffers": 1000000
    },
    "uptime": 3600,
    "nodeVersion": "v20.10.0",
    "platform": "linux",
    "arch": "x64",
    "pid": 12345
  },
  "metadata": {
    "executionTime": 50,
    "componentsChecked": ["database", "cache", "agents", "memory"]
  }
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

**Tool Name:** `kg_cache_stats`

**Description:** Get statistics about the shadow cache including hit rates, entry counts, and size information.

#### Input Schema

```json
{
  "type": "object",
  "properties": {}
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "totalEntries": 250,
    "staleEntries": 10,
    "hitRate": 0.85,
    "sizeBytes": 5242880,
    "hits": 1500,
    "misses": 250
  }
}
```

---

## Workflow Tools

**(NEW in v0.4.0)**

### kg_workflow_start

Start a new workflow for knowledge graph operations.

**Tool Name:** `kg_workflow_start`

**Description:** Start a new workflow for knowledge graph operations. Supports collaboration, analysis, sync, and custom workflow types.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "workflowId": {
      "type": "string",
      "description": "Workflow type to start",
      "enum": ["collaboration", "analysis", "sync", "custom"]
    },
    "input": {
      "type": "object",
      "description": "Workflow input data",
      "properties": {
        "graphId": {
          "type": "string",
          "description": "Knowledge graph identifier"
        },
        "docPath": {
          "type": "string",
          "description": "Path to the source document"
        },
        "options": {
          "type": "object",
          "description": "Additional workflow options",
          "properties": {
            "autoStart": {
              "type": "boolean",
              "description": "Auto-start development when ready"
            },
            "watchPaths": {
              "type": "array",
              "description": "Paths to watch for changes",
              "items": { "type": "string" }
            },
            "threshold": {
              "type": "number",
              "description": "Completeness threshold (0-1)"
            }
          }
        }
      }
    }
  },
  "required": ["workflowId"]
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "workflowId": "collaboration-1703847600000",
    "type": "collaboration",
    "startedAt": "2024-12-29T10:00:00Z",
    "completedAt": "2024-12-29T10:05:00Z",
    "outcome": "completed",
    "artifacts": [...]
  },
  "metadata": {
    "executionTime": 300000,
    "serviceStatus": "running"
  }
}
```

#### Workflow Types

| Type | Description |
|------|-------------|
| `collaboration` | Real-time collaboration workflow with agent coordination |
| `analysis` | Gap analysis workflow for documentation completeness |
| `sync` | File watching and synchronization workflow |
| `custom` | Custom workflow using GOAP planning |

#### Example Usage

```javascript
// Start collaboration workflow
await callTool('kg_workflow_start', {
  workflowId: 'collaboration',
  input: {
    graphId: 'main-graph',
    docPath: './docs/spec.md'
  }
});

// Start analysis workflow
await callTool('kg_workflow_start', {
  workflowId: 'analysis',
  input: {
    docPath: './docs'
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

**Tool Name:** `kg_workflow_status`

**Description:** Check the status of a specific workflow by ID or get the overall workflow service status.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "workflowId": {
      "type": "string",
      "description": "Specific workflow ID to check (optional, returns service status if not provided)"
    },
    "includeMetrics": {
      "type": "boolean",
      "description": "Include execution metrics and statistics",
      "default": false
    },
    "includeConfig": {
      "type": "boolean",
      "description": "Include service configuration details",
      "default": false
    }
  }
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "found": true,
    "workflow": {
      "id": "collab-123-abc",
      "type": "realtime-collab",
      "status": "running",
      "currentStep": "agent-coordination",
      "startedAt": "2024-12-29T10:00:00Z",
      "lastEventAt": "2024-12-29T10:30:00Z"
    },
    "service": {
      "isRunning": true,
      "activeWorkflowCount": 3,
      "watchedPaths": ["./docs"],
      "lastActivity": "2024-12-29T10:30:00Z"
    },
    // When includeMetrics=true:
    "stats": {
      "totalExecutions": 50,
      "successfulExecutions": 45,
      "failedExecutions": 5,
      "averageDuration": 120000,
      "successRate": 90
    },
    // When includeConfig=true:
    "config": {
      "inactivityTimeout": 300000,
      "autoStartThreshold": 0.7,
      "watchPaths": [],
      "debug": false
    }
  },
  "metadata": {
    "executionTime": 10,
    "requestedWorkflowId": "collab-123-abc"
  }
}
```

---

### kg_workflow_list

List all active workflows with optional filtering.

**Tool Name:** `kg_workflow_list`

**Description:** List all active workflows with filtering by status and type, pagination, and sorting options.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "description": "Filter by workflow status",
      "enum": ["running", "completed", "failed", "suspended", "all"]
    },
    "type": {
      "type": "string",
      "description": "Filter by workflow type",
      "enum": ["realtime-collab", "analysis", "sync", "custom", "all"]
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of workflows to return",
      "default": 50
    },
    "offset": {
      "type": "number",
      "description": "Number of workflows to skip (for pagination)",
      "default": 0
    },
    "sortBy": {
      "type": "string",
      "description": "Field to sort by",
      "enum": ["startedAt", "lastEventAt", "status", "type"],
      "default": "startedAt"
    },
    "sortOrder": {
      "type": "string",
      "description": "Sort order",
      "enum": ["asc", "desc"],
      "default": "desc"
    }
  }
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "workflows": [
      {
        "id": "collab-123",
        "type": "realtime-collab",
        "status": "running",
        "currentStep": "coordination",
        "startedAt": "2024-12-29T10:00:00Z",
        "lastEventAt": "2024-12-29T10:30:00Z",
        "duration": 1800000,
        "isActive": true
      }
    ],
    "summary": {
      "total": 10,
      "filtered": 5,
      "returned": 5,
      "byStatus": {
        "running": 3,
        "completed": 5,
        "failed": 1,
        "suspended": 1
      },
      "byType": {
        "realtime-collab": 4,
        "analysis": 3,
        "sync": 2,
        "custom": 1
      }
    },
    "pagination": {
      "limit": 50,
      "offset": 0,
      "hasMore": false,
      "nextOffset": null
    },
    "serviceStatus": {
      "isRunning": true,
      "watchedPaths": 2,
      "lastActivity": "2024-12-29T10:30:00Z"
    }
  },
  "metadata": {
    "executionTime": 25,
    "filters": {
      "status": "all",
      "type": "all",
      "sortBy": "startedAt",
      "sortOrder": "desc"
    },
    "itemCount": 5
  }
}
```

---

## Vector Tools

**(NEW in v0.4.0)**

### kg_vector_search

Perform semantic vector search on the knowledge graph.

**Tool Name:** `kg_vector_search`

**Description:** Perform semantic vector search on the knowledge graph. Supports pure vector similarity search and hybrid search combining vector similarity with keyword matching for more precise results.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query string. Will be converted to an embedding vector for similarity search."
    },
    "k": {
      "type": "number",
      "description": "Number of results to return (default: 10, max: 100)",
      "default": 10,
      "minimum": 1,
      "maximum": 100
    },
    "type": {
      "type": "string",
      "description": "Filter results by node type",
      "enum": ["concept", "technical", "feature", "primitive", "service", "guide", "standard", "integration"]
    },
    "hybrid": {
      "type": "boolean",
      "description": "Enable hybrid search combining vector similarity with keyword matching (default: false)",
      "default": false
    },
    "minScore": {
      "type": "number",
      "description": "Minimum similarity score threshold (0-1, default: 0)",
      "default": 0,
      "minimum": 0,
      "maximum": 1
    },
    "includeVectors": {
      "type": "boolean",
      "description": "Include raw vector data in results (default: false)",
      "default": false
    },
    "namespace": {
      "type": "string",
      "description": "Filter by vector namespace"
    }
  },
  "required": ["query"]
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "doc-123",
        "score": 0.9234,
        "metadata": {
          "title": "Neural Network Architecture",
          "type": "concept",
          "path": "docs/concepts/neural.md",
          "tags": ["AI", "ML"]
        },
        // Hybrid search fields:
        "combinedScore": 0.9456,
        "keywordScore": 0.75,
        "source": "merged",
        // When includeVectors=true:
        "vector": [0.1, 0.2, ...]
      }
    ],
    "count": 10,
    "query": "neural network architecture",
    "searchMode": "hybrid",
    "filters": {
      "type": null,
      "minScore": 0.5,
      "namespace": null
    }
  },
  "metadata": {
    "executionTime": 150,
    "totalVectors": 1500,
    "indexType": "hnsw",
    "cached": false
  }
}
```

#### Example Usage

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

**Tool Name:** `kg_vector_upsert`

**Description:** Insert or update a vector in the knowledge graph. If a vector with the given ID exists, it will be replaced; otherwise, a new vector will be created.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for the vector. Used for retrieval and updates."
    },
    "vector": {
      "type": "array",
      "items": { "type": "number" },
      "description": "The embedding vector as an array of numbers. Must match the configured dimensions."
    },
    "metadata": {
      "type": "object",
      "description": "Optional metadata to associate with the vector",
      "properties": {
        "title": { "type": "string", "description": "Title of the source document" },
        "content": { "type": "string", "description": "Text content snippet" },
        "type": {
          "type": "string",
          "description": "Node type",
          "enum": ["concept", "technical", "feature", "primitive", "service", "guide", "standard", "integration"]
        },
        "path": { "type": "string", "description": "Source file path" },
        "tags": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Associated tags"
        },
        "sourceId": { "type": "string", "description": "Reference to source node" }
      },
      "additionalProperties": true
    },
    "namespace": {
      "type": "string",
      "description": "Optional namespace for organizing vectors (default: \"default\")"
    }
  },
  "required": ["id", "vector"]
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "id": "doc-123",
    "operation": "updated",
    "dimensions": 1536,
    "hasMetadata": true,
    "namespace": "default"
  },
  "metadata": {
    "executionTime": 50,
    "totalVectors": 1501,
    "wasUpdate": true
  }
}
```

#### Example Usage

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

#### Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `ID must be a string` | Invalid ID type | Provide a string ID |
| `ID cannot be empty` | Empty ID string | Provide a non-empty ID |
| `Vector dimension mismatch` | Wrong vector size | Match configured dimensions (default: 1536) |
| `Invalid vector element` | Non-numeric elements | Ensure all elements are finite numbers |

---

### kg_trajectory_list

List agent operation trajectories from the trajectory tracker.

**Tool Name:** `kg_trajectory_list`

**Description:** List agent operation trajectories from the trajectory tracker. Trajectories record agent actions for pattern learning and optimization.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "agentId": {
      "type": "string",
      "description": "Filter trajectories by specific agent ID"
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of trajectories to return (default: 20, max: 100)",
      "default": 20,
      "minimum": 1,
      "maximum": 100
    },
    "includeSteps": {
      "type": "boolean",
      "description": "Include detailed step information for each trajectory (default: false)",
      "default": false
    },
    "workflowId": {
      "type": "string",
      "description": "Filter trajectories by workflow ID"
    },
    "successOnly": {
      "type": "boolean",
      "description": "Only include successful trajectories (default: false)",
      "default": false
    },
    "includeStats": {
      "type": "boolean",
      "description": "Include aggregate statistics about trajectories (default: true)",
      "default": true
    }
  }
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "trajectories": [
      {
        "id": "traj-abc123",
        "agentId": "researcher-1",
        "success": true,
        "stepCount": 5,
        "totalDuration": 15000,
        "totalDurationFormatted": "15.00s",
        "startedAt": "2024-12-29T10:00:00Z",
        "completedAt": "2024-12-29T10:00:15Z",
        "workflowId": "workflow-xyz",
        "actionSummary": ["analyze", "search", "summarize", "validate", "complete"],
        // When includeSteps=true:
        "steps": [
          {
            "action": "analyze",
            "outcome": "success",
            "duration": 3000,
            "durationFormatted": "3.00s",
            "timestamp": "2024-12-29T10:00:00Z",
            "state": {...},
            "metadata": {...}
          }
        ]
      }
    ],
    "count": 10,
    "filters": {
      "agentId": null,
      "workflowId": null,
      "successOnly": false
    },
    // When includeStats=true:
    "stats": {
      "totalTrajectories": 150,
      "activeTrajectories": 3,
      "successRate": 92.5,
      "avgDuration": 12500,
      "avgDurationFormatted": "12.50s",
      "detectedPatterns": 8,
      "learningRecords": 25
    }
  },
  "metadata": {
    "executionTime": 35,
    "includeSteps": false
  }
}
```

---

## Audit Tools

**(NEW in v0.4.0)**

### kg_audit_query

Query the audit log for events.

**Tool Name:** `kg_audit_query`

**Description:** Query the audit log for events with filtering by type, time range, and limit. Returns events from the deterministic append-only log.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "eventType": {
      "type": "string",
      "description": "Filter by event type (e.g., NodeCreated, WorkflowCompleted, SyncStarted)"
    },
    "startTime": {
      "type": "string",
      "description": "Start time filter as ISO 8601 timestamp (e.g., 2024-01-01T00:00:00Z)"
    },
    "endTime": {
      "type": "string",
      "description": "End time filter as ISO 8601 timestamp (e.g., 2024-12-31T23:59:59Z)"
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of results to return (default: 50, max: 1000)",
      "default": 50,
      "minimum": 1,
      "maximum": 1000
    },
    "includePayload": {
      "type": "boolean",
      "description": "Include the full event payload in results (default: false)",
      "default": false
    }
  }
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "evt-abc123",
        "type": "NodeCreated",
        "author": "did:exo:agent-1",
        "timestamp": "2024-12-29T10:00:00Z",
        "hlc": {
          "physicalMs": 1703847600000,
          "logical": 0
        },
        "parentCount": 1,
        // When includePayload=true:
        "payload": {
          "type": "NodeCreated",
          "nodeId": "node-123",
          "path": "docs/example.md"
        },
        "signature": "...",
        "parents": [...]
      }
    ],
    "count": 50,
    "totalCount": 1500,
    "hasMore": true,
    "filters": {
      "eventType": "NodeCreated",
      "startTime": "2024-12-01T00:00:00Z",
      "endTime": null
    }
  },
  "metadata": {
    "executionTime": 75,
    "itemCount": 50
  }
}
```

#### Event Types

Common event types include:

| Event Type | Description |
|------------|-------------|
| `NodeCreated` | A new node was added to the graph |
| `NodeUpdated` | An existing node was modified |
| `NodeDeleted` | A node was removed from the graph |
| `WorkflowStarted` | A workflow execution began |
| `WorkflowCompleted` | A workflow finished successfully |
| `WorkflowFailed` | A workflow encountered an error |
| `SyncStarted` | Peer synchronization began |
| `SyncCompleted` | Peer synchronization finished |
| `CheckpointCreated` | A state checkpoint was created |

#### Example Usage

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

**Tool Name:** `kg_audit_checkpoint`

**Description:** Create a checkpoint in the audit chain. Checkpoints provide periodic state snapshots for efficient verification and sync recovery points.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Optional name for the checkpoint (for reference purposes)"
    },
    "tags": {
      "type": "array",
      "description": "Optional tags for categorizing the checkpoint",
      "items": {
        "type": "string"
      }
    }
  }
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "height": 150,
    "eventRoot": "0x1234567890abcdef...",
    "stateRoot": "0xfedcba0987654321...",
    "timestamp": "2024-12-29T10:00:00Z",
    "validatorCount": 3,
    "metadata": {
      "name": "pre-migration",
      "tags": ["migration", "backup"]
    },
    "stats": {
      "totalEventsAtCheckpoint": 1500,
      "eventsSincePreviousCheckpoint": 150,
      "previousCheckpointHeight": 140
    }
  },
  "metadata": {
    "executionTime": 250
  }
}
```

#### Example Usage

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

**Tool Name:** `kg_sync_status`

**Description:** Check the syndication status of the audit chain across peer environments. Shows peer connections, sync history, and error states.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "peerId": {
      "type": "string",
      "description": "Specific peer ID to check status for (optional, returns all peers if not specified)"
    },
    "detailed": {
      "type": "boolean",
      "description": "Include detailed sync metrics and history (default: false)",
      "default": false
    }
  }
}
```

#### Output Format

```json
{
  "success": true,
  "data": {
    "peers": [
      {
        "id": "peer-abc123",
        "endpoint": "https://peer1.example.com",
        "status": "connected",
        "lastSyncTime": "2024-12-29T09:55:00Z",
        "errorCount": 0,
        "lastError": null,
        // When detailed=true:
        "metrics": {
          "eventsReceived": 500,
          "eventsSent": 480,
          "latency": 45,
          "lastCheckpointHeight": 148
        }
      }
    ],
    "peersByStatus": {
      "connected": [...],
      "syncing": [...],
      "disconnected": [...],
      "error": [...]
    },
    "summary": {
      "totalPeers": 5,
      "connectedPeers": 4,
      "syncingPeers": 1,
      "errorPeers": 0
    },
    "serviceStatus": {
      "running": true,
      "autoSyncEnabled": true,
      "syncInterval": 30000,
      "syncing": true
    },
    // When detailed=true:
    "aggregateMetrics": {
      "totalEventsReceived": 2500,
      "totalEventsSent": 2400,
      "totalErrors": 3
    }
  },
  "metadata": {
    "executionTime": 100,
    "itemCount": 5
  }
}
```

#### Peer Status Values

| Status | Description |
|--------|-------------|
| `connected` | Peer is connected and ready for sync |
| `syncing` | Currently synchronizing with this peer |
| `disconnected` | Peer is not connected |
| `error` | Connection or sync error occurred |

---

## Common Response Format

All tools return responses following a consistent format:

```json
{
  "success": boolean,
  "data": {...},
  "error": "string (only on failure)",
  "metadata": {
    "executionTime": number,
    ...additional metadata
  }
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

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.4.0 | 2024-12-29 | Added Workflow, Vector, and Audit tools |
| 0.3.0 | 2024-12-15 | Added Agent tools, enhanced Graph tools |
| 0.2.0 | 2024-12-01 | Added Search tools, health checks |
| 0.1.0 | 2024-11-15 | Initial release with core Graph tools |

---

*This documentation is auto-generated from the MCP tool definitions in the Knowledge Graph Agent.*
