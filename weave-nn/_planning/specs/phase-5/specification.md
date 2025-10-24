# MCP Integration & Workflow Enhancement - Specification

**Phase ID**: PHASE-5
**Status**: pending
**Duration**: 3-4 days

---

## Executive Summary

Phase 5 exposes the Phase 4B foundation (file watcher, shadow cache, workflow engine) via the Model Context Protocol (MCP), enabling AI agents like Claude Desktop and Claude Code to query vault metadata and trigger workflows. This phase implements 10 MCP tools (6 shadow cache + 4 workflow) with <10ms query performance.

**Key Value Proposition**: Transform the Weave-NN vault into an AI-queryable knowledge base without rebuilding existing components.

---

## 1. Functional Requirements

### 1.1 MCP Server Foundation

**REQ-1.1.1: MCP Server Implementation**
- Implement `@modelcontextprotocol/sdk` server with stdio transport
- Support Claude Desktop and Claude Code as primary clients
- Handle server lifecycle: startup, graceful shutdown, health monitoring
- Process `ListTools` requests returning all 10 tool definitions
- Process `CallTool` requests routing to appropriate handlers
- **Acceptance**: Server starts via `bun run start:mcp`, connects to Claude Desktop

**REQ-1.1.2: Error Handling Strategy**
- All errors caught and returned as MCP error responses (never crash)
- Validation errors include suggestions for correction
- System errors logged with full context, safe messages to user
- Timeout handling for operations >5 seconds
- **Acceptance**: Integration test verifies error handling for all failure modes

**REQ-1.1.3: Logging Integration**
- Use existing pino logger with MCP-specific context
- Log levels: DEBUG for tool calls, INFO for lifecycle, ERROR for failures
- Include request IDs for tracing
- Performance metrics logged for each tool call
- **Acceptance**: Logs parseable, contain request IDs, performance data

### 1.2 Shadow Cache MCP Tools (6 Tools)

**Phase 4B Baseline**: Shadow cache has 229 files, 306 tags, 2,724 links indexed.

**REQ-1.2.1: `query_files` Tool**
```typescript
interface QueryFilesInput {
  directory?: string;      // e.g., "concepts/" (prefix match)
  type?: string;          // frontmatter type field
  status?: string;        // frontmatter status field
  tag?: string;           // exact tag match
  limit?: number;         // max results (default: 50, max: 500)
}

interface QueryFilesOutput {
  files: Array<{
    path: string;
    filename: string;
    directory: string;
    type: string | null;
    status: string | null;
    title: string | null;
    modified_at: string;
    tags: string[];
  }>;
  total: number;
  truncated: boolean;
}
```
- **Behavior**: Search shadow cache by directory, type, status, or tag
- **Performance**: <10ms for any query (p95)
- **Error Cases**: Invalid parameters → validation error, empty results → empty array
- **Acceptance**: Integration test with 50+ files, performance benchmark

**REQ-1.2.2: `get_file` Tool**
```typescript
interface GetFileInput {
  path: string;  // relative vault path
}

interface GetFileOutput {
  path: string;
  filename: string;
  directory: string;
  size: number;
  created_at: string;
  modified_at: string;
  content_hash: string;
  frontmatter: Record<string, unknown> | null;
  type: string | null;
  status: string | null;
  title: string | null;
  tags: string[];
  links: Array<{
    target_path: string;
    link_type: 'wikilink' | 'markdown';
    link_text: string | null;
  }>;
}
```
- **Behavior**: Retrieve complete metadata for specific file
- **Performance**: <5ms (single row query)
- **Error Cases**: File not found → descriptive error with suggestions
- **Acceptance**: Test with existing file, non-existent file, various frontmatter

**REQ-1.2.3: `get_file_content` Tool**
```typescript
interface GetFileContentInput {
  path: string;  // relative vault path
}

interface GetFileContentOutput {
  path: string;
  content: string;
  size: number;
  modified_at: string;
}
```
- **Behavior**: Read raw file content from vault filesystem
- **Performance**: <50ms for files <1MB
- **Error Cases**: File not found, read error, file too large (>10MB) → errors
- **Acceptance**: Test with markdown file, handles UTF-8, respects file size limits

**REQ-1.2.4: `search_tags` Tool**
```typescript
interface SearchTagsInput {
  tag: string;      // exact match or prefix (if ends with *)
  limit?: number;   // default: 50, max: 500
}

interface SearchTagsOutput {
  tag: string;
  files: Array<{
    path: string;
    title: string | null;
    type: string | null;
    modified_at: string;
  }>;
  total: number;
  truncated: boolean;
}
```
- **Behavior**: Find all files with specific tag, support prefix search
- **Performance**: <10ms via indexed query
- **Error Cases**: Invalid tag format → validation error
- **Acceptance**: Test with common tag (e.g., "concept"), prefix search

**REQ-1.2.5: `search_links` Tool**
```typescript
interface SearchLinksInput {
  path: string;           // source or target path
  direction?: 'outgoing' | 'incoming' | 'both';  // default: 'both'
  limit?: number;         // default: 50
}

interface SearchLinksOutput {
  path: string;
  outgoing: Array<{
    target_path: string;
    link_type: 'wikilink' | 'markdown';
    link_text: string | null;
  }>;
  incoming: Array<{
    source_path: string;
    link_type: 'wikilink' | 'markdown';
    link_text: string | null;
  }>;
  outgoing_count: number;
  incoming_count: number;
}
```
- **Behavior**: Query wikilink relationships bidirectionally
- **Performance**: <15ms with joins
- **Error Cases**: File not found → return empty arrays
- **Acceptance**: Test with highly-connected file (e.g., concept with many links)

**REQ-1.2.6: `get_stats` Tool**
```typescript
interface GetStatsOutput {
  files: {
    total: number;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
    by_directory: Record<string, number>;
  };
  tags: {
    total: number;
    top_tags: Array<{ tag: string; count: number }>;
  };
  links: {
    total: number;
    wikilinks: number;
    markdown_links: number;
  };
  cache_updated_at: string;
}
```
- **Behavior**: Return vault-wide statistics from shadow cache
- **Performance**: <20ms (aggregation queries)
- **Error Cases**: None (always returns stats, even if zero)
- **Acceptance**: Verify counts match shadow cache reality (229 files, 306 tags)

### 1.3 Workflow MCP Tools (4 Tools)

**Phase 4B Baseline**: Workflow engine with 7 registered workflows (task-completion, phase-completion, general-task-tracker, etc.)

**REQ-1.3.1: `trigger_workflow` Tool**
```typescript
interface TriggerWorkflowInput {
  workflowId: string;               // e.g., "task-completion"
  input?: Record<string, unknown>;  // optional metadata for workflow
}

interface TriggerWorkflowOutput {
  workflowId: string;
  executionId: string;  // unique execution ID
  status: 'started' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
}
```
- **Behavior**: Manually trigger registered workflow by ID
- **Integration**: Uses `WorkflowEngine.triggerManual()`
- **Performance**: <200ms for workflow execution
- **Error Cases**: Invalid workflow ID, workflow disabled, execution error
- **Acceptance**: Test triggering "task-completion" workflow manually

**REQ-1.3.2: `get_workflow_status` Tool**
```typescript
interface GetWorkflowStatusInput {
  executionId: string;  // from trigger_workflow response
}

interface GetWorkflowStatusOutput {
  executionId: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  duration?: number;  // milliseconds
  result?: unknown;
  error?: string;
}
```
- **Behavior**: Check execution status for running/completed workflow
- **Performance**: <10ms (single query)
- **Error Cases**: Execution not found → error
- **Acceptance**: Test status polling for long-running workflow

**REQ-1.3.3: `list_workflows` Tool**
```typescript
interface ListWorkflowsOutput {
  workflows: Array<{
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    triggers: string[];  // e.g., ["file:add", "file:change"]
    fileFilter?: string;  // e.g., "_log/tasks/**/*.md"
  }>;
  total: number;
}
```
- **Behavior**: Show all registered workflows with descriptions
- **Integration**: Uses `WorkflowRegistry.getAllWorkflows()`
- **Performance**: <5ms (in-memory)
- **Error Cases**: None (always returns list, even if empty)
- **Acceptance**: Verify 7+ workflows listed from Phase 4B

**REQ-1.3.4: `get_workflow_history` Tool**
```typescript
interface GetWorkflowHistoryInput {
  workflowId?: string;  // filter by workflow (optional)
  limit?: number;       // default: 20, max: 100
}

interface GetWorkflowHistoryOutput {
  executions: Array<{
    executionId: string;
    workflowId: string;
    status: 'completed' | 'failed';
    startedAt: string;
    completedAt: string;
    duration: number;
    error?: string;
  }>;
  total: number;
  truncated: boolean;
}
```
- **Behavior**: View execution history across all workflows
- **Performance**: <50ms (database query with limit)
- **Error Cases**: None (returns empty array if no history)
- **Acceptance**: Test with multiple workflow executions

### 1.4 Enhanced Proof Workflows

**REQ-1.4.1: Task Completion Workflow Enhancement**
- Parse frontmatter from task completion markdown files
- Extract: status, type, created_date, completed_date, tags
- Store task metadata in shadow cache with type="task_log"
- Enable querying tasks via `query_files` tool
- **Acceptance**: Task file triggers workflow, metadata appears in shadow cache

**REQ-1.4.2: Phase Completion Workflow Enhancement**
- Parse frontmatter from phase completion markdown files
- Extract: phase_id, status, duration, deliverables
- Store phase metadata in shadow cache with type="phase_completion"
- **Acceptance**: Phase file triggers workflow, metadata queryable

**REQ-1.4.3: Frontmatter Parser Integration**
- Use existing parser or implement gray-matter-compatible parser
- Handle YAML frontmatter extraction
- Store frontmatter as JSON in shadow cache
- **Acceptance**: Unit test parses various frontmatter formats

---

## 2. Non-Functional Requirements

### 2.1 Performance Requirements

**REQ-2.1.1: Shadow Cache Query Performance**
- `query_files`: <10ms (p95), <5ms (p50)
- `get_file`: <5ms (p95), <2ms (p50)
- `get_file_content`: <50ms for files <1MB
- `search_tags`: <10ms (p95)
- `search_links`: <15ms (p95)
- `get_stats`: <20ms (p95)
- **Measurement**: Performance benchmarks in CI, fail if violated

**REQ-2.1.2: Workflow Tool Performance**
- `trigger_workflow`: <200ms (p95), includes workflow execution
- `get_workflow_status`: <10ms (p95)
- `list_workflows`: <5ms (p95)
- `get_workflow_history`: <50ms (p95)

**REQ-2.1.3: Resource Constraints**
- MCP server memory overhead: <100MB baseline
- No memory leaks after 1-hour stress test (10k tool calls)
- Concurrent tool calls: handle 10 simultaneous without degradation

### 2.2 Reliability Requirements

**REQ-2.2.1: Error Handling**
- Zero crashes: All errors caught and returned as MCP errors
- Graceful degradation: Shadow cache unavailable → informative errors
- Retry logic: Database locked → retry 3x with backoff

**REQ-2.2.2: Data Integrity**
- Shadow cache read-only access (no writes via MCP tools)
- Workflow triggers don't modify shadow cache directly
- File content reads don't alter file metadata

**REQ-2.2.3: Backwards Compatibility**
- Phase 4B components unaffected by MCP server
- File watcher continues operating independently
- Workflow engine API unchanged
- Shadow cache schema unchanged

### 2.3 Usability Requirements

**REQ-2.3.1: Claude Desktop Integration**
- Configuration file example provided in README
- Server connects successfully on first attempt
- Error messages displayed clearly in Claude Desktop UI
- Tool descriptions clear and actionable

**REQ-2.3.2: Developer Experience**
- API documentation complete for all 10 tools
- Usage examples with expected outputs
- Troubleshooting guide for common issues
- TypeScript types exported for tool inputs/outputs

### 2.4 Quality Requirements

**REQ-2.4.1: Test Coverage**
- >80% code coverage for MCP server and tool handlers
- Integration tests for all 10 tools
- End-to-end tests with Claude Desktop
- Performance benchmarks in CI

**REQ-2.4.2: Code Quality**
- TypeScript strict mode enabled (zero `any` types without justification)
- `bun run typecheck` passes with 0 errors
- `bun run lint` passes with 0 errors
- `bun run build` completes successfully

---

## 3. System Architecture

### 3.1 Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Claude Desktop / Claude Code (MCP Client)               │
└────────────────────┬────────────────────────────────────┘
                     │ stdio transport
                     │
┌────────────────────▼────────────────────────────────────┐
│ WeaverMCPServer (NEW)                                   │
│ - Server lifecycle management                           │
│ - Request routing (ListTools, CallTool)                 │
│ - Error handling & logging                              │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼─────────┐       ┌──────▼──────────┐
│ Shadow Cache    │       │ Workflow Engine │
│ Tool Handlers   │       │ Tool Handlers   │
│ (6 tools)       │       │ (4 tools)       │
└───────┬─────────┘       └──────┬──────────┘
        │                         │
┌───────▼─────────┐       ┌──────▼──────────┐
│ ShadowCache     │       │ WorkflowEngine  │
│ (Phase 4B)      │       │ (Phase 4B)      │
└─────────────────┘       └─────────────────┘
```

### 3.2 Data Flow

**Shadow Cache Query Flow**:
1. Claude Desktop sends CallTool request (e.g., `query_files`)
2. WeaverMCPServer routes to shadow cache tool handler
3. Handler calls `ShadowCache.getAllFiles()` (Phase 4B API)
4. Filter/limit results in memory
5. Return MCP response with file metadata

**Workflow Trigger Flow**:
1. Claude Desktop sends CallTool request (`trigger_workflow`)
2. WeaverMCPServer routes to workflow tool handler
3. Handler calls `WorkflowEngine.triggerManual()` (Phase 4B API)
4. Workflow executes (potentially async)
5. Return MCP response with execution status

### 3.3 File Organization

```
/weaver/
├── src/
│   ├── mcp-server/
│   │   ├── index.ts                    # WeaverMCPServer class
│   │   ├── types.ts                    # MCP-specific types
│   │   └── tools/
│   │       ├── registry.ts             # Tool definitions export
│   │       ├── shadow-cache.ts         # 6 shadow cache tool handlers
│   │       └── workflow.ts             # 4 workflow tool handlers
│   ├── shadow-cache/                   # Existing (Phase 4B)
│   ├── workflow-engine/                # Existing (Phase 4B)
│   └── workflows/
│       └── proof-workflows.ts          # Enhanced with frontmatter parsing
├── tests/
│   ├── integration/
│   │   └── mcp-tools.test.ts           # Integration tests for all tools
│   └── unit/
│       └── mcp-server/                 # Unit tests
└── docs/
    ├── MCP-SETUP.md                    # Setup guide
    ├── MCP-TOOLS-REFERENCE.md          # Tool API reference
    └── CLAUDE-DESKTOP-CONFIG.md        # Configuration examples
```

---

## 4. Integration Points

### 4.1 Shadow Cache Integration

**Existing Methods Used**:
- `getAllFiles()`: Returns all cached files
- `getFile(path)`: Returns single file metadata
- `getFilesByType(type)`: Filters by frontmatter type
- `getFilesByStatus(status)`: Filters by status
- `getFilesByTag(tag)`: Filters by tag
- `getStats()`: Returns cache statistics

**Constraints**:
- Read-only access (no writes via MCP tools)
- All queries synchronous (SQLite better-sqlite3)
- Must handle missing files gracefully

### 4.2 Workflow Engine Integration

**Existing Methods Used**:
- `triggerManual(workflowId, metadata)`: Trigger workflow manually
- `registry.getWorkflow(id)`: Get workflow definition
- `registry.getAllWorkflows()`: List all workflows
- `registry.getWorkflowsByTrigger(trigger)`: Filter by trigger type

**New Requirements**:
- Workflow execution tracking (execution ID, status, timing)
- Workflow history storage (database or in-memory)

### 4.3 Configuration Integration

**Existing Config Used**:
- `config.vault.path`: Vault filesystem path
- `config.shadowCache.dbPath`: SQLite database path
- Logger configuration

**New Config Required**:
```typescript
export const config = {
  mcp: {
    server: {
      name: 'weaver-mcp-server',
      version: '0.1.0',
    },
    tools: {
      maxFileSize: 10 * 1024 * 1024,  // 10MB
      defaultLimit: 50,
      maxLimit: 500,
    },
  },
  // ... existing config
};
```

---

## 5. Acceptance Criteria

### 5.1 Functional Acceptance

- ✅ All 10 MCP tools implemented and tested
- ✅ MCP server starts and connects via stdio
- ✅ Claude Desktop configuration working
- ✅ Shadow cache queries return correct results
- ✅ Workflow triggers execute successfully
- ✅ Enhanced proof workflows parse frontmatter
- ✅ Error handling covers all failure modes

### 5.2 Performance Acceptance

- ✅ Shadow cache queries <10ms (p95)
- ✅ Workflow tools <200ms (p95)
- ✅ Memory overhead <100MB
- ✅ No memory leaks after 1-hour stress test
- ✅ Concurrent calls handled without degradation

### 5.3 Quality Acceptance

- ✅ >80% test coverage for MCP code
- ✅ TypeScript strict mode, 0 errors
- ✅ Linting passes with 0 errors
- ✅ Build completes successfully
- ✅ API documentation complete
- ✅ Usage examples documented

---

## 6. Out of Scope

The following are explicitly **NOT** part of Phase 5:

❌ **HTTP/WebSocket transports** - Stdio only in Phase 5
❌ **Write operations via MCP** - Read-only for safety
❌ **Real-time file watching via MCP** - File watcher runs independently
❌ **Custom workflow creation via MCP** - Only trigger/status for existing workflows
❌ **Multi-agent coordination** - Deferred to Phase 7+
❌ **Obsidian REST API client** - Direct file access sufficient
❌ **Additional tools beyond the 10** - Strict scope boundary
❌ **Real-time streaming updates** - Polling-based monitoring only

---

## 7. Dependencies & Assumptions

### 7.1 Dependencies

**External Dependencies**:
- `@modelcontextprotocol/sdk@^1.0.0` - Official MCP implementation

**Internal Dependencies**:
- Phase 4B shadow cache (229 files indexed)
- Phase 4B workflow engine (7 workflows registered)
- Phase 4B file watcher (operational)
- Bun runtime v1.0+

### 7.2 Assumptions

1. Claude Desktop supports stdio transport (verified)
2. Shadow cache performance sufficient for MCP queries (<10ms confirmed in Phase 4B)
3. Workflow engine can track execution IDs (may need enhancement)
4. Frontmatter parser compatible with existing vault files
5. No breaking changes in MCP SDK v1.0.x

---

## 8. Risks & Mitigation

See constitution.md for detailed risk analysis. Key risks:

1. **Claude Desktop Integration Issues** (Medium) - Mitigation: Early testing, troubleshooting guide
2. **Scope Creep** (Medium) - Mitigation: Strict adherence to 10 tools
3. **Workflow Execution Tracking** (Low) - Mitigation: Simple in-memory tracking acceptable for Phase 5

---

## 9. Success Metrics

**Phase 5 Completion Criteria**:
- ✅ All 10 tools functional and tested
- ✅ Performance benchmarks passing
- ✅ Claude Desktop integration working
- ✅ Documentation complete
- ✅ Zero breaking changes to Phase 4B
- ✅ Ready for Phase 6 (Obsidian plugin integration)

**Timeline**: 3-4 days (24-32 hours)
- Day 1: MCP server foundation (8 hours)
- Day 2: Shadow cache tools (8 hours)
- Day 3: Workflow tools + enhancements (8 hours)
- Day 4: Integration, testing, docs (8 hours)

---

**Generated**: 2025-10-24T02:22:02.774Z
**Elaborated**: 2025-10-24T02:40:00.000Z (via /speckit.specify)
**Source**: Phase planning document for PHASE-5
