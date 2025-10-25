# Weaver MCP Tools - Reference

Complete reference documentation for all MCP tools provided by the Weaver server.

---

## Table of Contents

1. [Shadow Cache Tools](#shadow-cache-tools)
2. [Workflow Tools](#workflow-tools)
3. [System Tools](#system-tools)
4. [Common Patterns](#common-patterns)
5. [Error Codes](#error-codes)

---

## Shadow Cache Tools

Tools for querying the SQLite shadow cache containing vault metadata.

---

### query_files

Query files from the shadow cache with optional filters and pagination.

#### Input Schema

```typescript
{
  directory?: string;    // Filter by directory path (e.g., "technical", "concepts")
  type?: string;         // Filter by file type from frontmatter
  status?: string;       // Filter by status from frontmatter
  tag?: string;          // Filter by tag
  limit?: number;        // Max results (1-500, default: 50)
  offset?: number;       // Skip results for pagination (default: 0)
}
```

#### Parameters

| Parameter   | Type   | Required | Default | Description                                    |
|-------------|--------|----------|---------|------------------------------------------------|
| directory   | string | No       | -       | Directory path relative to vault root          |
| type        | string | No       | -       | File type from frontmatter (concept, feature)  |
| status      | string | No       | -       | Status from frontmatter (active, draft)        |
| tag         | string | No       | -       | Tag to filter by                               |
| limit       | number | No       | 50      | Maximum results to return (1-500)              |
| offset      | number | No       | 0       | Number of results to skip                      |

#### Response

```typescript
{
  success: true,
  data: {
    files: [
      {
        path: string,              // Relative path from vault root
        type: string | null,       // File type from frontmatter
        status: string | null,     // Status from frontmatter
        frontmatter: object | null,// Parsed frontmatter YAML
        tags: string[],            // Array of tags
        created: number,           // Unix timestamp
        modified: number,          // Unix timestamp
        size: number               // File size in bytes
      }
    ],
    total: number,                 // Total matching files
    limit: number,                 // Applied limit
    offset: number,                // Applied offset
    hasMore: boolean               // True if more results available
  },
  metadata: {
    executionTime: number,         // Milliseconds
    cacheHit: true
  }
}
```

#### Examples

**Query all files**:
```json
{
  "name": "query_files",
  "arguments": {}
}
```

**Query files in a directory**:
```json
{
  "name": "query_files",
  "arguments": {
    "directory": "technical"
  }
}
```

**Query by type and status**:
```json
{
  "name": "query_files",
  "arguments": {
    "type": "concept",
    "status": "active",
    "limit": 20
  }
}
```

**Query with pagination**:
```json
{
  "name": "query_files",
  "arguments": {
    "tag": "neural",
    "limit": 50,
    "offset": 50
  }
}
```

#### Error Cases

- **No matching files**: Returns empty array with total = 0
- **Invalid limit**: Clamped to range 1-500
- **Invalid offset**: Clamped to minimum 0

---

### get_file

Get single file metadata by path from shadow cache.

#### Input Schema

```typescript
{
  path: string;          // Relative path from vault root
}
```

#### Parameters

| Parameter | Type   | Required | Description                           |
|-----------|--------|----------|---------------------------------------|
| path      | string | Yes      | File path relative to vault root      |

#### Response

```typescript
{
  success: true,
  data: {
    path: string,              // Relative path
    type: string | null,       // File type from frontmatter
    status: string | null,     // Status from frontmatter
    frontmatter: object | null,// Parsed frontmatter
    tags: string[],            // Array of tags
    created: number,           // Unix timestamp
    modified: number,          // Unix timestamp
    size: number,              // File size in bytes
    links: {
      outgoing: string[],      // Wikilinks to other files
      incoming: string[]       // Backlinks from other files
    }
  },
  metadata: {
    executionTime: number,
    cacheHit: true
  }
}
```

#### Examples

**Get file metadata**:
```json
{
  "name": "get_file",
  "arguments": {
    "path": "concepts/graph-topology.md"
  }
}
```

#### Error Cases

- **File not found**: Returns `success: false` with error message
- **Invalid path**: Returns validation error

---

### get_file_content

Read full file content from disk (not cached).

#### Input Schema

```typescript
{
  path: string;          // Relative path from vault root
}
```

#### Parameters

| Parameter | Type   | Required | Description                           |
|-----------|--------|----------|---------------------------------------|
| path      | string | Yes      | File path relative to vault root      |

#### Response

```typescript
{
  success: true,
  data: {
    path: string,              // Relative path
    content: string,           // Full markdown content
    size: number,              // Content size in bytes
    encoding: "utf-8"
  },
  metadata: {
    executionTime: number,
    cacheHit: false
  }
}
```

#### Examples

**Read file content**:
```json
{
  "name": "get_file_content",
  "arguments": {
    "path": "technical/fastapi.md"
  }
}
```

#### Error Cases

- **File not found**: Returns `success: false` with error
- **Path traversal**: Rejected with validation error
- **Encoding error**: Returns error if file is not valid UTF-8

---

### search_tags

Find all files containing a specific tag.

#### Input Schema

```typescript
{
  tag: string;           // Tag to search for
  limit?: number;        // Max results (1-500, default: 100)
}
```

#### Parameters

| Parameter | Type   | Required | Default | Description                    |
|-----------|--------|----------|---------|--------------------------------|
| tag       | string | Yes      | -       | Tag to search for              |
| limit     | number | No       | 100     | Maximum results (1-500)        |

#### Response

```typescript
{
  success: true,
  data: {
    tag: string,               // Searched tag
    files: [
      {
        path: string,          // File path
        type: string | null,   // File type
        status: string | null, // File status
        frontmatter: object,   // Parsed frontmatter
        modified: number       // Last modified timestamp
      }
    ],
    count: number              // Number of files found
  },
  metadata: {
    executionTime: number,
    cacheHit: true
  }
}
```

#### Examples

**Search for tag**:
```json
{
  "name": "search_tags",
  "arguments": {
    "tag": "neural"
  }
}
```

#### Error Cases

- **No files found**: Returns empty array with count = 0
- **Invalid tag**: Returns validation error

---

### search_links

Find files with wikilink connections to/from a given file.

#### Input Schema

```typescript
{
  path: string;          // File path to search links for
  direction?: "outgoing" | "incoming" | "both";  // Link direction
  limit?: number;        // Max results (1-500, default: 100)
}
```

#### Parameters

| Parameter | Type   | Required | Default | Description                              |
|-----------|--------|----------|---------|------------------------------------------|
| path      | string | Yes      | -       | File path to search links for            |
| direction | string | No       | "both"  | Link direction (outgoing/incoming/both)  |
| limit     | number | No       | 100     | Maximum results (1-500)                  |

#### Response

```typescript
{
  success: true,
  data: {
    path: string,              // Source file path
    outgoing: string[],        // Files linked from source
    incoming: string[],        // Files linking to source
    count: {
      outgoing: number,
      incoming: number,
      total: number
    }
  },
  metadata: {
    executionTime: number,
    cacheHit: true
  }
}
```

#### Examples

**Get all links**:
```json
{
  "name": "search_links",
  "arguments": {
    "path": "concepts/graph-topology.md"
  }
}
```

**Get only backlinks**:
```json
{
  "name": "search_links",
  "arguments": {
    "path": "technical/fastapi.md",
    "direction": "incoming"
  }
}
```

#### Error Cases

- **File not found**: Returns error
- **No links found**: Returns empty arrays with count = 0

---

### get_stats

Get vault statistics and metadata counts.

#### Input Schema

```typescript
{} // No parameters
```

#### Response

```typescript
{
  success: true,
  data: {
    totalFiles: number,        // Total markdown files
    totalTags: number,         // Unique tags count
    totalLinks: number,        // Total wikilinks count
    filesByType: {
      [type: string]: number   // Files grouped by type
    },
    filesByStatus: {
      [status: string]: number // Files grouped by status
    },
    topTags: [
      {
        tag: string,
        count: number
      }
    ],
    vaultSize: number,         // Total size in bytes
    lastUpdated: number        // Cache last update timestamp
  },
  metadata: {
    executionTime: number,
    cacheHit: true
  }
}
```

#### Examples

**Get vault stats**:
```json
{
  "name": "get_stats",
  "arguments": {}
}
```

#### Error Cases

- **Cache unavailable**: Returns error with partial stats

---

## Workflow Tools

Tools for triggering and monitoring workflow executions.

---

### trigger_workflow

Manually trigger a registered workflow with optional input data.

#### Input Schema

```typescript
{
  workflowId: string;           // Workflow ID to trigger
  input?: object;               // Optional input data
  async?: boolean;              // Execute asynchronously (default: false)
}
```

#### Parameters

| Parameter  | Type    | Required | Default | Description                                |
|------------|---------|----------|---------|--------------------------------------------|
| workflowId | string  | Yes      | -       | ID of workflow to trigger                  |
| input      | object  | No       | {}      | Input data to pass to workflow             |
| async      | boolean | No       | false   | Execute asynchronously and return ID       |

#### Available Workflows

| Workflow ID              | Description                          |
|--------------------------|--------------------------------------|
| file-change-logger       | Log file changes to database         |
| markdown-analyzer        | Analyze markdown content             |
| concept-tracker          | Track concept evolution              |
| file-deletion-monitor    | Monitor file deletions               |
| proof-daily-digest       | Generate daily summaries             |
| proof-task-complete      | Handle task completion events        |
| proof-spec-kit-review    | Review specification documents       |

#### Response (Sync Mode)

```typescript
{
  success: true,
  data: {
    executionId: string,       // Unique execution ID
    workflowId: string,        // Workflow ID
    workflowName: string,      // Workflow display name
    mode: "sync",
    status: "completed" | "failed",
    duration: number,          // Execution time in ms
    message: string
  },
  metadata: {
    executionTime: number
  }
}
```

#### Response (Async Mode)

```typescript
{
  success: true,
  data: {
    executionId: string,       // Unique execution ID
    workflowId: string,        // Workflow ID
    workflowName: string,      // Workflow display name
    mode: "async",
    message: "Workflow execution started"
  },
  metadata: {
    executionTime: number
  }
}
```

#### Examples

**Trigger workflow synchronously**:
```json
{
  "name": "trigger_workflow",
  "arguments": {
    "workflowId": "markdown-analyzer",
    "input": {
      "path": "concepts/graph-topology.md"
    }
  }
}
```

**Trigger workflow asynchronously**:
```json
{
  "name": "trigger_workflow",
  "arguments": {
    "workflowId": "proof-daily-digest",
    "async": true
  }
}
```

#### Error Cases

- **Workflow not found**: Returns error with workflow ID
- **Workflow disabled**: Returns error indicating workflow is disabled
- **Invalid input**: Returns validation error

---

### list_workflows

List all registered workflows with metadata.

#### Input Schema

```typescript
{
  enabled?: boolean;     // Filter by enabled status (optional)
}
```

#### Parameters

| Parameter | Type    | Required | Default | Description                    |
|-----------|---------|----------|---------|--------------------------------|
| enabled   | boolean | No       | -       | Filter by enabled status       |

#### Response

```typescript
{
  success: true,
  data: {
    workflows: [
      {
        id: string,            // Workflow ID
        name: string,          // Display name
        description: string,   // Workflow description
        enabled: boolean,      // Is workflow enabled
        triggers: string[],    // Trigger types (manual, file-change)
        lastExecuted: number | null,  // Last execution timestamp
        executionCount: number // Total executions
      }
    ],
    count: number            // Total workflows
  },
  metadata: {
    executionTime: number
  }
}
```

#### Examples

**List all workflows**:
```json
{
  "name": "list_workflows",
  "arguments": {}
}
```

**List only enabled workflows**:
```json
{
  "name": "list_workflows",
  "arguments": {
    "enabled": true
  }
}
```

---

### get_workflow_status

Check execution status of a specific workflow execution.

#### Input Schema

```typescript
{
  executionId: string;   // Execution ID from trigger_workflow
}
```

#### Parameters

| Parameter   | Type   | Required | Description                       |
|-------------|--------|----------|-----------------------------------|
| executionId | string | Yes      | Execution ID to check status for  |

#### Response

```typescript
{
  success: true,
  data: {
    executionId: string,       // Execution ID
    workflowId: string,        // Workflow ID
    status: "pending" | "running" | "completed" | "failed",
    progress: number,          // Progress percentage (0-100)
    startTime: number,         // Start timestamp
    endTime: number | null,    // End timestamp (null if running)
    duration: number | null,   // Duration in ms (null if running)
    result: any | null,        // Execution result (null if not complete)
    error: string | null       // Error message (null if no error)
  },
  metadata: {
    executionTime: number
  }
}
```

#### Examples

**Check execution status**:
```json
{
  "name": "get_workflow_status",
  "arguments": {
    "executionId": "wf_exec_20251024_123456"
  }
}
```

#### Error Cases

- **Execution not found**: Returns error with execution ID
- **Invalid execution ID**: Returns validation error

---

### get_workflow_history

Get historical execution records for a workflow.

#### Input Schema

```typescript
{
  workflowId?: string;   // Filter by workflow ID (optional)
  limit?: number;        // Max results (1-100, default: 20)
  offset?: number;       // Skip results for pagination (default: 0)
}
```

#### Parameters

| Parameter  | Type   | Required | Default | Description                         |
|------------|--------|----------|---------|-------------------------------------|
| workflowId | string | No       | -       | Filter by specific workflow ID      |
| limit      | number | No       | 20      | Maximum results (1-100)             |
| offset     | number | No       | 0       | Number of results to skip           |

#### Response

```typescript
{
  success: true,
  data: {
    executions: [
      {
        executionId: string,
        workflowId: string,
        workflowName: string,
        status: string,
        startTime: number,
        endTime: number | null,
        duration: number | null,
        error: string | null
      }
    ],
    total: number,             // Total executions
    limit: number,
    offset: number,
    hasMore: boolean
  },
  metadata: {
    executionTime: number
  }
}
```

#### Examples

**Get recent executions**:
```json
{
  "name": "get_workflow_history",
  "arguments": {
    "limit": 10
  }
}
```

**Get history for specific workflow**:
```json
{
  "name": "get_workflow_history",
  "arguments": {
    "workflowId": "markdown-analyzer",
    "limit": 50
  }
}
```

---

## System Tools

Tools for health checks and system diagnostics.

---

### health_check

Get server health status and component availability.

#### Input Schema

```typescript
{} // No parameters
```

#### Response

```typescript
{
  success: true,
  data: {
    status: "healthy" | "degraded" | "unhealthy",
    components: {
      shadowCache: boolean,      // Is shadow cache available
      workflowEngine: boolean,   // Is workflow engine available
      fileSystem: boolean        // Is file system accessible
    },
    uptime: number,              // Server uptime in ms
    requestCount: number,        // Total requests handled
    version: string              // Server version
  },
  metadata: {
    executionTime: number
  }
}
```

#### Examples

**Check health**:
```json
{
  "name": "health_check",
  "arguments": {}
}
```

---

## Common Patterns

### Pagination

Most query tools support pagination using `limit` and `offset`:

```typescript
// First page (items 0-49)
{ limit: 50, offset: 0 }

// Second page (items 50-99)
{ limit: 50, offset: 50 }

// Check if more results available
response.data.hasMore === true
```

### Error Handling

All tools return consistent error format:

```typescript
{
  success: false,
  error: "Human-readable error message",
  metadata: {
    executionTime: number
  }
}
```

### Filtering

Shadow cache tools support multiple filter combinations:

```typescript
// Single filter
{ directory: "technical" }

// Multiple filters (AND logic)
{ directory: "technical", type: "concept", status: "active" }

// Tag filter (can combine with others)
{ tag: "neural", type: "concept" }
```

### Async vs Sync Workflows

**Sync Mode** (default):
- Waits for workflow completion
- Returns result immediately
- Use for quick operations (<30s)

**Async Mode** (`async: true`):
- Returns execution ID immediately
- Workflow runs in background
- Use for long operations (>30s)
- Check status with `get_workflow_status`

---

## Error Codes

### MCP Protocol Errors

| Code   | Name            | Description                       |
|--------|-----------------|-----------------------------------|
| -32601 | MethodNotFound  | Tool name not found               |
| -32602 | InvalidParams   | Parameter validation failed       |
| -32603 | InternalError   | Tool execution error              |

### Tool-Specific Errors

| Error Message                | Cause                              |
|------------------------------|------------------------------------|
| "File not found"             | Path doesn't exist in vault        |
| "Invalid path"               | Path contains invalid characters   |
| "Workflow not found"         | Workflow ID doesn't exist          |
| "Workflow disabled"          | Workflow exists but is disabled    |
| "Execution not found"        | Execution ID doesn't exist         |
| "Database error"             | Shadow cache query failed          |

---

## Best Practices

### 1. Use Pagination

Always paginate large result sets to avoid memory issues:

```typescript
// Good
{ directory: "concepts", limit: 50 }

// Bad (could return thousands of results)
{ directory: "concepts" }
```

### 2. Check hasMore Flag

Use `hasMore` to implement proper pagination:

```typescript
let offset = 0;
let hasMore = true;

while (hasMore) {
  const result = await query_files({ limit: 50, offset });
  // Process result.data.files
  hasMore = result.data.hasMore;
  offset += 50;
}
```

### 3. Handle Errors Gracefully

Always check `success` field before accessing `data`:

```typescript
if (result.success) {
  // Use result.data
} else {
  // Handle result.error
}
```

### 4. Use Async for Long Workflows

Trigger long-running workflows asynchronously:

```typescript
// Trigger async
const trigger = await trigger_workflow({
  workflowId: "proof-daily-digest",
  async: true
});

const executionId = trigger.data.executionId;

// Poll for status
let status = "running";
while (status === "running") {
  await sleep(1000);
  const result = await get_workflow_status({ executionId });
  status = result.data.status;
}
```

---

**Last Updated**: 2025-10-24
**Maintained By**: Weave-NN Development Team
