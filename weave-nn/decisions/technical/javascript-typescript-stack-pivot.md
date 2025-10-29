---
type: decision
decision_id: D-021
decision_type: technical
title: JavaScript/TypeScript Stack Pivot for MVP
status: decided
created_date: {}
updated_date: '2025-10-28'
decided_date: {}
tags:
  - architecture
  - stack-selection
  - typescript
  - nodejs
  - mcp
  - infrastructure
related_concepts:
  - '[[C-008-agent-coordination]]'
  - '[[C-001-weave-nn-core]]'
related_features:
  - '[[F-001-mcp-server]]'
  - '[[F-002-file-watcher]]'
  - '[[F-006-automation]]'
related_decisions:
  - '[[adopt-weaver-workflow-proxy]]'
  - '[[event-driven-architecture]]'
obsoletes:
  - D-007 (FastMCP Python Stack)
  - D-014 (N8N Workflow Automation)
defers:
  - D-013 (RabbitMQ Message Queue)
phase: phase-0
priority: critical
impact: critical
cssclasses:
  - decision
  - decided
  - critical
visual:
  icon: ⚖️
  color: '#A855F7'
  cssclasses:
    - type-decision
    - status-decided
    - priority-critical
version: '3.0'
icon: ⚖️
---

# Decision: JavaScript/TypeScript Stack Pivot for MVP

## Decision Summary

**Architecture Chosen**: Node.js 20+ with TypeScript for all MVP services

**Date**: 2025-10-23
**Status**: ✅ DECIDED
**Impact**: 🔴 CRITICAL - Affects entire technology stack, all MVP services, and development workflow

---

## Context

### The Original Plan (Phases 1-4A)

The project initially planned a **Python-based stack**:
- **MCP Server**: FastMCP (Python framework)
- **File Watcher**: Python watchdog library
- **Workflow Engine**: N8N (Node.js, but separate process)
- **Git Automation**: GitPython
- **Database**: PostgreSQL with SQLAlchemy ORM

**Decision Documents**:
- **D-007**: FastMCP for MCP server implementation
- **D-014**: N8N for workflow automation
- **D-013**: RabbitMQ for message queuing (not yet implemented)

### The Phase 4B Reality Check

During Phase 4B reorganization (2025-10-21 to 2025-10-23), critical discoveries led to a strategic pivot:

**Discovery #1: Official MCP SDK Available**
- Anthropic released `@modelcontextprotocol/sdk` in TypeScript
- Native TypeScript support with official documentation
- FastMCP (Python) is a community wrapper, not official

**Discovery #2: Weaver is TypeScript-Native**
- workflow.dev provides TypeScript-first workflow orchestration
- Direct integration with MCP SDK without language barriers
- Superior to N8N for MCP-specific workflows

**Discovery #3: Unified Stack Benefits**
- No Python/JavaScript context switching
- Single package manager (npm/pnpm)
- Consistent tooling (TypeScript, ESLint, Prettier)
- Better Claude Desktop integration (Electron = Node.js)

---

## Decision

**Adopt JavaScript/TypeScript (Node.js 20+) as the primary stack for all MVP services.**

### Technology Selections

| Component | Technology | Replaces | Reason |
|-----------|-----------|----------|--------|
| **MCP Server** | `@modelcontextprotocol/sdk` | FastMCP (Python) | Official Anthropic SDK |
| **File Watcher** | `chokidar` | Python watchdog | Node.js native, 5M+ weekly downloads |
| **Workflows** | Weaver (workflow.dev) | N8N | TypeScript-native, MCP-optimized |
| **Git Automation** | `simple-git` | GitPython | Well-maintained, 1M+ weekly downloads |
| **Shadow Cache** | `better-sqlite3` | SQLite via SQLAlchemy | Native Node.js bindings, fast |
| **Runtime** | Node.js 20+ LTS | Python 3.11+ | LTS support, ESM modules |
| **Type Safety** | TypeScript 5.3+ | Python type hints | Stronger compile-time guarantees |

---

## Rationale

### 1. Official MCP SDK Support

**Why It Matters**:
- `@modelcontextprotocol/sdk` is maintained by Anthropic
- Direct access to new features and updates
- Official documentation and examples
- Community support through Anthropic channels

**FastMCP Limitations**:
- Community-maintained wrapper
- Potential lag behind official SDK updates
- Additional abstraction layer
- Smaller community for troubleshooting

**Evidence**:
```typescript
// Official SDK usage (TypeScript)
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'weave-nn',
  version: '0.1.0'
}, {
  capabilities: {
    resources: {},
    tools: {},
    prompts: {}
  }
});
```

### 2. Weaver Integration Advantages

**TypeScript-Native Design**:
- Direct type inference from workflow definitions
- No serialization overhead between Python/Node.js
- Single codebase for workflows and MCP tools

**MCP-Optimized Features**:
- Built-in support for tool calling patterns
- Async/await workflow execution
- Event-driven architecture alignment

**Comparison**:
```typescript
// Weaver workflow (TypeScript)
import { workflow } from '@workflow/core';

export const fileWatcherWorkflow = workflow('fileWatcher')
  .on('file.created', async (event) => {
    await mcpServer.notifyResourceUpdate(event.path);
    await shadowCache.updateEntry(event.path);
  });

// vs N8N (requires REST API calls or Python nodes)
```

### 3. Unified Development Experience

**Single Stack Benefits**:
- One package manager (`pnpm`)
- One linter/formatter (`ESLint`, `Prettier`)
- One type system (`TypeScript`)
- One runtime environment (`Node.js`)

**Developer Productivity**:
- No context switching between Python/JavaScript
- Shared utilities and types across all services
- Consistent error handling patterns
- Unified testing framework (`Vitest` or `Jest`)

**Deployment Simplicity**:
- Single Docker base image (`node:20-alpine`)
- No multi-language build pipelines
- Easier dependency management
- Smaller container sizes

### 4. Claude Desktop Integration

**Electron = Node.js**:
- Claude Desktop runs on Electron (Node.js runtime)
- MCP servers run in same runtime environment
- Lower IPC overhead
- Better performance and reliability

**Evidence from Research**:
```json
{
  "mcpServers": {
    "weave-nn": {
      "command": "node",
      "args": ["/path/to/weave-nn/build/index.js"]
    }
  }
}
```

### 5. Ecosystem Maturity

**NPM Package Quality**:
- `chokidar`: 5M+ weekly downloads, battle-tested
- `simple-git`: 1M+ weekly downloads, active maintenance
- `better-sqlite3`: 300K+ weekly downloads, native performance
- `@modelcontextprotocol/sdk`: Official Anthropic package

**TypeScript Advantages**:
- Stronger type safety than Python type hints
- Compile-time error detection
- Superior IDE support (autocomplete, refactoring)
- Growing adoption in AI/ML tooling (LangChain, etc.)

---

## Components Affected

### Immediate Impact (Phase 5 MVP)

**1. MCP Server (F-001)**
- **Before**: FastMCP Python server
- **After**: `@modelcontextprotocol/sdk` TypeScript server
- **Migration**: Complete rewrite (estimated 2-3 days)

**2. File Watcher (F-002)**
- **Before**: Python watchdog library
- **After**: `chokidar` Node.js library
- **Migration**: Port logic to TypeScript (estimated 1 day)

**3. Workflow Engine (F-006)**
- **Before**: N8N with REST API integration
- **After**: Weaver TypeScript workflows
- **Migration**: Redesign workflows in TypeScript (estimated 2-3 days)

**4. Shadow Cache (Internal)**
- **Before**: SQLAlchemy + PostgreSQL (planned)
- **After**: `better-sqlite3` (simpler for MVP)
- **Migration**: SQLite schema design (estimated 1 day)

**5. Git Automation (F-003)**
- **Before**: GitPython
- **After**: `simple-git`
- **Migration**: Port Git operations to TypeScript (estimated 1 day)

### Obsolete Decisions

**D-007: FastMCP Selection**
- **Status**: Obsolete
- **Reason**: Official SDK available, Python stack abandoned

**D-014: N8N Workflow Automation**
- **Status**: Obsolete
- **Reason**: Weaver provides better TypeScript integration

**D-013: RabbitMQ Message Queue**
- **Status**: Deferred
- **Reason**: Not needed for MVP; Weaver handles event coordination
- **Future**: May revisit for scale-out architecture

---

## Consequences

### Positive Consequences

✅ **Unified Stack**
- Single language, runtime, and toolchain
- Reduced cognitive load for developers
- Easier onboarding for new contributors

✅ **Official SDK Support**
- Direct access to Anthropic updates
- Better documentation and community support
- Lower risk of breaking changes

✅ **Better Performance**
- Node.js async I/O matches MCP event-driven model
- Native SQLite bindings faster than Python ORM
- Lower memory footprint for file watching

✅ **Superior Type Safety**
- TypeScript compiler catches errors at build time
- Better IDE support (VSCode, Cursor)
- Refactoring confidence

✅ **Simpler Deployment**
- Single Docker image (`node:20-alpine`)
- No Python/Node.js interop issues
- Easier CI/CD pipelines

### Negative Consequences

❌ **Sunk Cost: Python Research**
- ~3 days of FastMCP exploration in Phase 3
- ~2 days of Python watchdog prototyping
- Mitigated by early pivot (before implementation)

❌ **Learning Curve**
- Team may need TypeScript training
- Weaver is newer than N8N (less community content)
- Mitigated by official documentation and support

❌ **Library Ecosystem**
- Python has more mature AI/ML libraries (TensorFlow, PyTorch)
- Not relevant for MVP (no ML features planned)
- Can integrate Python services later via REST/gRPC if needed

❌ **Data Science Tooling**
- Python is preferred for Jupyter notebooks, data analysis
- Not relevant for current scope (infrastructure tooling)
- Future analytics can use Python + REST API

### Migration Risks

**Risk 1: Timeline Impact**
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**: Phase 5 already planned for 1 week; rewrite fits timeline

**Risk 2: Unfamiliar Technologies**
- **Probability**: Low
- **Impact**: Low
- **Mitigation**: Team has JavaScript/TypeScript experience; Weaver docs are excellent

**Risk 3: Hidden Complexity**
- **Probability**: Low
- **Impact**: Medium
- **Mitigation**: MCP SDK is simpler than FastMCP; Weaver is more opinionated (less configuration)

---

## Implementation Plan

### Phase 5 (MVP Week 1) - Complete Rewrite

**Day 1-2: MCP Server**
```typescript
// File: src/server/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'weave-nn',
  version: '0.1.0'
}, {
  capabilities: {
    resources: {},
    tools: {}
  }
});

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'vault_search',
      description: 'Search Obsidian vault',
      inputSchema: { /* ... */ }
    }
  ]
}));

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Day 3: File Watcher**
```typescript
// File: src/watcher/index.ts
import chokidar from 'chokidar';
import { mcpServer } from '../server';

const watcher = chokidar.watch('/path/to/vault', {
  persistent: true,
  ignoreInitial: true
});

watcher
  .on('add', path => mcpServer.notifyResourceUpdate(path))
  .on('change', path => mcpServer.notifyResourceUpdate(path))
  .on('unlink', path => mcpServer.notifyResourceUpdate(path));
```

**Day 4: Shadow Cache**
```typescript
// File: src/cache/index.ts
import Database from 'better-sqlite3';

const db = new Database('weave-nn.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    path TEXT PRIMARY KEY,
    content TEXT,
    mtime INTEGER,
    tags TEXT
  )
`);

export const updateCache = (path: string, content: string) => {
  const stmt = db.prepare('INSERT OR REPLACE INTO files VALUES (?, ?, ?, ?)');
  stmt.run(path, content, Date.now(), null);
};
```

**Day 5: Git Automation**
```typescript
// File: src/git/index.ts
import simpleGit from 'simple-git';

const git = simpleGit('/path/to/vault');

export const autoCommit = async (message: string) => {
  await git.add('.');
  await git.commit(message);
};
```

**Day 6-7: Weaver Workflows**
```typescript
// File: src/workflows/fileWatcher.ts
import { workflow } from '@workflow/core';

export const fileWatcherWorkflow = workflow('fileWatcher')
  .on('file.created', async (event) => {
    await updateCache(event.path);
    await mcpServer.notifyResourceUpdate(event.path);
  })
  .on('file.updated', async (event) => {
    await updateCache(event.path);
    await mcpServer.notifyResourceUpdate(event.path);
  });
```

### Testing Strategy

**Unit Tests** (Vitest):
```typescript
// File: tests/cache.test.ts
import { describe, it, expect } from 'vitest';
import { updateCache } from '../src/cache';

describe('Shadow Cache', () => {
  it('should store file content', () => {
    updateCache('/test.md', '# Test');
    const result = getCache('/test.md');
    expect(result.content).toBe('# Test');
  });
});
```

**Integration Tests**:
- MCP server tool invocation
- File watcher → cache → MCP notification pipeline
- Git automation workflows

**E2E Tests**:
- Claude Desktop integration
- Real vault file operations
- Workflow execution

---

## Alternatives Considered

### Alternative 1: Keep Python Stack

**Pros**:
- No sunk cost loss
- Familiar to data science teams
- Mature AI/ML ecosystem

**Cons**:
- FastMCP is unofficial
- Split stack (N8N is Node.js)
- Worse Claude Desktop integration
- Higher deployment complexity

**Verdict**: ❌ Rejected

### Alternative 2: Hybrid Stack (Python MCP + Node.js Workflows)

**Pros**:
- Leverage FastMCP progress
- Keep N8N/Weaver options open

**Cons**:
- Worst of both worlds
- Complex IPC between Python/Node.js
- Hard to maintain

**Verdict**: ❌ Rejected

### Alternative 3: Go Language

**Pros**:
- Superior performance
- Strong concurrency model
- Static binaries

**Cons**:
- No official MCP SDK
- Smaller ecosystem for MCP tooling
- Steeper learning curve

**Verdict**: ❌ Rejected (revisit for performance-critical services later)

---

## Decision Governance

### Decision Makers

- **Primary**: Project Lead (based on technical evidence)
- **Consulted**: Development Team, AI Agents (Researcher, Architect)
- **Informed**: Stakeholders, Future Contributors

### Review Criteria

This decision will be reviewed if:
1. **Performance issues** arise from Node.js (unlikely)
2. **Python-specific features** become critical (e.g., ML models)
3. **Official Python MCP SDK** is released by Anthropic (monitor)

### Success Metrics

- **Week 1**: TypeScript MCP server passing integration tests
- **Week 2**: File watcher + cache + workflows operational
- **Week 3**: Claude Desktop integration validated
- **Week 4**: MVP deployed and stable

---









## Related

[[ai-integration-layer]]
## Related

[[claude-flow-tight-coupling]]
## Related

[[MCP-DIRECTORY-UPDATE-PLAN]] • [[mcp-integration-hub]]
## Related

[[phase-5-mcp-server-implementation]]
## References

### Technical Documentation

- **MCP SDK**: https://github.com/anthropics/anthropic-sdk-typescript
- **Weaver**: https://workflow.dev/docs
- **Chokidar**: https://github.com/paulmillr/chokidar
- **Simple Git**: https://github.com/steveukx/git-js

### Related Decisions

- **[[adopt-weaver-workflow-proxy]]** - Weaver selection rationale
- **[[event-driven-architecture]]** - Event-driven design patterns
- **[[singleton-pattern-choice]]** - MCP server singleton pattern

### Research Documents

- **[[../research/mcp-sdk-comparison]]** - FastMCP vs Official SDK analysis
- **[[../research/workflow-engines]]** - N8N vs Weaver comparison
- **[[../research/nodejs-performance]]** - Node.js runtime characteristics

---

## Appendix: Migration Checklist

### Pre-Migration (Completed)

- [x] Research official MCP SDK capabilities
- [x] Evaluate Weaver vs N8N for TypeScript
- [x] Assess Node.js package ecosystem
- [x] Document decision rationale
- [x] Get stakeholder buy-in

### Phase 5 Migration (In Progress)

- [ ] Setup TypeScript project structure
- [ ] Implement MCP server with official SDK
- [ ] Port file watcher to chokidar
- [ ] Design shadow cache schema (SQLite)
- [ ] Implement Git automation with simple-git
- [ ] Create Weaver workflows
- [ ] Write unit tests (Vitest)
- [ ] Write integration tests
- [ ] Update deployment scripts
- [ ] Document API interfaces

### Post-Migration Validation

- [ ] Claude Desktop integration test
- [ ] Performance benchmarking vs Python (if prototyped)
- [ ] Workflow execution validation
- [ ] Error handling stress tests
- [ ] Documentation completeness review

---

## Change Log

- **2025-10-23**: Initial decision document created
- **2025-10-23**: Status set to DECIDED after Phase 4B review
- **Future**: Track implementation progress in Phase 5 daily logs

---

**Tags**: #decision #technical #stack-selection #typescript #nodejs #mcp #critical #decided
