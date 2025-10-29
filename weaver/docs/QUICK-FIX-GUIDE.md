# Quick Fix Guide - Phase 13 Build Issues
**For Rapid Parallel Agent Execution**

---

## 🚨 CRITICAL: 67 Issues Requiring Immediate Attention

**Build Status:** ❌ FAILING
**TypeScript:** 22 errors
**ESLint:** 28 errors
**Tests:** 52 failures
**Success Criteria:** 15/28 (53.6%)

---

## ⚡ Quick Start for Agents

### Agent Assignment

```bash
# Coder Agent 1: Chunking Module
Task: Fix ChunkingStrategy type export
Files: src/chunking/types.ts, src/chunking/validation.ts
Memory: coder/chunking-fixed
ETA: 30 minutes

# Backend Agent: Learning Loop
Task: Fix ExecutionResult export, Error types, feedback storage
Files: src/learning-loop/*
Memory: backend/learning-loop-fixed
ETA: 3-4 hours

# Coder Agent 2: Perception Module
Task: Fix type mismatches, error handling, rate limiting
Files: src/perception/*
Memory: coder/perception-fixed
ETA: 3-4 hours

# Code Quality Agent: ESLint Cleanup
Task: Fix 28 unused variable errors
Files: Multiple (see report)
Memory: quality/code-quality-fixed
ETA: 2-3 hours

# Architect Agent: SOP Scripts
Task: Move scripts to /src/sops/ OR update tsconfig
Files: scripts/sops/*, src/cli/commands/sop/index.ts, tsconfig.json
Memory: architect/sop-structure-fixed
ETA: 1-2 hours

# Tester Agent: Fix Failing Tests
Task: Fix 12 broken tests
Files: tests/agents/rules/*, tests/cli/*, tests/perception/*
Memory: tester/tests-fixed
ETA: 4-6 hours
```

---

## 🎯 Top 5 Critical Fixes (Execute First)

### 1. Fix SOP Scripts Path (BLOCKING BUILD)
**Priority:** P0 | **Time:** 1 hour | **Agent:** Architect

**Option A: Move Scripts (Recommended)**
```bash
# Create directory
mkdir -p /home/aepod/dev/weave-nn/weaver/src/sops

# Move scripts
mv /home/aepod/dev/weave-nn/weaver/scripts/sops/* /home/aepod/dev/weave-nn/weaver/src/sops/

# Update imports in src/cli/commands/sop/index.ts
# Change: '../../../scripts/sops/' to '../../../sops/'
```

**Option B: Update tsconfig**
```json
// Add to tsconfig.json
{
  "compilerOptions": {
    "rootDirs": ["src", "scripts"]
  }
}
```

**Test:**
```bash
npm run build
# Should reduce errors from 22 to 14
```

---

### 2. Fix ChunkingStrategy Type Export (BLOCKING BUILD)
**Priority:** P0 | **Time:** 15 minutes | **Agent:** Coder

**File:** `/home/aepod/dev/weave-nn/weaver/src/chunking/types.ts`

**Fix:**
```typescript
// Add export for ChunkingStrategy
export interface ChunkingStrategy {
  name: string;
  type: 'sentence' | 'semantic' | 'token' | 'sliding' | 'hybrid';
  config: ChunkingConfig;
}

// OR if it should be ChunkingStats:
// Update src/chunking/validation.ts line 9:
import type { ChunkingStats } from './types.js';
```

**Test:**
```bash
npm run build
# Should reduce errors from 14 to 13
```

---

### 3. Fix ExecutionResult Export (BLOCKING BUILD)
**Priority:** P0 | **Time:** 10 minutes | **Agent:** Backend

**File:** `/home/aepod/dev/weave-nn/weaver/src/learning-loop/feedback-types.ts`

**Fix:**
```typescript
// Add export
export interface ExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  duration: number;
}
```

**Test:**
```bash
npm run build
# Should reduce errors from 13 to 12
```

---

### 4. Fix Error Type Handling Pattern (BLOCKING BUILD)
**Priority:** P0 | **Time:** 2 hours | **Agent:** Backend

**Create:** `/home/aepod/dev/weave-nn/weaver/src/learning-loop/errors.ts`

```typescript
// Custom error types for learning loop
export class LearningLoopError extends Error {
  constructor(
    message: string,
    public readonly error?: Error,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LearningLoopError';
  }
}

export class PerceptionError extends Error {
  constructor(
    message: string,
    public readonly error?: Error,
    public readonly provider?: string
  ) {
    super(message);
    this.name = 'PerceptionError';
  }
}
```

**Update Files:**
- `src/learning-loop/learning-orchestrator.ts` (5 locations)
- `src/perception/perception-manager.ts` (3 locations)
- `src/perception/search-api.ts` (1 location)
- `src/perception/web-scraper.ts` (1 location)

**Pattern:**
```typescript
// OLD:
throw new Error('Failed', { error: e });

// NEW:
throw new LearningLoopError('Failed', e as Error);
```

**Test:**
```bash
npm run build
# Should reduce errors from 12 to 2
```

---

### 5. Fix Type Mismatches (BLOCKING BUILD)
**Priority:** P0 | **Time:** 1 hour | **Agent:** Coder

**File:** `/home/aepod/dev/weave-nn/weaver/src/perception/types.ts`

**Fix PerceptionFilters:**
```typescript
export interface PerceptionFilters {
  query?: string;
  sources?: string[];
  // CHANGE THIS:
  dateRange?: string; // Use string format "YYYY-MM-DD,YYYY-MM-DD"
  // INSTEAD OF:
  // dateRange?: { start?: Date; end?: Date };
}
```

**Update:** `/home/aepod/dev/weave-nn/weaver/src/perception/perception-manager.ts`
```typescript
// Line 204: Convert date range to string
const filters: SearchFilters = {
  ...perceptionFilters,
  dateRange: perceptionFilters.dateRange
    ? `${perceptionFilters.dateRange.start?.toISOString().split('T')[0]},${perceptionFilters.dateRange.end?.toISOString().split('T')[0]}`
    : undefined
};
```

**File:** `/home/aepod/dev/weave-nn/weaver/src/learning-loop/feedback-storage.ts`

**Fix Line 66:**
```typescript
// OLD:
const data = JSON.parse(fileContent);
if (data.value) { // ERROR: Property 'value' doesn't exist

// NEW:
const data = JSON.parse(fileContent) as { value?: unknown };
if (data && typeof data === 'object' && 'value' in data) {
```

**Test:**
```bash
npm run build
# Should pass with 0 errors! 🎉
```

---

## 🧹 ESLint Quick Fixes (28 Errors)

**Pattern:** Prefix unused variables with `_` or remove

**Quick Command:**
```bash
# Fix all unused catch variables
find src -name "*.ts" -type f -exec sed -i 's/} catch (error)/} catch (_error)/g' {} \;

# Fix specific files manually:
# - chunking/chunk-storage.ts:8 - Remove unused 'join' import
# - chunking/strategy-selector.ts:43 - Prefix: config -> _config
# - claude-flow/examples.ts:7 - Remove unused imports
# - embeddings/embedding-generator.ts:194 - Prefix: text -> _text
# - learning-loop/adaptation-engine.ts:300-301 - Prefix: history -> _history, signals -> _signals
# - learning-loop/integration-example.ts:182 - Remove or use result/lessons
# - vault-init/generator/types.ts:3 - Remove VaultTemplate import
```

**Remove unused @ts-expect-error:**
```bash
# File: src/vault-init/generator/types.ts line 2
# Just delete the line
```

**Test:**
```bash
npm run lint
# Should pass with 0 errors, 135 warnings (acceptable)
```

---

## 🧪 Test Fixes (52 Failures)

### Auto-Link Rule (3 failures)
**File:** `/home/aepod/dev/weave-nn/weaver/src/agents/rules/auto-link-rule.ts`

**Issues:**
1. Wikilink detection regex not matching
2. First occurrence tracking broken
3. Fuzzy threshold not applied

**Debug:**
```typescript
// Add debug logging
console.log('Testing wikilink pattern:', /\[\[([^\]]+)\]\]/g.test(content));
console.log('Found occurrences:', occurrences);
console.log('Fuzzy match score:', similarity);
```

---

### Auto-Tag Rule (2 failures)
**File:** `/home/aepod/dev/weave-nn/weaver/src/agents/rules/auto-tag-rule.ts`

**Fix confidence filtering:**
```typescript
const filteredTags = tags.filter(tag => tag.confidence >= this.options.confidenceThreshold);
const limitedTags = filteredTags.slice(0, this.options.maxTags);
```

---

### Meeting Note Date Format (1 failure)
**File:** `/home/aepod/dev/weave-nn/weaver/src/agents/rules/meeting-note-rule.ts`

**Fix:**
```typescript
// OLD:
const filename = `${title}-tasks-${new Date().toString()}`;

// NEW:
const filename = `${title}-tasks-${new Date().toISOString().split('T')[0]}`;
```

---

### Init-Vault Module Imports (2 failures)
**Cause:** Build must complete successfully first

**Fix:** Run `npm run build` after fixing TypeScript errors

---

### Web Scraper Rate Limit (1 failure)
**File:** `/home/aepod/dev/weave-nn/weaver/src/perception/web-scraper.ts`

**Add rate limiter:**
```typescript
private lastRequestTime = 0;
private readonly minRequestInterval = 1000; // 1 second

async scrape(url: string): Promise<ScrapedContent> {
  const now = Date.now();
  const timeSinceLastRequest = now - this.lastRequestTime;

  if (timeSinceLastRequest < this.minRequestInterval) {
    await new Promise(resolve =>
      setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
    );
  }

  this.lastRequestTime = Date.now();
  // ... rest of scraping logic
}
```

---

### Learning Orchestrator Timing (1 failure)
**File:** `/home/aepod/dev/weave-nn/weaver/src/learning-loop/learning-orchestrator.ts`

**Fix:**
```typescript
async executeLoop(query: string): Promise<LearningResult> {
  const startTime = performance.now(); // Use high-res timer

  // ... processing ...

  return {
    // ...
    metadata: {
      processingTime: Math.round(performance.now() - startTime),
      timestamp: Date.now()
    }
  };
}
```

---

## 🔐 Security Fixes

**Quick fix (safe):**
```bash
npm audit fix
```

**Review breaking changes:**
```bash
npm audit fix --force --dry-run
# Review output, then:
npm audit fix --force
```

---

## ✅ Validation Commands

**After each fix:**
```bash
# Quick validation
npm run build && npm run lint && npm test

# Full validation
npm run build
npm run typecheck
npm run lint
npm test
npm audit
```

**Expected final result:**
```
✅ Build: 0 errors
✅ Typecheck: 0 errors
✅ Lint: 0 errors (warnings <50)
✅ Tests: 238/238 passing
✅ Audit: <10 high/critical vulnerabilities
```

---

## 📊 Progress Tracking

**Memory keys to check:**
```bash
npx claude-flow@alpha memory query "coder/chunking-fixed"
npx claude-flow@alpha memory query "backend/learning-loop-fixed"
npx claude-flow@alpha memory query "coder/perception-fixed"
npx claude-flow@alpha memory query "quality/code-quality-fixed"
npx claude-flow@alpha memory query "architect/sop-structure-fixed"
npx claude-flow@alpha memory query "tester/tests-fixed"
```

**When ALL complete:**
```bash
npx claude-flow@alpha memory query "testing/build-complete"
# Should show: "PASSED: 0 errors"
```

---

## 🎯 Parallel Execution Strategy

**Wave 1 (Independent - Can run in parallel):**
- Architect: SOP scripts (1-2h)
- Coder 1: Chunking types (0.5h)
- Coder 2: Type mismatches (1h)

**Wave 2 (After Wave 1):**
- Backend: Learning loop errors (2-3h)
- Quality: ESLint cleanup (2-3h)

**Wave 3 (After build passes):**
- Tester: Fix all test failures (4-6h)
- Security: Audit fixes (2-4h)

**Total Time (Parallel):** 6-8 hours
**Total Time (Sequential):** 16-24 hours
**Speedup:** 2-3x faster with parallel execution

---

## 📞 Need Help?

**Full Report:** `/home/aepod/dev/weave-nn/weaver/docs/BUILD-VALIDATION-REPORT.md`
**Raw Outputs:**
- Build: `/tmp/build-output.log`
- Lint: `/tmp/lint-output.log`
- Tests: `/tmp/test-output.log`
- Audit: `/tmp/audit-output.log`

**Coordination:**
```bash
npx claude-flow@alpha memory query "testing/build-status"
npx claude-flow@alpha hooks session-restore --session-id "phase-13-fixes"
```

---

**Generated by:** Tester Agent
**Date:** 2025-10-28
**Session:** task-1761655351347-1vfydu34l
