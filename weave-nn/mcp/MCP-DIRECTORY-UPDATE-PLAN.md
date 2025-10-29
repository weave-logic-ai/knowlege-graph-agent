---
title: MCP Directory Update Plan
type: plan
status: active
phase_id: PHASE-1
tags:
  - mcp
  - refactoring
  - architecture
  - mvp
  - phase/phase-1
  - type/implementation
  - status/in-progress
priority: critical
visual:
  icon: "\U0001F4C4"
  color: '#7ED321'
  cssclasses:
    - type-plan
    - status-active
updated: '2025-10-29T04:55:05.911Z'
version: '3.0'
keywords:
  - current state assessment
  - related
  - files by status
  - ✅ mvp-relevant (update for weaver)
  - ✅ mvp-essential (claude-flow integration)
  - "\U0001F525 critical update (complete rewrite)"
  - update strategy
  - 'phase 1: understand claude-flow integration ⚠️'
  - 'phase 2: update conceptual docs'
  - 'phase 3: rewrite agent rules ⚠️ critical'
---

# MCP Directory Update Plan

## Current State Assessment

The `/mcp` directory contains **7 files** that reference the **old 4-service architecture** (RabbitMQ, Python MCP, Python file watcher, Claude-Flow) and need updating to reflect the **unified Weaver service** with **durable workflows**.

---















## Related

[[agent-rules]] • [[ai-agent-integration]]
## Related

[[javascript-typescript-stack-pivot]]
## Related

[[day-2-rest-api-client]]
## Related

[[day-4-agent-rules]]
## Related

[[day-11-properties-visualization]]
## Related

[[ai-integration-layer]]
## Related

[[mcp-integration-hub]] • [[claude-flow-tight-coupling]]
## Files by Status

### ✅ MVP-Relevant (Update for Weaver)

#### 1. **model-context-protocol.md** (13KB)
**Current State**:
- Explains MCP concept (accurate)
- Shows ObsidianAPIClient with EventEmitter
- Shows RuleEngine integration with event-driven model

**Needs**:
- Update integration examples to show **durable workflows** instead of EventEmitter
- Replace RuleEngine event triggers with **workflow triggers**
- Update code examples to use `workflow.dev` SDK
- Keep conceptual sections (they're accurate)

**Priority**: Medium (conceptual doc, not critical path)

---

#### 2. **ai-agent-integration.md** (3KB)
**Current State**:
- High-level explanation of how AI agents edit the knowledge graph via MCP
- Mostly conceptual, doesn't reference specific architecture

**Needs**:
- Minor updates only (references are generic)
- Update any references to "event-driven" to "workflow-driven"
- Otherwise mostly accurate as-is

**Priority**: Low (minimal changes needed)

---

#### 3. **servers/cyanheads-obsidian-mcp-server.md** (2.7KB)
**Current State**:
- Describes the cyanheads MCP server tool
- Lists capabilities (note operations, search, links, metadata, tags, templates)
- Explains why it's critical for Weave-NN

**Needs**:
- Minimal changes (tool description is accurate)
- Possibly add note about how Weaver MCP server uses this as a client

**Priority**: Low (mostly accurate)

---

### ✅ MVP-Essential (Claude-Flow Integration)

#### 4. **claude-flow-memory-visualization.md** (12KB)
**Current State**: Research document for understanding Claude-Flow v2.7 memory structure

**Status**: **MVP-Critical** - This establishes how Claude-Flow stores data in the neural network as markdown

**Needs**:
- Update to show how this integrates with **Weaver workflows**
- Clarify the connection between Claude-Flow memory system and Obsidian markdown storage
- Ensure consistency with durable workflow architecture

**Priority**: High (foundational understanding for integration)

---

#### 5. **claude-flow-schema-mapping.md** (18KB)
**Current State**: Field-by-field mapping between Claude-Flow memory and Weave-NN nodes

**Status**: **MVP-Critical** - This defines the 1:1 parity between Claude-Flow and markdown nodes

**Needs**:
- Update sync strategies to use **durable workflows** (not RabbitMQ events)
- Integrate with Weaver MCP tools
- Show how workflows handle the transformation

**Priority**: High (defines the data contract)

---

#### 6. **claude-flow-tight-coupling.md** (18KB)
**Current State**: Architecture document showing how Obsidian files ARE Claude-Flow memory

**Status**: **MVP-Critical** - This is the core architectural principle!

**Key Insight**: "Obsidian markdown files = Claude-Flow memory store. No sync. Direct access via MCP."

**Needs**:
- Update to show integration with **Weaver workflows**
- Clarify how agent rules work within this architecture
- Ensure workflow examples use workflow.dev SDK

**Priority**: Highest (foundational architecture)

---

### 🔥 Critical Update (Complete Rewrite)

#### 7. **agent-rules.md** (31KB)
**Current State**:
- Describes 6 agent rules: memory_sync, node_creation, update_propagation, schema_validation, auto_linking, auto_tagging
- Uses RabbitMQ-style event triggers (e.g., `claude_flow.memory.created`, `weave_nn.file.modified`)
- References Claude-Flow as primary AI system
- Shows RuleEngine.js framework in `/src/agents/`

**Needs**: **COMPLETE REWRITE**

Transform from:
```
[Claude-Flow Event] → [RabbitMQ] → [RuleEngine] → [Action]
```

To:
```
[File Watcher] → [Durable Workflow] → [Workflow Steps] → [Shadow Cache + MCP Operations]
```

**New Structure**:
- **Rule 1: Node Creation** → `vault-file-created` workflow
- **Rule 2: Node Update** → `vault-file-updated` workflow
- **Rule 3: Schema Validation** → Workflow step in create/update workflows
- **Rule 4: Auto-Linking** → `analyze-linking-opportunities` workflow
- **Rule 5: Auto-Tagging** → Workflow step using Claude API
- **Rule 6: Update Propagation** → Shadow cache update workflow step

**Priority**: **CRITICAL** (This is the core automation logic for MVP)

---

## Update Strategy

### Phase 1: Understand Claude-Flow Integration ⚠️
**CRITICAL**: Claude-Flow integration is **MVP**, not Phase 7!

Review all 3 Claude-Flow documents to understand:
- How Claude-Flow memory maps to Obsidian markdown
- The "tight coupling" architecture principle
- Field-by-field schema mapping
- Integration points with Weaver workflows

### Phase 2: Update Conceptual Docs
Update `model-context-protocol.md` and `ai-agent-integration.md` to reference:
- Weaver unified service (not separate services)
- Durable workflows (not RabbitMQ events)
- workflow.dev SDK (not EventEmitter)

### Phase 3: Rewrite Agent Rules ⚠️ CRITICAL
Create new `agent-rules.md` that describes:
- 6 core workflows for knowledge graph maintenance
- How file watcher triggers workflows
- Workflow step-by-step execution with persistence
- Shadow cache integration
- MCP tool usage within workflows

### Phase 4: Cross-Reference Integration Docs
Ensure consistency between:
- `/mcp/agent-rules.md` (workflow definitions)
- `/integrations/workflow-automation/file-watcher-workflows.md` (implementation details)
- `/integrations/obsidian/obsidian-weaver-mcp.md` (MCP tools)

---

## Detailed Rewrite Plan: agent-rules.md

### New Structure

```markdown
---
title: Weaver Workflow Automation Rules
type: architecture
status: active
created: 2025-10-23
tags: [workflows, automation, knowledge-graph, durable-execution]
related:
  - "[[integrations/workflow-automation/file-watcher-workflows]]"
  - "[[integrations/obsidian/obsidian-weaver-mcp]]"
  - "[[docs/local-first-architecture-overview]]"
---

# Weaver Workflow Automation Rules

## Overview

Weaver uses **durable workflows** to automate knowledge graph maintenance. Unlike traditional event-driven systems (RabbitMQ, EventEmitter), durable workflows provide:

- **Stateful execution**: Workflows persist state between steps
- **Crash recovery**: Workflows resume from last checkpoint after process restart
- **Atomic operations**: Each step is atomic and can be retried
- **Observability**: Full execution history and metrics

## Architecture

[Obsidian Vault Files]
         ↓
   [File Watcher - chokidar]
         ↓
[Trigger Workflow via workflow.dev]
         ↓
[Durable Workflow Execution]
  ├─ Step 1: Parse file
  ├─ Step 2: Validate schema
  ├─ Step 3: Update shadow cache
  ├─ Step 4: Extract links
  ├─ Step 5: Suggest tags (Claude API)
  └─ Step 6: Update related nodes

## Core Workflows

### 1. Workflow: vault-file-created
### 2. Workflow: vault-file-updated
### 3. Workflow: vault-file-deleted
### 4. Workflow: analyze-linking-opportunities
### 5. Workflow: validate-node-schema
### 6. Workflow: extract-and-store-memories

[Each workflow described in detail with TypeScript code examples]
```

### Key Transformations

| Old Concept | New Concept |
|------------|-------------|
| RabbitMQ event | Workflow trigger via `triggerWorkflow()` |
| Event handler | Durable workflow with `ctx.step()` |
| RuleEngine.js | workflow.dev SDK |
| Memory sync event | File watcher → workflow |
| Claude-Flow as hub | Weaver as unified service |
| Separate Python MCP | Weaver MCP (integrated) |

---

## Files to Create

### New Documentation Needed

1. **mcp/weaver-mcp-tools.md** (NEW)
   - Document Weaver's MCP tools specifically
   - Show how they differ from cyanheads MCP server
   - Integration with workflows

2. **mcp/workflow-catalog.md** (NEW)
   - Complete catalog of all workflows
   - Workflow parameters, return values, error handling
   - Dependencies between workflows

---

## Implementation Timeline

### Week 1: Analysis & Understanding
- [x] Analyze existing mcp/ directory
- [x] Create update plan
- [ ] **Review Claude-Flow integration documents** (MVP-critical!)
- [ ] Understand tight coupling architecture
- [ ] Review schema mapping specifications
- [ ] Identify integration points with workflows

### Week 2: Claude-Flow Integration Updates
- [ ] Update claude-flow-tight-coupling.md (add Weaver workflow integration)
- [ ] Update claude-flow-schema-mapping.md (workflow-based sync strategies)
- [ ] Update claude-flow-memory-visualization.md (workflow examples)
- [ ] Update model-context-protocol.md (workflow examples)
- [ ] Update ai-agent-integration.md (minor changes)

### Week 3: Critical Rewrite
- [ ] Draft new agent-rules.md structure
- [ ] Write workflow 1: vault-file-created
- [ ] Write workflow 2: vault-file-updated
- [ ] Write workflow 3: vault-file-deleted
- [ ] Write workflow 4: analyze-linking-opportunities
- [ ] Write workflow 5: validate-node-schema
- [ ] Write workflow 6: extract-and-store-memories

### Week 4: New Documentation
- [ ] Create mcp/weaver-mcp-tools.md
- [ ] Create mcp/workflow-catalog.md
- [ ] Cross-reference all integration docs
- [ ] Final consistency review

---

## Success Criteria

### Updated Documentation Shows
✅ Unified Weaver service (no separate services)
✅ Durable workflows (not RabbitMQ events)
✅ workflow.dev SDK (not EventEmitter)
✅ Shadow cache integration
✅ Claude API for AI-enhanced operations
✅ File watcher triggers
✅ Step-by-step workflow execution
✅ Error handling and retry logic
✅ Metrics and observability

### Archived Content
✅ Claude-Flow integration docs moved to phase-7 archive
✅ Archive preserves valuable future reference material
✅ Clear separation between MVP and future phases

### Cross-Referenced Consistency
✅ `/mcp/` directory aligns with `/integrations/` directory
✅ `/docs/local-first-architecture-overview.md` references are accurate
✅ No contradictions between documents

---

## Notes

- **agent-rules.md rewrite is CRITICAL PATH** - This is the core automation logic for MVP
- Claude-Flow docs have valuable Phase 7 insights - keep them in archive
- Ensure all workflow examples use real TypeScript code from integration docs
- Add mermaid diagrams for workflow execution flow

---

**Status**: Active plan
**Priority**: Critical
**Owner**: Documentation team
**Created**: 2025-10-23
