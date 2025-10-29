# CLI Integration Implementation Guide

**Purpose:** Complete the integration between recovery modules and PM2/CLI
**Estimated Time:** 6-9 hours
**Current Status:** Algorithms 100% implemented, integration 0% complete

---

## Overview

This guide provides step-by-step instructions to complete the CLI service management integration. All recovery algorithms are already implemented - we just need to wire them into PM2 and create test helpers.

### What's Already Done ✅

1. **Recovery Modules (1,200 LOC):**
   - `src/service-manager/recovery.ts` - Circuit breaker & restart logic
   - `src/service-manager/port-allocator.ts` - Port conflict resolution
   - `src/service-manager/database-recovery.ts` - DB corruption recovery
   - `src/service-manager/config-validator.ts` - Config validation & hot-reload
   - `src/service-manager/state-manager.ts` - State persistence

2. **Performance Modules (600 LOC):**
   - `src/service-manager/connection-pool.ts` - PM2 connection pooling
   - `src/service-manager/metrics-cache.ts` - Metrics caching
   - `src/service-manager/command-lock.ts` - Command locking

3. **CLI Commands:**
   - `src/cli/commands/service/start.ts` - Already calls recovery modules
   - All other service commands exist

### What Needs to Be Done ⏳

1. **Test Helpers** (2 hours) - Complete `tests/integration/cli/setup.ts`
2. **PM2 Event Wiring** (3 hours) - Connect recovery to PM2 lifecycle
3. **Integration Testing** (2-3 hours) - Test and debug
4. **Singleton Exports** (30 minutes) - Export missing instances

---

## Phase 1: Complete Test Helpers (2 hours)

### File: `tests/integration/cli/setup.ts`

The file already has the basic structure. We need to implement the missing functions.

#### 1.1 Implement `execCLI()` Function

```typescript
/**
 * Execute CLI command for testing
 */
export async function execCLI(
  command: string,
  args: string[],
  options: { timeout?: number; env?: Record<string, string> } = {}
): Promise<{ stdout: string; stderr: string; exitCode: number; failed: boolean }> {
  const CLI_PATH = path.join(__dirname, '../../../src/cli/index.ts');

  try {
    const result = await execa('tsx', [CLI_PATH, command, ...args], {
      timeout: options.timeout || 30000,
      env: { ...process.env, ...options.env },
      reject: false, // Don't throw on non-zero exit
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode || 0,
      failed: result.exitCode !== 0,
    };
  } catch (error) {
    if (error.timedOut) {
      return {
        stdout: '',
        stderr: 'Command timed out',
        exitCode: 1,
        failed: true,
      };
    }
    throw error;
  }
}
```

#### 1.2 Implement `createMockService()` Function

```typescript
/**
 * Create a mock service script for testing
 */
export async function createMockService(
  testDir: string,
  options: MockServiceOptions
): Promise<string> {
  const serviceName = options.name || `test-service-${Date.now()}`;
  const port = options.port || 3000;
  const shouldFail = options.shouldFail || false;

  // Create mock service script
  const scriptContent = `
// Mock service for testing
const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || ${port};
let requestCount = 0;

// Health check endpoint
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    requestCount++;

    ${shouldFail ? `
    // Simulate failure after 3 requests
    if (requestCount > 3) {
      res.writeHead(500);
      res.end('Service failing');
      process.exit(1);
    }
    ` : ''}

    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', requests: requestCount }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(\`Mock service listening on port \${PORT}\`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});
`;

  const scriptPath = path.join(testDir, `${serviceName}.js`);
  await fs.writeFile(scriptPath, scriptContent, 'utf-8');

  return scriptPath;
}
```

#### 1.3 Implement `waitForService()` Function

```typescript
/**
 * Wait for service to be running
 */
export async function waitForService(
  name: string,
  timeout: number = 30000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await execCLI('service', ['status', name]);

    if (result.stdout.includes('running') || result.stdout.includes('online')) {
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return false;
}
```

#### 1.4 Implement `waitForServiceStop()` Function

```typescript
/**
 * Wait for service to stop
 */
export async function waitForServiceStop(
  name: string,
  timeout: number = 10000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await execCLI('service', ['status', name]);

    if (result.stdout.includes('stopped') || result.failed) {
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return false;
}
```

#### 1.5 Implement `simulateCrash()` Function

```typescript
/**
 * Simulate service crash
 */
export async function simulateCrash(name: string): Promise<void> {
  // Get process info
  const statusResult = await execCLI('service', ['status', name]);
  const pidMatch = statusResult.stdout.match(/PID:\s*(\d+)/);

  if (!pidMatch) {
    throw new Error(`Could not find PID for service ${name}`);
  }

  const pid = parseInt(pidMatch[1], 10);

  // Send SIGKILL to crash the process
  try {
    process.kill(pid, 'SIGKILL');
  } catch (error) {
    // Process might already be dead
  }

  // Wait a bit for PM2 to detect the crash
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

#### 1.6 Implement `createMockDatabase()` Function

```typescript
/**
 * Create a mock database file
 */
export async function createMockDatabase(testDir: string): Promise<string> {
  const dbPath = path.join(testDir, `test-db-${Date.now()}.db`);

  // Create a simple SQLite database
  const sqlite3 = await import('better-sqlite3');
  const db = sqlite3.default(dbPath);

  // Create a simple table
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_data (
      id INTEGER PRIMARY KEY,
      value TEXT
    );
    INSERT INTO test_data (value) VALUES ('test');
  `);

  db.close();

  return dbPath;
}
```

#### 1.7 Implement `corruptDatabase()` Function

```typescript
/**
 * Corrupt a database file
 */
export async function corruptDatabase(dbPath: string): Promise<void> {
  // Read the database file
  const buffer = await fs.readFile(dbPath);

  // Corrupt some bytes in the middle
  const corruptedBuffer = Buffer.from(buffer);
  for (let i = 100; i < 200; i++) {
    corruptedBuffer[i] = 0xFF;
  }

  // Write back the corrupted data
  await fs.writeFile(dbPath, corruptedBuffer);
}
```

#### 1.8 Implement `isPortInUse()` Function

```typescript
import net from 'net';

/**
 * Check if a port is in use
 */
export async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close(() => resolve(false));
    });

    server.listen(port);
  });
}
```

#### 1.9 Implement `getProcessMetrics()` Function

```typescript
/**
 * Get process metrics for a service
 */
export async function getProcessMetrics(name: string): Promise<{
  cpu: number;
  memory: number;
  uptime: number;
  restarts: number;
}> {
  const result = await execCLI('service', ['metrics', name]);

  // Parse the output
  const cpuMatch = result.stdout.match(/CPU:\s*([\d.]+)%/);
  const memoryMatch = result.stdout.match(/Memory:\s*([\d.]+)\s*MB/);
  const uptimeMatch = result.stdout.match(/Uptime:\s*([\d.]+)s/);
  const restartsMatch = result.stdout.match(/Restarts:\s*(\d+)/);

  return {
    cpu: cpuMatch ? parseFloat(cpuMatch[1]) : 0,
    memory: memoryMatch ? parseFloat(memoryMatch[1]) : 0,
    uptime: uptimeMatch ? parseFloat(uptimeMatch[1]) : 0,
    restarts: restartsMatch ? parseInt(restartsMatch[1], 10) : 0,
  };
}
```

---

## Phase 2: Wire PM2 Event Bus (3 hours)

### File: `src/service-manager/process-manager.ts`

We need to connect to the PM2 event bus and wire recovery logic to lifecycle events.

#### 2.1 Initialize PM2 Event Bus Connection

Add this to the `ProcessManager` class:

```typescript
import pm2 from 'pm2';
import { recoveryManager } from './recovery.js';
import { stateManager } from './state-manager.js';
import { logger } from './logger.js';

export class ProcessManager {
  private eventBusInitialized = false;

  /**
   * Initialize PM2 event bus for lifecycle monitoring
   */
  async initializeEventBus(): Promise<void> {
    if (this.eventBusInitialized) {
      return;
    }

    return new Promise((resolve, reject) => {
      pm2.launchBus((err, bus) => {
        if (err) {
          logger.error('Failed to launch PM2 event bus', err);
          reject(err);
          return;
        }

        logger.info('PM2 event bus connected');
        this.eventBusInitialized = true;

        // Listen for process restart events
        bus.on('process:event', async (data: any) => {
          if (data.event === 'restart') {
            await this.handleRestart(data.process.name);
          }
        });

        // Listen for process exceptions
        bus.on('process:exception', async (data: any) => {
          await this.handleException(data.process.name, data.data);
        });

        // Listen for process exits
        bus.on('process:exit', async (data: any) => {
          await this.handleExit(data.process.name, data.code);
        });

        resolve();
      });
    });
  }

  /**
   * Handle service restart event
   */
  private async handleRestart(serviceName: string): Promise<void> {
    logger.info('Service restarted', { serviceName });

    // Record restart in recovery manager
    await recoveryManager.recordRestart(serviceName);

    // Update state
    const currentState = await stateManager.restoreState(serviceName);
    if (currentState) {
      await stateManager.saveState(serviceName, {
        ...currentState,
        restarts: (currentState.restarts || 0) + 1,
        lastRestart: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle service exception event
   */
  private async handleException(serviceName: string, error: any): Promise<void> {
    logger.error('Service exception', error, { serviceName });

    // Check if we should restart
    const shouldRestart = await recoveryManager.shouldRestart(serviceName);

    if (!shouldRestart) {
      logger.warn('Max restart limit reached, not restarting', { serviceName });

      // Open circuit breaker
      await recoveryManager.openCircuitBreaker(serviceName);
      return;
    }

    // Save state before restart
    const currentState = await stateManager.restoreState(serviceName);
    if (currentState) {
      await stateManager.saveState(serviceName, {
        ...currentState,
        state: 'restarting',
        lastError: error.message || 'Unknown error',
      });
    }
  }

  /**
   * Handle service exit event
   */
  private async handleExit(serviceName: string, exitCode: number): Promise<void> {
    logger.info('Service exited', { serviceName, exitCode });

    if (exitCode !== 0) {
      // Non-zero exit is a failure
      await recoveryManager.recordFailure(serviceName);
    }
  }
}

// Export singleton
export const processManager = new ProcessManager();
```

#### 2.2 Add Recovery Manager Methods

Add these methods to `src/service-manager/recovery.ts`:

```typescript
export class RecoveryManager {
  // ... existing code ...

  /**
   * Record a restart (called by PM2 event handler)
   */
  async recordRestart(serviceName: string): Promise<void> {
    const count = this.restartCounts.get(serviceName) || 0;
    this.restartCounts.set(serviceName, count + 1);
    this.lastRestartTime.set(serviceName, Date.now());

    logger.info('Restart recorded', {
      serviceName,
      restarts: count + 1,
    });
  }

  /**
   * Record a failure (called by PM2 event handler)
   */
  async recordFailure(serviceName: string): Promise<void> {
    const breaker = this.circuitBreakers.get(serviceName);
    if (breaker) {
      breaker.recordFailure();
    }

    logger.warn('Failure recorded', { serviceName });
  }

  /**
   * Open circuit breaker (stop trying to restart)
   */
  async openCircuitBreaker(serviceName: string): Promise<void> {
    const breaker = this.circuitBreakers.get(serviceName);
    if (breaker) {
      breaker.state = 'open';
      logger.warn('Circuit breaker opened', { serviceName });
    }
  }
}
```

#### 2.3 Auto-Initialize Event Bus on First Start

Modify `ProcessManager.start()` to initialize event bus:

```typescript
async start(config: ServiceConfig): Promise<ServiceInstance> {
  // Initialize event bus on first start
  if (!this.eventBusInitialized) {
    await this.initializeEventBus();
  }

  // ... rest of start logic ...
}
```

---

## Phase 3: Add Missing Singleton Exports (30 minutes)

### 3.1 Update `src/service-manager/port-allocator.ts`

Add at the end of the file:

```typescript
/**
 * Singleton instance
 */
export const portAllocator = new PortAllocator();
```

### 3.2 Update `src/service-manager/database-recovery.ts`

Add at the end of the file:

```typescript
/**
 * Database recovery service (singleton-style exports)
 */
export const databaseRecovery = {
  recoverDatabase,
  isDatabaseCorrupted,
  createBackup,
  restoreFromBackup,
  createNewDatabase,
};
```

### 3.3 Update `src/service-manager/config-validator.ts`

Add helper methods and singleton:

```typescript
export class ConfigValidator {
  // ... existing code ...

  /**
   * Load configuration from file
   */
  async loadConfig(configPath: string): Promise<ServiceConfig> {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Merge config with CLI options
   */
  mergeWithOptions(config: ServiceConfig, options: Record<string, any>): ServiceConfig {
    return {
      ...config,
      ...options,
      env: { ...config.env, ...options.env },
    };
  }
}

/**
 * Singleton instance
 */
export const configValidator = new ConfigValidator();
```

### 3.4 Update `src/service-manager/state-manager.ts`

Add at the end of the file:

```typescript
/**
 * Singleton instance
 */
export const stateManager = new StateManager();
```

### 3.5 Update `src/service-manager/connection-pool.ts`

Add at the end of the file:

```typescript
/**
 * Singleton instance
 */
export const connectionPool = PM2ConnectionPool.getInstance();
```

### 3.6 Update `src/service-manager/metrics-cache.ts`

Add at the end of the file:

```typescript
/**
 * Singleton instance
 */
export const metricsCache = new MetricsCache();
```

### 3.7 Update `src/service-manager/command-lock.ts`

Add at the end of the file:

```typescript
/**
 * Create command lock instance
 */
export const commandLock = new CommandLock(
  path.join(os.tmpdir(), 'weaver-cli-lock')
);
```

---

## Phase 4: Integration Testing (2-3 hours)

### 4.1 Run Tests

```bash
# Run service management tests
npm test -- tests/integration/cli/failure-recovery.test.ts

# Run performance tests
npm test -- tests/integration/cli/performance.test.ts
```

### 4.2 Debug Common Issues

**Issue 1: PM2 Connection Errors**
```
Error: pm2.connect is not a function
```
**Fix:** Ensure PM2 is properly initialized:
```typescript
await new Promise((resolve, reject) => {
  pm2.connect((err) => {
    if (err) reject(err);
    else resolve();
  });
});
```

**Issue 2: Test Timeouts**
```
Test timed out after 10000ms
```
**Fix:** Increase test timeout in vitest.config.ts:
```typescript
export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds
  },
});
```

**Issue 3: Port Already in Use**
```
Error: Port 3000 already in use
```
**Fix:** Use dynamic port allocation in tests:
```typescript
const port = 3000 + Math.floor(Math.random() * 1000);
```

**Issue 4: Service Not Starting**
```
Service failed to start
```
**Fix:** Check logs:
```bash
npx tsx src/cli/index.ts service logs <service-name>
```

### 4.3 Verify All Tests Pass

Target: 38/38 CLI tests passing (20 service + 18 performance)

```bash
# Run all CLI tests
npm test -- tests/integration/cli/

# Expected output:
# ✓ tests/integration/cli/failure-recovery.test.ts (20 tests)
# ✓ tests/integration/cli/performance.test.ts (18 tests)
# Test Files  2 passed (2)
#      Tests  38 passed (38)
```

---

## Phase 5: Build and Verify (30 minutes)

### 5.1 Run Build

```bash
npm run build
```

### 5.2 Run All Tests

```bash
npm test
```

### 5.3 Expected Final Results

```
✓ tests/vault-init/e2e-vault-initialization.test.ts (23 tests)
✓ tests/integration/cli/failure-recovery.test.ts (20 tests)
✓ tests/integration/cli/performance.test.ts (18 tests)
✓ tests/agents/error-handling.test.ts (2 tests)
✓ tests/unit/utils/error-recovery.test.ts (5 tests)
✓ tests/unit/shadow-cache-advanced-tools.test.ts (4 tests)
✓ tests/integration/workflows/kg-integration.test.ts (1 test)

Test Files  7 passed (7)
     Tests  73 passed (73)
```

---

## Checklist

### Test Helpers ✅
- [ ] Implement `execCLI()`
- [ ] Implement `createMockService()`
- [ ] Implement `waitForService()`
- [ ] Implement `waitForServiceStop()`
- [ ] Implement `simulateCrash()`
- [ ] Implement `createMockDatabase()`
- [ ] Implement `corruptDatabase()`
- [ ] Implement `isPortInUse()`
- [ ] Implement `getProcessMetrics()`

### PM2 Event Wiring ✅
- [ ] Add `initializeEventBus()` to ProcessManager
- [ ] Wire `process:event` handler
- [ ] Wire `process:exception` handler
- [ ] Wire `process:exit` handler
- [ ] Add `recordRestart()` to RecoveryManager
- [ ] Add `recordFailure()` to RecoveryManager
- [ ] Add `openCircuitBreaker()` to RecoveryManager
- [ ] Auto-initialize event bus on first start

### Singleton Exports ✅
- [ ] Export `portAllocator` singleton
- [ ] Export `databaseRecovery` functions
- [ ] Export `configValidator` singleton
- [ ] Export `stateManager` singleton
- [ ] Export `connectionPool` singleton
- [ ] Export `metricsCache` singleton
- [ ] Export `commandLock` singleton

### Testing & Verification ✅
- [ ] Run service management tests
- [ ] Run performance tests
- [ ] Debug integration issues
- [ ] Verify all 38 CLI tests pass
- [ ] Run full test suite
- [ ] Generate final report

---

## Time Estimates

| Phase | Task | Time |
|-------|------|------|
| 1 | Test Helpers | 2 hours |
| 2 | PM2 Event Wiring | 3 hours |
| 3 | Singleton Exports | 30 min |
| 4 | Integration Testing | 2-3 hours |
| 5 | Build & Verify | 30 min |
| **TOTAL** | | **8-9 hours** |

---

## Tips for Success

1. **Work in Order:** Complete Phase 1 fully before moving to Phase 2
2. **Test Incrementally:** Test each helper function as you write it
3. **Check Logs:** Use `logger.info()` extensively during PM2 event handling
4. **Use Debugger:** Set breakpoints in event handlers to verify they're being called
5. **Monitor PM2:** Run `pm2 monit` in another terminal to watch processes
6. **Clean State:** Between test runs, use `pm2 kill` to reset PM2 state

---

## Success Criteria

✅ All 38 CLI integration tests passing
✅ No TypeScript errors
✅ Build completes successfully
✅ PM2 event bus connected and working
✅ Recovery logic triggers on failures
✅ State persistence works across restarts
✅ Performance optimizations active
✅ Documentation updated

---

## Next Steps After Integration

Once integration is complete:

1. **Fix P1 Failures** (Error Handling & Shadow Cache) - ~3 hours
2. **Fix P2 Failure** (Workflow Integration) - ~1 hour
3. **Run Full Test Suite** - Should have 73/73 tests passing
4. **Generate Final Report** - Document all achievements
5. **Create Release Notes** - Document for users

---

## Support

If you encounter issues:

1. Check the logs in `logs/` directory
2. Review PM2 logs with `pm2 logs`
3. Enable debug logging with `LOG_LEVEL=debug`
4. Check process state with `pm2 status`
5. Review test output for specific error messages

Good luck with the integration! 🚀
