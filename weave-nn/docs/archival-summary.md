---
title: 'Archival Summary: Archetype Directory Reorganization'
type: architecture
status: in-progress
phase_id: PHASE-0
tags:
  - phase/phase-0
  - type/architecture
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4DA"
  color: '#50E3C2'
  cssclasses:
    - architecture-document
updated: '2025-10-29T04:55:05.371Z'
keywords:
  - executive summary
  - technical directory
  - archived (11 files)
  - kept (8 files)
  - created (7 files)
  - features directory
  - archived (13 files)
  - platforms directory
  - 'status: kept (3 files)'
  - patterns directory
---
# Archival Summary: Archetype Directory Reorganization

**Date**: 2025-10-23
**Purpose**: Archive out-of-scope items and create proper Weaver concept architypes
**Impact**: Cleaner codebase aligned with unified single-service architecture

---

## Executive Summary

Following the architecture simplification (4 services → 1 service), we audited all archetype directories and:
1. **Archived out-of-scope items** to `.archive/` with proper subdirectories
2. **Created missing Weaver concept documents** to properly document the new architecture
3. **Organized by reason** (Python stack, RabbitMQ, web UI, research, etc.)

**Result**: Clean, focused documentation aligned with MVP scope.

---

## Technical Directory

### Archived (11 files)

####`.archive/technical/python-stack/` (6 files)
**Reason**: Zero Python dependencies for MVP

- `fastapi.md` - Web framework for Python MCP server
- `python-3-11.md` - Python runtime
- `uvicorn.md` - ASGI server for FastAPI
- `pika-rabbitmq-client.md` - RabbitMQ Python client
- `watchdog-file-monitoring.md` - Python file watcher (replaced by chokidar)
- `pyyaml.md` - YAML parsing library

**See**: [[.archive/technical/python-stack/README|Why Python Stack Archived]]

#### `.archive/technical/rabbitmq/` (3 files)
**Reason**: Deferred to post-MVP (Weaver's durable workflows replace RabbitMQ)

- `rabbitmq.md` - Message broker
- `docker-compose.md` - Container orchestration
- `docker.md` - Container runtime

**See**: [[.archive/technical/rabbitmq/README|Why RabbitMQ Deferred]]

#### `.archive/technical/future-features/` (2 files)
**Reason**: Simpler alternatives chosen for MVP

- `postgresql.md` - Using SQLite instead
- `gitpython.md` - Using simple-git instead

**See**: [[.archive/technical/future-features/README|Why Future Features Deferred]]

### Kept (8 files)

Core MVP dependencies:
- `obsidian-local-rest-api-plugin.md` - Core dependency
- `obsidian-api-client.md` - Core dependency
- `rest-api-integration.md` - Core pattern
- `sqlite.md` - Shadow cache
- `weaver.md` - Core service (renamed from weaver-proxy.md)
- `claude-flow.md` - Optional coordination tool
- `jest-testing-framework.md` - Testing
- `obsidian-tasks-plugin.md` - Optional Obsidian feature

### Created (7 files)

New Weaver stack documentation:
- `nodejs.md` - Runtime
- `typescript.md` - Language
- `chokidar.md` - File watcher
- `modelcontextprotocol-sdk.md` - MCP server
- `workflow-dev.md` - Workflow orchestration
- `hono.md` - Webhook server
- `simple-git.md` - Git operations

---

## Features Directory

### Archived (13 files)

#### `.archive/features/web-ui/` (2 files)
**Reason**: Web UI features (future)

- `collaborative-editing.md`
- `comments-annotations.md`

#### `.archive/features/deferred/` (6 files)
**Reason**: Advanced features (post-MVP)

- `rabbitmq-message-queue.md` - Already marked deferred
- `semantic-search.md` - Advanced AI feature
- `github-issues-integration.md` - External integration
- `obsidian-tasks-integration.md` - Plugin integration
- `property-analytics.md` - Analytics feature
- `auto-tagging.md` - AI feature

#### `.archive/features/research/` (5 files + 1 dir)
**Reason**: Research concepts for future exploration

- `F-016-graph-topology-analyzer.md`
- `F-017-cognitive-variability-tracker.md`
- `F-018-semantic-bridge-builder.md`
- `F-019-pattern-library-plasticity.md`
- `synthesis/` (directory with research synthesis)

### Kept (8 files)

Core MVP features:
- `rest-api-integration.md` - Core
- `agent-automation.md` - Core
- `ai-integration-component.md` - Core
- `auto-linking.md` - Core (wikilinks)
- `git-integration.md` - Core
- `decision-tracking.md` - Core
- `weaver-workflow-automation.md` - Core
- `daily-log-automation.md` - MVP feature

---

## Platforms Directory

### Status: Kept (3 files)

Platform analysis documents (historical context):
- `obsidian.md` - Chosen platform ✅
- `notion.md` - Alternative considered (analysis kept for reference)
- `custom-solution.md` - Future web version (analysis kept for reference)

**Rationale**: These are analysis documents showing decision-making process. Keeping them provides historical context even though only Obsidian is used in MVP.

---

## Patterns Directory

### Status: Nearly Empty (1 file)

- `README.md` - Directory placeholder

**Rationale**: Patterns will be added as we discover reusable patterns during implementation. No archival needed.

---

## Concepts Directory

### Status: All Kept + 4 Added

**Existing concepts** (11 files) - all relevant to MVP:
- `weave-nn.md` - Project identity
- `knowledge-graph.md` - Core concept
- `wikilinks.md` - Core linking mechanism
- `ai-generated-documentation.md` - Core use case
- `temporal-queries.md` - MVP feature
- `betweenness-centrality.md` - Graph analysis
- `ecological-thinking.md` - Design philosophy
- `cognitive-variability.md` - Research concept
- `sparse-memory-finetuning.md` - Research foundation
- `structural-gap-detection.md` - Graph analysis
- `graph-topology-analysis.md` - Research concept

**New concepts** (4 files) - document Weaver architecture:
- `weaver.md` - The unified service
- `neural-network-junction.md` - Core architecture pattern
- `durable-workflows.md` - Statefulness concept
- `local-first-architecture.md` - MVP philosophy

---

## Decisions Directory

### Status: Not Audited

**Rationale**: Decisions are historical records. Even if technologies are archived (Python, RabbitMQ), the decision documents show our reasoning. These should be kept as-is with addendums noting changes.

**Example**: [[decisions/technical/adopt-weaver-workflow-proxy|D-020]] already has RabbitMQ deferral addendum.

---

## Archive Directory Structure

Final `.archive/` organization:

```
.archive/
├── technical/
│   ├── python-stack/          ← Python dependencies (FastAPI, uvicorn, etc.)
│   │   └── README.md          ← Explains why archived
│   ├── rabbitmq/              ← Message queue + Docker
│   │   └── README.md          ← Explains deferral rationale
│   ├── future-features/       ← PostgreSQL, GitPython
│   │   └── README.md          ← Explains simpler alternatives
│   ├── alternatives/          ← (pre-existing) Graphiti, Pinecone
│   ├── future-web-version/    ← (pre-existing) Web UI tech
│   └── out-of-scope/          ← (pre-existing) Stripe, etc.
│
├── features/
│   ├── web-ui/                ← Collaborative editing, comments
│   ├── deferred/              ← Semantic search, analytics, etc.
│   └── research/              ← F-016 through F-019 + synthesis
│
├── bash-hooks-legacy/         ← (pre-existing)
├── n8n-legacy/                ← (pre-existing)
└── _planning/                 ← (pre-existing)
```

**Key Principle**: Each archive subdirectory has a README.md explaining:
- Why items were archived
- When they might be revisited
- What replaced them (if applicable)

---

## Summary Statistics

### Total Files Moved to Archive
- **Technical**: 11 files
- **Features**: 13 files + 1 directory
- **Platforms**: 0 files (kept for reference)
- **Patterns**: 0 files (empty)
- **Concepts**: 0 files (all relevant)
- **Total Archived**: 24 files + 1 directory

### Total New Files Created
- **Technical docs**: 7 files (Weaver stack)
- **Concept docs**: 4 files (Weaver architecture)
- **Archive READMEs**: 3 files (explaining archival)
- **Total Created**: 14 files

### Net Change
- Moved 24 files to appropriate archive locations
- Created 14 new documentation files
- **Result**: Cleaner, more focused codebase aligned with single-service architecture

---

## Benefits

### 1. Clarity

**Before**:
- Mixed MVP and future features
- Python docs alongside TypeScript docs
- Unclear what's in scope

**After**:
- Clear MVP scope in main directories
- Future/research in `.archive/` with context
- Easy to find relevant documentation

### 2. Discoverability

**Before**:
- Developers unsure which tech stack to use
- Conflicting information (Python vs TypeScript)
- Missing docs for core Weaver concepts

**After**:
- Clear tech stack (TypeScript only)
- Complete Weaver documentation
- Proper concept hierarchy

### 3. Maintainability

**Before**:
- Outdated docs might mislead developers
- No clear indication of what's deferred vs rejected

**After**:
- Archive READMEs explain context
- Clear "when to revisit" criteria
- Historical decisions preserved

---

## Related Documentation

### Architecture
- [[docs/architecture-simplification-complete|Architecture Simplification Journey]]
- [[docs/local-first-architecture-overview|Local-First Architecture Overview]]
- [[docs/weaver-mcp-unification-summary|Weaver MCP Unification]]

### Concepts (NEW)
- [[concepts/weaver|Weaver Unified Service]]
- [[concepts/neural-network-junction|Neural Network Junction]]
- [[concepts/durable-workflows|Durable Workflows]]
- [[concepts/local-first-architecture|Local-First Architecture]]

### Technical (NEW)
- [[technical/nodejs|Node.js Runtime]]
- [[technical/typescript|TypeScript Language]]
- [[technical/chokidar|Chokidar File Watcher]]
- [[technical/modelcontextprotocol-sdk|MCP SDK]]
- [[technical/workflow-dev|Workflow.dev]]
- [[technical/hono|Hono Web Framework]]
- [[technical/simple-git|Simple Git]]

---

## Next Steps

1. **Update Cross-References**: Some documents may still link to archived files. Update to point to archive locations or remove if irrelevant.

2. **Update README**: Main README already reflects local-first philosophy but may need minor updates referencing new concept docs.

3. **Update Phase 0**: Already updated with single-service architecture, but double-check no references to archived tech.

4. **Implementation**: Begin implementing Weaver based on clean, focused documentation.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-23
**Status**: Complete
**Impact**: Documentation aligned with unified single-service architecture
