---
spec_type: "tasks"
phase_id: "PHASE-5"
phase_name: "MCP Integration & Workflow Enhancement"
status: "pending"
priority: "critical"
duration: "3-4 days"
generated_date: "2025-10-24"
task_count: 48
tags:
  - spec-kit
  - tasks
  - phase-5
  - mcp
links:
  phase_document: "[[phase-5-mcp-integration]]"
  constitution: "[[constitution.md]]"
  specification: "[[specification.md]]"
---

# MCP Integration & Workflow Enhancement - Task Breakdown

**Phase ID**: PHASE-5
**Status**: pending
**Priority**: critical
**Duration**: 3-4 days
**Total Tasks**: 48

---

## Overview

This task breakdown provides a detailed, hierarchical list of all implementation tasks for Phase 5. Tasks are organized by day and include effort estimates, priorities, dependencies, and acceptance criteria.

---

## Day 1: MCP Server Foundation (8 hours)

### Task 1: Project Setup & Dependencies (1 hour)
**Priority**: High | **Effort**: 1h | **Dependencies**: None

#### 1.1. Install MCP SDK
- Add `@modelcontextprotocol/sdk` to weaver dependencies
- Verify TypeScript types available
- Update package.json and lock file

**Command**:
```bash
cd /home/aepod/dev/weave-nn/weaver
bun add @modelcontextprotocol/sdk
```

**Acceptance Criteria**:
- [ ] Package installed successfully
- [ ] TypeScript types recognized
- [ ] No dependency conflicts

#### 1.2. Create MCP Server Directory Structure
- Create `src/mcp-server/` directory
- Create subdirectories: `tools/`, `handlers/`, `types/`
- Set up barrel exports

**Structure**:
```
src/mcp-server/
├── index.ts           # Main server class
├── types.ts           # MCP type definitions
├── handlers/          # Request handlers
│   ├── index.ts
│   ├── tool-handler.ts
│   └── error-handler.ts
└── tools/             # Tool implementations
    ├── index.ts
    ├── registry.ts
    ├── shadow-cache/  # Shadow cache tools
    └── workflow/      # Workflow tools
```

**Acceptance Criteria**:
- [ ] Directory structure created
- [ ] Barrel exports configured
- [ ] TypeScript paths working

---

### Task 2: Core MCP Server Implementation (3 hours)
**Priority**: High | **Effort**: 3h | **Dependencies**: 1

#### 2.1. Implement WeaverMCPServer Class
- Create base `WeaverMCPServer` class
- Initialize MCP SDK Server instance
- Configure server metadata (name, version)
- Define capabilities (tools support)

**File**: `src/mcp-server/index.ts`

**Implementation**:
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';
import { getToolDefinitions } from './tools/registry.js';
import { handleToolCall } from './handlers/tool-handler.js';

export class WeaverMCPServer {
  private server: Server;
  private isRunning: boolean = false;

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
    logger.info('WeaverMCPServer initialized');
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const tools = getToolDefinitions();
        logger.debug(`Listing ${tools.length} tools`);
        return { tools };
      } catch (error) {
        logger.error('Error listing tools:', error);
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to list tools: ${error}`
        );
      }
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        logger.debug(`Handling tool call: ${request.params.name}`);
        return await handleToolCall(request);
      } catch (error) {
        logger.error(`Error handling tool call ${request.params.name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error}`
        );
      }
    });
  }

  async run() {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      this.isRunning = true;
      logger.info('WeaverMCPServer running on stdio transport');
    } catch (error) {
      logger.error('Failed to start MCP server:', error);
      throw error;
    }
  }

  async shutdown() {
    if (!this.isRunning) return;

    try {
      await this.server.close();
      this.isRunning = false;
      logger.info('WeaverMCPServer shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown:', error);
      throw error;
    }
  }
}
```

**Acceptance Criteria**:
- [ ] Server class implemented with proper typing
- [ ] Constructor initializes MCP SDK server
- [ ] Metadata configured correctly
- [ ] Error handling in place

#### 2.2. Implement Request Handler Registration
- Register ListTools handler
- Register CallTool handler
- Add error handling middleware
- Add request logging

**File**: `src/mcp-server/handlers/tool-handler.ts`

**Acceptance Criteria**:
- [ ] Both handlers registered
- [ ] Error handling catches all exceptions
- [ ] Requests logged with context

#### 2.3. Implement Stdio Transport
- Configure StdioServerTransport
- Handle process stdin/stdout
- Add transport error handling
- Test basic connectivity

**Acceptance Criteria**:
- [ ] Transport connects successfully
- [ ] Stdin/stdout communication working
- [ ] Transport errors handled gracefully

---

### Task 3: Tool Registry Architecture (2 hours)
**Priority**: High | **Effort**: 2h | **Dependencies**: 2

#### 3.1. Create Tool Registry System
- Define tool registration interface
- Implement getToolDefinitions function
- Create tool categories (shadow-cache, workflow)
- Add tool validation

**File**: `src/mcp-server/tools/registry.ts`

**Implementation**:
```typescript
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  queryFilesTool,
  getFileTool,
  getFileContentTool,
  searchTagsTool,
  searchLinksTool,
  getStatsTool,
} from './shadow-cache/index.js';
import {
  triggerWorkflowTool,
  listWorkflowsTool,
  getWorkflowStatusTool,
  getWorkflowHistoryTool,
} from './workflow/index.js';

export interface ToolCategory {
  name: string;
  description: string;
  tools: Tool[];
}

export const toolCategories: ToolCategory[] = [
  {
    name: 'shadow-cache',
    description: 'Shadow cache query and metadata tools',
    tools: [
      queryFilesTool,
      getFileTool,
      getFileContentTool,
      searchTagsTool,
      searchLinksTool,
      getStatsTool,
    ],
  },
  {
    name: 'workflow',
    description: 'Workflow trigger and status tools',
    tools: [
      triggerWorkflowTool,
      listWorkflowsTool,
      getWorkflowStatusTool,
      getWorkflowHistoryTool,
    ],
  },
];

export function getToolDefinitions(): Tool[] {
  return toolCategories.flatMap((category) => category.tools);
}

export function getToolByName(name: string): Tool | undefined {
  return getToolDefinitions().find((tool) => tool.name === name);
}

export function validateToolDefinition(tool: Tool): boolean {
  return !!(
    tool.name &&
    tool.description &&
    tool.inputSchema
  );
}
```

**Acceptance Criteria**:
- [ ] Registry returns all tool definitions
- [ ] Tools organized by category
- [ ] Tool validation function working
- [ ] Type-safe tool lookups

#### 3.2. Define Tool Handler Interface
- Create ToolHandler type
- Define standard request/response format
- Add error response types
- Create handler registration system

**File**: `src/mcp-server/types.ts`

**Acceptance Criteria**:
- [ ] Handler interface defined
- [ ] Request/response types created
- [ ] Error types documented

---

### Task 4: Server Lifecycle Management (2 hours)
**Priority**: Medium | **Effort**: 2h | **Dependencies**: 2, 3

#### 4.1. Implement Startup Sequence
- Initialize shadow cache connection
- Initialize workflow engine connection
- Register all tools
- Start stdio transport
- Log startup status

**Acceptance Criteria**:
- [ ] Startup sequence completes successfully
- [ ] All dependencies initialized
- [ ] Startup logged with timing

#### 4.2. Implement Health Check System
- Create health check endpoint (via tool)
- Check shadow cache connectivity
- Check workflow engine status
- Report component health

**File**: `src/mcp-server/tools/health-check.ts`

**Acceptance Criteria**:
- [ ] Health check tool implemented
- [ ] All components checked
- [ ] Health status reported

#### 4.3. Implement Graceful Shutdown
- Handle process signals (SIGINT, SIGTERM)
- Close MCP server connection
- Clean up resources
- Log shutdown status

**Acceptance Criteria**:
- [ ] Signals handled properly
- [ ] Resources cleaned up
- [ ] Shutdown completes gracefully

---

## Day 2: Shadow Cache MCP Tools (8 hours)

### Task 5: Query Files Tool (1.5 hours)
**Priority**: High | **Effort**: 1.5h | **Dependencies**: 3

#### 5.1. Define Query Files Tool Schema
- Create tool definition with input schema
- Define filter parameters (directory, type, status, tag)
- Add pagination parameters
- Document all parameters

**File**: `src/mcp-server/tools/shadow-cache/query-files.ts`

**Schema**:
```typescript
export const queryFilesTool: Tool = {
  name: 'query_files',
  description: 'Search vault files by path, type, status, or tag. Queries the shadow cache for fast metadata retrieval.',
  inputSchema: {
    type: 'object',
    properties: {
      directory: {
        type: 'string',
        description: 'Filter by directory prefix (e.g., "concepts/" or "_planning/")',
      },
      type: {
        type: 'string',
        description: 'Filter by frontmatter type field',
      },
      status: {
        type: 'string',
        description: 'Filter by status field',
      },
      tag: {
        type: 'string',
        description: 'Filter by tag (exact match)',
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return',
        default: 50,
        minimum: 1,
        maximum: 500,
      },
      offset: {
        type: 'number',
        description: 'Offset for pagination',
        default: 0,
        minimum: 0,
      },
    },
  },
};
```

**Acceptance Criteria**:
- [ ] Tool schema complete and valid
- [ ] All parameters documented
- [ ] Validation rules defined

#### 5.2. Implement Query Files Handler
- Parse and validate request parameters
- Query shadow cache with filters
- Apply pagination
- Format response as JSON
- Handle empty results

**Acceptance Criteria**:
- [ ] Handler implements all filters
- [ ] Pagination working correctly
- [ ] Results formatted consistently
- [ ] Empty results handled gracefully

#### 5.3. Add Error Handling
- Validate input parameters
- Handle shadow cache errors
- Return user-friendly error messages
- Log errors with context

**Acceptance Criteria**:
- [ ] Invalid inputs rejected
- [ ] Cache errors caught
- [ ] Error messages clear

---

### Task 6: Get File Tool (1 hour)
**Priority**: High | **Effort**: 1h | **Dependencies**: 3

#### 6.1. Define Get File Tool Schema
- Create tool definition
- Add path parameter (required)
- Add includeContent option
- Document return format

**Acceptance Criteria**:
- [ ] Tool schema complete
- [ ] Path parameter validated
- [ ] Options documented

#### 6.2. Implement Get File Handler
- Accept file path parameter
- Query shadow cache for metadata
- Optionally include file content
- Return structured response

**Acceptance Criteria**:
- [ ] Handler retrieves file metadata
- [ ] Content inclusion works
- [ ] Response format consistent

---

### Task 7: Get File Content Tool (1 hour)
**Priority**: High | **Effort**: 1h | **Dependencies**: 3

#### 7.1. Define Get File Content Tool Schema
- Create tool definition
- Add path parameter
- Add encoding option
- Document limitations

**Acceptance Criteria**:
- [ ] Tool schema complete
- [ ] Encoding options defined

#### 7.2. Implement Get File Content Handler
- Read file from filesystem
- Handle different encodings
- Return content as text
- Handle binary files appropriately

**Acceptance Criteria**:
- [ ] File content retrieved
- [ ] Encodings handled
- [ ] Binary files handled

---

### Task 8: Search Tags Tool (1.5 hours)
**Priority**: High | **Effort**: 1.5h | **Dependencies**: 3

#### 8.1. Define Search Tags Tool Schema
- Create tool definition
- Add tag parameter (supports wildcards)
- Add sorting options
- Add pagination

**Acceptance Criteria**:
- [ ] Tool schema complete
- [ ] Wildcard support defined

#### 8.2. Implement Search Tags Handler
- Query shadow cache tags table
- Support wildcard matching
- Return files with tag
- Include tag frequency

**Acceptance Criteria**:
- [ ] Tag search working
- [ ] Wildcards supported
- [ ] Results include frequency

---

### Task 9: Search Links Tool (1.5 hours)
**Priority**: High | **Effort**: 1.5h | **Dependencies**: 3

#### 9.1. Define Search Links Tool Schema
- Create tool definition
- Add sourceFile parameter
- Add targetFile parameter
- Add bidirectional option

**Acceptance Criteria**:
- [ ] Tool schema complete
- [ ] All parameters defined

#### 9.2. Implement Search Links Handler
- Query shadow cache links table
- Support source → target queries
- Support target ← source queries
- Support bidirectional queries

**Acceptance Criteria**:
- [ ] Link queries working
- [ ] Bidirectional search works
- [ ] Results formatted clearly

---

### Task 10: Get Stats Tool (1 hour)
**Priority**: Medium | **Effort**: 1h | **Dependencies**: 3

#### 10.1. Define Get Stats Tool Schema
- Create tool definition
- Add category parameter (files, tags, links, all)
- Document stat types

**Acceptance Criteria**:
- [ ] Tool schema complete
- [ ] Categories defined

#### 10.2. Implement Get Stats Handler
- Query shadow cache for counts
- Calculate statistics
- Return formatted stats
- Include cache health info

**Acceptance Criteria**:
- [ ] Stats retrieved from cache
- [ ] All categories supported
- [ ] Health info included

---

### Task 11: Shadow Cache Tool Testing (1.5 hours)
**Priority**: High | **Effort**: 1.5h | **Dependencies**: 5-10

#### 11.1. Create Unit Tests for Each Tool
- Test query_files with various filters
- Test get_file with valid/invalid paths
- Test search_tags with wildcards
- Test search_links bidirectionally
- Test get_stats for all categories

**File**: `tests/unit/mcp-tools/shadow-cache.test.ts`

**Acceptance Criteria**:
- [ ] All tools have unit tests
- [ ] Edge cases covered
- [ ] Error cases tested

#### 11.2. Create Integration Tests
- Test tools against real shadow cache
- Verify query performance (<10ms)
- Test with actual vault data
- Verify response formats

**File**: `tests/integration/shadow-cache-tools.test.ts`

**Acceptance Criteria**:
- [ ] Integration tests passing
- [ ] Performance validated
- [ ] Real data tested

---

## Day 3: Workflow MCP Tools (8 hours)

### Task 12: Trigger Workflow Tool (2 hours)
**Priority**: High | **Effort**: 2h | **Dependencies**: 3

#### 12.1. Define Trigger Workflow Tool Schema
- Create tool definition
- Add workflowId parameter (required)
- Add input parameter (optional object)
- Add async flag
- Document workflow IDs

**Schema**:
```typescript
export const triggerWorkflowTool: Tool = {
  name: 'trigger_workflow',
  description: 'Manually trigger a registered workflow. Returns execution ID for async workflows.',
  inputSchema: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'string',
        description: 'Workflow ID to trigger (e.g., "task-completion", "phase-completion")',
        enum: [
          'task-completion',
          'phase-completion',
          'general-task-tracker',
          'spec-kit-generation',
        ],
      },
      input: {
        type: 'object',
        description: 'Optional input data for workflow',
      },
      async: {
        type: 'boolean',
        description: 'Run workflow asynchronously (returns execution ID)',
        default: false,
      },
    },
    required: ['workflowId'],
  },
};
```

**Acceptance Criteria**:
- [ ] Tool schema complete
- [ ] All workflow IDs listed
- [ ] Async mode documented

#### 12.2. Implement Trigger Workflow Handler
- Validate workflow ID exists
- Parse and validate input
- Trigger workflow via workflow engine
- Return execution ID or result
- Handle synchronous vs asynchronous execution

**Acceptance Criteria**:
- [ ] Workflow triggered correctly
- [ ] Both sync/async modes work
- [ ] Execution ID returned

#### 12.3. Add Workflow Validation
- Check workflow is registered
- Validate input against workflow schema
- Check workflow is enabled
- Return validation errors

**Acceptance Criteria**:
- [ ] Invalid workflows rejected
- [ ] Input validated
- [ ] Clear error messages

---

### Task 13: List Workflows Tool (1 hour)
**Priority**: High | **Effort**: 1h | **Dependencies**: 3

#### 13.1. Define List Workflows Tool Schema
- Create tool definition
- Add enabled filter (optional)
- Add category filter (optional)
- Document return format

**Acceptance Criteria**:
- [ ] Tool schema complete
- [ ] Filters documented

#### 13.2. Implement List Workflows Handler
- Query workflow engine for registered workflows
- Apply filters
- Return workflow metadata (id, name, description, enabled, triggers)
- Sort by name

**Acceptance Criteria**:
- [ ] All workflows listed
- [ ] Filters working
- [ ] Metadata complete

---

### Task 14: Get Workflow Status Tool (1.5 hours)
**Priority**: High | **Effort**: 1.5h | **Dependencies**: 3

#### 14.1. Define Get Workflow Status Tool Schema
- Create tool definition
- Add executionId parameter (required)
- Document status values
- Document progress format

**Acceptance Criteria**:
- [ ] Tool schema complete
- [ ] Status values defined

#### 14.2. Implement Get Workflow Status Handler
- Query workflow execution status
- Return status (pending, running, completed, failed)
- Include progress percentage
- Include execution metadata

**Acceptance Criteria**:
- [ ] Status retrieved correctly
- [ ] Progress tracked
- [ ] Metadata included

---

### Task 15: Get Workflow History Tool (1 hour)
**Priority**: Medium | **Effort**: 1h | **Dependencies**: 3

#### 15.1. Define Get Workflow History Tool Schema
- Create tool definition
- Add workflowId parameter (optional)
- Add limit parameter
- Add since parameter (timestamp)

**Acceptance Criteria**:
- [ ] Tool schema complete
- [ ] Filtering options defined

#### 15.2. Implement Get Workflow History Handler
- Query workflow execution history
- Filter by workflow ID
- Apply time filter
- Return paginated results

**Acceptance Criteria**:
- [ ] History retrieved
- [ ] Filters working
- [ ] Pagination working

---

### Task 16: Workflow Tool Testing (1 hour)
**Priority**: High | **Effort**: 1.5h | **Dependencies**: 12-15

#### 16.1. Create Unit Tests for Workflow Tools
- Test trigger_workflow with valid/invalid IDs
- Test list_workflows with filters
- Test get_workflow_status
- Test get_workflow_history

**Acceptance Criteria**:
- [ ] All tools have unit tests
- [ ] Edge cases covered

#### 16.2. Create Integration Tests
- Test workflow triggering end-to-end
- Test async workflow execution
- Verify status updates
- Test history recording

**Acceptance Criteria**:
- [ ] Integration tests passing
- [ ] Async workflows tested

---

### Task 17: Enhance Proof Workflows (2 hours)
**Priority**: High | **Effort**: 2h | **Dependencies**: 3

#### 17.1. Add Frontmatter Parsing to Task Completion Workflow
- Import frontmatter parser
- Extract task metadata from frontmatter
- Extract task ID and name from path
- Parse status, dates, priority

**File**: `src/workflows/proof-workflows.ts`

**Acceptance Criteria**:
- [ ] Frontmatter parsed correctly
- [ ] All metadata extracted
- [ ] Dates parsed properly

#### 17.2. Store Task Metadata in Shadow Cache
- Create task metadata schema
- Upsert task to shadow cache
- Link to file record
- Update file type to "task_log"

**Acceptance Criteria**:
- [ ] Metadata stored in cache
- [ ] File type updated
- [ ] Links preserved

#### 17.3. Enhance Phase Completion Workflow
- Add frontmatter parsing
- Extract phase metadata
- Store in shadow cache
- Update phase status

**Acceptance Criteria**:
- [ ] Phase metadata stored
- [ ] Status updates tracked

---

## Day 4: Integration, Testing & Documentation (8 hours)

### Task 18: End-to-End Integration Testing (2 hours)
**Priority**: High | **Effort**: 2h | **Dependencies**: ALL

#### 18.1. Create End-to-End Test Suite
- Test complete MCP server startup
- Test all tools sequentially
- Test tool combinations
- Test error scenarios

**File**: `tests/e2e/mcp-server.test.ts`

**Test Scenarios**:
```typescript
describe('MCP Server E2E Tests', () => {
  it('should start server and list tools');
  it('should query files and get file content');
  it('should search tags and links');
  it('should trigger workflow and check status');
  it('should handle invalid tool calls gracefully');
  it('should handle concurrent tool calls');
});
```

**Acceptance Criteria**:
- [ ] E2E tests passing
- [ ] All tools tested
- [ ] Error handling verified

#### 18.2. Performance Testing
- Benchmark tool response times
- Test concurrent requests
- Measure memory usage
- Test under sustained load

**Acceptance Criteria**:
- [ ] Response times < 200ms (p95)
- [ ] Concurrent requests handled
- [ ] Memory stable

---

### Task 19: Claude Desktop Integration (2 hours)
**Priority**: High | **Effort**: 2h | **Dependencies**: 18

#### 19.1. Create Claude Desktop Configuration
- Create config file example
- Document environment variables
- Add troubleshooting section

**File**: `docs/mcp/claude-desktop-setup.md`

**Configuration Example**:
```json
{
  "mcpServers": {
    "weaver": {
      "command": "bun",
      "args": [
        "run",
        "/home/aepod/dev/weave-nn/weaver/src/mcp-server/cli.ts"
      ],
      "env": {
        "VAULT_PATH": "/home/aepod/dev/weave-nn/weave-nn",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Acceptance Criteria**:
- [ ] Config example created
- [ ] Environment vars documented
- [ ] Path instructions clear

#### 19.2. Create MCP CLI Entry Point
- Create CLI script for MCP server
- Handle command-line arguments
- Add version and help commands
- Add connection testing

**File**: `src/mcp-server/cli.ts`

**Acceptance Criteria**:
- [ ] CLI script working
- [ ] Help command functional
- [ ] Connection test available

#### 19.3. Test Claude Desktop Integration
- Install weaver MCP server in Claude Desktop
- Test all tools via Claude Desktop
- Verify stdio communication
- Document any issues

**Acceptance Criteria**:
- [ ] Server connects to Claude Desktop
- [ ] Tools available in Claude
- [ ] Tools functional

---

### Task 20: Documentation (2 hours)
**Priority**: High | **Effort**: 2h | **Dependencies**: 19

#### 20.1. Create MCP Server Overview Documentation
- Explain MCP server architecture
- Document tool categories
- List all available tools
- Explain integration points

**File**: `docs/mcp/overview.md`

**Sections**:
- Architecture diagram
- Tool catalog
- Integration with shadow cache
- Integration with workflow engine
- Performance characteristics

**Acceptance Criteria**:
- [ ] Overview complete
- [ ] Architecture documented
- [ ] Tools cataloged

#### 20.2. Create Tool Reference Documentation
- Document each tool with examples
- Show input parameters
- Show output formats
- Add usage examples

**File**: `docs/mcp/tool-reference.md`

**Format per Tool**:
```markdown
### query_files

**Description**: Search vault files by path, type, status, or tag.

**Parameters**:
- `directory` (string, optional): Filter by directory prefix
- `type` (string, optional): Filter by frontmatter type
- `status` (string, optional): Filter by status
- `tag` (string, optional): Filter by tag
- `limit` (number, optional): Maximum results (default: 50)

**Example**:
{
  "directory": "concepts/",
  "type": "concept",
  "limit": 10
}

**Response**:
[
  {
    "path": "concepts/knowledge-graph.md",
    "type": "concept",
    "status": "active",
    ...
  }
]
```

**Acceptance Criteria**:
- [ ] All tools documented
- [ ] Examples provided
- [ ] Format consistent

#### 20.3. Create Usage Guide
- Getting started tutorial
- Common workflows
- Troubleshooting guide
- FAQ section

**File**: `docs/mcp/usage-guide.md`

**Acceptance Criteria**:
- [ ] Tutorial complete
- [ ] Workflows documented
- [ ] Troubleshooting guide helpful

#### 20.4. Update Main README
- Add MCP section
- Link to documentation
- Show quick start example
- Add badge for MCP support

**File**: `README.md`

**Acceptance Criteria**:
- [ ] README updated
- [ ] Links correct
- [ ] Quick start clear

---

### Task 21: Code Quality & Final Checks (2 hours)
**Priority**: High | **Effort**: 2h | **Dependencies**: ALL

#### 21.1. Run TypeScript Type Checking
- Run `bun run typecheck`
- Fix any type errors
- Add missing type annotations
- Ensure strict mode compliance

**Acceptance Criteria**:
- [ ] Typecheck passes with 0 errors
- [ ] All functions typed
- [ ] Strict mode enabled

#### 21.2. Run Linting
- Run `bun run lint`
- Fix linting errors
- Ensure consistent style
- Update .eslintrc if needed

**Acceptance Criteria**:
- [ ] Lint passes with 0 errors
- [ ] Style consistent

#### 21.3. Run Build Process
- Run `bun run build`
- Verify output files generated
- Check bundle size
- Test built artifacts

**Acceptance Criteria**:
- [ ] Build completes successfully
- [ ] Output verified
- [ ] Bundle size reasonable

#### 21.4. Run Complete Test Suite
- Run all unit tests
- Run all integration tests
- Run all E2E tests
- Verify test coverage > 80%

**Command**:
```bash
bun test
bun test:coverage
```

**Acceptance Criteria**:
- [ ] All tests passing
- [ ] Coverage > 80%
- [ ] No flaky tests

#### 21.5. Manual Testing Checklist
- [ ] MCP server starts without errors
- [ ] All 10 tools listed correctly
- [ ] query_files returns results
- [ ] get_file retrieves metadata
- [ ] search_tags finds files
- [ ] search_links shows connections
- [ ] get_stats shows vault statistics
- [ ] trigger_workflow executes workflows
- [ ] list_workflows shows all workflows
- [ ] get_workflow_status tracks execution
- [ ] get_workflow_history shows past runs
- [ ] Claude Desktop integration working
- [ ] Error handling catches issues
- [ ] Performance meets targets (<200ms)

---

## Critical Path Analysis

### Critical Path (Must Complete in Order)
```
Task 1 → Task 2 → Task 3 → Task 4
                    ↓
              Task 5-10 (Parallel)
                    ↓
              Task 12-15 (Parallel)
                    ↓
              Task 17 → Task 18 → Task 19 → Task 20 → Task 21
```

### Parallel Execution Opportunities
- **Day 2 Morning**: Tasks 5-10 can be done in parallel (shadow cache tools)
- **Day 3 Morning**: Tasks 12-15 can be done in parallel (workflow tools)
- **Day 4**: Tasks 20.1-20.4 documentation can be done in parallel

### Bottleneck Tasks
- Task 3: Tool Registry (blocks all tool implementation)
- Task 18: E2E Testing (blocks final validation)
- Task 21: Final Checks (blocks phase completion)

---

## Effort Summary

### By Day
- **Day 1**: 8 hours (Tasks 1-4)
- **Day 2**: 8 hours (Tasks 5-11)
- **Day 3**: 8 hours (Tasks 12-17)
- **Day 4**: 8 hours (Tasks 18-21)
- **Total**: 32 hours (4 days × 8 hours)

### By Priority
- **High**: 28 hours (14 tasks)
- **Medium**: 4 hours (4 tasks)
- **Total**: 32 hours

### By Category
- **Implementation**: 20 hours
- **Testing**: 6 hours
- **Documentation**: 4 hours
- **Integration**: 2 hours

---

## Risk Mitigation

### Risk 1: MCP SDK Breaking Changes
**Likelihood**: Low | **Impact**: High

**Mitigation**:
- Pin SDK version in package.json
- Review SDK changelog before updates
- Test against stable SDK version

### Risk 2: Performance Issues with Large Vaults
**Likelihood**: Medium | **Impact**: Medium

**Mitigation**:
- Implement pagination on all queries
- Add query result limits
- Cache frequently accessed data
- Benchmark with real vault data

### Risk 3: Claude Desktop Integration Issues
**Likelihood**: Medium | **Impact**: Medium

**Mitigation**:
- Test with latest Claude Desktop version
- Create detailed troubleshooting guide
- Add verbose logging for debugging
- Document common issues and solutions

### Risk 4: Workflow Execution Errors
**Likelihood**: Low | **Impact**: High

**Mitigation**:
- Add comprehensive error handling
- Implement workflow rollback mechanism
- Add execution timeout limits
- Log all workflow executions

---

## Testing Strategy

### Unit Tests (Target: 50+ tests)
- Each tool handler (10 tools × 3 tests = 30 tests)
- Tool registry (5 tests)
- Request handlers (5 tests)
- Error handling (10 tests)

### Integration Tests (Target: 15+ tests)
- Shadow cache tools with real data (6 tests)
- Workflow tools with real engine (4 tests)
- End-to-end workflows (5 tests)

### E2E Tests (Target: 10+ tests)
- Complete MCP server lifecycle (2 tests)
- All tools via MCP protocol (5 tests)
- Claude Desktop integration (3 tests)

### Performance Tests
- Tool response time benchmarks
- Concurrent request handling
- Memory usage under load
- Shadow cache query performance

---

## Success Criteria Validation

### Functional Requirements
- [ ] MCP server starts and connects via stdio
- [ ] 10 MCP tools functional (6 shadow cache + 4 workflow)
- [ ] Shadow cache queries working (<10ms)
- [ ] Workflow triggers working via MCP
- [ ] Proof workflows enhanced with metadata parsing
- [ ] Claude Desktop integration working

### Performance Requirements
- [ ] Tool response time < 200ms (p95)
- [ ] Shadow cache queries < 10ms
- [ ] Memory overhead < 100MB
- [ ] No memory leaks during extended operation

### Quality Requirements
- [ ] Test coverage > 80%
- [ ] TypeScript strict mode enabled
- [ ] No linting errors
- [ ] Complete API documentation
- [ ] Usage examples documented

---

## Deliverables Checklist

### Code Deliverables
- [ ] `/weaver/src/mcp-server/` - MCP server implementation
- [ ] `/weaver/src/mcp-server/tools/` - MCP tool definitions
- [ ] `/weaver/src/mcp-server/handlers/` - Request handlers
- [ ] `/weaver/src/mcp-server/cli.ts` - CLI entry point
- [ ] Enhanced proof workflows with frontmatter parsing
- [ ] Integration tests for all MCP tools
- [ ] Unit tests for all components

### Documentation Deliverables
- [ ] `/docs/mcp/overview.md` - MCP server overview
- [ ] `/docs/mcp/tool-reference.md` - Tool reference
- [ ] `/docs/mcp/usage-guide.md` - Usage guide
- [ ] `/docs/mcp/claude-desktop-setup.md` - Claude Desktop setup
- [ ] Updated README.md with MCP section

### Testing Deliverables
- [ ] Unit tests (50+ tests)
- [ ] Integration tests (15+ tests)
- [ ] E2E tests (10+ tests)
- [ ] Performance benchmarks
- [ ] Test coverage report (>80%)

---

## Next Steps After Phase 5

Once Phase 5 is complete, the following becomes possible:

### Immediate Capabilities
- Claude Desktop can query vault metadata
- Claude Desktop can trigger workflows
- AI agents can search tags and links
- Task metadata tracked automatically

### Phase 6 Prerequisites Met
- MCP protocol proven working
- Tool architecture established
- Integration patterns documented
- Performance validated

### Future Enhancements (Phase 6+)
- Additional MCP tools
- Real-time workflow notifications
- Advanced query capabilities
- Multi-vault support

---

**Generated**: 2025-10-24
**Task Count**: 48 tasks
**Estimated Duration**: 3-4 days (32 hours)
**Confidence Level**: 95%

---

**Note**: This task breakdown was generated using the Spec-Kit methodology. Tasks are designed to be completed sequentially by day, with parallel execution opportunities clearly marked. All tasks include acceptance criteria for validation.
