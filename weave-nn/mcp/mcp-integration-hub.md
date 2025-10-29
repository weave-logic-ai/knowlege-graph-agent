---
title: MCP Directory - Weaver Integration Documentation
type: directory-index
status: active
created: {}
tags:
  - mcp
  - weaver
  - integration
  - architecture
scope: system
priority: high
visual:
  icon: 📄
  cssclasses:
    - type-directory-index
    - status-active
    - priority-high
  graph_group: navigation
version: '3.0'
updated_date: '2025-10-28'
icon: 📄
---

# MCP Directory

This directory contains documentation for Model Context Protocol (MCP) integration in Weaver.

## What is MCP?

The Model Context Protocol (MCP) is an open standard that enables AI applications to securely connect with external data sources and tools. For Weaver, MCP provides the bridge between AI agents (Claude Code, Claude Flow) and the Obsidian knowledge graph.

## Directory Contents

### Core Documentation

#### **model-context-protocol.md**
High-level explanation of MCP, why it matters for Weaver, and integration patterns with ObsidianAPIClient.

**Status**: Reference document (conceptual, mostly accurate)

---

#### **ai-agent-integration.md**
Conceptual overview of how AI agents edit the knowledge graph via MCP.

**Status**: Reference document (conceptual, mostly accurate)

---

#### **agent-rules-workflows.md** ⭐ **NEW**
**CRITICAL MVP DOCUMENT**: Complete specification of 6 durable workflows that maintain knowledge graph integrity.

Workflows:
1. `vault-file-created` - Process new nodes
2. `vault-file-updated` - Handle modifications
3. `vault-file-deleted` - Clean up deletions
4. `ensure-bidirectional-link` - Maintain link integrity
5. `validate-node-schema` - Schema validation
6. `extract-and-store-memories` - AI-enhanced memory extraction

**Status**: ✅ Complete - Production-ready workflow definitions

---

#### **weaver-mcp-tools.md** ⭐ **NEW**
Comprehensive reference for all Weaver MCP tools available to Claude-Flow agents.

Categories:
- Core CRUD (create, read, update, delete)
- Search & Discovery
- Link Management
- Metadata Operations
- AI-Enhanced Operations
- Graph Analytics

**Status**: ✅ Complete - Full API reference

---

### Legacy Documentation

#### **agent-rules.md** (OLD - Keep for reference)
Original agent rules document using RabbitMQ event-driven architecture.

**Status**: Archived reference - replaced by `agent-rules-workflows.md`

---

### MCP Servers

#### **servers/cyanheads-obsidian-mcp-server.md**
Documentation for the cyanheads MCP server that Weaver uses as a client to interact with Obsidian vaults.

**Status**: Reference document (accurate)

---

## Architecture Overview

### Current MVP Architecture

```
[Obsidian Vault Files]
         ↓ (chokidar file watcher)
   [Weaver Service]
         ↓ (triggers durable workflows)
[Workflow Execution - workflow.dev]
  ├─ Parse file
  ├─ Validate schema
  ├─ Update shadow cache
  ├─ Extract links
  ├─ AI operations (Claude API)
  └─ MCP operations (ObsidianAPIClient)
         ↓
[Knowledge Graph Updated]
```

**Key Components**:
- **Weaver**: Unified Node.js/TypeScript service (single service, not 4 separate services)
- **Durable Workflows**: Stateful, resumable workflows via workflow.dev SDK
- **MCP Tools**: ObsidianAPIClient for vault operations
- **Shadow Cache**: SQLite database for fast metadata queries
- **File Watcher**: chokidar monitoring vault changes

---



























## Related

[[model-context-protocol]]
## Related

[[javascript-typescript-stack-pivot]]
## Related

[[adopt-weaver-workflow-proxy]]
## Related

[[task-completion-integration-guide]]
## Related

[[knowledge-graph-integration-architecture]]
## Related

[[phase-5-mcp-integration]]
## Related

[[ai-integration-layer]]
## Related

[[phase-5-claude-flow-integration]]
## Related

[[agent-rules]] • [[ai-agent-integration]] • [[weaver-mcp-tools]]
## Related

[[claude-flow-tight-coupling]]
## Related

[[claude-flow-schema-mapping]]
## Related

[[claude-flow-memory-visualization]]
## Related

[[MCP-DIRECTORY-UPDATE-PLAN]]
## Related Documentation

### Integration Docs
- [`/integrations/obsidian/obsidian-weaver-mcp.md`](../integrations/obsidian/obsidian-weaver-mcp.md) - Obsidian ↔ Weaver MCP integration
- [`/integrations/workflow-automation/file-watcher-workflows.md`](../integrations/workflow-automation/file-watcher-workflows.md) - File watcher → workflow triggers
- [`/integrations/ai/weaver-mcp-claude.md`](../integrations/ai/weaver-mcp-claude.md) - AI-enhanced MCP tools
- [`/integrations/version-control/git-weaver-workflows.md`](../integrations/version-control/git-weaver-workflows.md) - Git integration workflows

### Architecture Docs
- [`/docs/local-first-architecture-overview.md`](../docs/local-first-architecture-overview.md) - Complete MVP architecture

### Planning
- [`/mcp/MCP-DIRECTORY-UPDATE-PLAN.md`](./MCP-DIRECTORY-UPDATE-PLAN.md) - Detailed plan for updating this directory

---

## Update Status

### ✅ Completed (2025-10-23)
- ✅ Analyzed all 7 files in mcp/ directory
- ✅ Created comprehensive update plan (`MCP-DIRECTORY-UPDATE-PLAN.md`)
- ✅ Updated `claude-flow-tight-coupling.md` with Weaver workflow integration
- ✅ Updated `claude-flow-schema-mapping.md` sync strategies for workflows
- ✅ Created `agent-rules-workflows.md` - Complete workflow-based agent rules (replaces old event-driven)
- ✅ Created `weaver-mcp-tools.md` - Comprehensive MCP tool reference
- ✅ Updated architecture diagrams to show Weaver unified service

### 🚧 Optional Enhancements
- Update `claude-flow-memory-visualization.md` with workflow examples
- Update `model-context-protocol.md` with workflow integration examples
- Minor updates to `ai-agent-integration.md` (conceptual, low priority)

### ✅ MVP Complete
All critical MVP documentation is now complete and consistent with the unified Weaver architecture.

---

## Claude-Flow Integration (MVP)

### Core Integration Documents

#### **claude-flow-tight-coupling.md** ⭐
**CRITICAL**: Defines the core architectural principle - "Obsidian markdown files ARE Claude-Flow memory"

This document establishes that there is NO separate memory system. The knowledge graph markdown files are the single source of truth.

**Status**: Needs update to show Weaver workflow integration

---

#### **claude-flow-schema-mapping.md**
Complete field-by-field mapping between Claude-Flow memory structure and Weave-NN node format.

Defines transformation functions for bidirectional sync between Claude-Flow and markdown files.

**Status**: Needs update to use durable workflows for sync (not RabbitMQ)

---

#### **claude-flow-memory-visualization.md**
Research document explaining Claude-Flow v2.7 memory structure, including:
- SQLite persistent storage
- 12 database tables
- Hash-based embeddings (1024 dimensions)
- Namespace organization

**Status**: Needs integration examples with Weaver workflows

---

## Contributing

When updating MCP documentation:

1. **Consistency**: Ensure terminology matches `/integrations/` and `/docs/` directories
2. **Architecture**: Always reference unified Weaver service (not 4 separate services)
3. **Workflows**: Use durable workflow patterns (not RabbitMQ/EventEmitter)
4. **Code Examples**: Use real TypeScript code from integration docs
5. **Cross-Reference**: Link to related documentation

---

**Last Updated**: 2025-10-23
**Status**: Active development
**Critical Path**: `agent-rules.md` rewrite
