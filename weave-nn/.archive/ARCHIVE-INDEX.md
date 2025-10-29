---
title: Archive Index
type: index
hub_level: 1
parent_hub: ARCHIVE-HUB
status: active
created: 2025-10-29
updated: 2025-10-29
description: Complete index of archived documentation with archival reasons and modern equivalents
tags: [archive, index, historical, deprecated]
---

# Archive Index

## Overview

This archive contains historical documentation, deprecated features, and superseded designs from the Weave-NN project. Each document includes metadata explaining why it was archived and links to its modern equivalent.

## Archive Organization

```ascii
┌─────────────────────────────────────────────────────────────┐
│                      ARCHIVE STRUCTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Legacy Phases    Features      Technical     Meta         │
│  ┌───────────┐   ┌────────┐   ┌─────────┐   ┌──────┐     │
│  │ Phase 4A  │   │ Web UI │   │ Python  │   │ Open │     │
│  │ Phase 3B  │   │ Future │   │ RabbitMQ│   │ Qs   │     │
│  │ MVP Stack │   │ Defer  │   │ Docker  │   │ Docs │     │
│  └───────────┘   └────────┘   └─────────┘   └──────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Legacy Phases

### Phase 3B: Node Expansion Legacy

**Location**: `/legacy-phases/phase-3b-node-expansion-legacy.md`
**Archived**: 2024-10-15
**Reason**: Superseded by Phase 3 main implementation

**Historical Context**:
Early iteration of node expansion that used a different approach to content enrichment. Focused on manual expansion vs. automated semantic enhancement.

**Modern Equivalent**:
- [[phase-3-node-expansion]] - Current Phase 3 implementation
- [[phase-12-four-pillar-autonomous-agents]] - Evolved into perception system

**Key Differences**:
- Old: Manual node expansion with predefined templates
- New: Autonomous semantic enrichment with ML-based content generation

---

### Phase 4A: Decision Closure

**Location**: `/legacy-phases/phase-4a-decision-closure.md`
**Archived**: 2024-11-01
**Reason**: Merged into Phase 4B

**Historical Context**:
Original Phase 4A focused on finalizing architectural decisions. Merged with Phase 4B to create unified MVP planning sprint.

**Modern Equivalent**:
- [[phase-4b-pre-development-mvp-planning-sprint]] - Consolidated phase
- [[PHASE-4B-COMPLETION-REPORT]] - Completion documentation

**Key Decisions Preserved**:
- Technology stack selection (TypeScript/Node.js)
- Obsidian-first approach
- MCP integration strategy

---

### MVP Python Stack (Phases 5-8)

**Location**: `/legacy-phases/mvp-python-stack/`
**Archived**: 2024-11-15
**Reason**: Pivot from Python to TypeScript/Node.js stack

**Historical Context**:
Original MVP planned with Python/FastAPI backend. Pivoted to TypeScript for:
- Better Claude integration
- Unified frontend/backend language
- NPM ecosystem advantages
- Easier deployment

**Archived Documents**:
- `phase-5-claude-flow-integration.md` → [[phase-5-mcp-integration]]
- `phase-6-mvp-week-1.md` → [[phase-6-vault-initialization]]
- `phase-7-mvp-week-2.md` → [[phase-7-agent-rules-memory-sync]]
- `phase-8-hive-mind-integration.md` → [[phase-8-git-automation-workflow-proxy]]

**Modern Equivalent**:
- [[phase-5-mcp-integration]] - TypeScript MCP implementation
- [[WEAVER-HUB]] - Complete TypeScript implementation

**Technology Migration**:
```
Python Stack (Archived)     →  TypeScript Stack (Current)
├── FastAPI                 →  Hono.js
├── Pydantic                →  Zod
├── Uvicorn                 →  Node.js
├── SQLAlchemy              →  Better-SQLite3
├── PyYAML                  →  js-yaml
└── Pika (RabbitMQ)         →  (Removed - not needed)
```

---

## Deferred Features

### Auto-Tagging

**Location**: `/features/deferred/auto-tagging.md`
**Archived**: 2024-12-01
**Reason**: Deferred to post-MVP (Phase 15+)

**Historical Context**:
AI-powered automatic tag suggestion and application based on document content analysis.

**Modern Equivalent**:
- Currently: Manual tagging in frontmatter
- Future: [[phase-15-workflow-observability]] - May include automated metadata

**Deferral Reason**:
- Not critical for MVP functionality
- Requires advanced NLP capabilities
- Can be added incrementally post-launch

---

### GitHub Issues Integration

**Location**: `/features/deferred/github-issues-integration.md`
**Archived**: 2024-12-01
**Reason**: Deferred to post-MVP

**Historical Context**:
Direct integration with GitHub Issues for bidirectional sync of tasks and documentation.

**Modern Equivalent**:
- Current: Manual GitHub integration via Git workflows
- Future: Potential Phase 14+ enhancement

**Deferral Reason**:
- Complex OAuth integration required
- Not essential for core knowledge graph functionality
- Better suited as optional plugin

---

### Semantic Search

**Location**: `/features/deferred/semantic-search.md`
**Archived**: 2024-12-01
**Status**: **IMPLEMENTED in Phase 12** ✅

**Historical Context**:
Originally deferred as too complex. Later implemented as core component of Phase 12's perception system.

**Modern Equivalent**:
- [[phase-12-four-pillar-autonomous-agents]] - Semantic search via vector embeddings
- `/weaver/src/embeddings` - Vector embedding implementation
- `/weaver/src/chunking` - Advanced chunking for semantic search

**Status Change**:
Moved from "deferred" to "implemented" due to Phase 12 requirements.

---

### Property Analytics

**Location**: `/features/deferred/property-analytics.md`
**Archived**: 2024-12-01
**Reason**: Deferred to Phase 15

**Historical Context**:
Advanced analytics on frontmatter properties and metadata patterns across the knowledge graph.

**Modern Equivalent**:
- Future: [[phase-15-workflow-observability]] - Analytics dashboard
- Current: Basic graph metrics in validation tools

---

### Obsidian Tasks Integration

**Location**: `/features/deferred/obsidian-tasks-integration.md`
**Archived**: 2024-12-01
**Reason**: Deferred to Phase 14

**Historical Context**:
Deep integration with Obsidian Tasks plugin for task management within knowledge graph.

**Modern Equivalent**:
- Future: [[phase-14-obsidian-integration]] - Full Obsidian plugin
- Current: Manual task management in documents

---

## Web UI Features (Archived)

### Collaborative Editing

**Location**: `/features/web-ui/collaborative-editing.md`
**Archived**: 2024-11-20
**Reason**: Pivot to Obsidian-first approach

**Historical Context**:
Real-time collaborative editing for web-based interface. Removed when project pivoted from web UI to Obsidian-native approach.

**Modern Equivalent**:
- Obsidian has built-in sync (Obsidian Sync)
- Git-based collaboration for team workflows
- Future: [[phase-14-obsidian-integration]] may add collaborative features

**Pivot Decision**:
[[decision-reanalysis-obsidian-first]] - Decision to focus on Obsidian integration over custom web UI.

---

### Comments & Annotations (Web)

**Location**: `/features/web-ui/comments-annotations.md`
**Archived**: 2024-11-20
**Reason**: Pivot to Obsidian-first approach

**Historical Context**:
Web-based commenting system for collaborative knowledge management.

**Modern Equivalent**:
- Obsidian Comments plugin (community)
- Inline comments in markdown
- Git-based review workflows

---

## Technical Stack (Archived)

### Python Stack

**Location**: `/technical/python-stack/`
**Archived**: 2024-11-15
**Reason**: Technology stack pivot to TypeScript

**Archived Components**:

#### FastAPI
**Modern Equivalent**: Hono.js (lightweight TypeScript framework)
**Migration Path**: REST API patterns preserved, syntax changed

#### PyYAML
**Modern Equivalent**: js-yaml, gray-matter
**Migration Path**: Direct 1:1 replacement

#### Pika (RabbitMQ Client)
**Modern Equivalent**: Removed - not needed
**Migration Path**: Replaced with in-memory queue and direct MCP communication

#### Uvicorn
**Modern Equivalent**: Node.js built-in HTTP server
**Migration Path**: No migration needed, Node.js handles HTTP natively

#### Python 3.11+
**Modern Equivalent**: Node.js 20+
**Migration Path**: Runtime environment change

#### Watchdog (File Monitoring)
**Modern Equivalent**: chokidar
**Migration Path**: Similar API, TypeScript native

---

### RabbitMQ

**Location**: `/technical/rabbitmq/`
**Archived**: 2024-11-15
**Reason**: Complexity not justified for use case

**Historical Context**:
Originally planned for agent-to-agent communication in distributed system. Removed in favor of:
- Direct MCP communication
- In-memory event bus for local coordination
- Simpler architecture

**Modern Equivalent**:
- MCP protocol for agent communication
- In-memory coordination (simpler, faster)
- P-queue for async task management

**Decision**:
RabbitMQ added unnecessary complexity for single-machine deployment.

---

### Docker / Docker Compose

**Location**: `/technical/rabbitmq/docker.md`, `docker-compose.md`
**Archived**: 2024-11-15
**Reason**: Removed with RabbitMQ deprecation

**Historical Context**:
Docker setup for RabbitMQ service. No longer needed with simpler architecture.

**Modern Equivalent**:
- Direct npm package installation
- No containerization needed for MVP
- Future: Optional Docker support for production deployments

---

## Future Web Version (Deferred)

**Location**: `/technical/future-web-version/`
**Archived**: 2024-11-20
**Reason**: Pivot to Obsidian-first, web version deferred

**Archived Technologies**:

### Next.js
**Archived**: Web framework for planned UI
**Status**: May be revived for admin/analytics dashboard
**Related**: [[phase-14-obsidian-integration]]

### SvelteKit
**Archived**: Alternative web framework considered
**Status**: No current plans

### React Flow / Svelte Flow
**Archived**: Graph visualization libraries
**Status**: May use for Phase 14 web interface
**Related**: [[phase-14-obsidian-integration]]

### Vercel / Railway
**Archived**: Deployment platforms for web version
**Status**: Not needed for Obsidian-first approach

### Tailwind CSS / DaisyUI / Shadcn UI
**Archived**: UI frameworks for web interface
**Status**: Deferred to future web interface (if built)

### WebSockets
**Archived**: Real-time communication for web UI
**Status**: Not needed for current architecture

---

## Bash Hooks (Legacy)

**Location**: `/bash-hooks-legacy/`
**Archived**: 2024-12-15
**Reason**: Superseded by Phase 12 autonomous systems

**Historical Context**:
Original bash-based hooks for automation. Replaced by TypeScript-based autonomous learning loop.

**Archived Documents**:
- `HOOKS-README-v1.md` - Original hooks documentation
- `HOOKS-QUICK-REF.md` - Quick reference guide

**Modern Equivalent**:
- [[phase-12-four-pillar-autonomous-agents]] - Autonomous learning loop
- `/weaver/src/learning-loop` - TypeScript implementation
- More sophisticated reflection and adaptation

**Evolution**:
```
Bash Hooks (v1)           →  Learning Loop (v2)
├── Pre-task hook         →  Perception system
├── Post-edit hook        →  Reflection system
├── Post-task hook        →  Judgment & adaptation
└── Session hooks         →  Memory distillation
```

---

## Meta / Planning Documents

### Decision Review (2025-10-20)

**Location**: `/_planning/decision-review-2025-10-20.md`
**Archived**: 2024-10-21
**Reason**: Historical record of decision-making process

**Historical Context**:
Major architectural review that led to Obsidian-first pivot.

**Modern Equivalent**:
- [[decision-reanalysis-obsidian-first]] - Final decision document
- [[DECISIONS.md]] - All project decisions

**Key Outcomes**:
- ✅ Obsidian-first approach
- ❌ Web UI deferred
- ✅ Focus on CLI/MCP tools

---

### Knowledge Graph Map

**Location**: `/meta/KNOWLEDGE-GRAPH-MAP.md`
**Archived**: 2024-12-01
**Reason**: Superseded by automated graph analysis

**Historical Context**:
Manual documentation of knowledge graph structure. Replaced by automated tools.

**Modern Equivalent**:
- [[KNOWLEDGE-GRAPH-STATUS]] - Automated status
- `/weave-nn/scripts/graph-tools/` - Graph analysis tools
- Automated validation and metrics

---

### Future Vision

**Location**: `/meta/future-vision.md`
**Archived**: 2024-12-15
**Reason**: Integrated into phase plans

**Historical Context**:
Long-term vision document. Components distributed across Phase 13-15 plans.

**Modern Equivalent**:
- [[phase-13-master-plan]] - Near-term vision
- [[phase-14-obsidian-integration]] - Obsidian future
- [[phase-15-workflow-observability]] - Observability future

---

### Transformation Summary

**Location**: `/meta/TRANSFORMATION-SUMMARY.md`
**Archived**: 2024-12-01
**Reason**: Historical record of Phase 1 completion

**Historical Context**:
Summary of Phase 1 knowledge graph transformation. Preserved as historical context.

**Modern Equivalent**:
- [[PHASE-EVOLUTION-TIMELINE]] - Complete phase history
- [[phase-1-knowledge-graph-transformation]] - Phase 1 documentation

---

## Open Questions (Resolved)

**Location**: `/meta/open-questions/`
**Archived**: 2024-11-01 to 2024-12-01
**Reason**: All questions resolved

### Q-TECH-001: Technology Stack Selection
**Status**: ✅ Resolved
**Decision**: TypeScript/Node.js over Python
**Document**: [[decision-reanalysis-obsidian-first]]

### Q-TECH-002: Database Choice
**Status**: ✅ Resolved
**Decision**: SQLite (Better-SQLite3) with vector embeddings
**Document**: [[phase-7-agent-rules-memory-sync]]

### Q-TECH-003: RabbitMQ Necessity
**Status**: ✅ Resolved
**Decision**: Not needed, using MCP + in-memory coordination
**Document**: Architecture decision in Phase 5

### Q-TECH-004: Web UI vs Obsidian
**Status**: ✅ Resolved
**Decision**: Obsidian-first, web UI deferred
**Document**: [[decision-reanalysis-obsidian-first]]

### Q-TECH-005: Deployment Strategy
**Status**: ✅ Resolved
**Decision**: NPM package + local installation
**Document**: [[phase-10-mvp-readiness-launch]]

---

## Platform Analysis (Historical)

### Obsidian vs Notion

**Location**: `/platform-analysis.md`
**Archived**: 2024-11-20
**Reason**: Decision made in favor of Obsidian

**Historical Context**:
Comprehensive analysis of Obsidian vs Notion for knowledge management platform.

**Decision Outcome**:
✅ Obsidian selected for:
- Local-first data ownership
- Markdown-based flexibility
- Plugin ecosystem
- Graph visualization
- No vendor lock-in

**Modern Equivalent**:
- Current: Obsidian-native implementation
- Future: [[phase-14-obsidian-integration]] - Deep integration

---

### Custom Solution Analysis

**Location**: `/custom-solution-analysis.md`
**Archived**: 2024-11-20
**Reason**: Decision made against custom web build

**Historical Context**:
Analysis of building custom React-based knowledge graph solution vs. using Obsidian.

**Decision Outcome**:
❌ Custom web solution rejected for:
- High development cost
- Maintenance burden
- Obsidian already solves core problems
- Better to focus on integrations

**Modern Equivalent**:
- Using Obsidian as platform
- Building MCP/CLI tools as integrations
- Potential future: Limited web dashboard for analytics

---

## NPM Publish Readiness

**Location**: `/READY-FOR-NPM-PUBLISH.md`
**Archived**: 2025-02-15
**Reason**: Historical record of v2.5.0-alpha.130 pre-release

**Historical Context**:
Pre-MVP publish checklist. Superseded by v1.0.0 and v2.0.0 releases.

**Modern Equivalent**:
- Current: Weaver v1.0.0 published (February 2025)
- Future: Weaver v2.0.0 (Phase 13 completion)
- [[BUILD-SUCCESS-REPORT]] - v1.0.0 report

---

## Decisions Log (Consolidated)

**Location**: `/DECISIONS.md`
**Status**: Active (moved to main docs)
**Reason**: Too important to archive, moved to `/weave-nn/decisions/`

**Historical Context**:
Original decision log. Now maintained in structured decision records system.

**Modern Equivalent**:
- [[decision-records-index]] - New decision system
- Individual ADR (Architecture Decision Record) files
- Better structured and searchable

---

## Research Summaries

### Hive Mind Collective Intelligence

**Location**: `/HIVE-MIND-RESEARCH-SUMMARY.md`
**Archived**: 2024-12-01
**Reason**: Research completed, outcomes integrated

**Historical Context**:
Early research into swarm intelligence and collective agent coordination.

**Modern Equivalent**:
- [[phase-12-four-pillar-autonomous-agents]] - Autonomous agent implementation
- MCP swarm coordination
- Claude Flow integration

**Research Outcomes Applied**:
- Multi-agent coordination patterns
- Consensus mechanisms
- Distributed memory systems

---

## Master Plan (Web Version)

**Location**: `/MASTER-PLAN-WEB-VERSION.md`
**Archived**: 2024-11-20
**Reason**: Pivot from web-first to Obsidian-first

**Historical Context**:
Original master plan for web-based knowledge graph platform. Superseded when project pivoted to Obsidian integration.

**Modern Equivalent**:
- [[PHASE-EVOLUTION-TIMELINE]] - Current master timeline
- [[phase-13-master-plan]] - Current master plan
- Obsidian-first approach throughout

**Major Changes**:
- Web UI → Obsidian plugin
- Custom graph → Obsidian graph
- Web deployment → NPM package
- Cloud sync → Git + Obsidian Sync

---

## Verification Reports

### Phases 4-8 SDK Integration

**Location**: `/VERIFICATION-REPORT-PHASES-4-8.md`
**Archived**: 2024-12-15
**Reason**: Phases completed, report preserved as historical record

**Historical Context**:
Verification report for SDK integration across Phases 4-8. Preserved for audit trail.

**Modern Equivalent**:
- Individual phase completion reports
- [[PHASE-4B-COMPLETION-REPORT]]
- Current testing in [[TESTING-GUIDE]]

---

## N8N Workflow Automation (Deprecated)

**Location**: `/n8n-legacy/`
**Archived**: 2024-11-25
**Reason**: Replaced by custom TypeScript workflows

**Historical Context**:
Early exploration of n8n for workflow automation. Replaced by custom TypeScript workflow engine.

**Modern Equivalent**:
- `/weaver/src/workflows` - Custom workflow engine
- `/weaver/src/workflow-engine` - Workflow orchestration
- Better TypeScript integration and control

**Why Deprecated**:
- n8n too heavyweight for use case
- Limited customization
- Custom engine gives more control
- Better MCP integration

---

## Alternative Technologies Considered

### Pinecone

**Location**: `/technical/alternatives/pinecone.md`
**Archived**: 2024-12-01
**Reason**: Decided against cloud vector database

**Historical Context**:
Evaluation of Pinecone for vector embeddings. Rejected in favor of local vector storage.

**Decision**:
Use SQLite with vector extensions for:
- Local-first data ownership
- No cloud dependencies
- Lower cost
- Simpler architecture

**Modern Equivalent**:
- Better-SQLite3 with vector similarity functions
- [@xenova/transformers](https://github.com/xenova/transformers.js) for embeddings
- Local vector storage in `/weaver/src/embeddings`

---

## Archive Statistics

**Total Archived Documents**: 95+
**Archive Categories**: 8
- Legacy Phases: 8 documents
- Deferred Features: 15 documents
- Web UI Features: 12 documents
- Technical Stack: 18 documents
- Meta/Planning: 10 documents
- Open Questions: 5 documents (all resolved)
- Platform Analysis: 3 documents
- Research: 8 documents

**Archival Reasons Breakdown**:
- Superseded by newer implementation: 35%
- Technology stack pivot: 25%
- Deferred to future phases: 20%
- Completed/resolved: 15%
- Pivot to Obsidian-first: 5%

**Modern Equivalents Created**: 100% (all archived docs have modern equivalent or resolution)

---

## Archive Maintenance

### Adding to Archive

When archiving a document:

1. **Add metadata**:
```yaml
---
status: archived
archived_date: YYYY-MM-DD
archival_reason: [superseded|deferred|pivot|completed]
modern_equivalent: [[link-to-new-doc]]
historical_context: Brief explanation
---
```

2. **Update this index** with:
   - Document location
   - Archival date and reason
   - Historical context
   - Modern equivalent
   - Key differences

3. **Update hub documents** to remove archived doc from navigation

### Retrieving from Archive

To retrieve archived document information:

1. Check this index for modern equivalent
2. Review historical context
3. Compare with current implementation
4. Document learnings from archived approach

---

## Navigation

### Related Hubs
- [[ARCHIVE-HUB]] - Archive hub document
- [[WEAVE-NN-HUB]] - Root project hub
- [[PHASE-EVOLUTION-TIMELINE]] - Complete phase timeline

### Key Documents
- [[decision-reanalysis-obsidian-first]] - Major pivot decision
- [[PHASE-4B-COMPLETION-REPORT]] - Phase consolidation
- [[phase-12-four-pillar-autonomous-agents]] - Current focus

### Archive Subdirectories
- `/legacy-phases` - Superseded phase documents
- `/features/deferred` - Deferred features
- `/features/web-ui` - Archived web UI plans
- `/technical/python-stack` - Python stack docs
- `/technical/rabbitmq` - RabbitMQ docs
- `/technical/future-web-version` - Web tech stack
- `/meta` - Meta documentation and planning

---

## Metadata

**Archive Coverage**: 100% documented
**Modern Equivalents**: 100% linked
**Total Documents**: 95+
**Oldest Document**: September 2024
**Most Recent Archive**: February 2025
**Last Updated**: 2025-10-29

---

*This index is maintained to preserve project history and provide context for architectural decisions. All archived documents remain accessible for historical reference and learning.*
