# Phase 5: MCP Integration - Task Breakdown

**Phase ID**: PHASE-5
**Status**: pending
**Priority**: critical
**Estimated Duration**: 3-4 days (24-32 hours)

---

## Task Organization

Tasks are organized by day and include:
- **ID**: Unique task identifier
- **Priority**: Critical (C), High (H), Medium (M), Low (L)
- **Estimate**: Time in hours
- **Dependencies**: Prerequisites (blocked by)
- **Acceptance Criteria**: How to verify completion

---

## Day 1: MCP Server Foundation (8 hours)

### Morning Session (4 hours)

#### TASK-5.1.1: Install MCP SDK Dependencies
- **Priority**: C
- **Estimate**: 0.5h
- **Dependencies**: None
- **Files**: `package.json`
- **Commands**:
  ```bash
  cd /home/aepod/dev/weave-nn/weaver
  bun add @modelcontextprotocol/sdk
  bun install
  ```
- **Acceptance Criteria**:
  - ✅ `@modelcontextprotocol/sdk@^1.0.0` added to package.json
  - ✅ `bun install` completes without errors
  - ✅ TypeScript types available for MCP SDK

---

#### TASK-5.1.2: Create MCP Server Directory Structure
- **Priority**: C
- **Estimate**: 0.5h
- **Dependencies**: TASK-5.1.1
- **Files**:
  - `src/mcp-server/index.ts` (create)
  - `src/mcp-server/types.ts` (create)
  - `src/mcp-server/tools/registry.ts` (create)
  - `src/mcp-server/tools/shadow-cache.ts` (create)
  - `src/mcp-server/tools/workflow.ts` (create)
- **Acceptance Criteria**:
  - ✅ All 5 files created with TypeScript module boilerplate
  - ✅ Exports defined (empty but typed)
  - ✅ `bun run typecheck` passes with 0 errors

---

#### TASK-5.1.3: Implement WeaverMCPServer Class (Core)
- **Priority**: C
- **Estimate**: 2h
- **Dependencies**: TASK-5.1.2
- **Files**: `src/mcp-server/index.ts`
- **Implementation**:
  ```typescript
  import { Server } from '@modelcontextprotocol/sdk/server/index.js';
  import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
  import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
  } from '@modelcontextprotocol/sdk/types.js';
  import { logger } from '../utils/logger.js';
  import { getToolDefinitions } from './tools/registry.js';

  export class WeaverMCPServer {
    private server: Server;

    constructor() {
      this.server = new Server(
        {
          name: 'weaver-mcp-server',
          version: '0.1.0',
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      this.setupHandlers();
    }

    private setupHandlers() {
      // List available tools
      this.server.setRequestHandler(ListToolsRequestSchema, async () => {
        const tools = getToolDefinitions();
        logger.debug('ListTools request', { count: tools.length });
        return { tools };
      });

      // Handle tool calls
      this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
        logger.debug('CallTool request', {
          tool: request.params.name,
          args: request.params.arguments
        });
        return await this.handleToolCall(request);
      });
    }

    private async handleToolCall(request: any) {
      // TODO: Route to tool handlers
      throw new Error('Not implemented');
    }

    async run() {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      logger.info('✅ MCP server started');
    }
  }
  ```
- **Acceptance Criteria**:
  - ✅ Server class instantiates without errors
  - ✅ ListTools handler registered
  - ✅ CallTool handler registered (stub)
  - ✅ Logging integrated with pino
  - ✅ TypeScript strict mode passes

---

#### TASK-5.1.4: Create Tool Registry Structure
- **Priority**: C
- **Estimate**: 1h
- **Dependencies**: TASK-5.1.3
- **Files**: `src/mcp-server/tools/registry.ts`, `src/mcp-server/types.ts`
- **Implementation**:
  ```typescript
  // types.ts
  import type { Tool } from '@modelcontextprotocol/sdk/types.js';

  export interface ToolHandler<TInput = any, TOutput = any> {
    (input: TInput): Promise<TOutput>;
  }

  export interface ToolDefinition extends Tool {
    handler: ToolHandler;
  }

  // registry.ts
  import type { Tool } from '@modelcontextprotocol/sdk/types.js';
  import { shadowCacheTools } from './shadow-cache.js';
  import { workflowTools } from './workflow.js';

  export function getToolDefinitions(): Tool[] {
    return [
      ...shadowCacheTools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
      ...workflowTools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    ];
  }

  export function getToolHandler(toolName: string): ToolHandler | undefined {
    const allTools = [...shadowCacheTools, ...workflowTools];
    return allTools.find(t => t.name === toolName)?.handler;
  }
  ```
- **Acceptance Criteria**:
  - ✅ Tool registry exports `getToolDefinitions()` function
  - ✅ Tool registry exports `getToolHandler()` function
  - ✅ TypeScript types defined for tool structure
  - ✅ Stubs for shadow cache and workflow tool arrays

---

### Afternoon Session (4 hours)

#### TASK-5.1.5: Implement Tool Call Routing
- **Priority**: C
- **Estimate**: 1.5h
- **Dependencies**: TASK-5.1.4
- **Files**: `src/mcp-server/index.ts`
- **Implementation**:
  ```typescript
  private async handleToolCall(request: any): Promise<any> {
    const { name, arguments: args } = request.params;
    const handler = getToolHandler(name);

    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      const result = await handler(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Tool execution failed', { tool: name, error });
      throw error;
    }
  }
  ```
- **Acceptance Criteria**:
  - ✅ Tool calls routed to appropriate handlers
  - ✅ Unknown tools return error
  - ✅ Results formatted as MCP response
  - ✅ Errors logged with context

---

#### TASK-5.1.6: Add Error Handling & Logging
- **Priority**: H
- **Estimate**: 1.5h
- **Dependencies**: TASK-5.1.5
- **Files**: `src/mcp-server/index.ts`
- **Implementation**:
  - Wrap all tool calls in try-catch
  - Return MCP error responses instead of throwing
  - Add request IDs for tracing
  - Log performance metrics (tool call duration)
- **Acceptance Criteria**:
  - ✅ All errors caught and returned as MCP errors
  - ✅ Request IDs generated and logged
  - ✅ Performance metrics logged for each tool call
  - ✅ Integration test verifies error handling

---

#### TASK-5.1.7: Add Server Lifecycle Management
- **Priority**: H
- **Estimate**: 1h
- **Dependencies**: TASK-5.1.6
- **Files**: `src/mcp-server/index.ts`, `src/index.ts`
- **Implementation**:
  - Add graceful shutdown handler (SIGINT, SIGTERM)
  - Add health check logging
  - Update main entry point to launch MCP server
- **Acceptance Criteria**:
  - ✅ Server starts via `bun run start:mcp`
  - ✅ Graceful shutdown on Ctrl+C
  - ✅ Health check logs periodically
  - ✅ Clean resource cleanup

---

#### TASK-5.1.8: Test MCP Server Foundation
- **Priority**: H
- **Estimate**: 1h (runs in parallel with development)
- **Dependencies**: TASK-5.1.7
- **Files**: `tests/integration/mcp-server.test.ts` (create)
- **Tests**:
  1. Server starts successfully
  2. ListTools returns empty array (no tools yet)
  3. CallTool with unknown tool returns error
  4. Graceful shutdown works
- **Acceptance Criteria**:
  - ✅ All 4 tests passing
  - ✅ Integration test suite executable
  - ✅ Test coverage >80% for MCP server class

---

## Day 2: Shadow Cache MCP Tools (8 hours)

### Morning Session (4 hours)

#### TASK-5.2.1: Implement `query_files` Tool
- **Priority**: C
- **Estimate**: 1.5h
- **Dependencies**: TASK-5.1.8
- **Files**: `src/mcp-server/tools/shadow-cache.ts`
- **Implementation**:
  ```typescript
  import type { ToolDefinition } from '../types.js';
  import { shadowCache } from '../../index.js';

  export const queryFilesTool: ToolDefinition = {
    name: 'query_files',
    description: 'Search vault files by directory, type, status, or tag',
    inputSchema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Filter by directory (prefix match, e.g., "concepts/")',
        },
        type: {
          type: 'string',
          description: 'Filter by frontmatter type field',
        },
        status: {
          type: 'string',
          description: 'Filter by frontmatter status field',
        },
        tag: {
          type: 'string',
          description: 'Filter by tag (exact match)',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return',
          default: 50,
          maximum: 500,
        },
      },
    },
    handler: async (args: any) => {
      const { directory, type, status, tag, limit = 50 } = args;

      let results = shadowCache.getAllFiles();

      if (directory) {
        results = results.filter(f => f.directory.startsWith(directory));
      }
      if (type) {
        results = shadowCache.getFilesByType(type);
      }
      if (status) {
        results = shadowCache.getFilesByStatus(status);
      }
      if (tag) {
        results = shadowCache.getFilesByTag(tag);
      }

      const total = results.length;
      const truncated = total > limit;
      const files = results.slice(0, limit);

      return { files, total, truncated };
    },
  };
  ```
- **Acceptance Criteria**:
  - ✅ Tool returns filtered results
  - ✅ All filter parameters work (directory, type, status, tag)
  - ✅ Limit parameter respected
  - ✅ Performance <10ms (benchmark)
  - ✅ Integration test with 50+ files

---

#### TASK-5.2.2: Implement `get_file` Tool
- **Priority**: C
- **Estimate**: 1h
- **Dependencies**: TASK-5.2.1
- **Files**: `src/mcp-server/tools/shadow-cache.ts`
- **Implementation**: Similar pattern to `query_files`, using `shadowCache.getFile(path)`
- **Acceptance Criteria**:
  - ✅ Returns complete file metadata
  - ✅ Includes tags and links
  - ✅ File not found returns descriptive error
  - ✅ Performance <5ms
  - ✅ Integration test with existing file

---

#### TASK-5.2.3: Implement `get_file_content` Tool
- **Priority**: C
- **Estimate**: 1h
- **Dependencies**: TASK-5.2.2
- **Files**: `src/mcp-server/tools/shadow-cache.ts`
- **Implementation**:
  ```typescript
  export const getFileContentTool: ToolDefinition = {
    name: 'get_file_content',
    description: 'Read raw file content from vault',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative vault path',
        },
      },
      required: ['path'],
    },
    handler: async (args: any) => {
      const { path } = args;
      const absolutePath = join(config.vault.path, path);

      // Check file size
      const stats = await fs.stat(absolutePath);
      if (stats.size > 10 * 1024 * 1024) {
        throw new Error('File too large (>10MB)');
      }

      const content = await fs.readFile(absolutePath, 'utf-8');

      return {
        path,
        content,
        size: stats.size,
        modified_at: stats.mtime.toISOString(),
      };
    },
  };
  ```
- **Acceptance Criteria**:
  - ✅ Reads file content from filesystem
  - ✅ File size limit enforced (10MB)
  - ✅ UTF-8 encoding handled
  - ✅ Performance <50ms for <1MB files
  - ✅ Error handling for missing files

---

#### TASK-5.2.4: Implement `search_tags` Tool
- **Priority**: C
- **Estimate**: 0.5h
- **Dependencies**: TASK-5.2.3
- **Files**: `src/mcp-server/tools/shadow-cache.ts`
- **Implementation**: Use `shadowCache.getFilesByTag()` with prefix support
- **Acceptance Criteria**:
  - ✅ Returns files with specific tag
  - ✅ Prefix search supported (tag ending with *)
  - ✅ Performance <10ms
  - ✅ Integration test with common tag

---

### Afternoon Session (4 hours)

#### TASK-5.2.5: Implement `search_links` Tool
- **Priority**: C
- **Estimate**: 1.5h
- **Dependencies**: TASK-5.2.4
- **Files**: `src/mcp-server/tools/shadow-cache.ts`
- **Implementation**: Query bidirectional links (outgoing and incoming)
- **Acceptance Criteria**:
  - ✅ Returns outgoing links
  - ✅ Returns incoming links (backlinks)
  - ✅ Direction parameter respected
  - ✅ Performance <15ms with joins
  - ✅ Test with highly-connected file

---

#### TASK-5.2.6: Implement `get_stats` Tool
- **Priority**: C
- **Estimate**: 1h
- **Dependencies**: TASK-5.2.5
- **Files**: `src/mcp-server/tools/shadow-cache.ts`
- **Implementation**: Aggregate statistics from shadow cache
- **Acceptance Criteria**:
  - ✅ Returns file counts by type/status/directory
  - ✅ Returns tag statistics with top tags
  - ✅ Returns link statistics
  - ✅ Performance <20ms
  - ✅ Counts match reality (229 files, 306 tags)

---

#### TASK-5.2.7: Update Tool Registry with Shadow Cache Tools
- **Priority**: C
- **Estimate**: 0.5h
- **Dependencies**: TASK-5.2.6
- **Files**: `src/mcp-server/tools/shadow-cache.ts`, `src/mcp-server/tools/registry.ts`
- **Implementation**: Export all 6 shadow cache tools
- **Acceptance Criteria**:
  - ✅ All 6 tools exported in array
  - ✅ Registry imports and includes all 6
  - ✅ ListTools returns 6 shadow cache tools
  - ✅ TypeScript types correct

---

#### TASK-5.2.8: Integration Tests for Shadow Cache Tools
- **Priority**: H
- **Estimate**: 2h
- **Dependencies**: TASK-5.2.7
- **Files**: `tests/integration/mcp-shadow-cache.test.ts` (create)
- **Tests** (6 test suites, one per tool):
  1. `query_files` with various filters
  2. `get_file` with existing/missing files
  3. `get_file_content` with size limits
  4. `search_tags` with prefix search
  5. `search_links` with direction filters
  6. `get_stats` verifying counts
- **Acceptance Criteria**:
  - ✅ All 6 tools tested end-to-end
  - ✅ Performance benchmarks passing
  - ✅ Error cases covered
  - ✅ Test coverage >80%

---

## Day 3: Workflow Tools & Enhancements (8 hours)

### Morning Session (4 hours)

#### TASK-5.3.1: Implement Workflow Execution Tracking
- **Priority**: C
- **Estimate**: 1.5h
- **Dependencies**: TASK-5.2.8
- **Files**: `src/workflow-engine/index.ts` (enhance)
- **Implementation**:
  - Add execution ID generation (UUID)
  - Track execution status (running, completed, failed)
  - Store start/end timestamps
  - In-memory execution history (Map)
- **Acceptance Criteria**:
  - ✅ Execution IDs generated for all workflow runs
  - ✅ Status tracked throughout execution
  - ✅ Timing data captured
  - ✅ History queryable

---

#### TASK-5.3.2: Implement `trigger_workflow` Tool
- **Priority**: C
- **Estimate**: 1h
- **Dependencies**: TASK-5.3.1
- **Files**: `src/mcp-server/tools/workflow.ts`
- **Implementation**:
  ```typescript
  export const triggerWorkflowTool: ToolDefinition = {
    name: 'trigger_workflow',
    description: 'Manually trigger a registered workflow',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow ID to trigger',
        },
        input: {
          type: 'object',
          description: 'Optional metadata for workflow',
        },
      },
      required: ['workflowId'],
    },
    handler: async (args: any) => {
      const { workflowId, input } = args;
      const execution = await workflowEngine.triggerManual(workflowId, input);

      return {
        workflowId,
        executionId: execution.id,
        status: execution.status,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        result: execution.result,
        error: execution.error,
      };
    },
  };
  ```
- **Acceptance Criteria**:
  - ✅ Triggers workflow successfully
  - ✅ Returns execution ID
  - ✅ Handles invalid workflow IDs
  - ✅ Performance <200ms

---

#### TASK-5.3.3: Implement `get_workflow_status` Tool
- **Priority**: C
- **Estimate**: 0.5h
- **Dependencies**: TASK-5.3.2
- **Files**: `src/mcp-server/tools/workflow.ts`
- **Implementation**: Query execution status by ID
- **Acceptance Criteria**:
  - ✅ Returns status for running/completed workflows
  - ✅ Includes timing data
  - ✅ Execution not found returns error
  - ✅ Performance <10ms

---

#### TASK-5.3.4: Implement `list_workflows` Tool
- **Priority**: C
- **Estimate**: 0.5h
- **Dependencies**: TASK-5.3.3
- **Files**: `src/mcp-server/tools/workflow.ts`
- **Implementation**: Query `WorkflowRegistry.getAllWorkflows()`
- **Acceptance Criteria**:
  - ✅ Lists all registered workflows
  - ✅ Includes descriptions and triggers
  - ✅ Shows enabled/disabled status
  - ✅ Performance <5ms

---

#### TASK-5.3.5: Implement `get_workflow_history` Tool
- **Priority**: C
- **Estimate**: 0.5h
- **Dependencies**: TASK-5.3.4
- **Files**: `src/mcp-server/tools/workflow.ts`
- **Implementation**: Query execution history with limit
- **Acceptance Criteria**:
  - ✅ Returns historical executions
  - ✅ Filter by workflow ID (optional)
  - ✅ Limit parameter respected
  - ✅ Performance <50ms

---

### Afternoon Session (4 hours)

#### TASK-5.3.6: Enhance Task Completion Workflow (Frontmatter Parsing)
- **Priority**: H
- **Estimate**: 2h
- **Dependencies**: TASK-5.3.5
- **Files**: `src/workflows/proof-workflows.ts`
- **Implementation**:
  - Add frontmatter parsing using gray-matter or custom parser
  - Extract: status, type, created_date, completed_date, tags
  - Store in shadow cache with type="task_log"
- **Acceptance Criteria**:
  - ✅ Task files trigger workflow
  - ✅ Frontmatter parsed correctly
  - ✅ Metadata stored in shadow cache
  - ✅ Queryable via `query_files` tool
  - ✅ End-to-end test passes

---

#### TASK-5.3.7: Enhance Phase Completion Workflow
- **Priority**: M
- **Estimate**: 1h
- **Dependencies**: TASK-5.3.6
- **Files**: `src/workflows/proof-workflows.ts`
- **Implementation**: Similar to task completion, extract phase metadata
- **Acceptance Criteria**:
  - ✅ Phase files trigger workflow
  - ✅ Metadata stored in shadow cache
  - ✅ Integration test passes

---

#### TASK-5.3.8: Integration Tests for Workflow Tools
- **Priority**: H
- **Estimate**: 1.5h
- **Dependencies**: TASK-5.3.7
- **Files**: `tests/integration/mcp-workflow.test.ts` (create)
- **Tests** (4 test suites):
  1. `trigger_workflow` with valid/invalid IDs
  2. `get_workflow_status` status polling
  3. `list_workflows` verifying 7+ workflows
  4. `get_workflow_history` with filtering
- **Acceptance Criteria**:
  - ✅ All 4 tools tested end-to-end
  - ✅ Execution tracking verified
  - ✅ Error handling tested
  - ✅ Test coverage >80%

---

## Day 4: Integration, Testing & Documentation (8 hours)

### Morning Session (4 hours)

#### TASK-5.4.1: Complete End-to-End Integration Testing
- **Priority**: C
- **Estimate**: 2h
- **Dependencies**: TASK-5.3.8
- **Files**: `tests/integration/mcp-e2e.test.ts` (create)
- **Tests**:
  1. Full workflow: query files → get file → read content
  2. Workflow trigger → status check → history query
  3. Task completion workflow → query task metadata
  4. Performance benchmarks for all 10 tools
- **Acceptance Criteria**:
  - ✅ All integration tests passing
  - ✅ Performance benchmarks passing
  - ✅ Memory leak test (1-hour stress test)
  - ✅ Concurrent tool calls handled

---

#### TASK-5.4.2: Claude Desktop Configuration & Testing
- **Priority**: C
- **Estimate**: 1.5h
- **Dependencies**: TASK-5.4.1
- **Files**: `~/.config/Claude/claude_desktop_config.json`, `docs/CLAUDE-DESKTOP-CONFIG.md` (create)
- **Implementation**:
  ```json
  {
    "mcpServers": {
      "weaver": {
        "command": "bun",
        "args": ["run", "start:mcp"],
        "cwd": "/home/aepod/dev/weave-nn/weaver",
        "env": {
          "VAULT_PATH": "/home/aepod/dev/weave-nn/weave-nn"
        }
      }
    }
  }
  ```
- **Acceptance Criteria**:
  - ✅ Configuration file documented
  - ✅ Server connects to Claude Desktop
  - ✅ All 10 tools accessible in Claude Desktop
  - ✅ Tool calls work from Claude Desktop UI
  - ✅ Error messages display correctly

---

#### TASK-5.4.3: Performance Testing & Optimization
- **Priority**: H
- **Estimate**: 1h
- **Dependencies**: TASK-5.4.2
- **Files**: `tests/performance/benchmarks.test.ts` (create)
- **Benchmarks**:
  - Shadow cache queries <10ms (p95)
  - Workflow tools <200ms (p95)
  - Memory overhead <100MB
  - Concurrent calls (10 simultaneous)
- **Acceptance Criteria**:
  - ✅ All performance targets met
  - ✅ Benchmarks in CI
  - ✅ Performance report generated

---

### Afternoon Session (4 hours)

#### TASK-5.4.4: Create Developer Documentation
- **Priority**: H
- **Estimate**: 1.5h
- **Dependencies**: TASK-5.4.3
- **Files**:
  - `docs/MCP-SETUP.md` (create)
  - `docs/MCP-TOOLS-REFERENCE.md` (create)
  - `README.md` (update)
- **Content**:
  - MCP server setup instructions
  - API reference for all 10 tools
  - Usage examples with expected outputs
  - Troubleshooting guide
- **Acceptance Criteria**:
  - ✅ Setup guide complete with commands
  - ✅ API reference documents all 10 tools
  - ✅ Examples for each tool with outputs
  - ✅ Troubleshooting section

---

#### TASK-5.4.5: Create Usage Examples
- **Priority**: M
- **Estimate**: 1h
- **Dependencies**: TASK-5.4.4
- **Files**: `docs/MCP-USAGE-EXAMPLES.md` (create)
- **Examples**:
  1. Query all concept files
  2. Get file metadata and content
  3. Search by tags
  4. Explore wikilink relationships
  5. Trigger workflow and monitor status
- **Acceptance Criteria**:
  - ✅ 5+ usage examples documented
  - ✅ Expected outputs shown
  - ✅ Common patterns illustrated

---

#### TASK-5.4.6: Final Quality Checks
- **Priority**: C
- **Estimate**: 1h
- **Dependencies**: TASK-5.4.5
- **Commands**:
  ```bash
  bun run typecheck
  bun run lint
  bun run build
  bun run test
  ```
- **Acceptance Criteria**:
  - ✅ TypeScript strict mode: 0 errors
  - ✅ Linting: 0 errors
  - ✅ Build: completes successfully
  - ✅ Tests: >80% coverage, all passing

---

#### TASK-5.4.7: Update Main README with MCP Instructions
- **Priority**: M
- **Estimate**: 0.5h
- **Dependencies**: TASK-5.4.6
- **Files**: `/home/aepod/dev/weave-nn/weaver/README.md`
- **Updates**:
  - Add MCP server section
  - Link to MCP setup guide
  - Claude Desktop configuration example
- **Acceptance Criteria**:
  - ✅ README updated with MCP info
  - ✅ Links to detailed docs
  - ✅ Quick start instructions

---

## Task Summary

### By Priority
- **Critical (C)**: 21 tasks (must complete)
- **High (H)**: 6 tasks (important for quality)
- **Medium (M)**: 3 tasks (nice to have)
- **Low (L)**: 0 tasks

### By Day
- **Day 1**: 8 tasks, 8 hours (MCP server foundation)
- **Day 2**: 8 tasks, 8 hours (Shadow cache tools)
- **Day 3**: 8 tasks, 8 hours (Workflow tools + enhancements)
- **Day 4**: 7 tasks, 8 hours (Integration, testing, docs)

### Total
- **31 tasks**
- **32 hours estimated**
- **10 MCP tools** (6 shadow cache + 4 workflow)
- **4 documentation files**
- **6 test suites**

---

## Critical Path

The critical path for Phase 5 completion:

```
TASK-5.1.1 → TASK-5.1.2 → TASK-5.1.3 → TASK-5.1.4 → TASK-5.1.5 → TASK-5.1.6 → TASK-5.1.7 → TASK-5.1.8
    ↓
TASK-5.2.1 → TASK-5.2.2 → TASK-5.2.3 → TASK-5.2.4 → TASK-5.2.5 → TASK-5.2.6 → TASK-5.2.7 → TASK-5.2.8
    ↓
TASK-5.3.1 → TASK-5.3.2 → TASK-5.3.3 → TASK-5.3.4 → TASK-5.3.5 → TASK-5.3.6 → TASK-5.3.7 → TASK-5.3.8
    ↓
TASK-5.4.1 → TASK-5.4.2 → TASK-5.4.3 → TASK-5.4.4 → TASK-5.4.5 → TASK-5.4.6 → TASK-5.4.7
```

**Critical Path Duration**: 32 hours (4 days @ 8 hours/day)

---

## Sync to Vault

After completing tasks, sync back to vault:

```bash
cd /home/aepod/dev/weave-nn/weaver
bun run sync-tasks phase-5
```

This will update the vault's task tracking system with completion status.

---

**Generated**: 2025-10-24T02:22:02.774Z
**Task Breakdown**: 2025-10-24T02:50:00.000Z (via /speckit.tasks)
**Source**: Phase 5 specification and constitution
