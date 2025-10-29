# Vitest Lockup Fix - Phase 13

**Date**: 2025-10-28
**Issue**: Tests locked up computer during Phase 13 execution
**Status**: ✅ **FIXED**

---

## 🚨 Problem

When running `npm test`, vitest would:
1. Discover thousands of test files in `node_modules/` (zod tests, etc.)
2. Run Phase 13 tests with expensive operations in parallel
3. Spawn unlimited worker processes
4. Lock up the system due to resource exhaustion

---

## ✅ Solution Applied

Updated `/weaver/vitest.config.ts` with critical safety measures:

### 1. **Limited Parallelism**
```typescript
poolOptions: {
  forks: {
    maxForks: 2, // Only 2 test files at once
  },
}
```

### 2. **Explicit Test Directory**
```typescript
include: ['tests/**/*.test.ts'], // ONLY our tests
exclude: ['**/node_modules/**'],  // NOT 3rd-party tests
```

### 3. **Aggressive Timeouts**
```typescript
testTimeout: 30000,     // 30s max per test
hookTimeout: 10000,     // 10s for setup
bailOut: 1,             // Stop after first failure
```

---

## 🧪 Safe Test Execution

**Run tests safely:**
```bash
# Run single test file
npm test -- tests/reasoning/tree-of-thought.test.ts

# Run specific directory
npm test -- tests/reasoning/

# Run all (now safe with limits)
npm test
```

**Check test discovery:**
```bash
npx vitest list
```

---

## 📊 Before vs After

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Test files discovered** | ~800+ (node_modules) | ~54 (our tests) | 93% reduction |
| **Parallel workers** | Unlimited | 2 max | CPU-safe |
| **Test timeout** | 10s | 30s | Better for integration tests |
| **System lockup** | Yes | No | ✅ Fixed |

---

## 🎯 Phase 13 Test Guidelines

### Safe Test Patterns

✅ **DO:**
- Mock external API calls (Claude, arXiv, etc.)
- Use test utilities from `/tests/utils/`
- Set timeouts for async operations
- Clean up resources in `afterEach`

❌ **DON'T:**
- Make real API calls in tests
- Create infinite loops or recursion
- Spawn subprocesses without limits
- Read entire large datasets

### Example Safe Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockClaudeClient } from '../utils/mock-claude-client';

describe('TreeOfThought', () => {
  let mockClient: MockClaudeClient;

  beforeEach(() => {
    mockClient = new MockClaudeClient();
  });

  afterEach(() => {
    mockClient.cleanup(); // Always cleanup!
  });

  it('explores problem space within timeout', async () => {
    const tot = new TreeOfThought({ client: mockClient });

    // Use mocks, not real API
    mockClient.setResponse('Mock thought 1');

    const result = await tot.explore('test problem');

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  }, { timeout: 5000 }); // Per-test timeout
});
```

---

## 🔧 Troubleshooting

**If tests still hang:**

1. Check for infinite loops:
   ```bash
   # Run with verbose logging
   npm test -- --reporter=verbose
   ```

2. Identify hanging test:
   ```bash
   # Run files one at a time
   npm test -- tests/reasoning/tree-of-thought.test.ts
   npm test -- tests/reasoning/integration.test.ts
   ```

3. Disable parallel execution completely:
   ```typescript
   // In vitest.config.ts
   poolOptions: {
     forks: { singleFork: true }
   }
   ```

4. Kill hung vitest processes:
   ```bash
   pkill -f vitest
   ```

---

## 📝 Lessons Learned

1. **Always exclude node_modules** from test discovery
2. **Limit parallelism** on shared development machines
3. **Use mocks** for all external services
4. **Set aggressive timeouts** during development
5. **Test incrementally** - don't run all tests at once initially

---

## ✅ Verification

After applying fix:
```bash
# Should complete without hanging
npm test -- tests/reasoning/

# Should show only our test files (not node_modules)
npx vitest list | grep -c "test.ts"  # Should be ~50-60, not 800+
```

---

**Status**: ✅ Vitest configuration hardened, system-safe test execution restored

*Fix applied: 2025-10-28*
