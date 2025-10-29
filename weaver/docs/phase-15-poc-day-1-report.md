# Phase 15 POC - Day 1 Status Report

**Date**: 2025-10-28
**Status**: ⚠️ **BLOCKER DISCOVERED** - Requires Build System Integration
**Time Invested**: 3 hours

---

## 🎯 Objective

Validate that Vercel Workflow DevKit (`workflow@4.0.1-beta.3`) can replace our custom workflow engine for the document-connection workflow.

---

## ✅ Progress Made

### 1. Package Installation
- ✅ Installed correct `workflow@4.0.1-beta.3` (243 packages)
- ❌ Initial attempt installed wrong package (`workflow@1.1.6` - desktop window manager)
- ✅ Resolved by explicit version: `npm install workflow@4.0.1-beta.3`

### 2. Code Migration Attempted
- ✅ Created `/weaver/src/workflow-engine/embedded-world.ts`
- ✅ Created `/weaver/src/workflows/kg/document-connection.workflow.ts`
- ✅ Created `/weaver/scripts/poc-test-workflow.ts`
- ✅ Fixed pre-existing fast-glob import issues

### 3. Files Created
```
weaver/
├── src/
│   ├── workflow-engine/
│   │   └── embedded-world.ts          # EmbeddedWorld configuration
│   └── workflows/kg/
│       └── document-connection.workflow.ts  # Migrated workflow
└── scripts/
    └── poc-test-workflow.ts           # Test runner
```

---

## 🚨 CRITICAL DISCOVERY: Compiler Directive API

###  API Misunderstanding

**What I Implemented** (WRONG):
```typescript
import { step } from 'workflow';
import { createEmbeddedWorld } from 'workflow';

export async function documentConnectionWorkflow(input) {
  'use workflow';

  const context = await step('build-context', async () => {
    // Step logic
  });
}
```

**What Workflow DevKit Actually Requires**:
```typescript
// NO IMPORTS - these are compiler directives!

export async function documentConnectionWorkflow(input) {
  'use workflow';  // Compile-time directive

  // Each async function with 'use step' becomes a durable step
  async function buildContext() {
    'use step';
    // Step logic
  }

  const context = await buildContext();
}
```

### Root Cause

Workflow DevKit is **NOT a runtime library** - it's a **build-time compiler** that:

1. **Detects directives**: `'use workflow'` and `'use step'`
2. **Compiles each step**: Generates isolated API routes
3. **Instruments code**: Adds persistence, retry logic, observability
4. **Requires bundler integration**: Vite plugin, Webpack plugin, or Rollup plugin

**Evidence**:
- ✅ `workflow` package exports `rollup-plugin.js`
- ✅ Examples show `next.config.js` integration
- ✅ Documentation mentions "compile-time transformation"
- ❌ NO `step()` function exported from `@workflow/core`
- ❌ NO `createEmbeddedWorld()` runtime function

---

## ⚠️ Blocker Analysis

### Missing Components

1. **Build System Integration**
   - Need Vite/Webpack/Rollup plugin configuration
   - `weaver` currently uses `tsconfig.json` + `tsx` for execution
   - No bundler in the build chain

2. **Compiler Transformation**
   - Workflow DevKit needs to transform code at compile time
   - Cannot work with `npx tsx` direct execution
   - Requires proper build pipeline

3. **Next.js/Framework Integration**
   - Phase 15 document assumes Next.js integration
   - `weaver` is a CLI tool, not a Next.js app
   - May need different integration approach

### Package Structure Findings

```bash
workflow@4.0.1-beta.3 dependencies:
- @workflow/cli         # CLI tools
- @workflow/core        # Core utilities (hooks, errors)
- @workflow/next        # Next.js integration
- @workflow/nitro       # Nitro integration
- @workflow/typescript-plugin  # TypeScript plugin
```

**Key Insight**: `@workflow/core` exports:
- `createHook()`, `createWebhook()`
- `FatalError`, `RetryableError`
- `getStepMetadata()`, `getWorkflowMetadata()`
- ❌ **NO** `step()` or `createEmbeddedWorld()`

---

## 🔍 Research Findings

### Vercel Workflow DevKit Resources

1. **GitHub**: https://github.com/vercel/workflow
2. **Examples**: https://github.com/vercel/workflow-examples
3. **Docs**: https://useworkflow.dev/
4. **Blog**: https://vercel.com/blog/introducing-workflow

### API Pattern (from examples)

```typescript
// birthday-card-generator/app/generateCard/route.ts
export async function POST(request: Request) {
  'use workflow';

  async function generateCardIdea() {
    'use step';
    return await streamText({ /* AI call */ });
  }

  async function createImage() {
    'use step';
    return await fetch(/* image generation */);
  }

  const idea = await generateCardIdea();
  const image = await createImage();
  return Response.json({ idea, image });
}
```

### Integration Pattern

```javascript
// next.config.js
import { WorkflowPlugin } from '@workflow/next';

export default {
  webpack: (config) => {
    config.plugins.push(WorkflowPlugin());
    return config;
  },
};
```

---

## 📊 Impact Assessment

### POC Cannot Proceed Without

1. **Build System Setup** (2-3 days)
   - Add Vite/Rollup to weaver build chain
   - Configure Workflow DevKit plugin
   - Test compilation pipeline

2. **Architecture Decision** (1 day)
   - Option A: Convert weaver to Vite-based project
   - Option B: Use Workflow DevKit CLI instead of library
   - Option C: Create separate Next.js service for workflows
   - Option D: Abandon Workflow DevKit, keep custom engine

3. **Code Refactor** (2-3 days)
   - Rewrite workflows using directive API
   - No function imports - pure directives
   - Test compiled output

**Total Additional Time**: 5-7 days before POC can continue

---

## 🎯 Recommendations

### Option 1: Pause POC, Setup Build System ⭐ **RECOMMENDED**
**Pros**:
- Validates Workflow DevKit properly
- Future-proof architecture
- Gets us the observability we want

**Cons**:
- 5-7 day delay
- Significant build system rework

**Action**:
1. Create Phase 15A: "Build System Integration" (5-7 days)
2. Then resume Phase 15 POC (original 2-week timeline)
3. Total: 3-4 weeks instead of 2 weeks

### Option 2: Abandon Workflow DevKit, Keep Custom Engine
**Pros**:
- No delay
- Working system already exists
- Full control over implementation

**Cons**:
- Miss out on Workflow DevKit observability
- Custom maintenance burden
- Phase 15 goals not met

**Action**:
1. Document decision to skip Workflow DevKit
2. Enhance custom workflow engine with observability
3. Continue with Phase 16+

### Option 3: Hybrid Approach - Custom Engine + Workflow CLI Tools
**Pros**:
- Use Workflow DevKit CLI for inspection/monitoring
- Keep custom engine for execution
- Get some observability benefits

**Cons**:
- May not integrate well
- CLI tools designed for their compiled output
- Partial solution

---

## 📝 Key Learnings

1. **Not All Libraries Are Runtime Libraries**
   - Workflow DevKit is primarily a compiler/build tool
   - Directives (`'use workflow'`) require compile-time processing
   - Cannot be used with `tsx`/`ts-node` direct execution

2. **Phase 15 Plan Assumptions**
   - Document assumed Next.js integration
   - Did not account for CLI tool architecture
   - Build system requirements not explicit

3. **Package Naming Collision**
   - `workflow@latest` resolves to desktop manager (v1.1.6)
   - `workflow@4.0.1-beta.3` is the Workflow DevKit
   - Easy to install wrong package

4. **Documentation Gaps**
   - No standalone/CLI integration guide
   - Examples all use Next.js/Nitro
   - "EmbeddedWorld" mentioned in docs but not exported

---

## 🚀 Next Steps

**Decision Point**: User must choose Option 1, 2, or 3 above.

**If Option 1** (Build System Integration):
1. Create `/weaver/vite.config.ts`
2. Install Workflow DevKit Vite/Rollup plugin
3. Convert build from `tsc` to `vite build`
4. Test directive compilation
5. Resume POC with correct API

**If Option 2** (Keep Custom Engine):
1. Close Phase 15 POC as "Workflow DevKit not compatible"
2. Document custom workflow engine enhancements
3. Add manual observability layer
4. Continue with other phases

**If Option 3** (Hybrid):
1. Research Workflow DevKit CLI capabilities
2. Test if CLI can inspect custom workflow output
3. Document integration strategy

---

## 📊 Time Accounting

- Package installation troubleshooting: 1.5 hours
- Code migration attempt: 1 hour
- API discovery and research: 0.5 hours
- **Total**: 3 hours

**POC Status**: ⏸️ **PAUSED** - Awaiting architecture decision

---

## 🔗 References

- Phase 15 Plan: `/weave-nn/_planning/phases/phase-15-workflow-observability.md`
- Workflow DevKit GitHub: https://github.com/vercel/workflow
- Examples Repository: https://github.com/vercel/workflow-examples
- Documentation: https://useworkflow.dev/

---

**Report Author**: Claude (via weaver implementation)
**Status**: 🚦 Blocked - Requires User Decision
**Next Action**: User chooses Option 1, 2, or 3
