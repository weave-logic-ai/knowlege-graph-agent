# CLI Integration Testing Guide

Complete guide to the CLI integration test suite for service management commands.

## Overview

The CLI integration test suite ensures reliability of service management commands across all platforms and failure scenarios. Tests cover the complete lifecycle from service startup to graceful shutdown, including crash recovery, resource limits, and performance benchmarks.

## Architecture

### Test Infrastructure (`tests/integration/cli/setup.ts`)

The test infrastructure provides:

- **Isolated Test Environments:** Each test gets its own temporary directory
- **Mock Services:** Lightweight Node.js HTTP servers for testing
- **CLI Execution Helpers:** Wrappers around execa for command execution
- **Utility Functions:** Health checks, metrics collection, cleanup

### Test Categories

#### 1. Service Lifecycle (`service-lifecycle.test.ts`)

Tests complete service workflows:

```typescript
// Complete workflow
start → health → logs → metrics → stop

// Multi-instance management
start --instances 3 → scale 5 → stop

// Configuration reload
start → reload --env NEW=value → verify
```

**Covered Commands:**
- `service start` - Start services with various options
- `service stop` - Graceful and forced shutdown
- `service restart` - Restart with zero-downtime option
- `service status` - Status checking and monitoring
- `service health` - Health check execution
- `service logs` - Log retrieval and filtering
- `service metrics` - Metrics collection
- `service list` - Service discovery

#### 2. Failure Recovery (`failure-recovery.test.ts`)

Tests error handling and recovery:

```typescript
// Crash recovery
service crashes → auto-restart → verify uptime

// Port conflicts
start service A on :3000 → start service B on :3000 → handle gracefully

// Database corruption
corrupt DB → detect → restore from backup → resume
```

**Covered Scenarios:**
- Automatic restart after crash
- Max restart attempts
- Port conflict detection
- Database corruption recovery
- Configuration validation
- Network failure handling
- Circuit breaker patterns
- Exponential backoff

#### 3. Performance (`performance.test.ts`)

Tests performance and resource limits:

```typescript
// Startup performance
measure startup time < 5s

// Concurrent execution
execute 100 status checks in parallel

// Resource limits
enforce memory limit → restart on exceeded
```

**Covered Metrics:**
- Service startup time
- Concurrent request handling
- Metrics accuracy (CPU, memory, uptime)
- Resource limit enforcement
- Load testing (RPS, burst traffic)

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTestContext,
  createMockService,
  execCLI,
  waitForService,
  type TestContext,
} from './setup.js';

describe('Feature Tests', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    // Create isolated test environment
    ctx = await createTestContext();
  });

  afterEach(async () => {
    // Clean up resources
    await ctx.cleanup();
  });

  it('should test feature', async () => {
    // 1. Setup
    const serviceName = 'test-service';
    const scriptPath = await createMockService(ctx.testDir, {
      name: serviceName,
      port: 3000,
    });

    // 2. Execute
    await execCLI('service', ['start', serviceName, '--script', scriptPath]);

    // 3. Verify
    const isReady = await waitForService(3000);
    expect(isReady).toBe(true);

    // 4. Cleanup
    await execCLI('service', ['stop', serviceName]);
  });
});
```

### Advanced Patterns

#### Testing Concurrent Operations

```typescript
it('should handle concurrent operations', async () => {
  const serviceName = 'concurrent-test';
  const scriptPath = await createMockService(ctx.testDir, {
    name: serviceName,
    port: 3000,
  });

  await execCLI('service', ['start', serviceName, '--script', scriptPath]);
  await waitForService(3000);

  // Execute 10 concurrent status checks
  const results = await Promise.all(
    Array.from({ length: 10 }, () =>
      execCLI('service', ['status', serviceName])
    )
  );

  // All should succeed
  expect(results.every(r => r.exitCode === 0)).toBe(true);

  await execCLI('service', ['stop', serviceName]);
});
```

#### Testing Failure Scenarios

```typescript
it('should handle service crash', async () => {
  const serviceName = 'crash-test';
  const scriptPath = await createMockService(ctx.testDir, {
    name: serviceName,
    port: 3000,
  });

  await execCLI('service', [
    'start',
    serviceName,
    '--script',
    scriptPath,
    '--max-restarts',
    '5',
  ]);

  await waitForService(3000);

  // Get restart count before crash
  const beforeMetrics = await getProcessMetrics(serviceName);

  // Simulate crash
  await simulateCrash(serviceName);

  // Wait for auto-restart
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Verify auto-restart
  const isRestarted = await waitForService(3000, 10000);
  expect(isRestarted).toBe(true);

  // Verify restart count increased
  const afterMetrics = await getProcessMetrics(serviceName);
  expect(afterMetrics.restarts).toBeGreaterThan(beforeMetrics.restarts);

  await execCLI('service', ['stop', serviceName]);
});
```

#### Testing Performance

```typescript
it('should start service quickly', async () => {
  const serviceName = 'perf-test';
  const scriptPath = await createMockService(ctx.testDir, {
    name: serviceName,
    port: 3000,
  });

  const startTime = Date.now();

  await execCLI('service', ['start', serviceName, '--script', scriptPath]);
  await waitForService(3000, 5000);

  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(5000);
  console.log(`Startup time: ${duration}ms`);

  await execCLI('service', ['stop', serviceName]);
});
```

## Test Helpers

### Environment Setup

```typescript
// Create isolated test environment
const ctx = await createTestContext();

// Access directories
console.log(ctx.testDir);   // Temporary test directory
console.log(ctx.configDir);  // Configuration directory
console.log(ctx.logsDir);    // Logs directory
console.log(ctx.dataDir);    // Data directory

// Cleanup
await ctx.cleanup();
```

### Mock Services

```typescript
// Create basic mock service
const scriptPath = await createMockService(testDir, {
  name: 'my-service',
  port: 3000,
});

// Create failing service
const failingScript = await createMockService(testDir, {
  name: 'failing-service',
  port: 3001,
  shouldFail: true, // Will exit with code 1
});
```

### CLI Execution

```typescript
// Execute command (throws on error)
const result = await execCLI('service', ['start', 'my-service']);
console.log(result.stdout);
console.log(result.exitCode);

// Execute command (doesn't throw)
const result = await execCLI('service', ['start', 'my-service'], {
  reject: false,
});
if (result.failed) {
  console.error(result.stderr);
}

// With custom environment
const result = await execCLI('service', ['start', 'my-service'], {
  env: { NODE_ENV: 'test', DEBUG: '*' },
  timeout: 10000,
});
```

### Service Monitoring

```typescript
// Wait for service to be ready
const isReady = await waitForService(3000, 10000); // port, timeout
expect(isReady).toBe(true);

// Wait for service to stop
const isStopped = await waitForServiceStop(3000, 10000);
expect(isStopped).toBe(true);

// Get process metrics
const metrics = await getProcessMetrics('my-service');
console.log(`CPU: ${metrics.cpu}%`);
console.log(`Memory: ${metrics.memory}MB`);
console.log(`Uptime: ${metrics.uptime}s`);
console.log(`Restarts: ${metrics.restarts}`);
```

### Utilities

```typescript
// Check if port is in use
const inUse = await isPortInUse(3000);

// Get available port
const port = await getAvailablePort(3000);

// Simulate service crash
await simulateCrash('my-service');

// Read log file
const logs = await readLogFile('/path/to/log.txt', 100); // last 100 lines
```

## Best Practices

### 1. Test Isolation

**✅ DO:**
- Create unique test environments
- Use unique port numbers
- Clean up in `afterEach()`
- Use temporary directories

**❌ DON'T:**
- Share state between tests
- Reuse port numbers
- Leave orphaned processes
- Write to fixed locations

### 2. Timing and Waits

**✅ DO:**
- Use `waitForService()` for async operations
- Set reasonable timeouts (5-30s)
- Account for CI/CD slower performance
- Use `waitForServiceStop()` to verify cleanup

**❌ DON'T:**
- Use fixed `setTimeout()` delays
- Assume immediate completion
- Set unrealistic timeouts (<1s)
- Skip verification steps

### 3. Error Handling

**✅ DO:**
- Use `{ reject: false }` for expected failures
- Clean up even on test failure
- Check both exit code and output
- Log useful debug information

**❌ DON'T:**
- Let failures leak resources
- Ignore error messages
- Assume happy path only
- Skip cleanup on failure

### 4. Assertions

**✅ DO:**
- Assert on behavior, not implementation
- Use specific matchers (`toContain`, `toMatch`)
- Check multiple aspects
- Include meaningful messages

**❌ DON'T:**
- Make brittle exact-match assertions
- Only check exit codes
- Over-specify implementation details
- Skip important verifications

### 5. Performance

**✅ DO:**
- Run independent tests in parallel
- Use lightweight mock services
- Set appropriate timeouts
- Measure and log durations

**❌ DON'T:**
- Run expensive operations unnecessarily
- Start real applications
- Use synchronous operations
- Skip performance tests

## CI/CD Integration

### GitHub Actions Workflow

Tests run on:
- **Triggers:** Push to main branches, Pull requests
- **Matrix:** Ubuntu/macOS/Windows × Node 18/20
- **Jobs:**
  - `test` - Run all integration tests
  - `performance` - Run performance benchmarks
  - `coverage` - Check coverage thresholds
  - `cross-platform-validation` - Platform-specific validation
  - `regression` - Compare PR vs base branch

### Coverage Requirements

| Metric      | Threshold |
|-------------|-----------|
| Statements  | 90%       |
| Branches    | 85%       |
| Functions   | 90%       |
| Lines       | 90%       |

### Running in CI

```bash
# Install dependencies
npm ci

# Install PM2
npm install -g pm2

# Build project
npm run build

# Run tests
npm test -- --run tests/integration/cli

# Check coverage
npm test -- --coverage tests/integration/cli
```

## Troubleshooting

### Common Issues

#### Tests Hang

**Symptoms:** Tests don't complete or timeout

**Causes:**
- Orphaned PM2 processes
- Missing cleanup in `afterEach()`
- Infinite wait loops

**Solutions:**
```bash
# Kill all PM2 processes
npx pm2 delete all

# Check for orphaned processes
ps aux | grep node

# Verify cleanup hooks
grep -r "afterEach" tests/
```

#### Port Conflicts

**Symptoms:** `EADDRINUSE` errors

**Causes:**
- Reused port numbers
- Previous test didn't cleanup
- External service using port

**Solutions:**
```bash
# Check port usage (macOS/Linux)
lsof -i :3000

# Check port usage (Windows)
netstat -ano | findstr :3000

# Use dynamic ports in tests
const port = await getAvailablePort(3000);
```

#### Permission Errors

**Symptoms:** Cannot write files or execute commands

**Causes:**
- Incorrect file permissions
- Temp directory not writable
- Insufficient user permissions

**Solutions:**
```bash
# Check temp directory
ls -la /tmp

# Fix permissions
chmod 755 /path/to/test/dir

# Run with correct user
sudo -u testuser npm test
```

#### PM2 Connection Failures

**Symptoms:** Cannot connect to PM2 daemon

**Causes:**
- PM2 not installed
- PM2 daemon crashed
- Permission issues

**Solutions:**
```bash
# Install PM2 globally
npm install -g pm2

# Check PM2 status
pm2 status

# Reset PM2
pm2 kill
pm2 resurrect
```

## Examples

### Complete Lifecycle Test

```typescript
it('should execute complete service lifecycle', async () => {
  const serviceName = 'lifecycle-test';
  const scriptPath = await createMockService(ctx.testDir, {
    name: serviceName,
    port: 3000,
  });

  // 1. Start
  await execCLI('service', ['start', serviceName, '--script', scriptPath]);
  const isReady = await waitForService(3000, 10000);
  expect(isReady).toBe(true);

  // 2. Health Check
  const healthResult = await execCLI('service', ['health', serviceName]);
  expect(healthResult.exitCode).toBe(0);
  expect(healthResult.stdout).toContain('healthy');

  // 3. Metrics
  const metrics = await getProcessMetrics(serviceName);
  expect(metrics.cpu).toBeGreaterThanOrEqual(0);
  expect(metrics.memory).toBeGreaterThan(0);

  // 4. Logs
  const logsResult = await execCLI('service', ['logs', serviceName, '--lines', '10']);
  expect(logsResult.exitCode).toBe(0);

  // 5. Stop
  const stopResult = await execCLI('service', ['stop', serviceName]);
  expect(stopResult.exitCode).toBe(0);

  const isStopped = await waitForServiceStop(3000, 10000);
  expect(isStopped).toBe(true);
});
```

### Crash Recovery Test

```typescript
it('should recover from crash', async () => {
  const serviceName = 'crash-recovery';
  const scriptPath = await createMockService(ctx.testDir, {
    name: serviceName,
    port: 3000,
  });

  await execCLI('service', [
    'start',
    serviceName,
    '--script',
    scriptPath,
    '--max-restarts',
    '5',
  ]);

  await waitForService(3000);

  const beforeMetrics = await getProcessMetrics(serviceName);

  // Simulate crash
  await simulateCrash(serviceName);

  // Wait for auto-restart
  await new Promise(resolve => setTimeout(resolve, 3000));

  const isRestarted = await waitForService(3000, 10000);
  expect(isRestarted).toBe(true);

  const afterMetrics = await getProcessMetrics(serviceName);
  expect(afterMetrics.restarts).toBeGreaterThan(beforeMetrics.restarts);

  await execCLI('service', ['stop', serviceName]);
});
```

## References

- [Vitest Documentation](https://vitest.dev/)
- [Execa Documentation](https://github.com/sindresorhus/execa)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#-testing-best-practices)
