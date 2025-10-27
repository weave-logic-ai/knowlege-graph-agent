# Vault Initialization E2E Test Execution Guide

## Overview

This guide provides instructions for running and validating the comprehensive E2E test suite for Phase 6 vault initialization.

## Test Suite Summary

### Created Files

**Test Files:**
- `e2e-vault-initialization.test.ts` - Main E2E test suite (484 lines)
- `test-helpers.ts` - Test utilities and helpers (257 lines)
- `README.md` - Test documentation

**Test Fixtures:**

**Next.js App** (`tests/fixtures/nextjs-app/`):
- `package.json` - Next.js dependencies
- `tsconfig.json` - TypeScript config
- `next.config.js` - Next.js config
- `src/app/page.tsx` - Home page
- `src/app/layout.tsx` - Root layout
- `src/components/Button.tsx` - Sample component
- `src/lib/utils.ts` - Utility functions
- `README.md` - Fixture documentation

**React + Vite** (`tests/fixtures/react-vite/`):
- `package.json` - React + Vite dependencies
- `tsconfig.json` - TypeScript config
- `vite.config.ts` - Vite config
- `index.html` - HTML entry point
- `src/main.tsx` - React entry point
- `src/App.tsx` - Main component
- `src/components/Button.tsx` - Sample component
- `src/utils/helpers.ts` - Helper functions
- `README.md` - Fixture documentation

## Test Coverage

### 8 Major Test Suites

1. **Next.js Project Initialization** (5 tests)
   - Full vault structure validation
   - README.md generation
   - Shadow cache population
   - Spec-kit metadata
   - Project type detection

2. **React/Vite Project Initialization** (3 tests)
   - Vault structure for Vite projects
   - Configuration detection
   - Template application

3. **Dry-Run Mode** (2 tests)
   - No file writes
   - Preview output validation

4. **Error Handling** (5 tests)
   - Invalid paths
   - Missing package.json
   - Permission errors
   - Rollback on failure
   - Writability checks

5. **Performance Tests** (3 tests)
   - Small project (<30s)
   - Medium project (<3min)
   - Shadow cache efficiency

6. **Template Selection** (2 tests)
   - Auto-detection
   - Manual override

7. **Workflow Integration** (2 tests)
   - Workflow file creation
   - Memory namespace config

8. **Idempotency** (2 tests)
   - Re-initialization safety
   - Data preservation

**Total: 24+ comprehensive test scenarios**

## Prerequisites

Before running the tests, ensure:

1. **Implementation Ready**: The vault initialization implementation must be complete
2. **Dependencies Installed**: Run `npm install`
3. **Imports Updated**: Replace mock implementation with actual code

### Update Required

In `e2e-vault-initialization.test.ts`, replace:

```typescript
// ❌ Remove this mock
async function initializeVault(options: VaultInitOptions): Promise<void> {
  throw new Error('Not implemented - replace with actual vault init');
}
```

With:

```typescript
// ✅ Add this import
import { initializeVault } from '../../src/vault/initialize';
// Or wherever the actual implementation is located
```

## Running Tests

### Run All E2E Tests

```bash
cd /home/aepod/dev/weave-nn/weaver
npm test tests/vault-init/e2e-vault-initialization.test.ts
```

### Run Specific Test Suite

```bash
# Next.js tests only
npm test -- tests/vault-init/e2e-vault-initialization.test.ts -t "Next.js"

# Error handling tests only
npm test -- tests/vault-init/e2e-vault-initialization.test.ts -t "Error Handling"

# Performance tests only
npm test -- tests/vault-init/e2e-vault-initialization.test.ts -t "Performance"
```

### Run with Coverage

```bash
npm test -- --coverage tests/vault-init/e2e-vault-initialization.test.ts
```

### Watch Mode (for development)

```bash
npm test -- --watch tests/vault-init/e2e-vault-initialization.test.ts
```

### Verbose Output

```bash
npm test -- --reporter=verbose tests/vault-init/e2e-vault-initialization.test.ts
```

## Expected Results

### Success Criteria

✅ **All tests pass** (24/24)
✅ **No timeout errors**
✅ **Performance targets met**:
   - Small project: <30s
   - Medium project: <3min
✅ **Cleanup successful** (no temp files left)
✅ **No memory leaks**

### Sample Output

```
 ✓ tests/vault-init/e2e-vault-initialization.test.ts (24)
   ✓ Next.js Project Initialization (5)
     ✓ should initialize vault for Next.js App Router project
     ✓ should generate comprehensive README.md
     ✓ should populate shadow cache with project files
     ✓ should create spec-kit with project metadata
   ✓ React/Vite Project Initialization (3)
   ✓ Dry-Run Mode (2)
   ✓ Error Handling (5)
   ✓ Performance Tests (3)
   ✓ Template Selection (2)
   ✓ Workflow Integration (2)
   ✓ Idempotency (2)

Test Files  1 passed (1)
     Tests  24 passed (24)
  Start at  14:30:00
  Duration  45.23s
```

## Troubleshooting

### Common Issues

**1. Tests fail with "Not implemented" error**

**Solution**: Update imports to use actual implementation instead of mock.

**2. Permission errors during tests**

**Solution**: Ensure test process has write access to `/tmp` directory.

**3. Timeout on performance tests**

**Possible causes**:
- Slow disk I/O
- System under heavy load
- Implementation inefficiency

**Solution**: Run tests in isolation or increase timeout values.

**4. Cleanup failures**

**Solution**: Check for locked files or processes holding temp directories.

### Debug Mode

Run tests with debug logging:

```bash
DEBUG=vault:* npm test tests/vault-init/e2e-vault-initialization.test.ts
```

## Test Helpers Reference

### `createTempVault()`
Creates temporary vault directory, returns cleanup function.

```typescript
const vault = await createTempVault();
// Use vault.path
await vault.cleanup(); // Clean up when done
```

### `createTestProject(files)`
Creates test project with specified files.

```typescript
const project = await createTestProject({
  'package.json': '{ "name": "test" }',
  'src/index.ts': 'console.log("test");'
});
```

### `validateVaultStructure(vaultPath)`
Validates vault directory structure.

```typescript
const result = await validateVaultStructure(vaultPath);
expect(result.valid).toBe(true);
expect(result.structure.hasSpecKit).toBe(true);
```

### `measureExecutionTime(fn)`
Measures async function execution time.

```typescript
const { result, duration } = await measureExecutionTime(async () => {
  await someOperation();
});
expect(duration).toBeLessThan(30000);
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: E2E Tests - Vault Initialization

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm test tests/vault-init/e2e-vault-initialization.test.ts
        timeout-minutes: 10
```

## Performance Benchmarks

Expected execution times on standard hardware:

| Test Suite | Expected Duration |
|------------|------------------|
| Next.js Initialization | 5-15s |
| React/Vite Initialization | 3-10s |
| Dry-Run Tests | 1-2s |
| Error Handling | 2-5s |
| Performance Tests | 15-45s |
| Template Selection | 3-8s |
| Workflow Integration | 5-10s |
| Idempotency Tests | 8-15s |
| **Total** | **45-120s** |

## Maintenance

### Adding New Test Scenarios

1. Add test case to appropriate `describe` block
2. Use existing test helpers where possible
3. Ensure cleanup in `afterEach`
4. Update this guide with new test count

### Updating Fixtures

1. Modify fixture files in `tests/fixtures/`
2. Keep fixtures minimal but realistic
3. Document any special requirements
4. Test fixture changes independently

## Next Steps

1. ✅ Test files created (24 scenarios)
2. ⬜ Connect actual implementation
3. ⬜ Run initial test suite
4. ⬜ Fix any failing tests
5. ⬜ Validate performance benchmarks
6. ⬜ Add to CI/CD pipeline
7. ⬜ Document edge cases found
8. ⬜ Optimize slow tests

## Support

For issues or questions:
- Check test output for specific errors
- Review test helpers for usage examples
- Examine fixture files for expected structure
- Enable debug logging for detailed traces

---

**Test Suite Status**: ✅ Ready for Implementation Integration

**Total Test Coverage**: 24+ comprehensive scenarios
**Performance Target**: <2 minutes for full suite
**Success Rate Required**: 100%
