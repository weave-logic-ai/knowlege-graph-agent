---
title: 'Phase 15: Workflow Observability & Workflow.dev Integration'
type: documentation
status: in-progress
phase_id: PHASE-15
tags:
  - phase/phase-15
  - type/documentation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4CB"
  color: '#8E8E93'
  cssclasses:
    - document
updated: '2025-10-29T04:55:04.029Z'
keywords:
  - "\U0001F3AF executive summary"
  - "\U0001F4CB current state analysis"
  - what we have (custom workflow engine)
  - what we need
  - "\U0001F680 phase 15 strategy: poc-first approach"
  - two-phase execution
  - "\U0001F4E6 technical architecture"
  - workflow devkit integration
  - directory structure
  - "\U0001F3AF phase 15 deliverables"
---
# Phase 15: Workflow Observability & Workflow.dev Integration

**Status**: 🔵 PLANNING
**Priority**: HIGH
**Timeline**: 10-12 weeks (2-week POC + 8-10 week implementation)
**Dependencies**: Phase 12 (Complete), Phase 13, Phase 14

---

## 🎯 Executive Summary

Phase 15 will add comprehensive workflow observability to Weaver by integrating Workflow.dev (Workflow DevKit by Vercel). This replaces our custom workflow engine with a battle-tested, directive-based durable workflow system that provides:

- ✅ **Built-in Observability**: `npx workflow inspect runs` CLI + Web UI
- ✅ **Zero Infrastructure**: No queues, schedulers, or databases needed
- ✅ **Durable Execution**: Workflows suspend/resume across process restarts
- ✅ **Simple DX**: Familiar async/await syntax with two directives
- ✅ **Portable**: Local, Vercel, AWS, GCP via World abstraction

**Decision**: ✅ **PROCEED WITH 2-WEEK POC** → Full migration if successful

---

## 📋 Current State Analysis

### What We Have (Custom Workflow Engine)

**Location**: `/weaver/src/workflow-engine/`

**Architecture**:
```typescript
WorkflowEngine
├── WorkflowRegistry (in-memory Map)
├── WorkflowDefinition (custom types)
├── WorkflowExecution (tracking only)
└── Middleware (activity logging)
```

**Workflows Implemented** (19 total):
- Knowledge Graph workflows (7)
- Learning Loop workflows (4)
- Vector DB workflows (4)
- Example workflows (4)

**Limitations**:
- ❌ No persistence across restarts
- ❌ No observability tooling
- ❌ No suspend/resume capability
- ❌ Manual execution tracking
- ❌ No built-in retries or error handling
- ❌ No visual inspection tools

**Package**: `workflow@1.1.6` (DEPRECATED workspace manager, NOT Workflow DevKit)

### What We Need

1. **Observability**: Inspect running/completed workflows
2. **Persistence**: `.workflow-data/` directory with execution history
3. **CLI Tools**: `npx workflow inspect runs` with web UI
4. **Durability**: Workflows survive process restarts
5. **Monitoring**: Real-time execution tracking

---

## 🚀 Phase 15 Strategy: POC-First Approach

### Two-Phase Execution

#### PHASE 15A: POC & Validation (2 weeks)
**Goal**: Prove Workflow DevKit works for Weaver's use cases

**Week 1**: Setup & Basic Integration
- Install Workflow DevKit (`workflow@4.0.1-beta.3`)
- Setup EmbeddedWorld with `.workflow-data/`
- Migrate 2-3 simple workflows
- Test basic observability

**Week 2**: Advanced Testing & Decision
- Test durable execution (suspend/resume)
- Performance benchmarking
- Beta stability assessment
- **Go/No-Go Decision**

**Success Criteria**:
- ✅ All 3 test workflows execute correctly
- ✅ `npx workflow inspect runs` shows execution history
- ✅ Workflows survive process restart
- ✅ Performance acceptable (<10% overhead)
- ✅ No critical bugs in beta version

**Deliverables**:
1. POC codebase with 3 migrated workflows
2. Performance benchmark report
3. Stability assessment document
4. **Go/No-Go recommendation**

#### PHASE 15B: Full Migration (8-10 weeks)
**Conditional**: Only if POC succeeds

**Weeks 3-4**: Core Migration
- Migrate all 19 workflows to Workflow DevKit
- Setup production EmbeddedWorld configuration
- Implement error handling & retries

**Weeks 5-6**: Testing & Validation
- Comprehensive testing of all workflows
- Performance optimization
- Documentation updates

**Weeks 7-8**: Integration & CLI
- Integrate with Weaver CLI commands
- Setup observability dashboard
- Add monitoring hooks

**Weeks 9-10**: Production Readiness
- Final testing & bug fixes
- Team training
- Staged rollout
- Production deployment

---

## 📦 Technical Architecture

### Workflow DevKit Integration

#### Installation
```bash
npm install workflow@latest
```

#### EmbeddedWorld Setup
```typescript
// src/workflow-engine/embedded-world.ts
import { createEmbeddedWorld } from 'workflow';

export const workflowWorld = createEmbeddedWorld({
  dataDir: './.workflow-data',  // Persistent storage
  port: 3000,                    // Observability server
});
```

#### Workflow Migration Pattern
```typescript
// BEFORE (Custom Engine)
export const documentConnectionWorkflow: WorkflowDefinition = {
  id: 'kg:document-connection',
  name: 'Document Connection Workflow',
  triggers: ['file:add', 'file:change'],
  handler: async (context) => {
    // Workflow logic
  },
};

// AFTER (Workflow DevKit)
import { step } from 'workflow';

export async function documentConnectionWorkflow(filePath: string) {
  'use workflow';

  const parsed = await step('parse-file', async () => {
    return parseMarkdownFile(filePath);
  });

  const connections = await step('find-connections', async () => {
    return findRelatedDocuments(parsed);
  });

  await step('update-connections', async () => {
    return updateConnectionsInFile(filePath, connections);
  });
}
```

### Directory Structure
```
weaver/
├── .workflow-data/          # NEW: Persistent workflow data
│   ├── runs/               # Execution history
│   ├── steps/              # Step execution data
│   ├── hooks/              # Lifecycle hooks
│   └── metadata/           # Workflow metadata
│
├── src/
│   ├── workflows/          # UPDATED: Workflow DevKit workflows
│   │   ├── kg/
│   │   │   ├── document-connection.workflow.ts
│   │   │   ├── link-update.workflow.ts
│   │   │   └── graph-validation.workflow.ts
│   │   ├── learning-loop/
│   │   │   ├── perception.workflow.ts
│   │   │   ├── reasoning.workflow.ts
│   │   │   ├── execution.workflow.ts
│   │   │   └── reflection.workflow.ts
│   │   └── vector-db/
│   │       ├── embedding.workflow.ts
│   │       ├── indexing.workflow.ts
│   │       └── search.workflow.ts
│   │
│   ├── workflow-engine/     # REFACTORED: Thin wrapper
│   │   ├── embedded-world.ts  # NEW: EmbeddedWorld setup
│   │   ├── registry.ts        # UPDATED: Workflow DevKit registry
│   │   └── observability.ts   # NEW: Observability utilities
│   │
│   └── cli/commands/
│       └── workflow.ts      # UPDATED: New inspect commands
│
├── docs/workflows/          # NEW: Workflow documentation
│   ├── migration-guide.md
│   ├── workflow-catalog.md
│   └── observability-guide.md
│
└── tests/workflows/         # UPDATED: Workflow DevKit tests
    ├── document-connection.test.ts
    └── learning-loop.test.ts
```

---

## 🎯 Phase 15 Deliverables

### POC Phase (Weeks 1-2)

1. **POC Codebase**
   - 3 migrated workflows (document-connection, embedding, file-watcher)
   - EmbeddedWorld setup
   - Basic observability integration

2. **Documentation**
   - POC setup guide
   - Migration pattern examples
   - Performance benchmark results
   - Stability assessment

3. **Decision Document**
   - Go/No-Go recommendation
   - Risk analysis
   - Timeline estimate
   - Resource requirements

### Full Migration Phase (Weeks 3-10)

#### Code Deliverables
1. **19 Migrated Workflows**
   - All workflows converted to Workflow DevKit
   - Step-based execution
   - Error handling & retries
   - Type-safe implementations

2. **Observability Infrastructure**
   - `.workflow-data/` directory setup
   - EmbeddedWorld configuration
   - CLI integration
   - Web UI access

3. **CLI Enhancements**
   ```bash
   # New commands
   npx weaver workflow list           # List all workflows
   npx weaver workflow inspect        # Launch web UI
   npx weaver workflow inspect runs   # View execution history
   npx weaver workflow status <id>    # Check specific workflow
   npx weaver workflow retry <run-id> # Retry failed workflow
   ```

4. **Testing Suite**
   - Unit tests for each workflow
   - Integration tests
   - Performance benchmarks
   - Durable execution tests

#### Documentation Deliverables
1. **Migration Guide** (`docs/workflows/migration-guide.md`)
   - Before/after patterns
   - Step-by-step migration process
   - Common pitfalls

2. **Workflow Catalog** (`docs/workflows/workflow-catalog.md`)
   - All 19 workflows documented
   - Triggers, inputs, outputs
   - Execution flow diagrams

3. **Observability Guide** (`docs/workflows/observability-guide.md`)
   - CLI commands reference
   - Web UI usage
   - Debugging workflows
   - Performance monitoring

4. **Developer Guide** (`docs/workflows/developer-guide.md`)
   - Creating new workflows
   - Best practices
   - Testing strategies
   - Error handling

---

## 📊 Timeline & Milestones

### POC Phase (Weeks 1-2)

| Week | Milestone | Deliverables |
|------|-----------|-------------|
| **Week 1** | Setup & Basic Migration | - Workflow DevKit installed<br>- EmbeddedWorld configured<br>- 3 workflows migrated<br>- Basic CLI working |
| **Week 2** | Testing & Decision | - Performance benchmarks<br>- Stability testing<br>- Go/No-Go report<br>- **Decision Made** |

**Critical Path**: Week 2 Go/No-Go decision determines Phase 15B

### Full Migration Phase (Weeks 3-10)

| Weeks | Milestone | Deliverables |
|-------|-----------|-------------|
| **3-4** | Core Migration | - All 19 workflows migrated<br>- Error handling implemented<br>- Integration tests passing |
| **5-6** | Testing & Optimization | - Performance optimized<br>- Comprehensive tests<br>- Documentation draft |
| **7-8** | CLI & Observability | - CLI commands complete<br>- Web UI integrated<br>- Monitoring setup |
| **9-10** | Production Readiness | - Final testing complete<br>- Team trained<br>- **Production deployment** |

---

## ⚠️ Risks & Mitigation

### High Risk: Beta Software Stability

**Risk**: Workflow DevKit is v4.0.1-beta.3 (public beta)

**Impact**: Potential bugs, breaking changes, limited support

**Mitigation**:
- ✅ 2-week POC validates stability first
- ✅ Pin to specific version (no auto-updates)
- ✅ Comprehensive error handling
- ✅ Fallback to custom engine if critical issues
- ✅ Monitor GitHub issues and changelogs

**Go/No-Go Criteria**: If >2 critical bugs found in POC, abort migration

### Medium Risk: Next.js Framework Dependency

**Risk**: Workflow DevKit optimized for Next.js, Weaver is standalone

**Impact**: Potential compatibility issues, missing features

**Mitigation**:
- ✅ POC validates standalone usage
- ✅ EmbeddedWorld designed for non-Next.js apps
- ✅ Direct API usage (not framework abstractions)
- ✅ Test extensively in Weaver's environment

### Medium Risk: Learning Curve

**Risk**: Team needs to learn new workflow paradigm

**Impact**: Slower initial development, potential bugs

**Mitigation**:
- ✅ Comprehensive documentation
- ✅ Migration examples for all patterns
- ✅ Team training sessions
- ✅ Gradual rollout (3 workflows → 19 workflows)

### Low Risk: Performance Overhead

**Risk**: Workflow DevKit may add execution overhead

**Impact**: Slower workflow execution

**Mitigation**:
- ✅ Benchmark in POC (<10% overhead required)
- ✅ Optimize step boundaries
- ✅ Profile and optimize if needed
- ✅ Compare with custom engine baseline

---

## 💰 Cost-Benefit Analysis

### Costs

**Development Time**: 10-12 weeks (2 POC + 8-10 implementation)

**Team Resources**: 2 developers full-time for POC, 3-4 for full migration

**Risk**: Beta software may have stability issues

### Benefits

**Immediate Benefits**:
- ✅ Built-in observability (`npx workflow inspect runs`)
- ✅ Durable execution (workflows survive restarts)
- ✅ Visual workflow inspection (web UI)
- ✅ Automatic retries and error handling
- ✅ Step-based execution tracking

**Long-Term Benefits**:
- ✅ Reduced maintenance (no custom engine to maintain)
- ✅ Better debugging (visual inspection tools)
- ✅ Improved reliability (battle-tested framework)
- ✅ Faster development (simple directive-based syntax)
- ✅ Future-proof (Vercel-backed, active development)

**Technical Debt Reduction**:
- ❌ Remove custom workflow engine (~1,000 lines)
- ❌ Remove manual execution tracking
- ❌ Remove custom middleware
- ❌ Simplify testing

**ROI**: Positive after 6 months (maintenance savings + developer productivity)

---

## 🎓 Success Criteria

### POC Success (Week 2 Decision)

**Required** (All must pass):
- ✅ All 3 test workflows execute correctly
- ✅ `npx workflow inspect runs` shows execution history
- ✅ Workflows survive process restart
- ✅ Performance <10% overhead vs custom engine
- ✅ No critical bugs affecting Weaver use cases

**Recommended** (2 of 3):
- ✅ Error handling works as expected
- ✅ Step-based execution provides value
- ✅ Web UI is helpful for debugging

**If <5 Required OR <2 Recommended**: Abort migration, enhance custom engine

### Full Migration Success (Week 10)

**Functional**:
- ✅ All 19 workflows migrated and working
- ✅ Zero regressions from custom engine
- ✅ Observability tools fully functional
- ✅ CLI commands complete

**Quality**:
- ✅ Test coverage ≥85%
- ✅ All workflows documented
- ✅ Performance within 10% of baseline
- ✅ Zero critical bugs

**Operational**:
- ✅ Team trained on Workflow DevKit
- ✅ Production deployment successful
- ✅ Monitoring in place
- ✅ Rollback plan tested

---

## 📚 Reference Documentation

### Created by Research Agent

All research documents located in: `/docs/research/`

1. **Full Analysis** (35 KB, 1,352 lines)
   - `workflow-dev-analysis.md`
   - Complete technical analysis
   - Code examples
   - Migration patterns

2. **Executive Summary** (9.1 KB, 292 lines)
   - `workflow-dev-migration-summary.md`
   - Quick decision guide
   - Cost-benefit analysis
   - Timeline overview

3. **Quick Reference** (8.7 KB, 458 lines)
   - `workflow-dev-quick-reference.md`
   - Developer cheat sheet
   - CLI commands
   - Code patterns

4. **Navigation Index** (15 KB, 473 lines)
   - `WORKFLOW-DEV-RESEARCH-INDEX.md`
   - Document guide
   - Glossary
   - Stakeholder messaging

5. **Research Report** (17 KB)
   - `RESEARCH-COMPLETE-REPORT.md`
   - Methodology
   - Statistics
   - Completion summary

**Total Research Package**: 84.8 KB | 2,575+ lines | ~18,000 words

---

## 🚀 Next Steps

### This Week (Immediate Actions)

1. **Team Review** (3-4 hours)
   - Leadership: Read `workflow-dev-migration-summary.md` (15 min)
   - Tech leads: Read `workflow-dev-analysis.md` (45 min)
   - Developers: Read `workflow-dev-quick-reference.md` (10 min)
   - Team meeting: Discuss findings (2 hours)

2. **POC Decision** (By end of week)
   - Make Go/No-Go decision on POC
   - If Go: Assign 2 developers for 2-week POC
   - If No-Go: Plan custom engine enhancements

3. **Resource Allocation**
   - Reserve 2 developers for POC (Weeks 1-2)
   - Reserve 3-4 developers for full migration (Weeks 3-10)

### Week 1-2: POC Execution (If Approved)

**Day 1-3**: Setup
- Install Workflow DevKit
- Configure EmbeddedWorld
- Setup `.workflow-data/` directory

**Day 4-7**: Migration
- Migrate 3 simple workflows
- Test basic functionality
- Document issues

**Day 8-10**: Validation
- Performance benchmarking
- Stability testing
- Beta assessment
- Create Go/No-Go report

**Day 10**: Decision
- Review POC results
- Make Go/No-Go decision for full migration

### Weeks 3-10: Full Migration (If POC Succeeds)

Follow detailed timeline in **Timeline & Milestones** section above.

---

## 📞 Stakeholder Communication

### For Leadership
**Read**: `workflow-dev-migration-summary.md`
**Message**: "Phase 15 will add enterprise-grade workflow observability with minimal infrastructure overhead. POC-first approach mitigates beta software risk."
**Ask**: Approval for 2-week POC with 2 developers

### For Tech Leads
**Read**: `workflow-dev-analysis.md`
**Message**: "Workflow DevKit provides built-in observability, durability, and portability. Architecture is sound, but beta status requires validation."
**Ask**: Technical review and POC participation

### For Developers
**Read**: `workflow-dev-quick-reference.md`
**Message**: "Two directives (`'use workflow'`, `'use step'`) replace our custom engine. Simpler syntax, better tooling."
**Ask**: POC implementation volunteers

---

## 🎯 Phase 15 Recommendation

### Primary Recommendation: ✅ PROCEED WITH POC

**Confidence Level**: HIGH (85%)

**Rationale**:
1. **Technical Merit**: Workflow DevKit solves real problems (observability, durability, simplicity)
2. **Risk Mitigation**: 2-week POC validates beta stability before commitment
3. **Cost-Benefit**: Positive ROI after 6 months
4. **Strategic Alignment**: Aligns with "build vs. buy" philosophy (buy when better)
5. **Developer Experience**: Simpler, more productive workflow development

**Key Insight**: The POC is low-risk (2 weeks, 2 developers) with high upside (10x better observability). Even if POC fails, we learn what's needed for custom engine v2.

### Alternative: Custom Engine Enhancement

**If POC Fails** or **Decision is No-Go**:

Enhance custom workflow engine with:
1. SQLite-based execution history
2. Simple CLI inspect command
3. JSON file-based observability
4. Basic durability (state persistence)

**Timeline**: 4-6 weeks
**Effort**: Lower (known codebase)
**Outcome**: Adequate but not optimal

---

## 📊 Phase 15 Summary

| Aspect | Details |
|--------|---------|
| **Objective** | Add workflow observability via Workflow.dev integration |
| **Approach** | POC-first (2 weeks) → Full migration (8-10 weeks) if successful |
| **Timeline** | 10-12 weeks total |
| **Resources** | 2 developers (POC), 3-4 developers (full migration) |
| **Risk Level** | MEDIUM (beta software, mitigated by POC) |
| **Expected ROI** | Positive after 6 months |
| **Recommendation** | ✅ **PROCEED WITH POC** |
| **Critical Milestone** | Week 2: Go/No-Go decision based on POC results |

---

## ✅ Phase 15 Status

**Planning**: ✅ COMPLETE
**Research**: ✅ COMPLETE (84.8 KB documentation)
**Decision**: ⏳ PENDING (POC approval needed)
**POC**: 🔜 READY TO START
**Full Migration**: 🔜 CONDITIONAL (based on POC)

---

**Created**: 2025-10-28
**Last Updated**: 2025-10-28
**Next Review**: After POC completion (Week 2)
**Owner**: Weaver Engineering Team
**Stakeholders**: Product, Engineering, DevOps

---

**Phase 15 Plan: READY FOR APPROVAL**

