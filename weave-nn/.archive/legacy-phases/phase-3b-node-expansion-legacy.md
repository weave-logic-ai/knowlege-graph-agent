---
phase_id: PHASE-3B
phase_name: Node Expansion & Decision Documentation (Legacy)
type: planning
status: archived
priority: historical
created_date: '2025-10-20'
start_date: '2025-10-20'
end_date: '2025-10-20'
duration: 1 day
updated_date: '2025-10-23'
archived_date: '2025-10-23'
archived_reason: Obsoleted by Obsidian-First pivot and primitive architype reorganization
note: >-
  Renamed from PHASE-2B to PHASE-3B for clarity. Originally executed as Phase 3
  work. ARCHIVED 2025-10-23: Original scope (SaaS, custom UI, graph
  visualization component) superseded by Obsidian-First architecture decision
  and research synthesis integration.
scope:
  current_phase: mvp
  obsidian_only: true
dependencies:
  requires:
    - PHASE-2A
  enables:
    - PHASE-4
tags:
  - scope/mvp
  - type/planning
  - status/completed
  - priority/high
  - phase-3b
  - expansion
  - legacy
visual:
  icon: git-branch
  cssclasses:
    - type-planning
    - scope-mvp
    - status-completed
---

# Phase 2B: Node Expansion & Decision Documentation

**Status**: 📦 **ARCHIVED** (Obsoleted by Obsidian-First pivot)
**Started**: 2025-10-20
**Completed**: 2025-10-20
**Archived**: 2025-10-23
**Note**: This phase was executed as Phase 3 - see [[../../_planning/phases/phase-3-node-expansion|Phase 3]] for details

---

## ⚠️ ARCHIVAL NOTICE (2025-10-23)

**This document represents historical planning that is no longer applicable to the current project direction.**

### Why Archived

This phase document was created during the original "custom SaaS solution" vision for Weave-NN. Since then, the project underwent a **fundamental architectural pivot** in Phase 4A:

1. **Obsidian-First Architecture**: Eliminated need for custom frontend, graph visualization, and markdown editor components
2. **Primitive Architype Reorganization**: Vault restructured with 7 new architype directories (patterns/, protocols/, standards/, integrations/, schemas/, services/, guides/)
3. **Research Synthesis Integration**: Feature set redefined based on InfraNodus research, sparse memory finetuning, and cognitive variability tracking
4. **MCP Protocol Adoption**: AI integration shifted to Model Context Protocol instead of custom API layer

### What Superseded This Phase

**Original Scope** (Phase 3B Legacy):
- Custom frontend framework selection (React/Svelte)
- Graph visualization component development
- Markdown editor component
- SaaS business model planning
- Custom UI/UX architecture

**Current Reality** (Post-Phase 4A):
- Obsidian IS the frontend (native Obsidian features)
- Graph Analysis plugin + InfraNodus methodology
- Obsidian's markdown editor
- Personal knowledge management tool (no SaaS)
- MCP-based local-first architecture

### Historical Value

This document is preserved for:
- Understanding project evolution and decision history
- Recognizing scope changes and pivots
- Documenting lessons learned about feature creep
- Providing context for future architectural decisions

**For current project status, see**:
- [[../../_planning/phases/phase-0-pre-development-work|Phase 0: Pre-Development Work]] (current active phase)
- [[../../architecture/obsidian-native-integration-analysis|Obsidian-First Architecture]]
- [[../../docs/synthesis/prioritized-action-items|Research Synthesis Prioritized Actions]]

---













## Related

[[MASTER-PLAN]] • [[phase-6-file-watcher-weaver-integration]] • [[phase-7-agent-rules-memory-sync]]
## Related

[[phase-6-day-2-3-mcp-tasks]]
## Related

[[phase-2-documentation-capture]]
## Related

[[phase-7-mvp-week-2]]
## Related

[[phase-6-mvp-week-1]]
## Related

[[phase-4a-decision-closure]]
## 🎯 Objectives

### Primary Goals
1. **Create Architecture Nodes** - Document system layers and components
2. **Create Feature Nodes** - Define product features and capabilities
3. **Create Business Nodes** - Document business model and strategy
4. **Complete Decision Nodes** - Create remaining 11 decision documents
5. **Enhance Cross-Linking** - Strengthen relationships between nodes

### Target Deliverables
- **20-30 new nodes** across 4 categories
- **All decisions documented** (not necessarily decided)
- **Architecture fully mapped**
- **Feature set clearly defined**
- **Business model outlined**

---

## 📋 Pending Todos

### Architecture Nodes (4 nodes) - HIGH PRIORITY
- [ ] [[../../architecture/frontend-layer|frontend-layer.md]] - UI and visualization components
- [ ] [[../../architecture/api-layer|api-layer.md]] - REST/GraphQL endpoints
- [ ] [[../../architecture/data-knowledge-layer|data-knowledge-layer.md]] - Storage and graph systems
- [ ] [[../../architecture/ai-integration-layer|ai-integration-layer.md]] - MCP and AI services

### Feature Nodes (6 nodes) - HIGH PRIORITY
- [ ] [[../../features/knowledge-graph-visualization|knowledge-graph-visualization.md]]
- [ ] [[../../features/markdown-editor-component|markdown-editor-component.md]]
- [ ] [[../../features/ai-integration-component|ai-integration-component.md]]
- [ ] [[../../features/temporal-knowledge-graph|temporal-knowledge-graph.md]]
- [ ] [[../../features/auto-linking|auto-linking.md]]
- [ ] [[../../features/collaborative-editing|collaborative-editing.md]]

### Business Nodes (4 nodes) - MEDIUM PRIORITY
- [ ] [[../../business/value-proposition|value-proposition.md]]
- [ ] [[../../business/target-users|target-users.md]]
- [ ] [[../../business/saas-pricing-model|saas-pricing-model.md]]
- [ ] [[../../business/cost-analysis|cost-analysis.md]]

### Decision Nodes (11 nodes) - CRITICAL
#### Technical Decisions
- [ ] [[../../decisions/technical/frontend-framework|TS-1: Frontend Framework]] - **CRITICAL BLOCKER**
- [ ] [[../../decisions/technical/graph-visualization|TS-2: Graph Visualization]] - **BLOCKS MVP**
- [ ] [[../../decisions/technical/backend-architecture|TS-3: Backend Architecture]]
- [ ] [[../../decisions/technical/database-storage|TS-4: Database & Storage]] (update existing)
- [ ] [[../../decisions/technical/markdown-editor|TS-5: Markdown Editor]]
- [ ] [[../../decisions/technical/auth|TS-6: Authentication]]

#### Feature Decisions
- [ ] [[../../decisions/features/mvp-features|FP-1: MVP Feature Set]] - **CRITICAL**
- [ ] [[../../decisions/features/ai-integration|FP-2: AI Integration Priority]]
- [ ] [[../../decisions/features/collaboration|FP-3: Collaboration Features]]

#### Business Decisions
- [ ] [[../../decisions/business/monetization|BM-1: Monetization Strategy]]
- [ ] [[../../decisions/business/open-source|BM-2: Open Source Strategy]]

### Additional Nodes (Optional)
- [ ] Implementation phase nodes (4)
- [ ] Additional technical stack nodes (5-10)
- [ ] Workflow nodes (2-3)

---

## ✅ Completed This Phase

### Node Creation
- [x] Git repository initialized
- [x] Planning structure created (`_planning/`)
- [x] Phase 1 documentation completed
- [x] This phase document created

---

## 🚧 Blockers

### Decision Blockers
1. **TS-1 (Frontend Framework)** - Blocks:
   - TS-2 (Graph Visualization)
   - TS-5 (Markdown Editor)
   - FP-1 (MVP Features)
   - Timeline estimation

**Action Needed**: Decide React vs Svelte (or prototype both)

---

## 🔗 Related Nodes

### Prior Phase
- [[phase-1-knowledge-graph-transformation|Phase 1: Knowledge Graph Transformation]] ✅

### Related Concepts
- [[../../concepts/knowledge-graph|Knowledge Graph]]
- [[../../concepts/weave-nn|Weave-NN Project]]
- [[../../platforms/custom-solution|Custom Solution]]

### Related Decisions
- [[../../decisions/executive/project-scope|ED-1: Project Scope]] ✅ (SaaS decided)
- All TS-1 through BM-2 decisions pending

---

## 📊 Final Progress - Completed as Phase 3

This phase's work was completed under the name "Phase 3: Node Expansion & Architecture".

### Nodes Created: 24 / 30 (80%)
- Architecture: 4 / 4 ✅
- Technical: 10 / 10 ✅
- Business: 4 / 4 ✅
- Implementation Phases: 4 / 4 ✅
- Workflows: 2 / 2 ✅

### Completion: 100% ✅

**Completed**: 2025-10-20

---

## ✅ Success Criteria - All Met

- [x] 20+ new nodes created (24 created)
- [x] Architecture fully mapped (4 layers documented)
- [x] Business model outlined (4 comprehensive business nodes)
- [x] Implementation roadmap defined (4 phases)
- [x] Workflows documented (canvas creation, phase management)

**Note**: Decision nodes were handled separately in Phase 4 via DECISIONS.md

---

## 📚 Related Documentation

- [[phase-3-node-expansion|Phase 3: Node Expansion]] - Where this work was completed
- [[../README|Planning Hub]]
- [[../../README|Knowledge Graph Entry]]

---

## ➡️ Next Phase

**Phase 4**: [[phase-4-decision-closure|Decision Closure & Obsidian-First Pivot]]
- User filled out DECISIONS.md
- Architectural pivot to Obsidian-first
- 16 decisions closed

---

**Phase Started**: 2025-10-20
**Status**: ✅ **COMPLETED** (as Phase 3)
**Completed**: 2025-10-20
