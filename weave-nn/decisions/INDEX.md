---
type: decision-index
status: active
priority: critical
created_date: "2025-10-21"
updated_date: "2025-10-21"

# Tags
tags:
  - type/decision
  - status/active
  - scope/mvp
  - obsidian-first

# Visual
visual:
  icon: "check-circle"
  cssclasses:
    - type-decision
    - scope-mvp
---

# Weave-NN Decision Index

**Purpose**: Canonical list of all decisions made for Weave-NN MVP (Obsidian-first approach)
**Status**: 16/16 decisions finalized for MVP
**Last Updated**: 2025-10-21

---

## 📊 Quick Summary

| Category | Decisions | Status |
|----------|-----------|--------|
| **Executive** | 5 | ✅ All decided |
| **Technical** | 7 | ✅ All decided |
| **Infrastructure** | 4 | ✅ All decided |
| **Deferred** | 3 | ⏸️ Post-MVP |

---

## ✅ Executive Decisions

### D-001: Project Approach
**Decision**: Obsidian-first (2-week MVP), web UI deferred
**Date**: 2025-10-21
**Status**: ✅ DECIDED
**Impact**: Timeline reduced from 2-6 months → 2 weeks
**File**: [[executive/obsidian-first-approach]]

---

### D-002: Multi-Client Production System
**Decision**: Build for multi-client production (not single-user tool)
**Date**: 2025-10-21
**Status**: ✅ DECIDED
**Rationale**: Development agency needs concurrent client project management
**Impact**: Requires RabbitMQ, N8N, async workflows

---

### D-003: Budget & Deployment Model
**Decision**: Two deployment options (local $60/month OR GCP $110/month)
**Date**: 2025-10-21
**Status**: ✅ DECIDED
**Components**:
- **Local**: Claude API + OpenAI embeddings
- **Production**: + GCP e2-standard-2 VM for RabbitMQ/N8N
**File**: [[executive/budget-deployment]]

---

### D-004: Timeline & Scope
**Decision**: 2-week MVP timeline (Phase 5 + Phase 6)
**Date**: 2025-10-21
**Status**: ✅ DECIDED
**Scope**: Backend + N8N + Tasks + Real client deployment
**Out of Scope**: GitHub bidirectional sync, custom web UI

---

### D-005: Knowledge Retention Strategy
**Decision**: Automated cross-project pattern extraction
**Date**: 2025-10-21
**Status**: ✅ DECIDED
**Mechanism**: N8N workflow on project.closed event → Claude extraction → knowledge-base/
**Impact**: Compound learning effect (50% faster by 10th project)

---

## 🔧 Technical Decisions

### D-006: Primary Integration Method
**Decision**: Obsidian Local REST API plugin (not file system or URI)
**Date**: 2025-10-21
**Status**: ✅ DECIDED
**Advantages**:
- ✅ Synchronous responses
- ✅ API key authentication
- ✅ No file conflicts
- ✅ Cross-platform HTTP
**File**: [[technical/rest-api-integration]]
**Reference**: [[../architecture/obsidian-native-integration-analysis]]

---

### D-007: MCP Server Framework
**Decision**: FastMCP (not raw MCP SDK)
**Date**: 2025-10-21
**Status**: ✅ DECIDED
**Benefits**:
- 60-70% less code
- Automatic schema generation
- Built-in testing (<1s per test)
- Enterprise auth/error handling
**File**: [[technical/fastmcp-framework]]
**Reference**: [[../_planning/research/fastmcp-research-findings]]

---

### D-008: Task Management
**Decision**: obsidian-tasks plugin (not custom system)
**Date**: 2025-10-21
**Status**: ✅ DECIDED
**Rationale**: Native integration, no custom dev needed
**Features**: Markdown syntax, query language, metadata
**File**: [[technical/task-management]]
**Reference**: [[../features/obsidian-tasks-integration]]

---

### D-009: Visualization Approach
**Decision**: Mehrmaid plugin for knowledge graphs
**Date**: 2025-10-21
**Status**: ✅ DECIDED
**Capabilities**: Mermaid.js + clickable wikilinks
**Auto-generation**: Deferred to post-MVP improvement
**File**: [[technical/visualization]]

---

### D-010: Database Technology
**Decision**: SQLite for shadow cache (not PostgreSQL)
**Date**: 2025-10-21
**Status**: ✅ DECIDED
**Rationale**: Simpler deployment, file-based, sufficient for metadata
**Migration Path**: Can upgrade to Postgres if needed
**File**: [[technical/database]]

---

### D-011: Agent Framework
**Decision**: Claude-Flow v2.7 for agent orchestration
**Date**: 2025-10-21
**Status**: ✅ DECIDED
**Features**: 8 workers, rule-based system, memory integration
**Rules**: 6 agent rules for MVP
**File**: [[technical/agent-framework]]

---

### D-012: Semantic Search
**Decision**: Include in MVP (OpenAI embeddings + vector search)
**Date**: 2025-10-21
**Status**: ✅ DECIDED
**Rationale**: "We will have 1000s of nodes quickly" - critical for cross-project
**File**: [[technical/semantic-search]]

---

## 🏗️ Infrastructure Decisions

### D-013: Event-Driven Architecture
**Decision**: RabbitMQ message queue for event bus
**Date**: 2025-10-21
**Status**: ✅ DECIDED - CRITICAL
**Justification**:
- Multi-client async processing
- Guaranteed delivery
- Dead letter queue
- Scales to 1000+ clients
**File**: [[infrastructure/rabbitmq]]
**Reference**: [[../features/rabbitmq-message-queue]]

---

### D-014: Workflow Automation Platform
**Decision**: N8N workflow automation (Docker)
**Date**: 2025-10-21
**Status**: ✅ DECIDED - CRITICAL
**Justification**:
- Non-technical team workflow creation
- 150+ integrations
- Visual builder
- Official MCP support
**Workflows**: 5 core workflows for MVP
**File**: [[infrastructure/n8n-automation]]
**Reference**: [[../features/n8n-workflow-automation]]

---

### D-015: Git Integration
**Decision**: Auto-commit with debouncing (5 seconds)
**Date**: 2025-10-21
**Status**: ✅ DECIDED
**Features**: Workspace watcher, pre-commit validation
**File**: [[infrastructure/git-integration]]
**Reference**: [[../features/git-integration]]

---

### D-016: Obsidian Properties Strategy
**Decision**: Bulk property application via Python script
**Date**: 2025-10-21
**Status**: ✅ DECIDED
**Approach**: Lucide icons, CSS classes, tag taxonomy
**File**: [[infrastructure/obsidian-properties]]
**Reference**: [[../_planning/research/obsidian-groups-icons-research]]

---

## ⏸️ Deferred Decisions (Post-MVP)

### D-101: Custom Web UI
**Status**: Deferred to v1.1+
**Rationale**: Obsidian validates value first
**Timeline**: Only if validated
**File**: [[deferred/custom-web-ui]]
**Archive**: [[../.archive/MASTER-PLAN-WEB-VERSION]]

---

### D-102: Mehrmaid Auto-Generation
**Status**: Deferred to improvement phase
**Rationale**: Manual creation sufficient for MVP
**File**: [[deferred/mehrmaid-auto-generation]]

---

### D-103: GitHub Bidirectional Sync
**Status**: Deferred to v1.1
**Rationale**: Git integration sufficient for MVP
**File**: [[deferred/github-bidirectional-sync]]

---

## 📚 Documentation References

### Planning Documents
- [[../_planning/MASTER-PLAN|Master Plan]] - Complete roadmap
- [[../_planning/phases/phase-5-mvp-week-1|Phase 5 Plan]] - Week 1 backend
- [[../_planning/phases/phase-6-mvp-week-2|Phase 6 Plan]] - Week 2 automation
- [[../_planning/PLANNING-REVIEW-2025-10-21|Planning Review]] - Comprehensive audit

### Architecture Documents
- [[../architecture/obsidian-native-integration-analysis|Obsidian Integration Architecture]]
- [[../architecture/cross-project-knowledge-retention|Knowledge Retention Architecture]]

### Feature Documents
- [[../features/rabbitmq-message-queue|RabbitMQ Feature]]
- [[../features/n8n-workflow-automation|N8N Feature]]
- [[../features/obsidian-tasks-integration|Tasks Feature]]
- [[../features/git-integration|Git Feature]]

### Research Documents
- [[../_planning/research/fastmcp-research-findings|FastMCP Research]]
- [[../_planning/research/n8n-mcp-integration-research|N8N MCP Research]]
- [[../_planning/research/obsidian-groups-icons-research|Properties Research]]

### Archived Reviews
- [[../.archive/_planning/decision-review-2025-10-20|Decision Review (654 lines)]]
- [[../.archive/_planning/decision-reanalysis-obsidian-first|Decision Reanalysis (344 lines)]]
- [[../.archive/DECISIONS|User Decision Questionnaire]]

---

## 🔍 Decision by Phase

### Phase 5 (Week 1: Backend)
- D-006: REST API integration
- D-007: FastMCP framework
- D-010: SQLite database
- D-011: Claude-Flow agents
- D-013: RabbitMQ event bus
- D-015: Git integration

### Phase 6 (Week 2: Automation)
- D-008: Task management
- D-009: Visualization
- D-014: N8N workflows
- D-016: Properties strategy

### Cross-Phase
- D-001: Obsidian-first approach
- D-002: Multi-client production
- D-003: Budget/deployment
- D-004: Timeline/scope
- D-005: Knowledge retention
- D-012: Semantic search

---

## 📊 Decision Impact Matrix

| Decision | Blocks | Enables | Priority |
|----------|--------|---------|----------|
| D-001 (Obsidian-first) | All | All | 🔴 Critical |
| D-006 (REST API) | D-007, D-015 | MCP tools | 🔴 Critical |
| D-013 (RabbitMQ) | D-014 | N8N, async | 🔴 Critical |
| D-007 (FastMCP) | - | MCP server | 🟡 High |
| D-014 (N8N) | - | Workflows | 🔴 Critical |

---

## ✅ Completion Checklist

- [x] All 16 MVP decisions documented
- [x] Each decision has status, date, rationale
- [x] References to detailed docs provided
- [x] Deferred decisions clearly marked
- [x] Decision impact on phases mapped
- [x] Archived decision reviews linked

---

**Status**: All MVP decisions finalized ✅
**Next Action**: Begin Phase 5 Day 0 (prerequisites)
**Last Updated**: 2025-10-21

---

**See Also**:
- [[../meta/DECISIONS-INDEX|Extended Decision Hub]] - Detailed version with diagrams
- [[../INDEX|Main Knowledge Graph Index]]
