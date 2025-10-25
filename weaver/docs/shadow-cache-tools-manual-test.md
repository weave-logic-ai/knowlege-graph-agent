# Shadow Cache Tools Manual Testing

## Overview

This document provides manual testing instructions for the three shadow cache MCP tools implemented in Phase 5, Tasks 5-7.

## Prerequisites

1. Build the project:
```bash
cd /home/aepod/dev/weave-nn/weaver
npm run build
```

2. Ensure the shadow cache is populated:
```bash
# The shadow cache should be auto-populated when running the main service
npm run dev
```

## Tools Implemented

### 1. query_files

**Purpose**: Query files from shadow cache with filtering and pagination

**Schema**:
- `directory` (optional): Filter by directory path
- `type` (optional): Filter by file type from frontmatter
- `status` (optional): Filter by status from frontmatter
- `tag` (optional): Filter by tag
- `limit` (optional): Maximum results (default: 50, max: 500)
- `offset` (optional): Skip results for pagination (default: 0)

**Test Cases**:

```typescript
// Test 1: Query all files
{
  "name": "query_files",
  "arguments": {}
}

// Test 2: Filter by directory
{
  "name": "query_files",
  "arguments": {
    "directory": "concepts"
  }
}

// Test 3: Filter by type
{
  "name": "query_files",
  "arguments": {
    "type": "concept"
  }
}

// Test 4: Filter by status
{
  "name": "query_files",
  "arguments": {
    "status": "active"
  }
}

// Test 5: Filter by tag
{
  "name": "query_files",
  "arguments": {
    "tag": "graph"
  }
}

// Test 6: Pagination
{
  "name": "query_files",
  "arguments": {
    "limit": 10,
    "offset": 0
  }
}

// Test 7: Multiple filters
{
  "name": "query_files",
  "arguments": {
    "directory": "concepts",
    "status": "active",
    "limit": 20
  }
}
```

### 2. get_file

**Purpose**: Get metadata for a specific file with optional content

**Schema**:
- `path` (required): Relative path to file in vault
- `includeContent` (optional): Include file content (default: false)

**Test Cases**:

```typescript
// Test 1: Get file metadata only
{
  "name": "get_file",
  "arguments": {
    "path": "concepts/graph-topology-analysis.md"
  }
}

// Test 2: Get file with content
{
  "name": "get_file",
  "arguments": {
    "path": "concepts/graph-topology-analysis.md",
    "includeContent": true
  }
}

// Test 3: Get technical file
{
  "name": "get_file",
  "arguments": {
    "path": "technical/mcp-protocol.md"
  }
}

// Test 4: Non-existent file (should error)
{
  "name": "get_file",
  "arguments": {
    "path": "nonexistent.md"
  }
}
```

### 3. get_file_content

**Purpose**: Read file content directly from filesystem

**Schema**:
- `path` (required): Relative path to file in vault
- `encoding` (optional): 'utf8', 'base64', or 'auto' (default: auto)

**Test Cases**:

```typescript
// Test 1: Get text file content
{
  "name": "get_file_content",
  "arguments": {
    "path": "concepts/graph-topology-analysis.md"
  }
}

// Test 2: Explicit UTF-8 encoding
{
  "name": "get_file_content",
  "arguments": {
    "path": "concepts/graph-topology-analysis.md",
    "encoding": "utf8"
  }
}

// Test 3: Base64 encoding
{
  "name": "get_file_content",
  "arguments": {
    "path": "concepts/graph-topology-analysis.md",
    "encoding": "base64"
  }
}

// Test 4: Non-existent file (should error)
{
  "name": "get_file_content",
  "arguments": {
    "path": "nonexistent.md"
  }
}
```

## Expected Response Format

### query_files Response

```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": 1,
        "path": "concepts/graph-topology.md",
        "filename": "graph-topology.md",
        "directory": "concepts",
        "size": 1234,
        "type": "concept",
        "status": "active",
        "title": "Graph Topology Analysis",
        "frontmatter": { /* parsed JSON */ },
        "created_at": "2025-01-01T00:00:00.000Z",
        "modified_at": "2025-01-02T00:00:00.000Z",
        "cache_updated_at": "2025-01-02T01:00:00.000Z"
      }
    ],
    "total": 50,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  },
  "metadata": {
    "executionTime": 12,
    "cacheHit": true
  }
}
```

### get_file Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "path": "concepts/graph-topology.md",
    "filename": "graph-topology.md",
    "directory": "concepts",
    "size": 1234,
    "type": "concept",
    "status": "active",
    "title": "Graph Topology Analysis",
    "frontmatter": { /* parsed JSON */ },
    "tags": ["graph", "topology", "analysis"],
    "outgoingLinks": [
      {
        "targetPath": "technical/graph-db.md",
        "linkType": "wikilink",
        "linkText": "Graph Database"
      }
    ],
    "incomingLinks": [
      {
        "sourceFileId": 42,
        "linkType": "wikilink",
        "linkText": null
      }
    ],
    "content": "# Graph Topology...", // if includeContent: true
    "created_at": "2025-01-01T00:00:00.000Z",
    "modified_at": "2025-01-02T00:00:00.000Z"
  },
  "metadata": {
    "executionTime": 8,
    "cacheHit": true
  }
}
```

### get_file_content Response

```json
{
  "success": true,
  "data": {
    "path": "concepts/graph-topology.md",
    "content": "# Graph Topology Analysis\n\nContent here...",
    "encoding": "utf8",
    "isBinary": false,
    "size": 1234
  },
  "metadata": {
    "executionTime": 5
  }
}
```

## Testing via Claude Desktop

1. Add the MCP server to Claude Desktop config:

```json
{
  "mcpServers": {
    "weaver": {
      "command": "node",
      "args": ["/home/aepod/dev/weave-nn/weaver/dist/mcp-server/bin.js"],
      "env": {
        "VAULT_PATH": "/home/aepod/dev/weave-nn/weave-nn",
        "SHADOW_CACHE_DB_PATH": "/home/aepod/dev/weave-nn/weaver/data/shadow-cache.db"
      }
    }
  }
}
```

2. Restart Claude Desktop

3. Verify tools are loaded:
```
Ask: "What MCP tools are available?"
```

4. Test each tool with sample queries

## Verification Checklist

- [ ] All three tools compile without TypeScript errors
- [ ] Tools are registered in the tool registry
- [ ] Tools appear in Claude Desktop MCP tools list
- [ ] query_files returns filtered results correctly
- [ ] query_files pagination works (limit/offset)
- [ ] get_file returns metadata with tags and links
- [ ] get_file includeContent option works
- [ ] get_file_content reads files correctly
- [ ] get_file_content handles binary files (base64)
- [ ] Error handling works for invalid paths
- [ ] Execution time is tracked in metadata

## Performance Expectations

- **query_files**: < 50ms for most queries (cache hit)
- **get_file**: < 20ms (metadata from cache)
- **get_file_content**: < 10ms for small files (< 100KB)

## Common Issues

1. **Configuration errors**: Ensure VAULT_PATH and SHADOW_CACHE_DB_PATH env vars are set
2. **Empty results**: Run a full vault sync first (`npm run dev`)
3. **File not found**: Verify the path is relative to vault root
4. **Binary file issues**: Use `encoding: "base64"` for non-text files

## Implementation Files

- `/home/aepod/dev/weave-nn/weaver/src/mcp-server/tools/shadow-cache/query-files.ts`
- `/home/aepod/dev/weave-nn/weaver/src/mcp-server/tools/shadow-cache/get-file.ts`
- `/home/aepod/dev/weave-nn/weaver/src/mcp-server/tools/shadow-cache/get-file-content.ts`
- `/home/aepod/dev/weave-nn/weaver/src/mcp-server/tools/shadow-cache/index.ts`
- `/home/aepod/dev/weave-nn/weaver/src/mcp-server/tools/registry.ts`
