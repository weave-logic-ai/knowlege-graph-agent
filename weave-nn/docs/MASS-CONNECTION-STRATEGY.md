---
visual:
  icon: 📚
icon: 📚
---
# Mass Connection Strategy - Phase 14 Week 1-2

## Current State Analysis

From graph analysis:
- **Total files**: 528 markdown files
- **Currently connected**: 363 files (68.75%)
- **Orphaned**: 165 files (31.25%)
- **Target**: <5% orphan rate (<27 orphans)
- **Need to connect**: ~138 files

## Orphan Categories Identified

### 1. Root-Level Status Files (Priority: HIGH)
Files that need connection to project timeline/status hub:
- `BUILD-SUCCESS-REPORT.md` → [[PROJECT-TIMELINE]]
- `CLAUDE.md` → [[PROJECT-OVERVIEW-HUB]]
- `PHASE-13-DOCUMENTATION-COMPLETE.md` → [[PROJECT-TIMELINE]]
- `PHASE-13-FINAL-VALIDATION.md` → [[PROJECT-TIMELINE]]
- `PHASE-13-NEXT-STEPS.md` → [[PROJECT-TIMELINE]]
- `PHASE-14-WEEK-1-2-VALIDATION.md` → [[PROJECT-TIMELINE]]
- `PROJECT-STATUS-SUMMARY.md` → [[PROJECT-TIMELINE]]
- `TESTER-TO-CODER-HANDOFF.md` → [[PROJECT-TIMELINE]]

### 2. Documentation Files (Priority: HIGH)
Files that need connection to DOCS-DIRECTORY-HUB:
- `docs/BACKEND-HANDOFF-PHASE-13.md` → [[DOCS-DIRECTORY-HUB]]
- `docs/GENERIC-FILE-RENAME-REPORT.md` → [[DOCS-DIRECTORY-HUB]]
- `docs/PHASE-13-INTEGRATION-STATUS.md` → [[DOCS-DIRECTORY-HUB]]
- `docs/RENAME-SUMMARY.md` → [[DOCS-DIRECTORY-HUB]]

### 3. Phase 14 Files (Priority: HIGH)
New documentation that needs integration:
- `docs/phase-14/ANALYSIS-HANDOFF.md` → [[phase-14-master-plan]]
- `docs/phase-14/README.md` → [[phase-14-master-plan]]
- `docs/phase-14/orphan-cluster-analysis.md` → [[phase-14-master-plan]]

### 4. Infrastructure Hubs (Priority: MEDIUM)
Placeholder hubs that need content and connections:
- `infrastructure/infrastructure-overview-hub.md` → Needs content + links
- `infrastructure/kubernetes/kubernetes-deployment-hub.md` → Needs content + links
- `memory/agents/agent-memory-hub.md` → Needs content + links
- `memory/sessions/session-memory-hub.md` → Needs content + links
- `packages/packages-overview-hub.md` → Needs content + links
- `services/services-overview-hub.md` → Needs content + links

### 5. Test and Deliverables (Priority: MEDIUM)
- `tests/TEST-PLAN.md` → [[TESTING-HUB]]
- `weave-nn/PHASE-12-DELIVERABLES.md` → [[PHASE-12-COMPLETE-PLAN]]
- `weave-nn/PHASE-13-TEST-DELIVERABLES.md` → [[phase-13-master-plan]]

### 6. Archive and Legacy Files (Priority: LOW)
- `weave-nn/_files/knowledge-graph-integration-architecture.md` → [[ARCHIVE-HUB]]
- Task log files → [[TASK-LOG-HUB]]

## Batch Connection Plan

### Batch 1: Root Status Files (8 files)
Connect all root-level status/phase files to PROJECT-TIMELINE hub

### Batch 2: Documentation Orphans (20+ files)
Connect docs/ orphans to DOCS-DIRECTORY-HUB

### Batch 3: Phase 14 Integration (3 files)
Create phase-14-master-plan hub and connect all phase 14 files

### Batch 4: Infrastructure Hubs (6 hubs)
Populate hub documents with relevant content and bidirectional links

### Batch 5: Remaining Orphans
Systematic connection of all remaining files by directory

## Implementation Approach

For each orphan file:
1. **Add frontmatter** with related_hub metadata
2. **Add navigation section** at top of file
3. **Update hub document** with link to orphan
4. **Verify bidirectional** connection

## Success Metrics

- ✅ Orphan rate: 31.25% → <5%
- ✅ Connected files: 363 → 500+ (95%+)
- ✅ Average link density: 6.37 → 8+ links/file
- ✅ All major directories have hub documents

## Next Steps

1. Start with Batch 1 (root files) - highest impact
2. Progress through batches 2-5 systematically
3. Generate final report with updated metrics
4. Validate orphan rate achieved <5% target
