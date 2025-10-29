---
title: MCP Integration & Workflow Enhancement - Implementation Plan
type: planning
status: ready
phase_id: PHASE-5
tags:
  - spec-kit
  - implementation-plan
  - phase-5
  - mcp-integration
  - phase/phase-5
  - type/architecture
  - status/complete
priority: critical
visual:
  icon: "\U0001F4CB"
  color: '#3B82F6'
  cssclasses:
    - type-planning
    - status-ready
    - priority-critical
    - phase-5
updated: '2025-10-29T04:55:04.465Z'
version: '3.0'
keywords:
  - executive summary
  - key deliverables
  - success metrics
  - related
  - architecture overview
  - current state (phase 4b complete)
  - target state (phase 5)
  - components to build
  - day-by-day implementation plan
  - 'day 1: mcp server foundation (8 hours)'
---

# MCP Integration & Workflow Enhancement - Implementation Plan

**Phase ID**: PHASE-5
**Status**: Ready for Implementation
**Priority**: Critical
**Duration**: 3-4 days (24-32 hours)

---

## Executive Summary

Phase 5 focuses on exposing existing Weaver components (Shadow Cache, Workflow Engine) via the Model Context Protocol (MCP), enabling Claude Desktop and Claude Code to interact with the Weave-NN knowledge graph. This phase does NOT rebuild existing functionality - it creates an MCP interface layer.

### Key Deliverables
1. MCP server with stdio transport
2. 9+ MCP tools (5 shadow cache + 4 workflow)
3. Enhanced proof workflows with frontmatter parsing
4. Claude Desktop integration
5. Comprehensive testing and documentation

### Success Metrics
- All 9+ MCP tools functional
- Query response time < 200ms (p95)
- Shadow cache queries < 10ms
- Test coverage > 80%
- Zero TypeScript/lint errors

---









## Related

[[constitution]]
## Related

[[plan]]
## Related

[[specification]]
## Related

[[phase-5-mcp-tasks]]
## Architecture Overview

### Current State (Phase 4B Complete)
```
Vault Files → File Watcher → Shadow Cache → Workflow Engine → Proof Workflows
```

### Target State (Phase 5)
```
Vault Files
    ↓
File Watcher ✅
    ↓
Shadow Cache ✅ ←─────────┐
    ↓                     │
Workflow Engine ✅         │ MCP Server (NEW)
    ↓                     │   ├── Shadow Cache Tools (5)
Proof Workflows ✅         │   └── Workflow Tools (4)
    ↓                     │
MCP Server ───────────────┘
    ↓
Claude Desktop / Claude Code
```

### Components to Build
1. **MCP Server Core** (`src/mcp-server/index.ts`)
   - Server initialization
   - Stdio transport
   - Request handlers
   - Error handling

2. **Tool Registry** (`src/mcp-server/tools/registry.ts`)
   - Tool definitions
   - Tool routing
   - Input validation

3. **Shadow Cache Tools** (`src/mcp-server/tools/shadow-cache/`)
   - query_files
   - get_file
   - get_file_content
   - search_tags
   - search_links
   - get_stats

4. **Workflow Tools** (`src/mcp-server/tools/workflows/`)
   - trigger_workflow
   - get_workflow_status
   - list_workflows
   - get_workflow_history

5. **Enhanced Proof Workflows** (`src/workflows/proof-workflows.ts`)
   - Frontmatter parsing
   - Task metadata extraction
   - Shadow cache integration

---

## Day-by-Day Implementation Plan

### Day 1: MCP Server Foundation (8 hours)

#### Morning Session (4 hours): Core Server Setup

**Step 1.1: Install Dependencies** (15 min)
```bash
cd /home/aepod/dev/weave-nn/weaver
bun add @modelcontextprotocol/sdk
```

**Step 1.2: Create MCP Server Core** (2 hours)
- File: `src/mcp-server/index.ts`
- Implement `WeaverMCPServer` class
- Add stdio transport
- Set up request handlers for ListTools and CallTool
- Add error handling and logging

**Technical Details**:
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: this.getToolDefinitions() };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return await this.handleToolCall(request);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
```

**Step 1.3: Add Entry Point** (30 min)
- File: `src/mcp-server/cli.ts`
- Create CLI entry point for MCP server
- Add argument parsing
- Add graceful shutdown

**Step 1.4: Test Server Startup** (1 hour)
- Manual testing with stdio
- Verify ListTools response
- Test error handling
- Check logging output

**Acceptance Criteria**:
- ✅ Server starts without errors
- ✅ Responds to ListTools request
- ✅ Stdio transport working
- ✅ Graceful shutdown functional

---

#### Afternoon Session (4 hours): Tool Registry & Architecture

**Step 1.5: Create Tool Registry** (2 hours)
- File: `src/mcp-server/tools/registry.ts`
- Define tool interface
- Create tool registry map
- Implement tool routing logic
- Add input schema validation

**Technical Details**:
```typescript
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { queryFilesTool, handleQueryFiles } from './shadow-cache/query-files.js';
import { getFileTool, handleGetFile } from './shadow-cache/get-file.js';
// ... other imports

export interface ToolHandler {
  definition: Tool;
  handler: (args: any) => Promise<any>;
}

export const toolRegistry: Map<string, ToolHandler> = new Map([
  ['query_files', { definition: queryFilesTool, handler: handleQueryFiles }],
  ['get_file', { definition: getFileTool, handler: handleGetFile }],
  // ... other tools
]);

export function getToolDefinitions(): Tool[] {
  return Array.from(toolRegistry.values()).map(t => t.definition);
}

export async function callTool(name: string, args: any) {
  const tool = toolRegistry.get(name);
  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }
  return await tool.handler(args);
}
```

**Step 1.6: Create Tool Type Definitions** (1 hour)
- File: `src/mcp-server/tools/types.ts`
- Define common types
- Create response formatters
- Add error types

**Step 1.7: Set Up Directory Structure** (30 min)
```
src/mcp-server/
├── index.ts           # Server core
├── cli.ts             # CLI entry point
└── tools/
    ├── registry.ts    # Tool registry
    ├── types.ts       # Common types
    ├── shadow-cache/  # Shadow cache tools
    │   ├── query-files.ts
    │   ├── get-file.ts
    │   ├── get-file-content.ts
    │   ├── search-tags.ts
    │   ├── search-links.ts
    │   └── get-stats.ts
    └── workflows/     # Workflow tools
        ├── trigger-workflow.ts
        ├── get-workflow-status.ts
        ├── list-workflows.ts
        └── get-workflow-history.ts
```

**Step 1.8: Create Tool Stubs** (30 min)
- Create empty files for all 9+ tools
- Add basic structure and exports
- Document required functionality

**Acceptance Criteria**:
- ✅ Tool registry architecture complete
- ✅ All tool files created
- ✅ Type system in place
- ✅ Documentation started

---

### Day 2: Shadow Cache MCP Tools (8 hours)

#### Morning Session (4 hours): Query Tools Implementation

**Step 2.1: Implement `query_files` Tool** (1.5 hours)
- File: `src/mcp-server/tools/shadow-cache/query-files.ts`
- Define tool schema
- Implement handler
- Connect to shadow cache
- Add filtering logic

**Technical Details**:
```typescript
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { shadowCache } from '../../../index.js';

export const queryFilesTool: Tool = {
  name: 'query_files',
  description: 'Search vault files by path, type, status, or tag',
  inputSchema: {
    type: 'object',
    properties: {
      directory: {
        type: 'string',
        description: 'Filter by directory (e.g., "concepts/")',
      },
      type: {
        type: 'string',
        description: 'Filter by frontmatter type',
      },
      status: {
        type: 'string',
        description: 'Filter by status',
      },
      tag: {
        type: 'string',
        description: 'Filter by tag',
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return',
        default: 50,
      },
    },
  },
};

export async function handleQueryFiles(args: any) {
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

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(results.slice(0, limit), null, 2),
      },
    ],
  };
}
```

**Step 2.2: Implement `get_file` Tool** (1 hour)
- File: `src/mcp-server/tools/shadow-cache/get-file.ts`
- Retrieve specific file metadata
- Handle missing files
- Format response

**Step 2.3: Implement `get_file_content` Tool** (1 hour)
- File: `src/mcp-server/tools/shadow-cache/get-file-content.ts`
- Read file content from disk
- Handle file system errors
- Return formatted content

**Step 2.4: Unit Tests for Query Tools** (30 min)
- File: `tests/unit/mcp-tools/query-files.test.ts`
- Test filtering logic
- Test error cases
- Test response format

**Acceptance Criteria**:
- ✅ 3 tools implemented and tested
- ✅ Shadow cache integration working
- ✅ Error handling in place
- ✅ Response format consistent

---

#### Afternoon Session (4 hours): Search Tools & Testing

**Step 2.5: Implement `search_tags` Tool** (1 hour)
- File: `src/mcp-server/tools/shadow-cache/search-tags.ts`
- Query files by tags
- Support multiple tags
- Handle tag relationships

**Step 2.6: Implement `search_links` Tool** (1 hour)
- File: `src/mcp-server/tools/shadow-cache/search-links.ts`
- Query wikilink relationships
- Support bidirectional links
- Format graph data

**Step 2.7: Implement `get_stats` Tool** (1 hour)
- File: `src/mcp-server/tools/shadow-cache/get-stats.ts`
- Aggregate vault statistics
- Return file counts, tag counts, link counts
- Performance metrics

**Step 2.8: Integration Testing** (1 hour)
- File: `tests/integration/mcp-shadow-cache.test.ts`
- Test all 6 shadow cache tools end-to-end
- Benchmark query performance (<10ms)
- Test with real vault data

**Acceptance Criteria**:
- ✅ All 6 shadow cache tools implemented
- ✅ Integration tests passing
- ✅ Performance benchmarks met (<10ms)
- ✅ Documentation updated

---

### Day 3: Workflow Tools & Enhancement (8 hours)

#### Morning Session (4 hours): Workflow MCP Tools

**Step 3.1: Implement `trigger_workflow` Tool** (1.5 hours)
- File: `src/mcp-server/tools/workflows/trigger-workflow.ts`
- Manually trigger registered workflows
- Validate workflow ID
- Handle input data
- Return execution ID

**Technical Details**:
```typescript
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { workflowEngine } from '../../../index.js';

export const triggerWorkflowTool: Tool = {
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
        description: 'Optional input data for workflow',
      },
    },
    required: ['workflowId'],
  },
};

export async function handleTriggerWorkflow(args: any) {
  const { workflowId, input = {} } = args;

  const workflow = workflowEngine.getWorkflow(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  const executionId = await workflowEngine.executeWorkflow(workflowId, input);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ executionId, workflowId }, null, 2),
      },
    ],
  };
}
```

**Step 3.2: Implement `list_workflows` Tool** (1 hour)
- File: `src/mcp-server/tools/workflows/list-workflows.ts`
- List all registered workflows
- Show enabled/disabled status
- Include trigger information

**Step 3.3: Implement `get_workflow_status` Tool** (1 hour)
- File: `src/mcp-server/tools/workflows/get-workflow-status.ts`
- Check execution status by ID
- Return progress information
- Show error details if failed

**Step 3.4: Implement `get_workflow_history` Tool** (30 min)
- File: `src/mcp-server/tools/workflows/get-workflow-history.ts`
- Return execution history
- Support filtering by workflow ID
- Include timing and status info

**Acceptance Criteria**:
- ✅ All 4 workflow tools implemented
- ✅ Integration with workflow engine working
- ✅ Error handling for invalid workflows
- ✅ Tests passing

---

#### Afternoon Session (4 hours): Proof Workflow Enhancement

**Step 3.5: Add Frontmatter Parser** (1.5 hours)
- File: `src/shadow-cache/parser.ts` (enhance existing)
- Parse YAML frontmatter
- Extract task metadata
- Handle invalid frontmatter

**Step 3.6: Enhance Task Completion Workflow** (2 hours)
- File: `src/workflows/proof-workflows.ts`
- Add frontmatter parsing to task-completion workflow
- Extract task metadata (status, dates, tags)
- Store in shadow cache
- Add logging

**Technical Details**:
```typescript
export const taskCompletionWorkflow: WorkflowDefinition = {
  id: 'task-completion',
  name: 'Task Completion Workflow',
  description: 'Tracks task completion and stores metadata',
  triggers: ['file:add', 'file:change'],
  enabled: true,
  fileFilter: '_log/tasks/**/*.md',
  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) return;

    // Parse frontmatter
    const absolutePath = join(config.vault.path, fileEvent.relativePath);
    const content = readFileSync(absolutePath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    // Extract task metadata
    const taskData = {
      path: fileEvent.relativePath,
      taskId: extractTaskId(fileEvent.relativePath),
      taskName: extractTaskName(fileEvent.relativePath),
      status: frontmatter.status || 'pending',
      type: frontmatter.type || 'task',
      createdDate: frontmatter.created_date,
      completedDate: frontmatter.completed_date,
      tags: extractTags(content),
    };

    // Store in shadow cache
    shadowCache.upsertFile({
      path: fileEvent.relativePath,
      frontmatter: taskData,
      type: 'task_log',
      // ... other metadata
    });

    logger.info('✅ Task metadata stored', taskData);
  },
};
```

**Step 3.7: Test Enhanced Workflows** (30 min)
- File: `tests/integration/proof-workflows.test.ts`
- Test frontmatter parsing
- Test metadata extraction
- Test shadow cache integration
- Verify with real task files

**Acceptance Criteria**:
- ✅ Frontmatter parsing working
- ✅ Task metadata stored in shadow cache
- ✅ Phase completion workflow enhanced
- ✅ End-to-end tests passing

---

### Day 4: Integration, Testing & Documentation (8 hours)

#### Morning Session (4 hours): Integration & Testing

**Step 4.1: End-to-End Integration Testing** (2 hours)
- File: `tests/integration/mcp-server-full.test.ts`
- Test complete MCP server workflow
- Test all tools via MCP protocol
- Test error handling
- Test concurrent requests

**Step 4.2: Performance Testing** (1 hour)
- File: `tests/performance/mcp-tools.bench.ts`
- Benchmark all tool response times
- Test with large datasets
- Verify <200ms p95 requirement
- Check memory usage

**Step 4.3: Create Claude Desktop Config** (30 min)
- File: `docs/claude-desktop-setup.md`
- Document configuration steps
- Provide config.json example
- Add troubleshooting guide

**Example Configuration**:
```json
{
  "mcpServers": {
    "weaver": {
      "command": "node",
      "args": [
        "/home/aepod/dev/weave-nn/weaver/dist/mcp-server/cli.js"
      ],
      "env": {
        "VAULT_PATH": "/home/aepod/dev/weave-nn/weave-nn"
      }
    }
  }
}
```

**Step 4.4: Manual Claude Desktop Testing** (30 min)
- Install config in Claude Desktop
- Test tool discovery
- Test each tool manually
- Verify responses

**Acceptance Criteria**:
- ✅ Integration tests passing (100%)
- ✅ Performance benchmarks met
- ✅ Claude Desktop config working
- ✅ Manual testing complete

---

#### Afternoon Session (4 hours): Documentation & Polish

**Step 4.5: Tool Reference Documentation** (1.5 hours)
- File: `docs/mcp-tools-reference.md`
- Document each tool
- Include input schemas
- Show example requests/responses
- Add use cases

**Step 4.6: Developer Guide** (1.5 hours)
- File: `docs/mcp-development-guide.md`
- Architecture overview
- Adding new tools guide
- Testing guidelines
- Debugging tips

**Step 4.7: Usage Examples** (30 min)
- File: `docs/mcp-usage-examples.md`
- Common query patterns
- Workflow automation examples
- Integration scenarios

**Step 4.8: Update README** (30 min)
- File: `README.md`
- Add MCP section
- Link to documentation
- Add quick start guide

**Step 4.9: Final Quality Checks** (30 min)
```bash
bun run typecheck  # Must pass
bun run lint       # Must pass
bun run test       # Must pass
bun run build      # Must succeed
```

**Acceptance Criteria**:
- ✅ All documentation complete
- ✅ Examples working
- ✅ README updated
- ✅ All quality checks passing

---

## Technical Implementation Details

### MCP Server Architecture

```typescript
// Server lifecycle
WeaverMCPServer
  ├── Server (from @modelcontextprotocol/sdk)
  ├── StdioServerTransport
  ├── Request Handlers
  │   ├── ListToolsRequestSchema → getToolDefinitions()
  │   └── CallToolRequestSchema → callTool(name, args)
  └── Graceful Shutdown

// Tool execution flow
Client Request
  → MCP Server receives via stdio
  → Parse request (ListTools or CallTool)
  → Route to tool registry
  → Execute tool handler
  → Format response
  → Return via stdio
```

### Tool Registry Pattern

```typescript
// Each tool exports:
1. Tool definition (schema)
2. Handler function (implementation)

// Registry maps name → {definition, handler}
// This allows:
- Easy tool discovery
- Centralized routing
- Type-safe tool calls
- Consistent error handling
```

### Shadow Cache Integration

```typescript
// Tools call existing shadow cache methods:
shadowCache.getAllFiles()
shadowCache.getFilesByType(type)
shadowCache.getFilesByStatus(status)
shadowCache.getFilesByTag(tag)
shadowCache.getFile(path)

// No new shadow cache methods needed
// MCP tools are thin wrappers
```

### Workflow Engine Integration

```typescript
// Tools call existing workflow engine methods:
workflowEngine.getWorkflow(id)
workflowEngine.executeWorkflow(id, input)
workflowEngine.getExecutionStatus(id)
workflowEngine.getHistory(filter)

// Add execution tracking if needed
// Store execution results in shadow cache
```

---

## Testing Strategy

### Unit Tests
- Test each tool handler in isolation
- Mock shadow cache and workflow engine
- Test input validation
- Test error cases
- Target: 90%+ coverage

### Integration Tests
- Test MCP server with real components
- Test all tools end-to-end
- Test with real vault data
- Test concurrent requests
- Target: 100% tool coverage

### Performance Tests
- Benchmark tool response times
- Test with large datasets (1000+ files)
- Test query performance
- Monitor memory usage
- Target: <200ms p95, <10ms shadow cache queries

### Manual Testing
- Test in Claude Desktop
- Test in Claude Code
- Test error scenarios
- Test edge cases
- Document known issues

---

## Risk Mitigation

### Risk 1: MCP Protocol Changes
**Likelihood**: Low (v1.0 stable)
**Impact**: High
**Mitigation**:
- Use official SDK
- Pin SDK version
- Follow official examples
- Monitor SDK releases

### Risk 2: Performance Issues
**Likelihood**: Low (shadow cache is fast)
**Impact**: Medium
**Mitigation**:
- Benchmark early
- Optimize queries
- Add caching if needed
- Monitor in production

### Risk 3: Claude Desktop Integration Issues
**Likelihood**: Medium (platform-specific)
**Impact**: Medium
**Mitigation**:
- Test on target platforms
- Document known issues
- Provide troubleshooting guide
- Create fallback options

### Risk 4: Frontmatter Parsing Edge Cases
**Likelihood**: Medium (varied frontmatter formats)
**Impact**: Low
**Mitigation**:
- Use robust YAML parser
- Handle invalid frontmatter gracefully
- Add validation
- Log parsing errors

---

## Quality Gates

Each day must pass these gates before proceeding:

### Day 1 Gate
- [ ] MCP server starts and connects
- [ ] ListTools returns tool list
- [ ] Tool registry architecture complete
- [ ] All tool stubs created
- [ ] No TypeScript errors
- [ ] Code passes lint

### Day 2 Gate
- [ ] All 6 shadow cache tools implemented
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Query performance < 10ms
- [ ] No TypeScript errors
- [ ] Code passes lint

### Day 3 Gate
- [ ] All 4 workflow tools implemented
- [ ] Frontmatter parsing working
- [ ] Proof workflows enhanced
- [ ] Integration tests passing
- [ ] No TypeScript errors
- [ ] Code passes lint

### Day 4 Gate
- [ ] End-to-end tests passing
- [ ] Performance benchmarks met
- [ ] Claude Desktop integration working
- [ ] All documentation complete
- [ ] README updated
- [ ] All quality checks passing (typecheck, lint, test, build)

---

## Success Criteria (Final)

### Functional Requirements
- ✅ MCP server operational via stdio
- ✅ 9+ MCP tools functional and tested
- ✅ Shadow cache queries working (<10ms)
- ✅ Workflow triggers working via MCP
- ✅ Proof workflows enhanced with metadata
- ✅ Claude Desktop integration working

### Performance Requirements
- ✅ Tool response time < 200ms (p95)
- ✅ Shadow cache queries < 10ms
- ✅ Memory overhead < 100MB
- ✅ No memory leaks during extended operation

### Quality Requirements
- ✅ Test coverage > 80%
- ✅ TypeScript strict mode enabled
- ✅ Zero linting errors
- ✅ Complete API documentation
- ✅ Usage examples documented
- ✅ Build succeeds without errors

### Integration Requirements
- ✅ Claude Desktop config working
- ✅ All tools discoverable
- ✅ Error messages helpful
- ✅ Logging comprehensive

---

## Deliverables Checklist

### Code
- [ ] `/weaver/src/mcp-server/index.ts` - MCP server core
- [ ] `/weaver/src/mcp-server/cli.ts` - CLI entry point
- [ ] `/weaver/src/mcp-server/tools/registry.ts` - Tool registry
- [ ] `/weaver/src/mcp-server/tools/types.ts` - Common types
- [ ] `/weaver/src/mcp-server/tools/shadow-cache/*.ts` - 6 shadow cache tools
- [ ] `/weaver/src/mcp-server/tools/workflows/*.ts` - 4 workflow tools
- [ ] Enhanced `src/workflows/proof-workflows.ts` - Frontmatter parsing
- [ ] Enhanced `src/shadow-cache/parser.ts` - YAML parsing

### Tests
- [ ] `tests/unit/mcp-tools/*.test.ts` - Unit tests for each tool
- [ ] `tests/integration/mcp-shadow-cache.test.ts` - Shadow cache integration
- [ ] `tests/integration/mcp-workflows.test.ts` - Workflow integration
- [ ] `tests/integration/mcp-server-full.test.ts` - End-to-end tests
- [ ] `tests/integration/proof-workflows.test.ts` - Enhanced workflow tests
- [ ] `tests/performance/mcp-tools.bench.ts` - Performance benchmarks

### Documentation
- [ ] `docs/mcp-tools-reference.md` - Tool API reference
- [ ] `docs/mcp-development-guide.md` - Developer guide
- [ ] `docs/mcp-usage-examples.md` - Usage examples
- [ ] `docs/claude-desktop-setup.md` - Claude Desktop config guide
- [ ] Updated `README.md` - MCP section added

### Configuration
- [ ] `package.json` - Updated scripts for MCP server
- [ ] `tsconfig.json` - Verified configuration
- [ ] Example Claude Desktop config in docs

---

## Dependencies & Prerequisites

### External Dependencies
- `@modelcontextprotocol/sdk` v1.0.4+ (to be installed)
- All other dependencies already installed in Phase 4B

### Internal Prerequisites
- ✅ Shadow Cache operational (Phase 4B)
- ✅ Workflow Engine operational (Phase 4B)
- ✅ File Watcher operational (Phase 4B)
- ✅ Configuration system operational (Phase 4B)

### Environment Requirements
- Node.js >= 20.0.0
- Bun >= 1.0.0
- TypeScript 5.7.2
- Vault path configured in `.env`

---

## Post-Implementation Tasks

### Immediate (Day 4 Completion)
1. Deploy MCP server to development environment
2. Share Claude Desktop config with team
3. Conduct team training on MCP tools
4. Create example workflows using MCP tools

### Short-term (Week 1-2)
1. Gather user feedback on tool usability
2. Monitor performance in production
3. Address any integration issues
4. Create additional usage examples

### Medium-term (Month 1)
1. Add more advanced query tools if needed
2. Implement tool request/response caching
3. Add metrics and monitoring
4. Optimize frequently-used queries

---

## Appendix A: Tool Specifications

### Shadow Cache Tools (6)

#### 1. `query_files`
**Purpose**: Search vault files with flexible filtering
**Input**: directory, type, status, tag, limit
**Output**: Array of file metadata objects
**Performance**: <10ms

#### 2. `get_file`
**Purpose**: Get specific file metadata
**Input**: path (required)
**Output**: File metadata object
**Performance**: <5ms

#### 3. `get_file_content`
**Purpose**: Read file content from disk
**Input**: path (required)
**Output**: File content as text
**Performance**: <50ms (I/O bound)

#### 4. `search_tags`
**Purpose**: Find files by tags
**Input**: tags (array), operator (AND/OR)
**Output**: Array of files with matching tags
**Performance**: <10ms

#### 5. `search_links`
**Purpose**: Query wikilink relationships
**Input**: path (required), direction (forward/backward/both)
**Output**: Array of linked files
**Performance**: <10ms

#### 6. `get_stats`
**Purpose**: Get vault statistics
**Input**: None
**Output**: Aggregated counts (files, tags, links, types)
**Performance**: <10ms

### Workflow Tools (4)

#### 1. `trigger_workflow`
**Purpose**: Manually trigger a workflow
**Input**: workflowId (required), input (optional)
**Output**: Execution ID
**Performance**: <100ms

#### 2. `list_workflows`
**Purpose**: List all registered workflows
**Input**: filter (optional: enabled/disabled/all)
**Output**: Array of workflow definitions
**Performance**: <10ms

#### 3. `get_workflow_status`
**Purpose**: Check workflow execution status
**Input**: executionId (required)
**Output**: Status, progress, errors
**Performance**: <10ms

#### 4. `get_workflow_history`
**Purpose**: View workflow execution history
**Input**: workflowId (optional), limit (optional)
**Output**: Array of execution records
**Performance**: <20ms

---

## Appendix B: File Structure

```
weaver/
├── src/
│   ├── mcp-server/              # NEW
│   │   ├── index.ts             # Server core
│   │   ├── cli.ts               # CLI entry point
│   │   └── tools/
│   │       ├── registry.ts      # Tool registry
│   │       ├── types.ts         # Common types
│   │       ├── shadow-cache/    # Shadow cache tools
│   │       │   ├── query-files.ts
│   │       │   ├── get-file.ts
│   │       │   ├── get-file-content.ts
│   │       │   ├── search-tags.ts
│   │       │   ├── search-links.ts
│   │       │   └── get-stats.ts
│   │       └── workflows/       # Workflow tools
│   │           ├── trigger-workflow.ts
│   │           ├── list-workflows.ts
│   │           ├── get-workflow-status.ts
│   │           └── get-workflow-history.ts
│   ├── shadow-cache/            # ENHANCED
│   │   └── parser.ts            # Add YAML parsing
│   ├── workflows/               # ENHANCED
│   │   └── proof-workflows.ts   # Add frontmatter parsing
│   └── ... (existing files)
├── tests/
│   ├── unit/
│   │   └── mcp-tools/           # NEW
│   │       ├── query-files.test.ts
│   │       ├── get-file.test.ts
│   │       └── ... (9+ test files)
│   ├── integration/
│   │   ├── mcp-shadow-cache.test.ts  # NEW
│   │   ├── mcp-workflows.test.ts     # NEW
│   │   ├── mcp-server-full.test.ts   # NEW
│   │   └── proof-workflows.test.ts   # NEW
│   └── performance/
│       └── mcp-tools.bench.ts   # NEW
├── docs/                         # ENHANCED
│   ├── mcp-tools-reference.md   # NEW
│   ├── mcp-development-guide.md # NEW
│   ├── mcp-usage-examples.md    # NEW
│   └── claude-desktop-setup.md  # NEW
├── package.json                 # UPDATED (add MCP scripts)
└── README.md                    # UPDATED (add MCP section)
```

---

## Appendix C: Example MCP Tool Interactions

### Example 1: Query Recent Tasks
```json
{
  "method": "tools/call",
  "params": {
    "name": "query_files",
    "arguments": {
      "directory": "_log/tasks/",
      "status": "completed",
      "limit": 10
    }
  }
}
```

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "[{\"path\":\"_log/tasks/TASK-001.md\",\"status\":\"completed\",...}]"
    }
  ]
}
```

### Example 2: Trigger Workflow
```json
{
  "method": "tools/call",
  "params": {
    "name": "trigger_workflow",
    "arguments": {
      "workflowId": "task-completion",
      "input": {
        "force": true
      }
    }
  }
}
```

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"executionId\":\"exec-123\",\"workflowId\":\"task-completion\"}"
    }
  ]
}
```

### Example 3: Search by Tags
```json
{
  "method": "tools/call",
  "params": {
    "name": "search_tags",
    "arguments": {
      "tags": ["concept", "graph-theory"],
      "operator": "AND"
    }
  }
}
```

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "[{\"path\":\"concepts/knowledge-graph.md\",...}]"
    }
  ]
}
```

---

## Appendix D: Timeline Visualization

```
Day 1: Foundation
├── Morning:   MCP Server Core [████████] 4h
└── Afternoon: Tool Registry   [████████] 4h

Day 2: Shadow Cache Tools
├── Morning:   Query Tools (3) [████████] 4h
└── Afternoon: Search Tools (3)[████████] 4h

Day 3: Workflows & Enhancement
├── Morning:   Workflow Tools  [████████] 4h
└── Afternoon: Proof Workflows [████████] 4h

Day 4: Integration & Docs
├── Morning:   Testing & Setup [████████] 4h
└── Afternoon: Documentation   [████████] 4h

Total: 32 hours over 4 days
```

---

## Next Steps

1. **Review this plan** with team
2. **Set up development environment**
   ```bash
   cd /home/aepod/dev/weave-nn/weaver
   bun install
   bun run typecheck  # Verify baseline
   ```
3. **Run `/speckit.tasks`** to generate detailed task list
4. **Begin Day 1 implementation**
5. **Daily standups** to track progress

---

**Generated**: 2025-10-24
**Author**: Claude Code (Spec-Kit Workflow)
**Status**: Ready for Implementation
**Next**: Run `/speckit.tasks` to generate actionable task breakdown
