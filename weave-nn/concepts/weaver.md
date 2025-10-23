#---
type: concept
category: architecture
status: active
tags:
  - weaver
  - architecture
  - mcp
  - workflows
  - file-watcher
related:
  - "[[neural-network-junction]]"
  - "[[durable-workflows]]"
  - "[[local-first-architecture]]"
---

# Weaver

**The unified TypeScript service that serves as the neural network junction for Weave-NN's local-first knowledge graph.**

## Overview

Weaver is THE ONLY SERVICE in the Weave-NN MVP architecture. It combines three critical functions into a single, stateful Node.js process:

1. **MCP Server** - Provides Claude Code with knowledge graph access tools
2. **File Watcher** - Monitors Obsidian vault for changes
3. **Workflow Orchestrator** - Executes durable, resumable workflows

## Core Philosophy

Weaver acts as the **neural network junction point** where multiple AI "neural networks" (Claude Code, Claude-Flow agents, future local models) connect to share knowledge through a common substrate (the Obsidian vault knowledge graph).

This architecture enables **compound learning**: each AI interaction benefits from all previous interactions through the shared knowledge graph.

## Architecture

```
┌─────────────────┐
│  Claude Code    │
└────┬────────────┘
     │
     └─→ Weaver (Node.js)             ← THE ONLY SERVICE
         ├─→ MCP Server
         │   └─→ @modelcontextprotocol/sdk
         │   └─→ Knowledge graph tools
         │
         ├─→ File Watcher
         │   └─→ chokidar
         │   └─→ Monitors vault changes
         │
         └─→ Workflow Orchestration
             └─→ workflow.dev
             └─→ Durable, stateful execution
```

**Single Process**: Everything runs in one unified TypeScript process.

## Why "Weaver"?

The name "Weaver" reflects its role in weaving together:
- Multiple AI systems (Claude, agents, models)
- Multiple data sources (vault, git, APIs)
- Multiple workflows (task completion, memory extraction, git operations)
- Multiple events (file changes, webhooks, scheduled tasks)

Like a weaver creates fabric by interleaving threads, Weaver creates a cohesive knowledge system by interleaving AI interactions, file changes, and workflow executions.

## Key Capabilities

### 1. Stateful Execution

Weaver uses durable workflows, meaning **you can stop and resume at any time**:

```typescript
// Workflow starts
await ctx.step('extract-memory', async () => { /* ... */ }); // ✅ Completes
await ctx.step('store-memory', async () => { /* ... */ });   // ✅ Completes

// Process stops (crash, user interrupt, system restart)

// Process restarts
// Workflow automatically resumes from last checkpoint
await ctx.step('update-vault', async () => { /* ... */ });   // Continues here
```

**This is game-changing**: Developers can stop work, close their laptop, come back hours or days later, and workflows resume exactly where they left off. No complex state management, no external database, no Redis—just built-in statefulness.

### 2. Zero Latency Communication

All components are in-process:
- File change → Workflow trigger: <1ms
- MCP tool call → Vault query: <5ms
- Workflow step → Obsidian API: <10ms

Compare to separate services:
- File change → RabbitMQ → Weaver: ~50-100ms
- MCP call → Python server → Response: ~20-50ms

**10-50x faster** with unified architecture.

### 3. Single Point of Configuration

```typescript
// weaver.config.ts - ONE config file
export default {
  mcp: { /* MCP settings */ },
  watcher: { /* File watcher settings */ },
  workflows: { /* Workflow settings */ },
  obsidian: { /* API settings */ }
};
```

No juggling Python `.env`, RabbitMQ `docker-compose.yml`, and Node.js config files.

### 4. Unified Logging

All events in single log stream:
```
[2025-10-23 10:00:00] MCP: Tool 'get_knowledge' called (query: "weaver architecture")
[2025-10-23 10:00:05] Watcher: File changed: concepts/weaver.md
[2025-10-23 10:00:05] Workflow: Started 'file-updated' (wf_abc123)
[2025-10-23 10:00:06] Workflow: Completed step 'extract-metadata'
[2025-10-23 10:00:07] Workflow: Completed 'file-updated'
```

Makes debugging **dramatically** easier than correlating logs across 4 services.

## Technology Stack

- **Runtime**: Node.js 20+ (LTS)
- **Language**: TypeScript 5+
- **MCP**: `@modelcontextprotocol/sdk` (official Anthropic SDK)
- **File Watcher**: `chokidar` (30M+ repos use it)
- **Workflows**: `workflow.dev` (durable, stateful execution)
- **Web Server**: `hono` (ultra-fast, TypeScript-first)
- **Git**: `simple-git` (Node.js Git client)

**Zero Python Dependencies**: Pure TypeScript/Node.js stack.

## Startup

```bash
cd weave-nn-weaver
npm start
```

**That's it.** No Docker containers, no Python virtual environments, no RabbitMQ management UI. Just one command.

## Evolution

**Before** (original architecture):
- 4 separate services
- Python + TypeScript + Docker
- 4 terminals
- ~5 hours setup

**After** (current architecture):
- 1 unified service
- Pure TypeScript
- 1 terminal
- ~1 hour setup

See: [[docs/architecture-simplification-complete|Architecture Simplification Journey]]

## Benefits

### For Developers
- **Simple Setup**: `npm install && npm start`
- **Fast Iteration**: Hot reload in development
- **Easy Debugging**: Single process, single debugger
- **Stateful**: Stop/resume anytime without losing work

### For System
- **High Performance**: In-process communication (zero latency)
- **Low Resource Usage**: ~50-100MB memory, <5% CPU idle
- **Reliable**: Battle-tested libraries (chokidar, workflow.dev)
- **Observable**: Unified logs, traces, metrics

### For Architecture
- **Simple**: 1 service vs 4 services (75% reduction)
- **Maintainable**: Single codebase, single language
- **Scalable**: Can add features without adding services
- **Future-Proof**: Easy to add capabilities (more MCP tools, more workflows)

## When to Add More Services

Weaver is sufficient for MVP and beyond. Consider adding services only if:

1. **Scale**: >1000 concurrent users (add load balancer, replicas)
2. **Isolation**: Need to isolate resource-intensive tasks (add worker service)
3. **Integration**: External systems need event notifications (add message queue)
4. **Multi-tenant**: Shared infrastructure for many users (add orchestration)

For single-user local-first MVP, Weaver is the optimal architecture.

## Related Concepts

- [[concepts/neural-network-junction|Neural Network Junction]]
- [[concepts/durable-workflows|Durable Workflows]]
- [[concepts/local-first-architecture|Local-First Architecture]]
- [[concepts/compound-learning|Compound Learning]]

## Related Technical

- [[technical/weaver|Weaver Implementation]]
- [[technical/modelcontextprotocol-sdk|MCP SDK]]
- [[technical/chokidar|Chokidar File Watcher]]
- [[technical/workflow-dev|Workflow.dev]]

## Related Documentation

- [[docs/weaver-mcp-unification-summary|Weaver MCP Unification]]
- [[docs/local-first-architecture-overview|Local-First Architecture Overview]]
- [[docs/architecture-simplification-complete|Architecture Simplification Complete]]

---

**Key Insight**: Weaver's statefulness means developers can work async. Start a task, stop Weaver, come back tomorrow, and it resumes. This is **incredibly valuable** for solo developers and small teams—no need for complex orchestration or state management infrastructure.
