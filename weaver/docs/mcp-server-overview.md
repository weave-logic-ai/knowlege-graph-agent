# Weaver MCP Server - Overview

**Version**: 0.1.0
**Status**: Production Ready
**Protocol**: Model Context Protocol (MCP) v1.0

---

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Tool Categories](#tool-categories)
4. [Integration Points](#integration-points)
5. [Performance Characteristics](#performance-characteristics)
6. [Tool Catalog](#tool-catalog)

---

## Introduction

The Weaver MCP Server is a production-ready implementation of the Model Context Protocol (MCP) that exposes Weave-NN's local-first knowledge graph capabilities to AI agents like Claude Desktop. It acts as the neural network junction point where AI systems can query, analyze, and interact with your Obsidian vault through a standardized protocol.

### Key Features

- **Fast Queries**: Sub-10ms cache queries via SQLite shadow cache
- **Durable Workflows**: Orchestrate multi-step operations with automatic retries
- **Type-Safe**: Full TypeScript implementation with comprehensive type definitions
- **Production Ready**: Error handling, logging, and graceful shutdown
- **Extensible**: Plugin-based architecture for custom tools

### Use Cases

- **AI-Powered Knowledge Navigation**: Let Claude explore your vault intelligently
- **Automated Workflows**: Trigger complex operations from natural language
- **Real-Time Monitoring**: Track workflow executions and system health
- **Content Analysis**: Extract patterns, links, and metadata from markdown

---

## Architecture

### Component Diagram

```
┌───────────────────────────────────────────────────────────┐
│                    Claude Desktop                         │
│                  (MCP Client)                             │
└─────────────────┬─────────────────────────────────────────┘
                  │ stdio
                  │ (JSON-RPC over stdio)
┌─────────────────▼─────────────────────────────────────────┐
│              Weaver MCP Server                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Server Layer                                       │  │
│  │  - StdioServerTransport                            │  │
│  │  - Request routing (ListTools, CallTool)           │  │
│  │  - Error handling & logging                        │  │
│  └─────────────────┬───────────────────────────────────┘  │
│                    │                                       │
│  ┌─────────────────▼───────────────────────────────────┐  │
│  │  Tool Registry                                      │  │
│  │  - Tool definitions (metadata, schemas)            │  │
│  │  - Handler mapping (name → function)               │  │
│  │  - Validation & initialization                     │  │
│  └─────────────────┬───────────────────────────────────┘  │
│                    │                                       │
│  ┌─────────────────▼───────────────────────────────────┐  │
│  │  Request Handlers                                   │  │
│  │  - Parameter validation                            │  │
│  │  - Tool execution                                  │  │
│  │  - Result formatting                               │  │
│  └─────┬─────────────────┬─────────────────────────────┘  │
│        │                 │                                 │
│  ┌─────▼──────┐    ┌────▼─────────┐                      │
│  │  Shadow    │    │  Workflow    │                      │
│  │  Cache     │    │  Engine      │                      │
│  │  Tools     │    │  Tools       │                      │
│  └─────┬──────┘    └────┬─────────┘                      │
└────────┼────────────────┼──────────────────────────────────┘
         │                │
         │                │
┌────────▼────────┐  ┌───▼──────────────────┐
│  Shadow Cache   │  │  Workflow Engine     │
│  (SQLite DB)    │  │  (Durable Workflows) │
└────────┬────────┘  └───┬──────────────────┘
         │               │
         │               │
┌────────▼───────────────▼──────────────┐
│         Obsidian Vault                │
│         (Markdown Files)              │
└───────────────────────────────────────┘
```

### Core Components

#### 1. WeaverMCPServer (src/mcp-server/index.ts)

Main server class that:
- Initializes MCP SDK server with stdio transport
- Registers request handlers for ListTools and CallTool
- Manages server lifecycle (startup, shutdown)
- Tracks health and metrics (uptime, request count)

**Key Methods**:
- `run()`: Start server and connect stdio transport
- `shutdown()`: Graceful shutdown with cleanup
- `getHealth()`: Return health status
- `isServerRunning()`: Check if server is active

#### 2. Tool Registry (src/mcp-server/tools/registry.ts)

Central registry that:
- Organizes tools by category (shadow-cache, workflow, system)
- Validates tool definitions against MCP schema
- Maps tool names to handler functions
- Provides lookup and statistics functions

**Key Functions**:
- `initializeTools(shadowCache, vaultPath, workflowEngine)`: Register all tools
- `getToolDefinitions()`: Get all tool definitions for ListTools
- `getToolHandler(name)`: Get handler function by tool name
- `getToolsByCategory(name)`: Filter tools by category

#### 3. Request Handlers (src/mcp-server/handlers/)

Handler layer that:
- Routes CallTool requests to appropriate handler
- Validates input parameters against schema
- Executes tool logic with error handling
- Formats results in MCP protocol format

**Main Handler**: `handleToolCall(request)` in tool-handler.ts

#### 4. Tool Implementations

Individual tool files that export:
- Tool definition (name, description, inputSchema)
- Handler factory function (creates handler with dependencies)
- TypeScript types for parameters and results

**Pattern**:
```typescript
export const myTool: Tool = {
  name: 'my_tool',
  description: 'Tool description',
  inputSchema: { /* JSON Schema */ }
};

export function createMyToolHandler(deps): ToolHandler {
  return async (params) => {
    // Tool implementation
    return { success: true, data: result };
  };
}
```

---

## Tool Categories

### 1. Shadow Cache Tools

Query the SQLite shadow cache for fast metadata access without reading files.

**Tools**:
- `query_files`: Query files with filters and pagination
- `get_file`: Get file metadata by path
- `get_file_content`: Read full file content from disk
- `search_tags`: Find files by tag
- `search_links`: Find files by wikilink
- `get_stats`: Get vault statistics

**Performance**: < 10ms typical query time (SQLite cache hit)

**Use Cases**:
- Navigate vault structure
- Find related notes
- Filter by metadata (type, status, tags)
- Analyze link patterns

### 2. Workflow Tools

Trigger and monitor durable workflow executions.

**Tools**:
- `trigger_workflow`: Manually trigger a registered workflow
- `list_workflows`: List all available workflows
- `get_workflow_status`: Check execution status
- `get_workflow_history`: Get historical executions

**Performance**: < 200ms typical tool execution time

**Use Cases**:
- Trigger batch operations
- Monitor long-running processes
- Schedule automated tasks
- Track execution history

### 3. System Tools

Health checks and diagnostics.

**Tools**:
- `health_check`: Get server health status

**Performance**: < 5ms response time

**Use Cases**:
- Monitor server status
- Debug connection issues
- Verify component availability

---

## Integration Points

### 1. Shadow Cache Integration

The MCP server reads directly from the SQLite shadow cache located at:
```
/data/shadow-cache.db
```

**Schema**:
- `files` table: File metadata (path, type, status, timestamps)
- `tags` table: Tag index for fast lookups
- `links` table: Wikilink relationships for graph queries

**Update Mechanism**: File watcher monitors vault and updates cache in real-time.

### 2. Workflow Engine Integration

The MCP server delegates workflow operations to the workflow engine:

**Engine Location**: `src/workflow-engine/`

**Communication**:
- `workflowEngine.triggerManual(workflowId, input)`: Trigger workflow
- `workflowEngine.getRegistry().getWorkflow(id)`: Get workflow metadata
- `workflowEngine.getRegistry().getExecutionsByWorkflow(id)`: Get executions

**Available Workflows**:
1. `file-change-logger`: Log file changes
2. `markdown-analyzer`: Analyze markdown content
3. `concept-tracker`: Track concept evolution
4. `file-deletion-monitor`: Monitor deletions
5. `proof-daily-digest`: Generate daily summaries
6. `proof-task-complete`: Handle task completions
7. `proof-spec-kit-review`: Review specifications

### 3. File System Integration

Direct file reads for content retrieval:

**Base Path**: Configured via `vaultPath` parameter (typically `/path/to/vault`)

**Read Operations**:
- `get_file_content`: Reads full markdown content from disk
- Path validation to prevent directory traversal
- UTF-8 encoding for markdown files

---

## Performance Characteristics

### Query Performance

| Operation Type          | Target Time | Typical Time | Notes                    |
|------------------------|-------------|--------------|--------------------------|
| Shadow cache query     | < 10ms      | 3-8ms        | SQLite indexed queries   |
| Workflow trigger       | < 200ms     | 50-150ms     | Includes validation      |
| File content read      | < 50ms      | 10-30ms      | Depends on file size     |
| Health check           | < 5ms       | 1-3ms        | In-memory status check   |

### Scalability

- **Concurrent Requests**: Handles multiple tool calls simultaneously
- **Cache Size**: Tested with 10,000+ files in shadow cache
- **Memory Usage**: ~50-100MB typical (including Node.js runtime)
- **Startup Time**: < 1 second (cache already initialized)

### Resource Usage

- **CPU**: Minimal (< 5% typical, spikes during queries)
- **Memory**: 50-100MB resident
- **Disk I/O**: Low (mostly cache reads)
- **Network**: None (stdio transport)

---

## Tool Catalog

### Shadow Cache Category

#### query_files
**Description**: Query files with optional filters and pagination
**Latency**: < 10ms
**Filters**: directory, type, status, tag
**Pagination**: limit (1-500), offset (0+)
**Returns**: Array of file metadata objects with frontmatter

#### get_file
**Description**: Get single file metadata by path
**Latency**: < 10ms
**Input**: path (relative to vault root)
**Returns**: File metadata object with parsed frontmatter

#### get_file_content
**Description**: Read full file content from disk
**Latency**: < 50ms
**Input**: path (relative to vault root)
**Returns**: Full markdown content as string

#### search_tags
**Description**: Find files containing specific tag
**Latency**: < 10ms
**Input**: tag (string)
**Returns**: Array of file paths with metadata

#### search_links
**Description**: Find files with wikilink connections
**Latency**: < 10ms
**Input**: source/target path
**Returns**: Array of linked file paths

#### get_stats
**Description**: Get vault statistics
**Latency**: < 10ms
**Returns**: Total files, types breakdown, tags count, links count

### Workflow Category

#### trigger_workflow
**Description**: Manually trigger a registered workflow
**Latency**: < 200ms
**Input**: workflowId, input (optional), async flag
**Returns**: Execution ID (async) or result (sync)

#### list_workflows
**Description**: List all registered workflows
**Latency**: < 10ms
**Returns**: Array of workflow definitions with metadata

#### get_workflow_status
**Description**: Check execution status of a workflow
**Latency**: < 10ms
**Input**: executionId
**Returns**: Status (pending, running, completed, failed), progress

#### get_workflow_history
**Description**: Get historical execution records
**Latency**: < 20ms
**Input**: workflowId, limit, offset
**Returns**: Array of execution records with timestamps

### System Category

#### health_check
**Description**: Get server health and component status
**Latency**: < 5ms
**Returns**: Status, uptime, request count, component health

---

## Error Handling

### Error Categories

1. **MethodNotFound** (Code -32601): Tool name not found in registry
2. **InvalidParams** (Code -32602): Parameter validation failed
3. **InternalError** (Code -32603): Tool execution error

### Error Response Format

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "metadata": {
    "executionTime": 123
  }
}
```

### Common Errors

- **Workflow not found**: Requested workflow ID doesn't exist
- **Workflow disabled**: Workflow exists but is not enabled
- **File not found**: Path doesn't exist in vault
- **Invalid path**: Path contains invalid characters or traversal
- **Database error**: Shadow cache query failed

---

## Security Considerations

### Path Validation

All file paths are validated to:
- Prevent directory traversal (../)
- Ensure paths are within vault root
- Reject absolute paths starting with /

### Input Sanitization

- JSON schema validation for all parameters
- Type checking (string, number, boolean)
- Range validation (min/max for numbers)
- Enum validation for workflow IDs

### Access Control

- **Read-Only by Default**: Shadow cache tools only read data
- **Workflow Permissions**: Only registered workflows can be triggered
- **No Write Access**: MCP server cannot modify vault files directly

---

## Logging and Monitoring

### Log Levels

- **DEBUG**: Detailed execution traces (tool calls, parameters)
- **INFO**: Lifecycle events (startup, shutdown, triggers)
- **WARN**: Non-critical issues (missing optional params)
- **ERROR**: Failures (tool errors, exceptions)

### Log Output

Logs written to:
- **Console**: Structured JSON logs to stderr
- **File**: Optional file logging to `logs/weaver-mcp.log`

### Metrics Tracked

- Total requests handled
- Uptime in milliseconds
- Tool execution times
- Cache hit/miss ratios
- Error counts by type

---

## Next Steps

- **For Usage Guide**: See [mcp-usage-guide.md](./mcp-usage-guide.md)
- **For Tool Reference**: See [mcp-tools-reference.md](./mcp-tools-reference.md)
- **For Main README**: See [../README.md](../README.md)

---

**Last Updated**: 2025-10-24
**Maintained By**: Weave-NN Development Team
