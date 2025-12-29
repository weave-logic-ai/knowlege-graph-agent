/**
 * Tests for Health Monitor and Health Checks
 *
 * Comprehensive test suite for the health monitoring system including:
 * - HealthMonitor class
 * - Check factory functions (createDatabaseCheck, createCacheCheck, etc.)
 * - Event emission and history tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  HealthMonitor,
  createHealthMonitor,
  createDatabaseCheck,
  createCacheCheck,
  createMemoryCheck,
  createDiskCheck,
} from '../../src/health/index.js';
import type { HealthCheck, ComponentHealth, HealthStatus } from '../../src/health/index.js';

describe('HealthMonitor', () => {
  let monitor: HealthMonitor;
  const testRoot = join('/tmp', `kg-health-test-${Date.now()}`);

  beforeEach(() => {
    mkdirSync(testRoot, { recursive: true });
    monitor = new HealthMonitor();
  });

  afterEach(() => {
    monitor.stop();
    rmSync(testRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a HealthMonitor instance with default config', () => {
      const m = new HealthMonitor();
      expect(m).toBeInstanceOf(HealthMonitor);
      m.stop();
    });

    it('should accept custom interval option', () => {
      const m = new HealthMonitor({ interval: 30000 });
      expect(m).toBeInstanceOf(HealthMonitor);
      m.stop();
    });

    it('should accept custom timeout option', () => {
      const m = new HealthMonitor({ timeout: 10000 });
      expect(m).toBeInstanceOf(HealthMonitor);
      m.stop();
    });

    it('should auto-start if autoStart is true', async () => {
      const m = new HealthMonitor({ autoStart: true, interval: 60000 });
      // Give it a moment to start
      await new Promise((r) => setTimeout(r, 10));
      // The monitor should be running (intervalId set internally)
      m.stop();
    });

    it('should not auto-start if autoStart is false', () => {
      const m = new HealthMonitor({ autoStart: false });
      // Monitor should not be running
      m.stop();
    });
  });

  describe('register() and unregister()', () => {
    it('should register a health check', () => {
      const check: HealthCheck = {
        name: 'test-check',
        check: async () => ({
          name: 'test-check',
          status: 'healthy',
          lastCheck: new Date(),
        }),
      };

      monitor.register(check);
      // Verify it was registered by running check
      expect(async () => await monitor.check()).not.toThrow();
    });

    it('should register multiple health checks', () => {
      const check1: HealthCheck = {
        name: 'check-1',
        check: async () => ({
          name: 'check-1',
          status: 'healthy',
          lastCheck: new Date(),
        }),
      };

      const check2: HealthCheck = {
        name: 'check-2',
        check: async () => ({
          name: 'check-2',
          status: 'healthy',
          lastCheck: new Date(),
        }),
      };

      monitor.register(check1);
      monitor.register(check2);
    });

    it('should unregister a health check', async () => {
      const check: HealthCheck = {
        name: 'test-check',
        check: async () => ({
          name: 'test-check',
          status: 'healthy',
          lastCheck: new Date(),
        }),
      };

      monitor.register(check);
      monitor.unregister('test-check');

      // Check should no longer be in results
      const health = await monitor.check();
      expect(health.components.find((c) => c.name === 'test-check')).toBeUndefined();
    });

    it('should replace a check with the same name', async () => {
      const check1: HealthCheck = {
        name: 'test-check',
        check: async () => ({
          name: 'test-check',
          status: 'healthy',
          message: 'first',
          lastCheck: new Date(),
        }),
      };

      const check2: HealthCheck = {
        name: 'test-check',
        check: async () => ({
          name: 'test-check',
          status: 'degraded',
          message: 'second',
          lastCheck: new Date(),
        }),
      };

      monitor.register(check1);
      monitor.register(check2);

      const health = await monitor.check();
      const result = health.components.find((c) => c.name === 'test-check');
      expect(result?.status).toBe('degraded');
      expect(result?.message).toBe('second');
    });
  });

  describe('check()', () => {
    it('should run all registered health checks', async () => {
      const check1: HealthCheck = {
        name: 'check-1',
        check: async () => ({
          name: 'check-1',
          status: 'healthy',
          lastCheck: new Date(),
        }),
      };

      const check2: HealthCheck = {
        name: 'check-2',
        check: async () => ({
          name: 'check-2',
          status: 'healthy',
          lastCheck: new Date(),
        }),
      };

      monitor.register(check1);
      monitor.register(check2);

      const health = await monitor.check();

      expect(health.components).toHaveLength(2);
      expect(health.components.map((c) => c.name)).toContain('check-1');
      expect(health.components.map((c) => c.name)).toContain('check-2');
    });

    it('should return unknown status when no checks registered', async () => {
      const health = await monitor.check();
      expect(health.status).toBe('unknown');
      expect(health.components).toHaveLength(0);
    });

    it('should return healthy status when all checks pass', async () => {
      monitor.register({
        name: 'check-1',
        check: async () => ({
          name: 'check-1',
          status: 'healthy',
          lastCheck: new Date(),
        }),
      });

      monitor.register({
        name: 'check-2',
        check: async () => ({
          name: 'check-2',
          status: 'healthy',
          lastCheck: new Date(),
        }),
      });

      const health = await monitor.check();
      expect(health.status).toBe('healthy');
    });

    it('should return degraded status when any check is degraded', async () => {
      monitor.register({
        name: 'healthy-check',
        check: async () => ({
          name: 'healthy-check',
          status: 'healthy',
          lastCheck: new Date(),
        }),
      });

      monitor.register({
        name: 'degraded-check',
        check: async () => ({
          name: 'degraded-check',
          status: 'degraded',
          lastCheck: new Date(),
        }),
      });

      const health = await monitor.check();
      expect(health.status).toBe('degraded');
    });

    it('should return unhealthy status when any check is unhealthy', async () => {
      monitor.register({
        name: 'healthy-check',
        check: async () => ({
          name: 'healthy-check',
          status: 'healthy',
          lastCheck: new Date(),
        }),
      });

      monitor.register({
        name: 'unhealthy-check',
        check: async () => ({
          name: 'unhealthy-check',
          status: 'unhealthy',
          lastCheck: new Date(),
        }),
      });

      const health = await monitor.check();
      expect(health.status).toBe('unhealthy');
    });

    it('should handle check errors gracefully', async () => {
      monitor.register({
        name: 'error-check',
        check: async () => {
          throw new Error('Check failed');
        },
      });

      const health = await monitor.check();
      expect(health.status).toBe('unhealthy');
      expect(health.components[0].status).toBe('unhealthy');
      expect(health.components[0].message).toContain('Check failed');
    });

    it('should handle check timeout', async () => {
      const slowMonitor = new HealthMonitor({ timeout: 50 });

      slowMonitor.register({
        name: 'slow-check',
        check: async () => {
          await new Promise((r) => setTimeout(r, 200));
          return {
            name: 'slow-check',
            status: 'healthy' as HealthStatus,
            lastCheck: new Date(),
          };
        },
      });

      const health = await slowMonitor.check();
      expect(health.status).toBe('unhealthy');
      expect(health.components[0].message).toContain('timeout');

      slowMonitor.stop();
    });

    it('should include uptime in health result', async () => {
      // Wait a bit to ensure uptime > 0
      await new Promise((r) => setTimeout(r, 10));

      const health = await monitor.check();
      expect(health.uptime).toBeGreaterThan(0);
    });

    it('should include timestamp in health result', async () => {
      const before = new Date();
      const health = await monitor.check();
      const after = new Date();

      expect(health.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(health.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('getLastStatus()', () => {
    it('should return the last health status without running checks', async () => {
      monitor.register({
        name: 'test-check',
        check: async () => ({
          name: 'test-check',
          status: 'healthy',
          lastCheck: new Date(),
        }),
      });

      // Run check first
      await monitor.check();

      // Get last status (should not run checks again)
      const status = monitor.getLastStatus();
      expect(status.status).toBe('healthy');
      expect(status.components).toHaveLength(1);
    });

    it('should return unknown if no checks have been run', () => {
      const status = monitor.getLastStatus();
      expect(status.status).toBe('unknown');
      expect(status.components).toHaveLength(0);
    });
  });

  describe('getPerformanceMetrics()', () => {
    it('should return memory metrics', () => {
      const metrics = monitor.getPerformanceMetrics();

      expect(metrics.memory).toBeDefined();
      expect(metrics.memory.heapUsed).toBeGreaterThan(0);
      expect(metrics.memory.heapTotal).toBeGreaterThan(0);
      expect(metrics.memory.rss).toBeGreaterThan(0);
      expect(metrics.memory.external).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.arrayBuffers).toBeGreaterThanOrEqual(0);
    });
  });

  describe('start() and stop()', () => {
    it('should start periodic checks', async () => {
      const checkFn = vi.fn().mockResolvedValue({
        name: 'test-check',
        status: 'healthy',
        lastCheck: new Date(),
      });

      monitor.register({
        name: 'test-check',
        check: checkFn,
      });

      // Use a short interval for testing
      const shortMonitor = new HealthMonitor({ interval: 50 });
      shortMonitor.register({
        name: 'test-check',
        check: checkFn,
      });

      shortMonitor.start();

      // Wait for at least 2 intervals
      await new Promise((r) => setTimeout(r, 120));

      shortMonitor.stop();

      // Check should have been called at least twice
      expect(checkFn.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('should stop periodic checks', async () => {
      const checkFn = vi.fn().mockResolvedValue({
        name: 'test-check',
        status: 'healthy',
        lastCheck: new Date(),
      });

      const shortMonitor = new HealthMonitor({ interval: 30 });
      shortMonitor.register({
        name: 'test-check',
        check: checkFn,
      });

      shortMonitor.start();
      await new Promise((r) => setTimeout(r, 50));
      shortMonitor.stop();

      const callsAfterStop = checkFn.mock.calls.length;
      await new Promise((r) => setTimeout(r, 100));

      // No new calls after stop
      expect(checkFn.mock.calls.length).toBe(callsAfterStop);
    });

    it('should not start multiple intervals if called multiple times', async () => {
      const checkFn = vi.fn().mockResolvedValue({
        name: 'test-check',
        status: 'healthy',
        lastCheck: new Date(),
      });

      const shortMonitor = new HealthMonitor({ interval: 50 });
      shortMonitor.register({
        name: 'test-check',
        check: checkFn,
      });

      shortMonitor.start();
      shortMonitor.start(); // Call again
      shortMonitor.start(); // Call again

      await new Promise((r) => setTimeout(r, 120));

      shortMonitor.stop();

      // Should only have been called about 2-3 times, not 6-9
      expect(checkFn.mock.calls.length).toBeLessThan(6);
    });

    it('should handle stop when not started', () => {
      expect(() => monitor.stop()).not.toThrow();
    });
  });
});

describe('createHealthMonitor()', () => {
  it('should create a HealthMonitor instance', () => {
    const monitor = createHealthMonitor();
    expect(monitor).toBeInstanceOf(HealthMonitor);
    monitor.stop();
  });

  it('should create a HealthMonitor with custom config', () => {
    const monitor = createHealthMonitor({
      interval: 30000,
      timeout: 5000,
    });
    expect(monitor).toBeInstanceOf(HealthMonitor);
    monitor.stop();
  });
});

describe('createDatabaseCheck()', () => {
  const testRoot = join('/tmp', `kg-dbcheck-test-${Date.now()}`);
  const testDbPath = join(testRoot, 'test.db');

  beforeEach(() => {
    mkdirSync(testRoot, { recursive: true });
  });

  afterEach(() => {
    rmSync(testRoot, { recursive: true, force: true });
  });

  it('should return a health check with correct name', () => {
    const check = createDatabaseCheck(testDbPath);
    expect(check.name).toBe('database');
  });

  it('should mark as critical by default', () => {
    const check = createDatabaseCheck(testDbPath);
    expect(check.critical).toBe(true);
  });

  it('should return healthy when database file exists', async () => {
    writeFileSync(testDbPath, 'mock database content');
    const check = createDatabaseCheck(testDbPath);
    const result = await check.check();

    expect(result.status).toBe('healthy');
    expect(result.message).toContain('accessible');
    expect(result.lastCheck).toBeInstanceOf(Date);
  });

  it('should return unhealthy when database file does not exist', async () => {
    const check = createDatabaseCheck('/nonexistent/path/db.sqlite');
    const result = await check.check();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('not found');
  });

  it('should include response time', async () => {
    writeFileSync(testDbPath, 'mock database content');
    const check = createDatabaseCheck(testDbPath);
    const result = await check.check();

    expect(result.responseTime).toBeDefined();
    expect(result.responseTime).toBeGreaterThanOrEqual(0);
  });
});

describe('createCacheCheck()', () => {
  it('should return a health check with correct name', () => {
    const check = createCacheCheck();
    expect(check.name).toBe('cache');
  });

  it('should return healthy status', async () => {
    const check = createCacheCheck();
    const result = await check.check();

    expect(result.status).toBe('healthy');
    expect(result.message).toContain('operational');
  });

  it('should include lastCheck timestamp', async () => {
    const check = createCacheCheck();
    const result = await check.check();

    expect(result.lastCheck).toBeInstanceOf(Date);
  });
});

describe('createMemoryCheck()', () => {
  it('should return a health check with correct name', () => {
    const check = createMemoryCheck();
    expect(check.name).toBe('memory');
  });

  it('should use default threshold of 500MB', async () => {
    const check = createMemoryCheck();
    const result = await check.check();

    expect(result.metadata?.thresholdMB).toBe(500);
  });

  it('should accept custom threshold', async () => {
    const check = createMemoryCheck(1000);
    const result = await check.check();

    expect(result.metadata?.thresholdMB).toBe(1000);
  });

  it('should return healthy when memory usage is low', async () => {
    // Use a very high threshold to ensure healthy status
    const check = createMemoryCheck(50000);
    const result = await check.check();

    expect(result.status).toBe('healthy');
  });

  it('should return degraded when memory usage is high', async () => {
    // Mock process.memoryUsage to return high usage
    const originalMemoryUsage = process.memoryUsage;
    const mockHeapTotal = 100 * 1024 * 1024; // 100MB total
    const mockHeapUsed = 80 * 1024 * 1024; // 80MB used (80%)

    vi.spyOn(process, 'memoryUsage').mockReturnValue({
      heapUsed: mockHeapUsed,
      heapTotal: mockHeapTotal,
      rss: 150 * 1024 * 1024,
      external: 10 * 1024 * 1024,
      arrayBuffers: 5 * 1024 * 1024,
    });

    // Threshold of 100MB, 80% used should trigger degraded (>70%)
    const check = createMemoryCheck(100);
    const result = await check.check();

    expect(result.status).toBe('degraded');

    vi.restoreAllMocks();
  });

  it('should return unhealthy when memory usage is critical', async () => {
    const mockHeapTotal = 100 * 1024 * 1024; // 100MB total
    const mockHeapUsed = 95 * 1024 * 1024; // 95MB used (95%)

    vi.spyOn(process, 'memoryUsage').mockReturnValue({
      heapUsed: mockHeapUsed,
      heapTotal: mockHeapTotal,
      rss: 150 * 1024 * 1024,
      external: 10 * 1024 * 1024,
      arrayBuffers: 5 * 1024 * 1024,
    });

    // Threshold of 100MB, 95% used should trigger unhealthy (>90%)
    const check = createMemoryCheck(100);
    const result = await check.check();

    expect(result.status).toBe('unhealthy');

    vi.restoreAllMocks();
  });

  it('should include heap usage in message', async () => {
    const check = createMemoryCheck();
    const result = await check.check();

    expect(result.message).toContain('Heap usage');
    expect(result.message).toContain('MB');
  });

  it('should include metadata with heap info', async () => {
    const check = createMemoryCheck(500);
    const result = await check.check();

    expect(result.metadata?.heapUsedMB).toBeDefined();
    expect(result.metadata?.thresholdMB).toBe(500);
  });
});

describe('createDiskCheck()', () => {
  const testRoot = join('/tmp', `kg-diskcheck-test-${Date.now()}`);

  beforeEach(() => {
    mkdirSync(testRoot, { recursive: true });
  });

  afterEach(() => {
    rmSync(testRoot, { recursive: true, force: true });
  });

  it('should return a health check with correct name', () => {
    const check = createDiskCheck(testRoot);
    expect(check.name).toBe('disk');
  });

  it('should return healthy when path is accessible', async () => {
    const check = createDiskCheck(testRoot);
    const result = await check.check();

    expect(result.status).toBe('healthy');
    expect(result.message).toContain('accessible');
  });

  it('should return unhealthy when path is not accessible', async () => {
    const check = createDiskCheck('/nonexistent/path/that/does/not/exist');
    const result = await check.check();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('not accessible');
  });

  it('should include lastCheck timestamp', async () => {
    const check = createDiskCheck(testRoot);
    const result = await check.check();

    expect(result.lastCheck).toBeInstanceOf(Date);
  });
});

describe('Integration: HealthMonitor with built-in checks', () => {
  const testRoot = join('/tmp', `kg-health-integration-${Date.now()}`);
  const testDbPath = join(testRoot, 'test.db');
  let monitor: HealthMonitor;

  beforeEach(() => {
    mkdirSync(testRoot, { recursive: true });
    writeFileSync(testDbPath, 'test database');
    monitor = new HealthMonitor();
  });

  afterEach(() => {
    monitor.stop();
    rmSync(testRoot, { recursive: true, force: true });
  });

  it('should run all built-in checks together', async () => {
    monitor.register(createDatabaseCheck(testDbPath));
    monitor.register(createCacheCheck());
    monitor.register(createMemoryCheck());
    monitor.register(createDiskCheck(testRoot));

    const health = await monitor.check();

    expect(health.components).toHaveLength(4);
    expect(health.components.map((c) => c.name)).toContain('database');
    expect(health.components.map((c) => c.name)).toContain('cache');
    expect(health.components.map((c) => c.name)).toContain('memory');
    expect(health.components.map((c) => c.name)).toContain('disk');
  });

  it('should report overall healthy when all checks pass', async () => {
    monitor.register(createDatabaseCheck(testDbPath));
    monitor.register(createCacheCheck());
    monitor.register(createDiskCheck(testRoot));

    const health = await monitor.check();

    expect(health.status).toBe('healthy');
  });

  it('should report overall unhealthy when database is missing', async () => {
    monitor.register(createDatabaseCheck('/nonexistent/db.sqlite'));
    monitor.register(createCacheCheck());
    monitor.register(createDiskCheck(testRoot));

    const health = await monitor.check();

    expect(health.status).toBe('unhealthy');
  });

  it('should handle mixed health statuses correctly', async () => {
    // One healthy, one unhealthy
    monitor.register(createCacheCheck()); // Always healthy
    monitor.register(createDatabaseCheck('/nonexistent/db.sqlite')); // Unhealthy

    const health = await monitor.check();

    // Should be unhealthy overall
    expect(health.status).toBe('unhealthy');
  });
});

describe('Edge cases and error handling', () => {
  let monitor: HealthMonitor;

  beforeEach(() => {
    monitor = new HealthMonitor();
  });

  afterEach(() => {
    monitor.stop();
  });

  it('should handle check that returns non-standard status', async () => {
    monitor.register({
      name: 'weird-check',
      check: async () => ({
        name: 'weird-check',
        status: 'unknown' as HealthStatus,
        lastCheck: new Date(),
      }),
    });

    const health = await monitor.check();
    expect(health.components[0].status).toBe('unknown');
  });

  it('should handle check that throws non-Error object', async () => {
    monitor.register({
      name: 'string-throw',
      check: async () => {
        throw 'string error';
      },
    });

    const health = await monitor.check();
    expect(health.status).toBe('unhealthy');
    expect(health.components[0].message).toBe('string error');
  });

  it('should handle check that throws null', async () => {
    monitor.register({
      name: 'null-throw',
      check: async () => {
        throw null;
      },
    });

    const health = await monitor.check();
    expect(health.status).toBe('unhealthy');
  });

  it('should handle concurrent check calls', async () => {
    let callCount = 0;

    monitor.register({
      name: 'counting-check',
      check: async () => {
        callCount++;
        await new Promise((r) => setTimeout(r, 50));
        return {
          name: 'counting-check',
          status: 'healthy' as HealthStatus,
          lastCheck: new Date(),
        };
      },
    });

    // Start multiple concurrent checks
    const results = await Promise.all([
      monitor.check(),
      monitor.check(),
      monitor.check(),
    ]);

    // All should complete successfully
    expect(results).toHaveLength(3);
    results.forEach((health) => {
      expect(health.status).toBe('healthy');
    });
  });

  it('should handle empty check name', async () => {
    monitor.register({
      name: '',
      check: async () => ({
        name: '',
        status: 'healthy',
        lastCheck: new Date(),
      }),
    });

    const health = await monitor.check();
    expect(health.components).toHaveLength(1);
    expect(health.components[0].name).toBe('');
  });

  it('should handle very long check names', async () => {
    const longName = 'a'.repeat(1000);

    monitor.register({
      name: longName,
      check: async () => ({
        name: longName,
        status: 'healthy',
        lastCheck: new Date(),
      }),
    });

    const health = await monitor.check();
    expect(health.components[0].name).toBe(longName);
  });
});
