---
title: 'Decision Review: Post-Phase Reorganization (2025-10-23)'
type: implementation
status: in-progress
phase_id: PHASE-5
tags:
  - phase/phase-5
  - type/implementation
  - status/in-progress
priority: critical
visual:
  icon: "\U0001F4CB"
  color: '#7ED321'
  cssclasses:
    - implementation-document
updated: '2025-10-29T04:55:03.895Z'
keywords:
  - executive summary
  - critical findings
  - detailed analysis
  - 1. obsolete decisions (immediate action required)
  - 'd-007-v2: mcp sdk framework (node.js)'
  - 'd-014: n8n workflow automation (replaced)'
  - 'd-013: rabbitmq message queue (deferred)'
  - 2. decisions needing updates (not obsolete)
  - 'amendment (2025-10-23): weaver interim implementation'
  - implementation update
---
# Decision Review: Post-Phase Reorganization (2025-10-23)

**Date**: 2025-10-23
**Reviewer**: Claude Code System Analyst
**Scope**: All decision documents after Phases 5-10 reorganization
**Status**: 🔄 In Progress

---

## Executive Summary

### Critical Findings

**🔴 CRITICAL**: 3 major architectural decisions are now OBSOLETE or INCOMPLETE due to the JavaScript/TypeScript stack pivot:

1. **D-013 (RabbitMQ)** - Marked for deferral but still referenced as "CRITICAL" in INDEX
2. **D-014 (N8N)** - Replaced by Weaver but decision not updated
3. **D-007 (FastMCP)** - Python framework, incompatible with Node.js MCP server

**⚠️ WARNING**: 2 decisions need updates to reflect new phase structure:
1. **D-020 (Weaver Adoption)** - Status still "Proposed", should be "Decided"
2. **TS-009 (Event-Driven Architecture)** - References RabbitMQ but Weaver replaces this

**✅ ALIGNED**: 11 decisions remain valid:
- Obsidian-first approach (D-001)
- Multi-client production (D-002)
- Budget model (D-003)
- Timeline/scope (D-004)
- REST API integration (D-006)
- Task management (D-008)
- Other infrastructure decisions

---

## Detailed Analysis

### 1. Obsolete Decisions (Immediate Action Required)

#### D-007: FastMCP Framework ❌ OBSOLETE

**Original Decision** (2025-10-21):
```markdown
**Decision**: FastMCP (not raw MCP SDK)
**Status**: ✅ DECIDED
**Benefits**:
- 60-70% less code
- Automatic schema generation
```

**Current Reality** (2025-10-23):
- **Phase 5** uses **@modelcontextprotocol/sdk** (JavaScript/TypeScript)
- **FastMCP is Python-only** - incompatible with Node.js stack
- **MCP server is TypeScript** with Hono web framework

**Required Action**:
- [ ] Create new decision: **D-007-v2: MCP SDK for Node.js**
- [ ] Update INDEX.md to mark D-007 as obsolete
- [ ] Archive D-007 to `_archive/decisions/obsolete-python-stack/`

**New Decision Content**:
```markdown
### D-007-v2: MCP SDK Framework (Node.js)
**Decision**: @modelcontextprotocol/sdk (official TypeScript SDK)
**Date**: 2025-10-23
**Status**: ✅ DECIDED
**Rationale**:
- Official SDK from Anthropic (maintained, documented)
- TypeScript-native (type safety, IDE support)
- Compatible with Node.js 20+ runtime
- Integrates with Hono web framework
**Replaces**: D-007 (FastMCP - Python only)
```

---

#### D-014: N8N Workflow Automation ❌ REPLACED

**Original Decision** (2025-10-21):
```markdown
**Decision**: N8N workflow automation (Docker)
**Status**: ✅ DECIDED - CRITICAL
**Workflows**: 5 core workflows for MVP
```

**Current Reality** (2025-10-23):
- **Weaver (workflow.dev)** chosen as replacement (see D-020)
- **Phases 6-8** all reference Weaver, not N8N
- **Phase 6**: File watcher → Weaver webhooks
- **Phase 7**: Agent rules executed via Weaver workflows
- **Phase 8**: Git automation via Weaver

**Required Action**:
- [ ] Update D-014 status to "REPLACED"
- [ ] Add note: "Replaced by D-020 (Weaver Workflow Proxy)"
- [ ] Update INDEX.md to show D-014 as superseded
- [ ] Keep archived for historical context

**Updated Decision Content**:
```markdown
### D-014: N8N Workflow Automation (REPLACED)
**Original Decision**: N8N workflow automation
**Date**: 2025-10-21
**Original Status**: ✅ DECIDED - CRITICAL
**Current Status**: 🔄 REPLACED by D-020 (Weaver)
**Reason for Change**:
- Weaver provides TypeScript-native workflows (vs N8N's visual UI)
- Better integration with Node.js MCP stack
- Simpler deployment (npm vs Docker + PostgreSQL)
- Durable workflows built-in (vs manual N8N state management)
**Replacement**: [[adopt-weaver-workflow-proxy|D-020: Weaver Workflow Proxy]]
```

---

#### D-013: RabbitMQ Message Queue ⚠️ DEFERRED (But Still Listed as CRITICAL)

**Original Decision** (2025-10-21):
```markdown
**Decision**: RabbitMQ message queue for event bus
**Status**: ✅ DECIDED - CRITICAL
**Justification**: Multi-client async processing
```

**Current Reality** (2025-10-23):
- **D-020 Addendum** states RabbitMQ is deferred to post-MVP
- **Weaver provides** async workflows (replaces need for RabbitMQ in MVP)
- **Phase 6** uses Weaver webhooks (not RabbitMQ pub/sub)
- **INDEX.md still lists D-013 as "CRITICAL"** ⚠️ Contradiction

**Required Action**:
- [ ] Update D-013 status to "DEFERRED TO POST-MVP"
- [ ] Update INDEX.md to move D-013 to "Deferred Decisions" section
- [ ] Add note explaining Weaver interim solution
- [ ] Define criteria for when to add RabbitMQ later

**Updated Decision Content**:
```markdown
### D-013: RabbitMQ Message Queue (DEFERRED)
**Original Decision**: RabbitMQ for event-driven architecture
**Date**: 2025-10-21
**Original Status**: ✅ DECIDED - CRITICAL
**Current Status**: ⏸️ DEFERRED TO POST-MVP
**Reason for Deferral**:
- Weaver (D-020) provides durable workflows (replaces message queue for MVP)
- Simpler architecture (Weaver webhooks vs RabbitMQ pub/sub)
- Fewer dependencies (no Docker container for RabbitMQ)
- ~15 tasks saved (~1 day of work)

**When to Revisit**:
- Multi-service architecture (3+ independent services)
- High-throughput streaming (>1000 events/sec)
- Complex routing (multiple consumers per event)
- Cross-language service communication

**Interim Solution**: [[adopt-weaver-workflow-proxy|D-020: Weaver]] handles async workflows for MVP
```

---

### 2. Decisions Needing Updates (Not Obsolete)

#### D-020: Weaver Workflow Proxy 🔄 UPDATE STATUS

**Current Status**: 📋 **Proposed** - Awaiting Approval
**Actual Status**: Should be ✅ **DECIDED** (reflected in Phases 5-10)

**Evidence of Decision**:
- **Phase 6**: Entire phase dedicated to "File Watcher & Weaver Integration"
- **Phase 7**: Agent rules execute via Weaver workflows
- **Phase 8**: Git automation uses Weaver proxy
- **Phase 4B**: Weaver listed in development environment setup

**Required Action**:
- [ ] Update D-020 status from "Proposed" to "Decided"
- [ ] Update decision date to 2025-10-23
- [ ] Add approval log entry
- [ ] Add implementation reference to Phases 6-8

**Updated Decision Header**:
```markdown
# Decision: Adopt Weaver Workflow Proxy to Replace Bash Hooks

**Architecture Chosen**: Weaver (workflow.dev) - TypeScript-native workflow orchestration

**Date**: 2025-10-23
**Status**: ✅ **DECIDED** (was: Proposed)
**Implementation**: Phases 6-8
**Approved By**: System Architect + Phase Planning Review
```

---

#### TS-009: Event-Driven Architecture ⚠️ UPDATE IMPLEMENTATION

**Current Status**: ✅ DECIDED (Event-Driven with RabbitMQ)
**Actual Implementation**: Event-Driven with Weaver (not RabbitMQ for MVP)

**Inconsistency**:
```markdown
# Current decision
**Chosen**: Option B - Event-Driven Architecture with RabbitMQ

# Actual implementation (Phase 6)
File watcher → Weaver webhooks → Weaver workflows → Services
```

**Required Action**:
- [ ] Add **Amendment** section explaining Weaver interim solution
- [ ] Keep RabbitMQ as long-term vision (post-MVP)
- [ ] Update architecture diagram to show Weaver
- [ ] Clarify that decision principles remain valid (event-driven is correct)

**Amendment Content**:
```markdown
## Amendment (2025-10-23): Weaver Interim Implementation

**Status**: ✅ DECIDED (Event-Driven Architecture)
**MVP Implementation**: Weaver Workflow Proxy (not RabbitMQ)
**Long-term Vision**: RabbitMQ (when scaling needs arise)

### Implementation Update

**Original Architecture**:
```
File Watcher → RabbitMQ → Rule Engine Workers (1-N)
```

**MVP Architecture (2025-10-23)**:
```
File Watcher → Weaver (webhooks) → Weaver Workflows → Services
```

### Rationale for Change

The **event-driven principles remain correct**, but MVP implementation uses Weaver instead of RabbitMQ:

1. **Weaver provides built-in async** (durable workflows = better than queues for MVP)
2. **Simpler deployment** (npm vs Docker + RabbitMQ)
3. **TypeScript-native** (consistent with Node.js MCP stack)
4. **Defers complexity** (RabbitMQ added when multi-service scaling needed)

### Migration Path

**MVP** (Phases 6-8): Weaver handles events
**Post-MVP** (when needed): Migrate to RabbitMQ for:
- Multi-service pub/sub
- High-throughput streaming (>1000 events/sec)
- Complex routing patterns

**See**: [[adopt-weaver-workflow-proxy|D-020]] for full Weaver decision details
```

---

### 3. Missing Decisions (Gaps Identified)

#### MD-001: JavaScript/TypeScript Stack Adoption ❓ MISSING

**What Happened**:
- Phases 1-4A assumed Python/FastAPI stack
- Phases 5-10 (2025-10-23) switched to JavaScript/TypeScript
- **No formal decision documented** for this major pivot

**Impact**:
- Replaces FastMCP (D-007) with @modelcontextprotocol/sdk
- Replaces Python file watcher with chokidar (Node.js)
- Replaces RabbitMQ (initially) with Weaver workflows
- Changes entire development toolchain

**Required Action**:
- [ ] Create **D-021: Technology Stack - JavaScript/TypeScript**
- [ ] Document rationale for pivot from Python
- [ ] List all affected decisions (D-007, D-013, D-014)
- [ ] Add to INDEX.md as foundational decision

**Proposed Decision Content**:
```markdown
### D-021: Technology Stack - JavaScript/TypeScript Pivot
**Decision**: Node.js 20+ / TypeScript for all MVP services
**Date**: 2025-10-23
**Status**: ✅ DECIDED
**Priority**: 🔴 CRITICAL (affects entire architecture)

**Replaces**: Original Python/FastAPI/RabbitMQ stack

**Rationale**:
1. **MCP SDK Availability**: @modelcontextprotocol/sdk is official TypeScript SDK
2. **Weaver Integration**: workflow.dev is TypeScript-native
3. **Obsidian Ecosystem**: Most plugins use JavaScript/TypeScript
4. **Unified Stack**: Single language for MCP server + workflows + file watcher
5. **Developer Velocity**: TypeScript type safety reduces bugs

**Components Affected**:
- MCP Server: @modelcontextprotocol/sdk (replaces FastMCP)
- File Watcher: chokidar (Node.js, replaces Python watchdog)
- Workflows: Weaver/workflow.dev (TypeScript, replaces N8N)
- Git Automation: simple-git (Node.js)
- Shadow Cache: better-sqlite3 (Node.js)

**Impacts**:
- D-007 (FastMCP) → Obsolete
- D-014 (N8N) → Replaced by Weaver
- D-013 (RabbitMQ) → Deferred (Weaver interim)

**See**: Phases 5-10 for implementation details
```

---

#### MD-002: Phase Timeline Reorganization ❓ MISSING

**What Happened**:
- D-004 stated "2-week MVP timeline (Phase 5 + Phase 6)"
- **Phases 5-10 (2025-10-23)** expanded to 6 phases over 10-14 days
- **No decision documented** for scope/timeline change

**Required Action**:
- [ ] Update D-004 to reflect new 6-phase structure
- [ ] Document why timeline expanded (feature-per-phase approach)
- [ ] Update success criteria

**Updated D-004 Content**:
```markdown
### D-004: Timeline & Scope (UPDATED 2025-10-23)
**Original Decision**: 2-week MVP timeline (Phase 5 + Phase 6)
**Updated Decision**: 10-14 days (Phases 5-10, feature-per-phase)
**Date**: 2025-10-21 (updated 2025-10-23)
**Status**: ✅ DECIDED

**Phase Breakdown** (Updated 2025-10-23):
- Phase 5: MCP Server Implementation (3-4 days)
- Phase 6: File Watcher & Weaver (2-3 days)
- Phase 7: Agent Rules & Memory Sync (2-3 days)
- Phase 8: Git Automation (2 days)
- Phase 9: Testing & Documentation (2 days)
- Phase 10: MVP Readiness & Launch (1-2 days)

**Total**: 10-14 days (vs original 14 days for Phases 5-6)

**Rationale for Change**:
- **Feature-per-phase** approach (single focused deliverable)
- **Clearer milestones** (easier progress tracking)
- **Better testing** (validate each feature independently)
- **Same timeline** (still ~2 weeks total)
```

---

## Decision Matrix: Current State

| ID | Title | Original Status | Current Status | Action Required |
|----|-------|----------------|----------------|-----------------|
| D-001 | Obsidian-First | ✅ Decided | ✅ Valid | None |
| D-002 | Multi-Client | ✅ Decided | ✅ Valid | None |
| D-003 | Budget Model | ✅ Decided | ✅ Valid | None |
| D-004 | Timeline/Scope | ✅ Decided | 🔄 Update | Update phases 5-10 structure |
| D-005 | Knowledge Retention | ✅ Decided | ✅ Valid | None |
| D-006 | REST API | ✅ Decided | ✅ Valid | None |
| **D-007** | **FastMCP** | **✅ Decided** | **❌ OBSOLETE** | **Archive, create D-007-v2** |
| D-008 | Task Management | ✅ Decided | ✅ Valid | None |
| D-009 | Visualization | ✅ Decided | ✅ Valid | None |
| D-010 | SQLite | ✅ Decided | ✅ Valid | None |
| D-011 | Agent Framework | ✅ Decided | ✅ Valid | None |
| D-012 | Semantic Search | ✅ Decided | ✅ Valid | None |
| **D-013** | **RabbitMQ** | **✅ Decided - CRITICAL** | **⏸️ DEFERRED** | **Update to deferred** |
| **D-014** | **N8N** | **✅ Decided - CRITICAL** | **🔄 REPLACED** | **Mark as replaced by D-020** |
| D-015 | Git Integration | ✅ Decided | ✅ Valid | None |
| D-016 | Properties | ✅ Decided | ✅ Valid | None |
| **D-020** | **Weaver** | **📋 Proposed** | **✅ DECIDED** | **Update status to decided** |
| **TS-009** | **Event-Driven** | **✅ Decided (RabbitMQ)** | **🔄 AMEND** | **Add Weaver amendment** |
| **MD-001** | **JS/TS Stack** | **❓ Missing** | **❓ MISSING** | **Create new decision** |
| **MD-002** | **Phase Structure** | **❓ Missing** | **❓ MISSING** | **Update D-004** |

---

## Recommendations

### Immediate Actions (Today)

1. **Update D-020 (Weaver) status**: Change from "Proposed" to "Decided"
2. **Update D-013 (RabbitMQ)**: Move to deferred decisions section
3. **Update D-014 (N8N)**: Mark as replaced by D-020
4. **Archive D-007 (FastMCP)**: Move to obsolete decisions archive

### This Week

5. **Create D-021**: JavaScript/TypeScript stack decision (NEW)
6. **Update D-004**: Reflect new Phases 5-10 structure
7. **Amend TS-009**: Add Weaver interim implementation note
8. **Update INDEX.md**: Reflect all status changes

### Quality Checks

9. **Cross-reference phases 5-10**: Ensure all technology choices have decisions
10. **Review deferred decisions**: Ensure criteria for revisiting are clear
11. **Archive legacy**: Move obsolete Python stack decisions to archive

---

## Open Questions

### Technical Decisions Needed

**Q1**: **SQLite library for Node.js** - Which library?
- Current: Phase 5 mentions "better-sqlite3"
- **Status**: ❓ No formal decision exists
- **Impact**: Medium (affects shadow cache implementation)
- **Recommendation**: Create decision D-022 (SQLite library choice)

**Q2**: **Git library for Node.js** - Which library?
- Current: Phase 8 mentions "simple-git"
- **Status**: ❓ No formal decision exists
- **Impact**: Medium (affects git automation Phase 8)
- **Recommendation**: Create decision D-023 (Git library choice)

**Q3**: **Testing framework** - Jest vs Vitest?
- Current: Phase 9 mentions "Jest"
- **Status**: ❓ No formal decision exists
- **Impact**: Medium (affects all testing infrastructure)
- **Recommendation**: Create decision D-024 (Testing framework)

**Q4**: **Web framework for Weaver** - Why Hono?
- Current: Phase 5 + Phase 6 mention "Hono"
- **Status**: ❓ No formal decision exists
- **Impact**: Medium (affects webhook server architecture)
- **Recommendation**: Create decision D-025 (Web framework for webhooks)

---

## Success Criteria for Decision Health

**Target State**:
- [ ] All MVP technologies have formal decisions
- [ ] All "CRITICAL" decisions are valid or updated
- [ ] No obsolete decisions listed as "DECIDED"
- [ ] Deferred decisions clearly separated from MVP
- [ ] INDEX.md accurately reflects current architecture

**Current Health Score**: 65% (11/17 decisions valid, 6 need action)
**Target Health Score**: 100% (all decisions updated by end of week)

---

## Next Steps

1. **Create missing decisions** (MD-001, D-022-D-025)
2. **Update obsolete decisions** (D-007, D-013, D-014, D-020, TS-009)
3. **Update INDEX.md** to reflect changes
4. **Commit decision updates** to git
5. **Review with user** for approval

---

**Reviewer**: Claude Code System Analyst
**Review Date**: 2025-10-23
**Next Review**: 2025-10-30 (1 week)
**Status**: 🔄 In Progress - Awaiting Action on 6 decisions
