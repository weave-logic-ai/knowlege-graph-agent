---
type: decision-index
status: active
priority: critical
created_date: '2025-10-21'
updated_date: '2025-10-28'
tags:
  - type/decision
  - status/active
  - scope/mvp
  - obsidian-first
visual:
  icon: check-circle
  cssclasses:
    - type-decision
    - scope-mvp
scope: system
version: '3.0'
icon: ✅
---

# Weave-NN Decision Index

**Purpose**: Canonical list of all decisions made for Weave-NN MVP (Obsidian-first approach)
**Status**: 20 active MVP decisions, 1 infrastructure decision deferred (D-013: RabbitMQ), 1 obsolete (D-007: FastMCP)
**Last Updated**: 2025-10-23

---

## 📊 Quick Summary

| Category | Decisions | Status |
|----------|-----------|--------|
| **Executive** | 5 | ✅ All decided |
| **Technical** | 16 active | ✅ All decided |
| **Infrastructure** | 3 active, 1 deferred | ⚠️ Mixed |
| **Deferred** | 4 | ⏸️ Post-MVP |
| **Obsolete** | 1 (D-007) | 🔄 Replaced |

**Total Active Decisions**: 24 (5 executive + 16 technical + 3 infrastructure)

---



## Related

[[phase-4a-decision-closure]]
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

### D-007: MCP Server Framework (OBSOLETE)
**Decision**: FastMCP (not raw MCP SDK)
**Date**: 2025-10-21
**Status**: 🔄 OBSOLETE - Replaced by D-021 (JavaScript/TypeScript stack)
**Obsoleted**: 2025-10-23
**Rationale**: Stack pivot to JavaScript/TypeScript with @modelcontextprotocol/sdk made FastMCP (Python) unnecessary
**Benefits** (historical):
- 60-70% less code
- Automatic schema generation
- Built-in testing (<1s per test)
- Enterprise auth/error handling
**File**: [[technical/fastmcp-framework]] (obsolete)
**Reference**: [[../_planning/research/fastmcp-research-findings]]
**Replacement**: [[technical/javascript-typescript-stack-pivot|D-021: JavaScript/TypeScript Stack]]

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

### D-017: Obsidian REST API Client Architecture
**Decision**: Singleton pattern for API client with retry logic
**Date**: 2025-10-23
**Status**: ✅ DECIDED
**Features**: Connection pooling, automatic retries, request queuing
**Phase**: Phase 5 (Day 2)
**File**: [[technical/day-2-rest-api-client]]

---

### D-018: Agent Rule Engine Architecture
**Decision**: Rule-based system for agent coordination with Claude-Flow
**Date**: 2025-10-23
**Status**: ✅ DECIDED
**Features**: 6 core agent rules, file-type routing, context injection
**Phase**: Phase 5 (Day 4)
**File**: [[technical/day-4-agent-rules]]

---

### D-019: Obsidian Properties & Visualization
**Decision**: Automated property application with Lucide icons and CSS classes
**Date**: 2025-10-23
**Status**: ✅ DECIDED
**Features**: Visual hierarchy, tag taxonomy, bulk property updates
**Phase**: Phase 5 (Day 11)
**File**: [[technical/day-11-properties-visualization]]

---

### D-020: Weaver Workflow Proxy
**Decision**: Adopt Weaver (workflow.dev) for workflow orchestration
**Date**: 2025-10-23
**Status**: ✅ DECIDED
**Replaces**: D-014 (N8N), reduces need for D-013 (RabbitMQ)
**Benefits**: TypeScript-native, durable execution, time-travel debugging
**Impact**: 🔴 High - Simplifies infrastructure, removes Docker dependency
**File**: [[technical/adopt-weaver-workflow-proxy]]

---

### D-021: JavaScript/TypeScript Stack Pivot
**Decision**: Full JavaScript/TypeScript stack (Node.js + @modelcontextprotocol/sdk)
**Date**: 2025-10-23
**Status**: ✅ DECIDED
**Obsoletes**: D-007 (FastMCP Python)
**Benefits**: Unified language, better Weaver integration, simpler deployment
**Impact**: 🔴 High - Affects entire tech stack
**File**: [[technical/javascript-typescript-stack-pivot]]

---

### D-022: SQLite Library Selection
**Decision**: better-sqlite3 for shadow cache
**Date**: 2025-10-23
**Status**: ✅ DECIDED
**Rationale**: Synchronous API, high performance, native bindings
**Phase**: Phase 5 (Shadow Cache)
**File**: [[technical/sqlite-library-choice]]

---

### D-023: Git Library Selection
**Decision**: simple-git for git automation
**Date**: 2025-10-23
**Status**: ✅ DECIDED
**Features**: Promise-based API, comprehensive git operations, active maintenance
**Phase**: Phase 8 (Git Integration)
**File**: [[technical/git-library-choice]]

---

### D-024: Testing Framework Selection
**Decision**: Vitest for test infrastructure
**Date**: 2025-10-23
**Status**: ✅ DECIDED
**Benefits**: Fast execution, native TypeScript, Jest-compatible API
**Phase**: Phase 9 (Testing)
**File**: [[technical/testing-framework-choice]]

---

### D-025: Web Framework Selection
**Decision**: Hono for Weaver webhook endpoints
**Date**: 2025-10-23
**Status**: ✅ DECIDED
**Benefits**: Lightweight, edge-compatible, excellent TypeScript support
**Phase**: Phase 5/6 (Webhooks)
**File**: [[technical/web-framework-choice]]

---

## 🏗️ Infrastructure Decisions

### D-013: Event-Driven Architecture
**Decision**: RabbitMQ message queue for event bus
**Date**: 2025-10-21
**Status**: ⚠️ DEFERRED TO POST-MVP
**Updated**: 2025-10-23
**Justification**:
- ~~Multi-client async processing~~ → Weaver provides this
- ~~Guaranteed delivery~~ → Weaver durable workflows
- ~~Dead letter queue~~ → Weaver error handling
- ~~Scales to 1000+ clients~~ → Deferred until needed
**Deferral Rationale**: Weaver (workflow.dev) provides event-driven capabilities sufficient for MVP. RabbitMQ will be added post-MVP when multi-service architecture or high-throughput streaming (>1000 events/sec) is needed.
**File**: [[infrastructure/rabbitmq]] (deferred)
**Reference**: [[../features/rabbitmq-message-queue]]
**Replacement**: [[technical/adopt-weaver-workflow-proxy|D-020: Weaver]]

---

### D-014: Workflow Automation Platform
**Decision**: N8N workflow automation (Docker)
**Date**: 2025-10-21
**Status**: ⚠️ REPLACED by D-020 (Weaver)
**Justification**:
- Non-technical team workflow creation
- 150+ integrations
- Visual builder
- Official MCP support
**Note**: Replaced by [[technical/adopt-weaver-workflow-proxy|D-020: Weaver Workflow Proxy]] which provides superior TypeScript-native workflow orchestration with built-in durability, observability, and developer-friendly code-first approach. Weaver eliminates the need for Docker + PostgreSQL infrastructure while providing automatic retries, time-travel debugging, and simpler deployment.
**Workflows**: 5 core workflows for MVP (now implemented in Weaver)
**File**: [[infrastructure/n8n-automation]] (deprecated)
**Reference**: [[../features/n8n-workflow-automation]] (archived)
**Replacement**: [[technical/adopt-weaver-workflow-proxy|D-020: Weaver]]

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

## 🔄 Obsolete Decisions

### D-007: FastMCP Framework (Python)
**Status**: 🔄 OBSOLETE
**Obsoleted By**: D-021 (JavaScript/TypeScript Stack Pivot)
**Date Obsoleted**: 2025-10-23
**Reason**: Stack pivot to JavaScript/TypeScript made Python-based FastMCP unnecessary
**Replacement**: @modelcontextprotocol/sdk (TypeScript MCP SDK)
**File**: [[technical/fastmcp-framework]] (archived)

---

## ⏸️ Deferred Decisions (Post-MVP)

### D-013: RabbitMQ Message Queue
**Status**: Deferred to Post-MVP
**Rationale**: Weaver provides event-driven capabilities for MVP
**When to Revisit**: Multi-service architecture (3+ services) or high-throughput streaming (>1000 events/sec)
**File**: [[../features/rabbitmq-message-queue]]
**Replacement**: [[technical/adopt-weaver-workflow-proxy|D-020: Weaver]]

---

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
- ~~D-007: FastMCP framework~~ → OBSOLETE (replaced by D-021)
- D-010: SQLite database
- D-011: Claude-Flow agents
- ~~D-013: RabbitMQ event bus~~ → DEFERRED (Weaver handles events)
- D-015: Git integration
- D-017: REST API client architecture
- D-018: Agent rule engine
- D-019: Properties & visualization
- D-020: Weaver workflow proxy (replaces D-013 + D-014)
- D-021: JavaScript/TypeScript stack pivot
- D-022: SQLite library (better-sqlite3)
- D-023: Git library (simple-git)
- D-025: Web framework (Hono)

### Phase 6 (Week 2: Automation)
- D-008: Task management
- D-009: Visualization
- ~~D-014: N8N workflows~~ → REPLACED by D-020 (Weaver)
- D-016: Properties strategy

### Phase 8 (Git Integration)
- D-023: Git library (simple-git)

### Phase 9 (Testing Infrastructure)
- D-024: Testing framework (Vitest)

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
| D-006 (REST API) | D-017, D-015 | MCP tools | 🔴 Critical |
| D-021 (JS/TS Stack) | D-020, D-022, D-023 | Unified codebase | 🔴 Critical |
| D-020 (Weaver) | - | Workflows, events | 🔴 Critical |
| ~~D-007 (FastMCP)~~ | - | ~~MCP server~~ | 🔄 OBSOLETE |
| ~~D-013 (RabbitMQ)~~ | ~~D-014~~ | ~~N8N, async~~ | ⏸️ DEFERRED |
| ~~D-014 (N8N)~~ | - | ~~Workflows~~ | ⏸️ REPLACED by D-020 |
| D-022 (better-sqlite3) | - | Shadow cache | 🟡 High |
| D-023 (simple-git) | - | Git automation | 🟡 High |
| D-024 (Vitest) | - | Testing infra | 🟡 High |
| D-025 (Hono) | - | Webhook endpoints | 🟡 High |

---

## ✅ Completion Checklist

- [x] All 25 MVP decisions documented (D-001 through D-025)
- [x] Each decision has status, date, rationale
- [x] References to detailed docs provided
- [x] Deferred decisions clearly marked (4 total: D-013, D-101, D-102, D-103)
- [x] Obsolete decisions marked (1 total: D-007)
- [x] Decision impact on phases mapped
- [x] Archived decision reviews linked
- [x] D-013 (RabbitMQ) deferred - Weaver provides MVP event handling
- [x] D-007 (FastMCP) obsoleted by D-021 (JS/TS stack pivot)
- [x] New technology decisions documented (D-022 through D-025)

---

## 📈 Decision Statistics

- **Total Decisions Made**: 25 (D-001 through D-025)
- **Active Decisions**: 20 (Executive: 5, Technical: 12, Infrastructure: 3)
- **Obsolete Decisions**: 2 (D-007: FastMCP, D-014: N8N)
- **Deferred Decisions**: 4 (D-013, D-101, D-102, D-103)
- **Replaced Decisions**: 1 (D-014: N8N by D-020: Weaver)
- **Critical Impact**: 5 decisions (D-001, D-006, D-020, D-021, D-002)
- **High Impact**: 8 decisions (D-017 through D-019, D-022 through D-025)

---

**Status**: 20 active MVP decisions finalized ✅, 2 obsolete (D-007, D-014), 4 deferred (D-013, D-101, D-102, D-103)
**Next Action**: Begin Phase 5 implementation with JavaScript/TypeScript stack
**Last Updated**: 2025-10-23

---

**See Also**:
- [[../meta/DECISIONS-INDEX|Extended Decision Hub]] - Detailed version with diagrams
- [[../INDEX|Main Knowledge Graph Index]]
