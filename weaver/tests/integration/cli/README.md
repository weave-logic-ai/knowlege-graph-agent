# CLI Integration Test Suite

Comprehensive integration tests for Weaver CLI service management commands ensuring reliability across environments and failure scenarios.

## Test Structure

```
tests/integration/cli/
├── setup.ts                    # Test infrastructure and helpers
├── service-lifecycle.test.ts   # Complete service lifecycle tests
├── failure-recovery.test.ts    # Crash recovery and error handling
├── performance.test.ts         # Performance benchmarks
└── README.md                   # This file
```

## Test Categories

### 1. Service Lifecycle Tests (`service-lifecycle.test.ts`)

**Complete Workflow Testing:**
- ✅ Start → Health → Logs → Metrics → Stop workflow
- ✅ Service status monitoring
- ✅ Service listing and discovery
- ✅ Multi-instance management
- ✅ Configuration hot-reload
- ✅ Log rotation and cleanup
- ✅ Graceful shutdown with SIGTERM
- ✅ Force kill on timeout
- ✅ Restart operations
- ✅ Zero-downtime restarts

**Coverage:**
- Commands: `start`, `stop`, `restart`, `status`, `health`, `logs`, `metrics`, `list`
- Options: `--watch`, `--env`, `--port`, `--max-memory`, `--instances`, `--force`, `--timeout`

### 2. Failure Recovery Tests (`failure-recovery.test.ts`)

**Crash Recovery:**
- ✅ Automatic restart after crash
- ✅ Max restart attempts limit
- ✅ Min uptime enforcement
- ✅ Circuit breaker pattern
- ✅ Exponential backoff on restart

**Port Conflict Handling:**
- ✅ Detect port already in use
- ✅ Auto-select available port
- ✅ Retry with backoff

**Database Corruption Recovery:**
- ✅ Detect corrupted database
- ✅ Restore from backup
- ✅ Create new database if backup fails

**Configuration Errors:**
- ✅ Validate config before starting
- ✅ Handle missing required fields
- ✅ Use default values for optional config
- ✅ Reload on config file change

**Network Failures:**
- ✅ Health check timeout handling
- ✅ Retry failed health checks
- ✅ DNS resolution failures
- ✅ Connection refused handling

### 3. Performance Tests (`performance.test.ts`)

**Startup Performance:**
- ✅ Service startup under 5 seconds
- ✅ Parallel service startup
- ✅ Lazy initialization optimization

**Concurrent Execution:**
- ✅ Concurrent status checks (10+ requests)
- ✅ Concurrent metrics collection (20+ requests)
- ✅ Command queueing to prevent race conditions

**Metrics Accuracy:**
- ✅ CPU usage reporting
- ✅ Memory usage reporting
- ✅ Uptime tracking
- ✅ Restart count accuracy

**Resource Limits:**
- ✅ Memory limit enforcement
- ✅ Auto-restart on memory exceeded
- ✅ CPU usage limiting

**Load Testing:**
- ✅ High-frequency status checks (100+ RPS)
- ✅ Burst traffic handling (50+ concurrent)
- ✅ Sustained load testing (10s duration)

## Running Tests

### Run All Integration Tests

```bash
npm test -- tests/integration/cli
```

### Run Specific Test Suite

```bash
# Service lifecycle tests
npm test -- tests/integration/cli/service-lifecycle.test.ts

# Failure recovery tests
npm test -- tests/integration/cli/failure-recovery.test.ts

# Performance tests
npm test -- tests/integration/cli/performance.test.ts
```

### Run with Coverage

```bash
npm test -- --coverage tests/integration/cli
```

### Run in Watch Mode

```bash
npm test -- --watch tests/integration/cli
```

## Test Helpers

### `createTestContext()`

Creates isolated test environment with temporary directories:

```typescript
const ctx = await createTestContext();
// ctx.testDir - Temporary test directory
// ctx.configDir - Configuration directory
// ctx.logsDir - Logs directory
// ctx.dataDir - Data directory
// ctx.cleanup() - Cleanup function
```

### `createMockService()`

Creates a mock Node.js service script:

```typescript
const scriptPath = await createMockService(testDir, {
  name: 'my-service',
  port: 3000,
  shouldFail: false, // Set to true to simulate failing service
});
```

### `execCLI()`

Execute CLI command with execa:

```typescript
const result = await execCLI('service', ['start', 'my-service'], {
  cwd: testDir,
  env: { NODE_ENV: 'test' },
  timeout: 10000,
});

console.log(result.stdout);
console.log(result.exitCode);
```

### `waitForService()`

Wait for service to be ready:

```typescript
const isReady = await waitForService(3000, 10000); // port, timeout
expect(isReady).toBe(true);
```

### `getProcessMetrics()`

Get service metrics from CLI:

```typescript
const metrics = await getProcessMetrics('my-service');
console.log(`CPU: ${metrics.cpu}%`);
console.log(`Memory: ${metrics.memory}MB`);
console.log(`Uptime: ${metrics.uptime}s`);
console.log(`Restarts: ${metrics.restarts}`);
```

## Writing New Tests

### Basic Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTestContext,
  createMockService,
  execCLI,
  waitForService,
  type TestContext,
} from './setup.js';

describe('My New Test Suite', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('should test something', async () => {
    const serviceName = 'test-service';
    const scriptPath = await createMockService(ctx.testDir, {
      name: serviceName,
      port: 3000,
    });

    await execCLI('service', ['start', serviceName, '--script', scriptPath]);
    const isReady = await waitForService(3000);

    expect(isReady).toBe(true);

    await execCLI('service', ['stop', serviceName]);
  });
});
```

## Best Practices

### 1. Isolation

- ✅ Each test creates its own temporary directory
- ✅ Use unique port numbers (3000+)
- ✅ Clean up after each test
- ❌ Don't share state between tests

### 2. Timing

- ✅ Use `waitForService()` instead of fixed delays
- ✅ Set reasonable timeouts (5-30 seconds)
- ✅ Account for CI/CD slower environments
- ❌ Don't use arbitrary `setTimeout()`

### 3. Error Handling

- ✅ Always clean up in `afterEach()`
- ✅ Use `{ reject: false }` for expected failures
- ✅ Check both `exitCode` and `stdout`/`stderr`
- ❌ Don't let failures leave orphaned processes

### 4. Assertions

- ✅ Assert on specific behavior, not implementation
- ✅ Check multiple aspects (exit code + output)
- ✅ Use appropriate matchers (`toContain`, `toMatch`, etc.)
- ❌ Don't make brittle assertions on exact output

### 5. Performance

- ✅ Run tests in parallel when possible
- ✅ Use mock services, not real applications
- ✅ Set appropriate test timeouts
- ❌ Don't run expensive operations unnecessarily

## Coverage Goals

| Metric      | Target | Current |
|-------------|--------|---------|
| Statements  | 90%+   | TBD     |
| Branches    | 85%+   | TBD     |
| Functions   | 90%+   | TBD     |
| Lines       | 90%+   | TBD     |

## CI/CD Integration

Tests run automatically on:

- ✅ Push to `master`, `main`, `develop` branches
- ✅ Pull requests to these branches
- ✅ Changes to CLI or service manager code

**Test Matrix:**
- **OS:** Ubuntu, macOS, Windows
- **Node.js:** 18, 20

## Troubleshooting

### Tests Hanging

**Problem:** Tests don't complete or timeout

**Solutions:**
- Ensure cleanup is running: check `afterEach()` hooks
- Kill orphaned processes: `npx pm2 delete all`
- Check port conflicts: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)

### Port Already in Use

**Problem:** `EADDRINUSE` errors

**Solutions:**
- Use unique port numbers for each test
- Use `getAvailablePort()` helper
- Ensure previous test cleaned up properly

### Permission Errors

**Problem:** Cannot write to directories

**Solutions:**
- Check file permissions: `chmod 755`
- Ensure temp directory is writable
- Run with appropriate user permissions

### PM2 Connection Errors

**Problem:** Cannot connect to PM2 daemon

**Solutions:**
- Install PM2 globally: `npm install -g pm2`
- Check PM2 status: `pm2 status`
- Reset PM2: `pm2 kill && pm2 resurrect`

## Contributing

When adding new tests:

1. Follow existing patterns in `setup.ts`
2. Add appropriate cleanup in `afterEach()`
3. Document new helpers in this README
4. Ensure tests pass on all platforms
5. Update coverage goals if needed

## References

- [Vitest Documentation](https://vitest.dev/)
- [Execa Documentation](https://github.com/sindresorhus/execa)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
