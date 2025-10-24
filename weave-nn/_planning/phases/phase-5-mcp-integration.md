---
phase_id: "PHASE-5"
phase_name: "MCP Integration & Workflow Enhancement"
status: "pending"
priority: "critical"
created_date: "2025-10-24"
start_date: "TBD"
end_date: "TBD"
duration: "3-4 days"
dependencies:
  requires: ["PHASE-4B"]
  enables: ["PHASE-6"]
tags:
  - phase
  - mcp
  - integration
  - critical
visual:
  icon: "plug"
  cssclasses:
    - type-implementation
    - status-pending
    - priority-critical
---

# Phase 5: MCP Integration & Workflow Enhancement

**Status**: ⏳ **PENDING**
**Priority**: 🔴 **CRITICAL**
**Duration**: 3-4 days
**Depends On**: [[phase-4b-pre-development-mvp-planning-sprint|Phase 4B]] ✅

---

## 📊 Phase 4B Accomplishments (Baseline)

Phase 4B delivered significantly more than originally planned:

### ✅ Completed in Phase 4B
1. **File Watcher (chokidar)** - Real-time vault monitoring, event-driven
2. **Shadow Cache (SQLite)** - 229 files, 306 tags, 2,724 links indexed
3. **Workflow Engine** - Event-driven orchestration, parallel execution
4. **Proof Workflows** - task-completion, phase-completion, general-task-tracker
5. **Configuration System** - Zod validation, type-safe env management
6. **Logging System** - Structured logging with context
7. **Code Quality Standards** - Mandatory typecheck + lint
8. **Spec-Kit Integration** - AI-powered phase planning (bonus!)

**Current Architecture**:
```
Vault Files → File Watcher ✅ → Shadow Cache ✅ → Workflow Engine ✅ → Proof Workflows ✅
```

---

## 🎯 Phase 5 Objectives (Revised Scope)

Phase 5 focuses on **exposing existing components** via MCP protocol, not rebuilding them.

### Primary Goals

1. **MCP Server Implementation**
   - Implement `@modelcontextprotocol/sdk` server with stdio transport
   - Enable Claude Desktop and Claude Code integration
   - Production-grade error handling and logging

2. **Shadow Cache MCP Tools**
   - Expose shadow cache queries as MCP tools
   - Enable AI agents to search vault metadata
   - Fast queries (<10ms) via existing SQLite cache

3. **Workflow MCP Tools**
   - Expose workflow triggers and status as MCP tools
   - Enable AI agents to trigger and monitor workflows
   - Integration with existing workflow engine

4. **Proof Workflow Enhancement**
   - Add frontmatter parsing to task-completion workflow
   - Store task metadata in shadow cache
   - Enable rich task tracking and reporting

---

## 📋 Implementation Tasks

### Day 1: MCP Server Setup (8 hours)
- [ ] Implement `@modelcontextprotocol/sdk` server
- [ ] Stdio transport for Claude Desktop integration
- [ ] Server lifecycle (startup, shutdown, health checks)
- [ ] Error handling and logging

#### Morning (4 hours): MCP Server Foundation

**Install Dependencies**:
```bash
cd /home/aepod/dev/weave-nn/weaver
bun add @modelcontextprotocol/sdk
```

**Implement MCP Server** (`src/mcp-server/index.ts`):
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
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getToolDefinitions()
      };
    });

    // Handle tool calls
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

**Success Criteria**:
- [x] MCP server starts and connects via stdio
- [x] Server responds to ListTools request
- [x] Basic error handling in place
- [x] Logging configured

#### Afternoon (4 hours): Tool Registry & Architecture

**Create Tool Registry** (`src/mcp-server/tools/registry.ts`):
```typescript
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export function getToolDefinitions(): Tool[] {
  return [
    // Shadow Cache Tools
    queryFilesTool,
    getFileTool,
    searchTagsTool,
    searchLinksTool,
    getStatsTool,

    // Workflow Tools
    triggerWorkflowTool,
    listWorkflowsTool,
    getWorkflowStatusTool,
    getWorkflowHistoryTool,
  ];
}
```

**Success Criteria**:
- [x] Tool registry architecture defined
- [x] Tool definitions created (stubs)
- [x] Integration points identified
- [x] Documentation started

---

### Day 2: Shadow Cache MCP Tools (8 hours)

- [ ] `query_files` - Search files by path, type, status, tag
- [ ] `get_file` - Retrieve specific file metadata
- [ ] `get_file_content` - Read file content
- [ ] `search_tags` - Find files by tags
- [ ] `search_links` - Query wikilink relationships
- [ ] `get_stats` - Vault statistics

#### Morning (4 hours): Query Tools

**Implement Query Files Tool** (`src/mcp-server/tools/query-files.ts`):
```typescript
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { shadowCache } from '../../index.js';

export const queryFilesTool: Tool = {
  name: 'query_files',
  description: 'Search vault files by path, type, status, or tag',
  inputSchema: {
    type: 'object',
    properties: {
      directory: {
        type: 'string',
        description: 'Filter by directory (e.g., "concepts/")'
      },
      type: {
        type: 'string',
        description: 'Filter by frontmatter type'
      },
      status: {
        type: 'string',
        description: 'Filter by status'
      },
      tag: {
        type: 'string',
        description: 'Filter by tag'
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return',
        default: 50
      }
    }
  }
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
        text: JSON.stringify(results.slice(0, limit), null, 2)
      }
    ]
  };
}
```

**Implement Additional Tools**:
- `get_file` - Retrieve specific file metadata
- `search_tags` - Find files by tag
- `search_links` - Query wikilink relationships
- `get_stats` - Vault statistics

**Success Criteria**:
- [x] 5 shadow cache tools implemented
- [x] All tools using existing shadow cache methods
- [x] Response format consistent
- [x] Error handling for missing files

#### Afternoon (4 hours): Testing & Integration

**Create Integration Tests** (`tests/integration/mcp-tools.test.ts`):
```typescript
import { WeaverMCPServer } from '../../src/mcp-server/index.js';

describe('MCP Shadow Cache Tools', () => {
  let server: WeaverMCPServer;

  beforeAll(async () => {
    server = new WeaverMCPServer();
  });

  it('should query files by type', async () => {
    const result = await server.callTool('query_files', {
      type: 'concept'
    });

    expect(result.content[0].text).toContain('knowledge-graph');
  });

  it('should get specific file', async () => {
    const result = await server.callTool('get_file', {
      path: 'concepts/knowledge-graph.md'
    });

    expect(result.content[0].text).toContain('knowledge-graph');
  });
});
```

**Success Criteria**:
- [x] Integration tests passing
- [x] All 5 tools tested end-to-end
- [x] Performance benchmarks (<10ms queries)
- [x] Documentation updated

---

### Day 3: Workflow MCP Tools (8 hours)

- [ ] `trigger_workflow` - Manually trigger workflow
- [ ] `get_workflow_status` - Check execution status
- [ ] `list_workflows` - Show registered workflows
- [ ] `get_workflow_history` - View execution history

#### Morning (4 hours): Workflow Tool Implementation

**Implement Workflow Tools**:

1. `trigger_workflow` - Manually trigger workflow
```typescript
export const triggerWorkflowTool: Tool = {
  name: 'trigger_workflow',
  description: 'Manually trigger a registered workflow',
  inputSchema: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'string',
        description: 'Workflow ID to trigger'
      },
      input: {
        type: 'object',
        description: 'Optional input data for workflow'
      }
    },
    required: ['workflowId']
  }
};
```

2. `list_workflows` - Show registered workflows
3. `get_workflow_status` - Check execution status
4. `get_workflow_history` - View execution history

**Success Criteria**:
- [x] 4 workflow tools implemented
- [x] Integration with existing workflow engine
- [x] Workflow execution tracking working
- [x] Error handling for invalid workflows

#### Afternoon (4 hours): Proof Workflow Enhancement

**Enhance Task Completion Workflow** (`src/workflows/proof-workflows.ts`):
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

**Success Criteria**:
- [x] Frontmatter parsing added
- [x] Task metadata stored in shadow cache
- [x] Phase completion workflow enhanced similarly
- [x] End-to-end test passing

---

### Day 4: Integration, Testing & Documentation (8 hours)

#### Tasks:
- [ ] Complete integration testing (MCP server + tools)
- [ ] Add Claude Desktop configuration example
- [ ] Performance testing and optimization
- [ ] Create developer documentation
- [ ] Create usage examples
- [ ] Update README with MCP setup instructions

**Claude Desktop Configuration** (`~/.config/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "weaver": {
      "command": "node",
      "args": [
        "/home/aepod/dev/weave-nn/weaver/dist/index.js"
      ],
      "env": {
        "VAULT_PATH": "/home/aepod/dev/weave-nn/weave-nn"
      }
    }
  }
}
```

---

## ✅ Success Criteria

### Functional Requirements
- [ ] MCP server starts and connects via stdio
- [ ] 9+ MCP tools functional (5 shadow cache + 4 workflow)
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

## 🔗 Architecture

### Before Phase 5
```
Vault Files
    ↓
File Watcher ✅
    ↓
Shadow Cache ✅
    ↓
Workflow Engine ✅
    ↓
Proof Workflows ✅
```

### After Phase 5
```
Vault Files
    ↓
File Watcher ✅
    ↓
Shadow Cache ✅ ←──────────┐
    ↓                      │
Workflow Engine ✅          │ MCP Tools (NEW)
    ↓                      │   - query_files
Proof Workflows ✅ (enhanced)│   - get_file
    ↓                      │   - search_tags
MCP Server (NEW) ──────────┘   - trigger_workflow
    ↓                          - list_workflows
Claude Desktop / Claude Code
```

---

## 📝 Deliverables

### Code
- [ ] `/weaver/src/mcp-server/` - MCP server implementation
- [ ] `/weaver/src/mcp-server/tools/` - MCP tool definitions
- [ ] Enhanced proof workflows with frontmatter parsing
- [ ] Integration tests for all MCP tools

### Documentation
- [ ] MCP server setup guide
- [ ] Tool reference documentation
- [ ] Claude Desktop configuration guide
- [ ] Usage examples and tutorials

### Testing
- [ ] Unit tests for MCP tools
- [ ] Integration tests (server + tools)
- [ ] End-to-end workflow tests
- [ ] Performance benchmarks

---

## 🚫 Out of Scope (Phase 6+)

The following items are **NOT** part of Phase 5:

- ❌ Obsidian REST API client (not needed - direct file access works)
- ❌ Advanced workflow orchestration (basic triggers sufficient)
- ❌ Multi-agent coordination (future enhancement)
- ❌ Real-time collaboration features
- ❌ Web UI or dashboard
- ❌ Advanced AI features beyond MCP protocol

---

## 🔗 Related Documentation

### Technical References
- [[../../technical/modelcontextprotocol-sdk|MCP SDK]]
- [[../../protocols/application/mcp|MCP Protocol]]
- [[PHASE-4B-COMPLETION-REPORT|Phase 4B Completion Report]]

### Integration Points
- [[../../mcp/weaver-mcp-tools|Weaver MCP Tools Reference]]
- [[../../integrations/claude-desktop|Claude Desktop Integration]]

### Next Phase
- [[phase-6-obsidian-integration|Phase 6: Obsidian Plugin Integration]]

---

## 📊 Confidence & Risk Assessment

**Confidence**: 95%
- Shadow cache proven working (229 files indexed)
- Workflow engine proven working (7 workflows registered)
- MCP protocol well-documented
- Components ready for integration

**Risks**:
- Low: MCP protocol changes (stable v1.0)
- Low: Performance issues (shadow cache is fast)
- Medium: Claude Desktop integration quirks (fixable)

**Mitigation**:
- Use official MCP SDK examples
- Test incrementally (tool by tool)
- Create fallback error handling
- Document known issues

---

**Phase Owner**: Development Team
**Review Frequency**: Daily
**Estimated Effort**: 3-4 days (down from 8-10 days in original plan)

**Note**: Phase 4B delivered more than expected, significantly reducing Phase 5 scope.
