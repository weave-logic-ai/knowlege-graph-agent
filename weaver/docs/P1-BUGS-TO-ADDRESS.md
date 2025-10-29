# P1 Bugs - Priority Issues To Address

**Date:** 2025-10-29
**Status:** 📋 READY TO ADDRESS
**Prerequisites:** ✅ Vitest rate limiting fixed

## Overview

After resolving the vitest MainThread explosion issue, we can now proceed to address the following P1 bugs that were identified during the build process.

## 1. TypeScript Compilation Errors (8 Total)

### 1.1 ServerType Incompatibility
**File:** `src/workflow-engine/embedded-world.ts:110:5`
**Error:** Type 'ServerType' is not assignable to type 'Server<typeof IncomingMessage, typeof ServerResponse>'

```typescript
// Line 110
httpServer = serve({
  ~~~~~~~~~~
```

**Issue:** Type mismatch between Hono's `serve()` return type and expected HTTP Server type
**Priority:** HIGH - Affects workflow HTTP server

---

### 1.2 WorkflowId in Error Object (2 instances)
**File:** `src/workflow-engine/workflow-bundler.ts`
**Lines:** 297:57, 307:61
**Error:** Object literal may only specify known properties, and 'workflowId' does not exist in type 'Error'

```typescript
// Line 297
logger.error('Invalid bundle: empty bundle code', { workflowId: bundle.workflowId });
                                                   ~~~~~~~~~~

// Line 307
logger.error('Invalid bundle: missing function name', { workflowId: bundle.workflowId });
                                                         ~~~~~~~~~~
```

**Issue:** Custom error metadata not properly typed
**Priority:** MEDIUM - Logging issue, doesn't block execution

---

### 1.3 Path Module Not Found
**File:** `src/workflows/kg/document-connection.workflow.ts:267:15`
**Error:** Cannot find name 'path'

```typescript
// Line 267
filePath: path.join(vaultRoot, testFile),
          ~~~~
```

**Issue:** Missing `import path from 'path'`
**Priority:** HIGH - Breaks workflow execution

---

### 1.4 Missing Module - Context Types
**File:** `src/workflows/kg/document-connection/steps.ts:13:38`
**Error:** Cannot find module '../context/types.js' or its corresponding type declarations

```typescript
// Line 13
import type { DocumentContext } from '../context/types.js';
                                     ~~~~~~~~~~~~~~~~~~~~~
```

**Issue:** Module path incorrect or file doesn't exist
**Priority:** HIGH - Breaks workflow compilation

---

### 1.5 String Array Size Property
**File:** `src/workflows/kg/enhance-metadata.ts:434:49`
**Error:** Property 'size' does not exist on type 'string[]'

```typescript
// Line 434
console.log(`📄 Regular files: ${regularFiles.size}\n`);
                                             ~~~~
```

**Issue:** Arrays use `.length` not `.size`
**Priority:** LOW - Simple fix, cosmetic logging issue

---

### 1.6 Gray Matter LineWidth Option
**File:** `src/workflows/kg/icon-application.ts:230:11`
**Error:** Object literal may only specify known properties, and 'lineWidth' does not exist in type 'GrayMatterOption'

```typescript
// Line 230
lineWidth: -1,
~~~~~~~~~
```

**Issue:** Invalid gray-matter configuration option
**Priority:** MEDIUM - Frontmatter formatting issue

---

### 1.7 Validation Warning Type
**File:** `workflows/kg/validate-graph.ts:298:9`
**Error:** Type '"missing_hub"' is not assignable to type '"orphan" | "low_connections" | "missing_tags"'

```typescript
// Line 298
type: 'missing_hub',
~~~~
```

**Issue:** Missing type in ValidationWarning union
**Priority:** MEDIUM - Graph validation feature

---

## 2. PM2 and Workflow Issues

### 2.1 PM2 Service Management Stability
**Status:** NEEDS INVESTIGATION
**Priority:** HIGH

**Issues:**
- Service startup/shutdown coordination
- Process recovery after crashes
- Health check reliability
- Metrics collection accuracy

**Files Involved:**
- `src/service-manager/process-manager.ts`
- `src/service-manager/recovery.ts`
- `src/service-manager/health-check.ts`

---

### 2.2 Workflow Execution Coordination
**Status:** NEEDS INVESTIGATION
**Priority:** HIGH

**Issues:**
- Workflow bundling and execution
- Step coordination and error handling
- State management across workflow steps
- Cleanup on workflow failure

**Files Involved:**
- `src/workflow-engine/index.ts`
- `src/workflow-engine/workflow-bundler.ts`
- `src/workflow-engine/monitored-executor.ts`

---

### 2.3 Process Monitoring and Recovery
**Status:** NEEDS INVESTIGATION
**Priority:** MEDIUM

**Issues:**
- Connection pool management
- Database recovery mechanisms
- State validation and recovery
- Metrics caching and staleness

**Files Involved:**
- `src/service-manager/connection-pool.ts`
- `src/service-manager/database-recovery.ts`
- `src/monitoring/state-validator.ts`

---

## Quick Fix Priority Order

### Phase 1: Critical Type Errors (Blocks Compilation)
1. ✅ Fix path import in `document-connection.workflow.ts`
2. ✅ Fix module path in `document-connection/steps.ts`
3. ✅ Fix ServerType in `embedded-world.ts`

### Phase 2: Medium Priority Fixes
4. ✅ Fix workflowId error metadata in `workflow-bundler.ts`
5. ✅ Fix validation type in `validate-graph.ts`
6. ✅ Fix lineWidth option in `icon-application.ts`

### Phase 3: Low Priority Cosmetic
7. ✅ Fix array.size → array.length in `enhance-metadata.ts`

### Phase 4: Integration Testing
8. ⬜ Test PM2 service lifecycle
9. ⬜ Test workflow execution
10. ⬜ Test process recovery
11. ⬜ Run full test suite

---

## Success Criteria

### TypeScript Compilation
- [ ] All 8 TypeScript errors resolved
- [ ] Build completes with 0 errors
- [ ] Type definitions generated successfully

### PM2 Integration
- [ ] Services start/stop reliably
- [ ] Health checks pass consistently
- [ ] Recovery mechanisms work
- [ ] No process leaks or zombies

### Workflow System
- [ ] Workflows bundle correctly
- [ ] Steps execute in sequence
- [ ] Error handling works
- [ ] State persists correctly

### Test Suite
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] No test timeouts
- [ ] No resource exhaustion

---

## Commands for Testing

```bash
# Build with type checking
npm run build:cli

# Run specific test suites
npm test -- tests/service-manager/
npm test -- tests/workflow-engine/
npm test -- tests/integration/

# Check PM2 status
weaver service status

# Monitor processes
ps aux | grep -i pm2
ps aux | grep -i node
```

---

## Dependencies

### Before Starting
- ✅ Vitest rate limiting fixed
- ✅ CLI build succeeds
- ✅ Test infrastructure stable

### During Implementation
- Type definitions for third-party libraries
- PM2 API documentation
- Workflow DevKit documentation
- Gray-matter API reference

---

## Next Steps

1. **Start with Phase 1** (Critical type errors)
   - These block compilation completely
   - Quick wins that unblock other work

2. **Move to Phase 2** (Medium priority)
   - Improve type safety
   - Fix runtime issues

3. **Complete Phase 3** (Cosmetic)
   - Clean up logging
   - Polish UX

4. **Execute Phase 4** (Integration testing)
   - Verify all systems work together
   - Run full test suite
   - Document any remaining issues

---

**Status:** 📋 READY TO START
**Estimated Time:** 2-4 hours
**Risk Level:** MEDIUM (some changes affect core systems)
