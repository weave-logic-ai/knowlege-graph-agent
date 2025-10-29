# Workflow Migration Strategy: OLD → NEW System

**Status**: 🚧 In Progress
**Goal**: Migrate from custom WorkflowEngine to Vercel Workflow DevKit
**Date**: October 29, 2025

---

## Executive Summary

We need to migrate all workflows from the OLD system (WorkflowEngine) to the NEW system (Workflow DevKit) to gain:
- ✅ Durable execution (survives restarts)
- ✅ Step-by-step observability
- ✅ Industry-standard workflow patterns
- ✅ Full execution history in `.workflow-data/`

**Current Status**:
- OLD System: ✅ Fully operational (1 workflow registered)
- NEW System: ⚠️ Infrastructure complete, but bundle generation broken
- Blocker: Workflow entrypoint returns 501 "Not Yet Implemented"

---

## Problem Analysis

### Root Cause: Workflow Bundle Generation

The `createWorkflowBundle()` function in `src/workflow-engine/embedded-world.ts` (lines 53-93) returns a **hardcoded test stub** instead of the real workflow implementation:

```typescript
// ❌ CURRENT (BROKEN)
async function createWorkflowBundle(): Promise<string> {
  const bundle = `
    async function documentConnectionWorkflow(input) {
      // Minimal test implementation
      return {
        success: true,
        connections: 0,
        filesModified: [],
        message: 'Test stub - not real workflow'
      };
    }

    globalThis.__private_workflows.set("...", documentConnectionWorkflow);
  `;
  return bundle;
}
```

**Problem**: The real workflow code in `document-connection.workflow.ts` (305 lines) is **never imported or executed**.

### Why This Happens

The Workflow DevKit runtime requires workflows to be:
1. **Bundled as JavaScript strings** (not ES modules with imports)
2. **Evaluated in a VM context** (isolated execution)
3. **Registered in `globalThis.__private_workflows` Map**

Our current build process:
- ✅ Compiles TypeScript → JavaScript (Vite)
- ✅ Preserves 'use workflow' directives (workflowRollupPlugin)
- ❌ Outputs ES modules with imports (not VM-compatible)
- ❌ No bundle generation for workflow code

---

## Migration Strategy

### Phase 1: Fix Workflow Bundle Generation (Week 1)

#### 1.1 Create Workflow Bundler

**Goal**: Bundle compiled workflows into self-contained JavaScript strings

**Implementation**:
```typescript
// src/workflow-engine/workflow-bundler.ts

import fs from 'fs/promises';
import path from 'path';
import { build } from 'esbuild';

/**
 * Bundle a workflow into a self-contained JavaScript string
 *
 * Input: dist/workflows/kg/document-connection.workflow.js (ES module)
 * Output: Bundled JavaScript string with all dependencies inline
 */
export async function bundleWorkflow(
  workflowPath: string
): Promise<{ bundle: string; workflowId: string }> {
  // Use esbuild to bundle workflow with dependencies
  const result = await build({
    entryPoints: [workflowPath],
    bundle: true,
    format: 'iife', // Immediately Invoked Function Expression
    platform: 'node',
    write: false,
    external: [], // Bundle everything
  });

  const bundleCode = result.outputFiles[0].text;

  // Extract workflow ID from file path
  const workflowId = extractWorkflowId(workflowPath);

  // Wrap bundle to register in globalThis
  const wrappedBundle = `
    (function() {
      ${bundleCode}

      // Register workflow in runtime
      if (!globalThis.__private_workflows) {
        globalThis.__private_workflows = new Map();
      }

      globalThis.__private_workflows.set(
        "${workflowId}",
        documentConnectionWorkflow
      );
    })();
  `;

  return { bundle: wrappedBundle, workflowId };
}
```

#### 1.2 Update embedded-world.ts

Replace `createWorkflowBundle()` with dynamic bundler:

```typescript
// src/workflow-engine/embedded-world.ts

import { bundleWorkflow } from './workflow-bundler.js';
import { glob } from 'glob';

async function createWorkflowBundle(): Promise<string> {
  // Find all compiled .workflow.js files
  const workflowFiles = await glob('dist/workflows/**/*.workflow.js');

  // Bundle each workflow
  const bundles = await Promise.all(
    workflowFiles.map(file => bundleWorkflow(file))
  );

  // Combine all bundles into single string
  const combinedBundle = bundles.map(b => b.bundle).join('\n\n');

  console.log(`✅ Bundled ${bundles.length} workflows`);
  return combinedBundle;
}
```

#### 1.3 Test Bundle Generation

```bash
# Test workflow bundle creation
npx tsx scripts/test-workflow-bundle.ts

# Expected output:
# ✅ Bundled 1 workflows
# ✅ Workflow registered: document-connection
# ✅ Workflow executable in VM context
```

---

### Phase 2: Dynamic Workflow Registration (Week 1)

#### 2.1 Workflow Registry Service

Create service to auto-discover and register workflows:

```typescript
// src/workflow-engine/workflow-registry.ts

export class WorkflowRegistry {
  private workflows = new Map<string, WorkflowMetadata>();

  /**
   * Scan dist/workflows/ and register all .workflow.js files
   */
  async registerAll(): Promise<void> {
    const files = await glob('dist/workflows/**/*.workflow.js');

    for (const file of files) {
      const metadata = await this.analyzeWorkflow(file);
      this.workflows.set(metadata.id, metadata);
    }
  }

  /**
   * Get workflow by trigger type
   */
  getWorkflowsByTrigger(trigger: string): WorkflowMetadata[] {
    return Array.from(this.workflows.values())
      .filter(w => w.triggers.includes(trigger));
  }
}
```

#### 2.2 Update File Watcher Integration

Trigger NEW workflows from file events:

```typescript
// src/index.ts (update file watcher handler)

fileWatcher.on(async (event: FileEvent) => {
  // Update shadow cache
  await shadowCache.syncFile(event.path, event.relativePath);

  // Trigger OLD workflows (for now)
  await workflowEngine.triggerFileEvent(event);

  // Trigger NEW workflows
  const workflows = workflowRegistry.getWorkflowsByTrigger(`file:${event.type}`);

  for (const workflow of workflows) {
    await executeWorkflowDevKit(workflow.id, {
      filePath: event.path,
      vaultRoot: config.vault.path,
      eventType: event.type,
    });
  }
});
```

---

### Phase 3: Migrate document-connection Workflow (Week 2)

#### 3.1 Validate NEW Workflow Implementation

**Checklist**:
- ✅ `document-connection.workflow.ts` uses 'use workflow' directive
- ✅ Steps use 'use step' directive
- ✅ Input/output types match OLD workflow
- ✅ Error handling comprehensive
- ✅ Logging consistent

#### 3.2 Create Side-by-Side Test

Run both OLD and NEW workflows on same input:

```typescript
// scripts/test-workflow-migration.ts

async function testBothWorkflows(filePath: string) {
  console.log('\n🧪 Testing OLD vs NEW Workflow\n');

  // Test OLD workflow
  const oldResult = await testOldWorkflow(filePath);

  // Test NEW workflow
  const newResult = await testNewWorkflow(filePath);

  // Compare results
  console.log('📊 Comparison:\n');
  console.log(`OLD - Connections: ${oldResult.connections}`);
  console.log(`NEW - Connections: ${newResult.connections}`);
  console.log(`Match: ${oldResult.connections === newResult.connections ? '✅' : '❌'}`);
}
```

#### 3.3 Production Cutover

**Steps**:
1. Enable NEW workflow in production
2. Keep OLD workflow running in parallel (shadow mode)
3. Compare results for 1 week
4. If results match consistently → disable OLD workflow
5. Remove OLD workflow code

---

### Phase 4: Infrastructure Cleanup (Week 3)

#### 4.1 Deprecate OLD System

Once NEW workflow validated:
```typescript
// Mark OLD system as deprecated
// src/workflow-engine/index.ts

/**
 * @deprecated Use Workflow DevKit instead
 * This system will be removed in v2.0.0
 */
export class WorkflowEngine {
  // ...
}
```

#### 4.2 Update Documentation

- Document NEW workflow development process
- Create workflow migration guide
- Update architecture diagrams
- Add NEW workflow examples

#### 4.3 Remove OLD System (v2.0.0)

**Breaking Changes**:
- Remove WorkflowEngine class
- Remove WorkflowDefinition interface
- Remove OLD workflow registration
- Update all imports

---

## Detailed Implementation Plan

### Week 1: Fix Bundle Generation

#### Day 1-2: Implement Workflow Bundler
- [ ] Create `src/workflow-engine/workflow-bundler.ts`
- [ ] Install esbuild dependency
- [ ] Implement `bundleWorkflow()` function
- [ ] Add workflow ID extraction
- [ ] Create test suite

#### Day 3-4: Update embedded-world.ts
- [ ] Replace hardcoded bundle with dynamic bundler
- [ ] Implement workflow discovery (glob)
- [ ] Test multi-workflow bundling
- [ ] Verify VM context execution

#### Day 5: Integration Testing
- [ ] Test workflow execution end-to-end
- [ ] Verify observability data (.workflow-data/)
- [ ] Test file watcher triggers
- [ ] Performance benchmarks

### Week 2: Migrate document-connection

#### Day 1-2: Validate NEW Workflow
- [ ] Review document-connection.workflow.ts
- [ ] Create comprehensive test suite
- [ ] Test with real vault data
- [ ] Compare with OLD workflow results

#### Day 3-4: File Watcher Integration
- [ ] Update file watcher to trigger NEW workflows
- [ ] Implement dual-execution (OLD + NEW)
- [ ] Add result comparison logging
- [ ] Monitor for discrepancies

#### Day 5: Production Testing
- [ ] Deploy to staging
- [ ] Run on production vault (read-only)
- [ ] Analyze execution history
- [ ] Validate results

### Week 3: Cleanup & Documentation

#### Day 1-2: Deprecate OLD System
- [ ] Add deprecation warnings
- [ ] Update changelog
- [ ] Plan breaking changes for v2.0.0
- [ ] Notify users

#### Day 3-4: Documentation
- [ ] Write workflow migration guide
- [ ] Create NEW workflow tutorial
- [ ] Update architecture docs
- [ ] Add workflow examples

#### Day 5: Final Validation
- [ ] Comprehensive integration tests
- [ ] Performance benchmarks
- [ ] Security review
- [ ] Release notes

---

## Success Criteria

### Must Have (P0)
- ✅ Workflow bundle generation working
- ✅ NEW workflow executes successfully
- ✅ File watcher triggers NEW workflows
- ✅ Results match OLD workflow
- ✅ Observability data persisted correctly

### Should Have (P1)
- ✅ Multiple workflow support
- ✅ Workflow registry auto-discovery
- ✅ Side-by-side testing
- ✅ Migration documentation

### Nice to Have (P2)
- CLI inspection tools (`weaver workflow inspect`)
- Web UI for workflow visualization
- Performance monitoring dashboard
- Workflow debugging tools

---

## Risk Analysis

### Technical Risks

**Risk 1: Bundle Generation Complexity**
- **Impact**: High
- **Likelihood**: Medium
- **Mitigation**: Use esbuild for reliable bundling, extensive testing

**Risk 2: VM Context Compatibility**
- **Impact**: High
- **Likelihood**: Low
- **Mitigation**: Test with various workflow patterns, fallback to OLD system

**Risk 3: Performance Degradation**
- **Impact**: Medium
- **Likelihood**: Low
- **Mitigation**: Benchmark both systems, optimize bundle size

### Operational Risks

**Risk 4: Production Disruption**
- **Impact**: High
- **Likelihood**: Low
- **Mitigation**: Dual-execution mode, gradual rollout, instant rollback plan

**Risk 5: Data Loss**
- **Impact**: High
- **Likelihood**: Very Low
- **Mitigation**: NEW system runs in parallel, OLD system backup

---

## Current Blockers

### Blocker 1: Workflow Bundle Generation ⚠️ HIGH PRIORITY
**Status**: Not implemented
**Impact**: NEW workflows cannot execute
**Solution**: Implement workflow bundler (Phase 1)
**ETA**: 2-3 days

### Blocker 2: File Watcher Integration
**Status**: Only triggers OLD workflows
**Impact**: NEW workflows not triggered by file events
**Solution**: Update file watcher handler (Phase 2)
**ETA**: 1 day

### Blocker 3: Workflow Discovery
**Status**: Manual registration only
**Impact**: Can't scale to multiple workflows
**Solution**: Implement workflow registry (Phase 2)
**ETA**: 1 day

---

## Migration Timeline

```
Week 1: Fix Bundle Generation
├─ Day 1-2: Implement workflow bundler
├─ Day 3-4: Update embedded-world.ts
└─ Day 5:   Integration testing

Week 2: Migrate document-connection
├─ Day 1-2: Validate NEW workflow
├─ Day 3-4: File watcher integration
└─ Day 5:   Production testing

Week 3: Cleanup & Documentation
├─ Day 1-2: Deprecate OLD system
├─ Day 3-4: Documentation
└─ Day 5:   Final validation
```

**Total Duration**: 3 weeks (15 working days)

---

## Next Steps (Immediate)

1. **TODAY**: Implement workflow bundler (`workflow-bundler.ts`)
2. **TODAY**: Update `createWorkflowBundle()` in embedded-world.ts
3. **TOMORROW**: Test workflow execution end-to-end
4. **TOMORROW**: Update file watcher integration
5. **DAY 3**: Create migration test suite

---

## Appendix: File Comparison

### OLD Workflow (document-connection.ts)
- **Lines**: 367
- **Format**: WorkflowDefinition interface
- **Execution**: Direct function call
- **Persistence**: None (in-memory only)
- **Status**: ✅ Working

### NEW Workflow (document-connection.workflow.ts)
- **Lines**: 305
- **Format**: 'use workflow' directive
- **Execution**: Workflow DevKit runtime
- **Persistence**: Full (.workflow-data/)
- **Status**: ⚠️ Code complete, bundle generation broken

### Key Differences
1. NEW has explicit step definitions ('use step')
2. NEW returns structured result object
3. NEW has full observability
4. NEW survives process restarts
5. OLD has slightly more complex connection scoring

---

**Migration Status**: 🚧 Ready to Begin
**Next Action**: Implement workflow bundler
**Owner**: Development Team
**Timeline**: 3 weeks
