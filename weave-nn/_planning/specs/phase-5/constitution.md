---
title: MCP Integration & Workflow Enhancement - Constitution
type: architecture
status: in-progress
phase_id: PHASE-5
tags:
  - phase/phase-5
  - type/architecture
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4CB"
  color: '#50E3C2'
  cssclasses:
    - architecture-document
updated: '2025-10-29T04:55:04.424Z'
keywords:
  - project principles
  - 1. **integration over reimplementation**
  - 2. **mcp protocol-first design**
  - 3. **performance by design**
  - 4. **incremental delivery**
  - 5. **test-driven quality**
  - 6. **documentation as deliverable**
  - 7. **error handling excellence**
  - 8. **backwards compatibility**
  - technical constraints
---
# MCP Integration & Workflow Enhancement - Constitution

**Phase ID**: PHASE-5
**Status**: pending
**Priority**: critical
**Duration**: 3-4 days

---

## Project Principles

### 1. **Integration Over Reimplementation**
Phase 4B delivered a robust foundation (file watcher, shadow cache, workflow engine, proof workflows). Phase 5 **exposes** these components via MCP protocol rather than rebuilding them. Prefer composition and integration over duplication.

### 2. **MCP Protocol-First Design**
All external interfaces follow the Model Context Protocol specification strictly. Use `@modelcontextprotocol/sdk` official implementation. Claude Desktop and Claude Code are primary integration targets.

### 3. **Performance by Design**
- Shadow cache queries must complete in <10ms (p95)
- MCP tool responses must complete in <200ms (p95)
- No memory leaks during extended operation
- Memory overhead <100MB baseline

### 4. **Incremental Delivery**
Implement tools incrementally, one category at a time:
- Day 1: MCP server foundation
- Day 2: Shadow cache tools (6 tools)
- Day 3: Workflow tools (4 tools) + Proof workflow enhancement
- Day 4: Integration, testing, documentation

### 5. **Test-Driven Quality**
- Write integration tests for each MCP tool before marking as complete
- Achieve >80% test coverage
- All tests must pass before proceeding to next phase
- Performance benchmarks are acceptance criteria

### 6. **Documentation as Deliverable**
Documentation is not an afterthought. Each tool requires:
- API documentation (parameters, responses, errors)
- Usage examples with real queries
- Claude Desktop configuration examples
- Integration guides

### 7. **Error Handling Excellence**
MCP tools must handle all error cases gracefully:
- Missing files → descriptive error messages
- Invalid parameters → validation errors with suggestions
- System errors → logged with context, safe user-facing messages
- Timeout handling for long-running operations

### 8. **Backwards Compatibility**
Phase 5 must not break existing Phase 4B functionality:
- File watcher continues operating independently
- Shadow cache remains performant
- Workflow engine unaffected by MCP integration
- Proof workflows continue functioning

## Technical Constraints

### Language & Runtime
- **TypeScript 5.x** with strict mode enabled (no `any` types without justification)
- **Bun** package manager and runtime (not Node.js)
- **ES modules** only (no CommonJS)
- Target: ES2022

### Dependencies
- **Required**: `@modelcontextprotocol/sdk` (official MCP implementation)
- **Existing**: Leverage Phase 4B components (chokidar, better-sqlite3, zod, pino)
- **Constraint**: No additional heavy dependencies without justification
- **Bundle size**: Keep MCP server bundle <2MB

### Architecture
- **MCP Server**: Single server instance managing all tools
- **Transport**: Stdio only (no HTTP/WebSocket in Phase 5)
- **Tool Handlers**: Pure functions accepting validated input, returning MCP response format
- **Error Handling**: All errors caught and returned as MCP error responses
- **Logging**: Use existing pino logger with MCP-specific context

### File Organization
```
/weaver/src/
├── mcp-server/
│   ├── index.ts              # WeaverMCPServer class
│   ├── types.ts              # MCP-specific types
│   └── tools/
│       ├── registry.ts       # Tool definitions
│       ├── shadow-cache.ts   # Shadow cache tool handlers
│       └── workflow.ts       # Workflow tool handlers
├── shadow-cache/             # Existing (no changes)
├── workflow-engine/          # Existing (no changes)
└── workflows/
    └── proof-workflows.ts    # Enhanced with frontmatter parsing
```

### Integration Points
- **Shadow Cache**: Read-only access via existing `ShadowCache` class methods
- **Workflow Engine**: Trigger/query via existing `WorkflowEngine` class methods
- **File System**: Read-only access to vault files (no writes via MCP in Phase 5)
- **Configuration**: Use existing `config` from Phase 4B

### Breaking Change Policy
Phase 5 must maintain 100% compatibility with Phase 4B:
- ❌ No modifications to shadow cache schema
- ❌ No changes to workflow engine API
- ❌ No alterations to file watcher behavior
- ✅ Additive changes only (new exports, new optional features)

### Code Quality Gates
All code must pass before PR approval:
```bash
bun run typecheck  # 0 errors
bun run lint       # 0 errors
bun run build      # success
bun run test       # 80%+ coverage, all passing
```

## Success Criteria

### Functional Acceptance Criteria

**MCP Server Foundation**:
- ✅ MCP server starts successfully via stdio transport
- ✅ Server responds to `ListTools` requests with all 10 tools (6 shadow cache + 4 workflow)
- ✅ Server handles `CallTool` requests without crashes
- ✅ Graceful shutdown with cleanup on termination signals

**Shadow Cache Tools (6 tools)**:
- ✅ `query_files` - Search by directory, type, status, tag (with limit)
- ✅ `get_file` - Retrieve specific file metadata by path
- ✅ `get_file_content` - Read file content with error handling
- ✅ `search_tags` - Find all files with specific tags
- ✅ `search_links` - Query wikilink relationships bidirectionally
- ✅ `get_stats` - Return vault statistics (file count, tag count, link count)

**Workflow Tools (4 tools)**:
- ✅ `trigger_workflow` - Manually trigger registered workflow by ID
- ✅ `get_workflow_status` - Check execution status with timing info
- ✅ `list_workflows` - Show all registered workflows with descriptions
- ✅ `get_workflow_history` - View execution history with results

**Note**: Phase 5 integrates with the existing Phase 4B workflow engine (event-driven orchestration, parallel execution). MCP tools expose workflow triggers and monitoring, NOT workflow creation.

**Enhanced Proof Workflows**:
- ✅ Task completion workflow parses frontmatter (status, type, dates)
- ✅ Task metadata stored in shadow cache for querying
- ✅ Phase completion workflow enhanced similarly
- ✅ Integration test demonstrates end-to-end workflow

**Claude Desktop Integration**:
- ✅ Configuration file example provided and documented
- ✅ Server connects successfully when launched via Claude Desktop
- ✅ All tools accessible from Claude Desktop interface
- ✅ Error messages displayed correctly in Claude Desktop UI

### Performance Acceptance Criteria

- ✅ Shadow cache tool queries complete in <10ms (p95)
- ✅ Workflow tool calls complete in <200ms (p95)
- ✅ MCP server memory overhead <100MB baseline
- ✅ No memory leaks after 1-hour stress test
- ✅ Concurrent tool calls handled without degradation

### Quality Acceptance Criteria

- ✅ TypeScript strict mode enabled with zero errors
- ✅ `bun run typecheck` passes with 0 errors
- ✅ `bun run lint` passes with 0 errors
- ✅ `bun run build` completes successfully
- ✅ Test coverage >80% for all MCP tool handlers
- ✅ All integration tests passing
- ✅ API documentation complete for all 10 tools
- ✅ Usage examples documented with expected outputs

## Quality Standards

All code must meet Weave-NN quality standards:

```bash
# Type checking
bun run typecheck  # Must pass with 0 errors

# Linting
bun run lint      # Must pass with 0 errors

# Build
bun run build     # Must complete successfully
```

## Risks & Mitigation Strategies

### Technical Risks

**Risk 1: MCP SDK Breaking Changes** (Low)
- **Impact**: Server fails to connect or tools stop working
- **Likelihood**: Low (MCP v1.0 is stable)
- **Mitigation**: Pin SDK version, monitor changelog, test before upgrading

**Risk 2: Performance Degradation** (Low)
- **Impact**: Shadow cache queries or workflow triggers become slow
- **Likelihood**: Low (existing components proven fast)
- **Mitigation**: Performance benchmarks in CI, <10ms cache queries, <200ms tool calls

**Risk 3: Claude Desktop Integration Issues** (Medium)
- **Impact**: Configuration problems, stdio transport issues, UI glitches
- **Likelihood**: Medium (integration quirks common)
- **Mitigation**: Document known issues, provide troubleshooting guide, test on fresh install

**Risk 4: Scope Creep** (Medium)
- **Impact**: Phase 5 extends beyond 3-4 days, delays Phase 6
- **Likelihood**: Medium (temptation to add features)
- **Mitigation**: Strict adherence to 10 tools (6 shadow cache + 4 workflow), defer enhancements to Phase 6

### Resource Risks

**Risk 5: Incomplete Phase 4B Components** (Low)
- **Impact**: Shadow cache or workflow engine missing required methods
- **Likelihood**: Low (Phase 4B completion report confirms readiness)
- **Mitigation**: Early integration testing, identify gaps on Day 1

**Risk 6: Documentation Time Underestimated** (Medium)
- **Impact**: Day 4 insufficient for complete documentation
- **Likelihood**: Medium (documentation often underestimated)
- **Mitigation**: Write docs alongside code (Days 1-3), reserve Day 4 for polish only

### Mitigation Strategy Summary
- **Daily standup**: Review progress against plan, identify blockers early
- **Incremental testing**: Integration test each tool before moving to next
- **Early Claude Desktop testing**: Test connection by end of Day 1
- **Documentation as code**: Generate API docs from TypeScript types
- **Performance gates**: CI fails if <10ms cache queries or <200ms tool calls violated

## Out of Scope (Explicitly Deferred)

The following are **NOT** part of Phase 5 and should be rejected if proposed:

❌ **HTTP/WebSocket transports** - Phase 5 uses stdio only
❌ **Write operations via MCP** - Read-only in Phase 5 (safety)
❌ **Real-time file watching via MCP** - File watcher runs independently
❌ **Multi-agent coordination** - Future enhancement (Phase 7+)
❌ **Real-time collaboration** - Not a Phase 5 goal
❌ **Web UI or dashboard** - Command-line and Claude Desktop only
❌ **Obsidian REST API client** - Not needed (direct file access works)
❌ **Additional MCP tools beyond the 10** - 6 shadow cache + 4 workflow is scope
❌ **Custom workflow creation via MCP** - Only trigger/status for existing workflows

---

**Generated**: 2025-10-24T02:22:02.774Z
**Enhanced**: 2025-10-24T02:30:00.000Z (via /speckit.constitution)
**Source**: Phase planning document for PHASE-5
