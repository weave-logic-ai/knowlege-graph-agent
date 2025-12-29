# MCP Server Guide

The MCP (Model Context Protocol) Server enables Claude and other AI models to interact with the Knowledge Graph Agent system. It provides a standardized interface for knowledge graph operations, agent management, and graph queries.

## Overview

The MCP Server exposes:

1. **Graph Tools** - CRUD operations for nodes and edges
2. **Search Tools** - Full-text and semantic search
3. **Agent Tools** - Agent spawning and task management
4. **Analysis Tools** - Codebase analysis and pattern detection
5. **Cultivation Tools** - Seed generation and primitive extraction

## Server Setup

### Installation

```bash
# Install the knowledge-graph-agent package
npm install @knowledge-graph-agent/mcp

# Or install globally
npm install -g @knowledge-graph-agent/mcp
```

### Starting the Server

```bash
# Start with default configuration
npx kg-mcp start

# Start with custom config
npx kg-mcp start --config ./kg-config.json

# Start with specific port
npx kg-mcp start --port 3100

# Start in development mode
npx kg-mcp start --dev
```

### Configuration

Create a configuration file `kg-mcp-config.json`:

```json
{
  "server": {
    "port": 3100,
    "host": "localhost",
    "transport": "stdio"
  },
  "graph": {
    "projectRoot": ".",
    "docsRoot": "./docs",
    "database": {
      "path": "./.kg/knowledge.db",
      "enableWAL": true
    }
  },
  "agents": {
    "enabled": true,
    "maxConcurrent": 5,
    "defaultTimeout": 60000
  },
  "claudeFlow": {
    "enabled": true,
    "namespace": "knowledge-graph"
  },
  "logging": {
    "level": "info",
    "format": "json"
  }
}
```

## Claude Code Integration

### Adding MCP Server to Claude

```bash
# Add the MCP server to Claude Code
claude mcp add knowledge-graph npx @knowledge-graph-agent/mcp start

# Verify installation
claude mcp list
```

### CLAUDE.md Configuration

Add the following to your project's CLAUDE.md:

```markdown
## Knowledge Graph Integration

This project uses the Knowledge Graph Agent MCP server for documentation
and codebase analysis.

### Available Tools

- `kg_node_create` - Create knowledge graph nodes
- `kg_node_get` - Retrieve node details
- `kg_search` - Search the knowledge graph
- `kg_analyze` - Analyze codebase patterns
- `kg_cultivate` - Generate primitives from code

### Usage Examples

To search for documentation:
Use the kg_search tool with your query.

To analyze patterns:
Use the kg_analyze tool with the project path.
```

## Tools by Category

### Graph Operations

#### kg_node_create

Create a new knowledge graph node.

```json
{
  "name": "kg_node_create",
  "description": "Create a new node in the knowledge graph",
  "parameters": {
    "type": {
      "type": "string",
      "enum": ["concept", "technical", "feature", "primitive", "service", "guide", "standard", "integration"],
      "description": "Node type"
    },
    "title": {
      "type": "string",
      "description": "Node title"
    },
    "content": {
      "type": "string",
      "description": "Node content in markdown"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Tags for the node"
    },
    "status": {
      "type": "string",
      "enum": ["draft", "active", "deprecated", "archived"],
      "default": "draft"
    }
  },
  "required": ["type", "title", "content"]
}
```

**Example Usage:**

```
Create a concept node about Event Sourcing with tags architecture and patterns
```

#### kg_node_get

Retrieve a node by ID or path.

```json
{
  "name": "kg_node_get",
  "parameters": {
    "id": {
      "type": "string",
      "description": "Node ID or path"
    },
    "includeLinks": {
      "type": "boolean",
      "default": true,
      "description": "Include incoming/outgoing links"
    }
  },
  "required": ["id"]
}
```

#### kg_node_update

Update an existing node.

```json
{
  "name": "kg_node_update",
  "parameters": {
    "id": {
      "type": "string",
      "description": "Node ID"
    },
    "title": {
      "type": "string",
      "description": "New title (optional)"
    },
    "content": {
      "type": "string",
      "description": "New content (optional)"
    },
    "status": {
      "type": "string",
      "description": "New status (optional)"
    },
    "tags": {
      "type": "array",
      "description": "New tags (optional)"
    }
  },
  "required": ["id"]
}
```

#### kg_node_delete

Delete a node from the graph.

```json
{
  "name": "kg_node_delete",
  "parameters": {
    "id": {
      "type": "string",
      "description": "Node ID to delete"
    },
    "cascade": {
      "type": "boolean",
      "default": false,
      "description": "Also delete connected edges"
    }
  },
  "required": ["id"]
}
```

#### kg_edge_create

Create an edge between nodes.

```json
{
  "name": "kg_edge_create",
  "parameters": {
    "source": {
      "type": "string",
      "description": "Source node ID"
    },
    "target": {
      "type": "string",
      "description": "Target node ID"
    },
    "type": {
      "type": "string",
      "enum": ["link", "reference", "parent", "related"],
      "description": "Edge type"
    },
    "weight": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "default": 0.5,
      "description": "Relationship strength"
    }
  },
  "required": ["source", "target", "type"]
}
```

### Search Tools

#### kg_search

Full-text search across the knowledge graph.

```json
{
  "name": "kg_search",
  "parameters": {
    "query": {
      "type": "string",
      "description": "Search query (supports FTS5 syntax)"
    },
    "types": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Filter by node types"
    },
    "tags": {
      "type": "array",
      "description": "Filter by tags"
    },
    "status": {
      "type": "string",
      "description": "Filter by status"
    },
    "limit": {
      "type": "number",
      "default": 20,
      "description": "Maximum results"
    }
  },
  "required": ["query"]
}
```

**Example Usage:**

```
Search for nodes about authentication with type technical
```

#### kg_search_semantic

Semantic similarity search.

```json
{
  "name": "kg_search_semantic",
  "parameters": {
    "query": {
      "type": "string",
      "description": "Natural language query"
    },
    "threshold": {
      "type": "number",
      "default": 0.7,
      "description": "Similarity threshold (0-1)"
    },
    "limit": {
      "type": "number",
      "default": 10,
      "description": "Maximum results"
    }
  },
  "required": ["query"]
}
```

### Agent Tools

#### kg_agent_spawn

Spawn a knowledge graph agent.

```json
{
  "name": "kg_agent_spawn",
  "parameters": {
    "type": {
      "type": "string",
      "enum": ["researcher", "analyst", "coordinator", "documenter", "optimizer"],
      "description": "Agent type"
    },
    "name": {
      "type": "string",
      "description": "Agent name"
    },
    "capabilities": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Agent capabilities"
    }
  },
  "required": ["type"]
}
```

#### kg_agent_task

Assign a task to an agent.

```json
{
  "name": "kg_agent_task",
  "parameters": {
    "agentId": {
      "type": "string",
      "description": "Agent ID"
    },
    "task": {
      "type": "string",
      "description": "Task description"
    },
    "params": {
      "type": "object",
      "description": "Task parameters"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"],
      "default": "medium"
    }
  },
  "required": ["agentId", "task"]
}
```

#### kg_agent_status

Get agent status and metrics.

```json
{
  "name": "kg_agent_status",
  "parameters": {
    "agentId": {
      "type": "string",
      "description": "Agent ID (optional, returns all if omitted)"
    }
  }
}
```

### Analysis Tools

#### kg_analyze

Analyze codebase for patterns and structure.

```json
{
  "name": "kg_analyze",
  "parameters": {
    "projectRoot": {
      "type": "string",
      "description": "Project root path"
    },
    "analysisType": {
      "type": "string",
      "enum": ["patterns", "dependencies", "structure", "quality", "full"],
      "default": "full"
    },
    "options": {
      "type": "object",
      "properties": {
        "includeTests": { "type": "boolean", "default": false },
        "maxDepth": { "type": "number", "default": 10 },
        "filePatterns": { "type": "array", "items": { "type": "string" } }
      }
    }
  },
  "required": ["projectRoot"]
}
```

#### kg_analyze_patterns

Detect specific patterns in code.

```json
{
  "name": "kg_analyze_patterns",
  "parameters": {
    "projectRoot": {
      "type": "string",
      "description": "Project root path"
    },
    "patternTypes": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["architectural", "design", "anti-pattern", "security"]
      },
      "description": "Pattern types to detect"
    },
    "confidence": {
      "type": "number",
      "default": 0.7,
      "description": "Minimum confidence threshold"
    }
  },
  "required": ["projectRoot"]
}
```

### Cultivation Tools

#### kg_cultivate

Run cultivation analysis on a project.

```json
{
  "name": "kg_cultivate",
  "parameters": {
    "projectRoot": {
      "type": "string",
      "description": "Project root path"
    },
    "docsPath": {
      "type": "string",
      "description": "Documentation path"
    },
    "ecosystems": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["nodejs", "python", "php", "rust", "go", "java", "ruby", "dotnet"]
      },
      "description": "Ecosystems to analyze"
    },
    "options": {
      "type": "object",
      "properties": {
        "includeDev": { "type": "boolean", "default": false },
        "minImportance": {
          "type": "string",
          "enum": ["all", "major", "framework"],
          "default": "major"
        },
        "dryRun": { "type": "boolean", "default": false }
      }
    }
  },
  "required": ["projectRoot"]
}
```

#### kg_generate_primitives

Generate PRIMITIVES.md from analysis.

```json
{
  "name": "kg_generate_primitives",
  "parameters": {
    "projectRoot": {
      "type": "string",
      "description": "Project root path"
    },
    "outputPath": {
      "type": "string",
      "description": "Output file path"
    },
    "format": {
      "type": "string",
      "enum": ["markdown", "json", "yaml"],
      "default": "markdown"
    }
  },
  "required": ["projectRoot"]
}
```

### Graph Statistics Tools

#### kg_stats

Get knowledge graph statistics.

```json
{
  "name": "kg_stats",
  "parameters": {
    "detailed": {
      "type": "boolean",
      "default": false,
      "description": "Include detailed breakdown"
    }
  }
}
```

Returns:

```json
{
  "totalNodes": 150,
  "totalEdges": 423,
  "nodesByType": {
    "concept": 45,
    "technical": 60,
    "feature": 25,
    "primitive": 20
  },
  "nodesByStatus": {
    "active": 120,
    "draft": 25,
    "deprecated": 5
  },
  "orphanNodes": 3,
  "avgLinksPerNode": 2.82
}
```

#### kg_health

Check system health.

```json
{
  "name": "kg_health",
  "parameters": {}
}
```

Returns:

```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "size": "2.4MB"
  },
  "agents": {
    "active": 2,
    "idle": 3
  },
  "claudeFlow": {
    "connected": true,
    "namespace": "knowledge-graph"
  }
}
```

## Custom Tool Development

### Creating a Custom Tool

```typescript
import { MCPTool, ToolSchema, ToolHandler } from '@knowledge-graph-agent/mcp';

const myCustomTool: MCPTool = {
  name: 'kg_custom_analysis',
  description: 'Perform custom analysis on the knowledge graph',
  schema: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        description: 'Analysis target'
      },
      options: {
        type: 'object',
        description: 'Analysis options'
      }
    },
    required: ['target']
  },
  handler: async (params, context) => {
    const { target, options } = params;
    const { graph, agents } = context;

    // Perform custom analysis
    const results = await performAnalysis(graph, target, options);

    return {
      success: true,
      data: results
    };
  }
};
```

### Registering Custom Tools

```typescript
import { MCPServer } from '@knowledge-graph-agent/mcp';

const server = new MCPServer();

// Register single tool
server.registerTool(myCustomTool);

// Register multiple tools
server.registerTools([
  myCustomTool,
  anotherTool,
  yetAnotherTool
]);

// Start server
await server.start();
```

### Tool Middleware

```typescript
// Add middleware for all tools
server.use(async (params, context, next) => {
  console.log(`Tool called: ${context.toolName}`);
  const startTime = Date.now();

  const result = await next();

  console.log(`Tool completed in ${Date.now() - startTime}ms`);
  return result;
});

// Add middleware for specific tools
server.use('kg_analyze*', async (params, context, next) => {
  // Only runs for tools starting with kg_analyze
  return next();
});
```

## Error Handling

### Standard Error Responses

```json
{
  "success": false,
  "error": {
    "code": "NODE_NOT_FOUND",
    "message": "Node with ID 'unknown-id' not found",
    "details": {
      "nodeId": "unknown-id",
      "suggestion": "Use kg_search to find available nodes"
    }
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `NODE_NOT_FOUND` | Requested node doesn't exist |
| `EDGE_NOT_FOUND` | Requested edge doesn't exist |
| `INVALID_PARAMS` | Invalid tool parameters |
| `AGENT_ERROR` | Agent execution failed |
| `DATABASE_ERROR` | Database operation failed |
| `AUTH_ERROR` | Authentication required |
| `RATE_LIMITED` | Too many requests |

## Security

### Authentication

```typescript
const server = new MCPServer({
  auth: {
    enabled: true,
    type: 'token',
    tokens: ['your-secret-token']
  }
});
```

### Rate Limiting

```typescript
const server = new MCPServer({
  rateLimit: {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000
  }
});
```

### Tool Permissions

```typescript
const server = new MCPServer({
  permissions: {
    // Read-only tools available to all
    'kg_node_get': { level: 'read' },
    'kg_search': { level: 'read' },

    // Write tools require elevated access
    'kg_node_create': { level: 'write' },
    'kg_node_delete': { level: 'admin' }
  }
});
```

## Monitoring

### Logging

```typescript
const server = new MCPServer({
  logging: {
    level: 'info', // 'debug' | 'info' | 'warn' | 'error'
    format: 'json',
    destination: './logs/mcp-server.log'
  }
});
```

### Metrics

```typescript
// Enable Prometheus metrics
const server = new MCPServer({
  metrics: {
    enabled: true,
    port: 9090,
    path: '/metrics'
  }
});
```

### Health Checks

```bash
# Check server health
curl http://localhost:3100/health

# Check detailed status
curl http://localhost:3100/status
```

## Best Practices

1. **Use appropriate tools** - Match tool to task requirements
2. **Handle errors gracefully** - Always check for error responses
3. **Batch operations** - Use batch tools for multiple operations
4. **Monitor performance** - Track tool execution times
5. **Secure sensitive data** - Use authentication for write operations
6. **Document custom tools** - Provide clear descriptions and examples

## Troubleshooting

### Common Issues

**Server not starting**
- Check port availability
- Verify configuration file syntax
- Check database path permissions

**Tools returning errors**
- Verify parameter types match schema
- Check required parameters are provided
- Review error details for specific issues

**Claude not finding tools**
- Verify MCP server is registered with Claude
- Check server is running and accessible
- Restart Claude Code if needed

### Debug Mode

```bash
# Start server in debug mode
DEBUG=kg:mcp* npx kg-mcp start

# Verbose output
npx kg-mcp start --verbose
```

## Related Guides

- [Knowledge Graph Guide](./knowledge-graph.md) - Graph concepts and operations
- [Agents Guide](./agents.md) - Working with agents
- [GraphQL API Guide](./graphql-api.md) - Alternative API access
