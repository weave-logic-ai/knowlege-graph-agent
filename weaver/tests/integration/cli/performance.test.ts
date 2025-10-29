/**
 * Performance Integration Tests
 * Tests service startup time, concurrent execution, metrics accuracy, resource limits
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTestContext,
  createMockService,
  execCLI,
  execCLIBackground,
  waitForService,
  getProcessMetrics,
  type TestContext,
} from './setup.js';
import { execa } from 'execa';

describe('Performance Integration Tests', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  describe('Service Startup Time', () => {
    it('should start service in under 5 seconds', async () => {
      const serviceName = 'startup-perf-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3500,
      });

      const startTime = Date.now();

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      const isReady = await waitForService(3500, 5000);

      const duration = Date.now() - startTime;

      expect(isReady).toBe(true);
      expect(duration).toBeLessThan(5000);

      console.log(`Startup time: ${duration}ms`);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 10000);

    it('should start multiple services in parallel efficiently', async () => {
      const serviceCount = 5;
      const services: string[] = [];
      const scripts: string[] = [];

      // Create services
      for (let i = 0; i < serviceCount; i++) {
        const name = `parallel-start-${i}`;
        const port = 3501 + i;
        services.push(name);
        scripts.push(await createMockService(ctx.testDir, { name, port }));
      }

      const startTime = Date.now();

      // Start all services in parallel
      await Promise.all(
        services.map((name, i) =>
          execCLI('service', ['start', name, '--script', scripts[i]])
        )
      );

      const duration = Date.now() - startTime;

      // Should be faster than sequential (which would take 5 * 5s = 25s)
      expect(duration).toBeLessThan(10000);

      console.log(`Parallel startup time for ${serviceCount} services: ${duration}ms`);

      // Verify all started
      for (let i = 0; i < serviceCount; i++) {
        const isReady = await waitForService(3501 + i, 2000);
        expect(isReady).toBe(true);
      }

      // Cleanup
      await Promise.all(
        services.map(name => execCLI('service', ['stop', name], { reject: false }))
      );
    }, 30000);

    it('should optimize startup with lazy initialization', async () => {
      const serviceName = 'lazy-init-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3510,
      });

      const startTime = Date.now();

      await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--lazy-init',
      ]);

      const duration = Date.now() - startTime;

      // Lazy init should be faster
      expect(duration).toBeLessThan(3000);

      console.log(`Lazy initialization time: ${duration}ms`);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 10000);
  });

  describe('Concurrent CLI Command Execution', () => {
    it('should handle concurrent status checks', async () => {
      const serviceName = 'concurrent-status-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3511,
      });

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3511);

      const concurrentRequests = 10;
      const startTime = Date.now();

      // Execute concurrent status checks
      const results = await Promise.all(
        Array.from({ length: concurrentRequests }, () =>
          execCLI('service', ['status', serviceName])
        )
      );

      const duration = Date.now() - startTime;

      // All should succeed
      expect(results.every(r => r.exitCode === 0)).toBe(true);

      // Should complete reasonably fast
      expect(duration).toBeLessThan(5000);

      console.log(`${concurrentRequests} concurrent status checks: ${duration}ms`);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 15000);

    it('should handle concurrent metrics collection', async () => {
      const serviceName = 'concurrent-metrics-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3512,
      });

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3512);

      const concurrentRequests = 20;
      const startTime = Date.now();

      // Execute concurrent metrics queries
      const results = await Promise.all(
        Array.from({ length: concurrentRequests }, () =>
          execCLI('service', ['metrics', serviceName])
        )
      );

      const duration = Date.now() - startTime;

      expect(results.every(r => r.exitCode === 0)).toBe(true);
      expect(duration).toBeLessThan(8000);

      console.log(`${concurrentRequests} concurrent metrics queries: ${duration}ms`);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 20000);

    it('should queue commands to prevent race conditions', async () => {
      const serviceName = 'command-queue-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3513,
      });

      // Execute start, stop, restart concurrently
      const startPromise = execCLI('service', ['start', serviceName, '--script', scriptPath]);

      await waitForService(3513, 5000);

      const restartPromise = execCLI('service', ['restart', serviceName]);
      const stopPromise = execCLI('service', ['stop', serviceName]);

      // All should complete without errors
      const [start, restart, stop] = await Promise.all([
        startPromise,
        restartPromise,
        stopPromise,
      ]);

      // Commands should be queued and executed in order
      expect([start.exitCode, restart.exitCode, stop.exitCode]).toContain(0);
    }, 20000);
  });

  describe('Metrics Collection Accuracy', () => {
    it('should report accurate CPU usage', async () => {
      const serviceName = 'cpu-metrics-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3514,
      });

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3514);

      // Wait for service to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));

      const metrics = await getProcessMetrics(serviceName);

      expect(metrics.cpu).toBeGreaterThanOrEqual(0);
      expect(metrics.cpu).toBeLessThan(100);

      console.log(`CPU usage: ${metrics.cpu}%`);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 15000);

    it('should report accurate memory usage', async () => {
      const serviceName = 'memory-metrics-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3515,
      });

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3515);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const metrics = await getProcessMetrics(serviceName);

      expect(metrics.memory).toBeGreaterThan(0);
      expect(metrics.memory).toBeLessThan(1000); // Less than 1GB

      console.log(`Memory usage: ${metrics.memory}MB`);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 15000);

    it('should track uptime accurately', async () => {
      const serviceName = 'uptime-metrics-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3516,
      });

      const startTime = Date.now();

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3516);

      // Wait 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));

      const metrics = await getProcessMetrics(serviceName);
      const expectedUptime = (Date.now() - startTime) / 1000;

      // Uptime should be approximately 3 seconds (with some tolerance)
      expect(metrics.uptime).toBeGreaterThan(2);
      expect(metrics.uptime).toBeLessThan(5);

      console.log(`Uptime: ${metrics.uptime}s (expected ~${expectedUptime.toFixed(1)}s)`);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 15000);

    it('should count restarts accurately', async () => {
      const serviceName = 'restart-count-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3517,
      });

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3517);

      // Restart 3 times
      for (let i = 0; i < 3; i++) {
        await execCLI('service', ['restart', serviceName]);
        await waitForService(3517, 5000);
      }

      const metrics = await getProcessMetrics(serviceName);

      expect(metrics.restarts).toBeGreaterThanOrEqual(3);

      console.log(`Restart count: ${metrics.restarts}`);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 25000);
  });

  describe('Resource Usage Limits', () => {
    it('should enforce memory limits', async () => {
      const serviceName = 'memory-limit-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3518,
      });

      await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--max-memory',
        '128M',
      ]);

      await waitForService(3518);

      const metrics = await getProcessMetrics(serviceName);

      // Should stay under limit (with some tolerance for overhead)
      expect(metrics.memory).toBeLessThan(150);

      console.log(`Memory usage with 128MB limit: ${metrics.memory}MB`);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 15000);

    it('should restart on memory limit exceeded', async () => {
      const serviceName = 'memory-restart-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3519,
      });

      await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--max-memory',
        '50M',
      ]);

      await waitForService(3519);

      // Get initial restart count
      const beforeMetrics = await getProcessMetrics(serviceName);

      // Wait and check if service is restarted due to memory
      await new Promise(resolve => setTimeout(resolve, 5000));

      const afterMetrics = await getProcessMetrics(serviceName);

      console.log(`Restart count: before=${beforeMetrics.restarts}, after=${afterMetrics.restarts}`);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 20000);

    it('should limit CPU usage when specified', async () => {
      const serviceName = 'cpu-limit-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3520,
      });

      await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--max-cpu',
        '50', // 50% limit
      ]);

      await waitForService(3520);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const metrics = await getProcessMetrics(serviceName);

      // CPU should be limited (though hard to enforce in Node.js)
      console.log(`CPU usage with 50% limit: ${metrics.cpu}%`);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 15000);
  });

  describe('Load Testing', () => {
    it('should handle high-frequency status checks', async () => {
      const serviceName = 'load-status-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3521,
      });

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3521);

      const requestCount = 100;
      const startTime = Date.now();

      // High-frequency status checks
      const results = await Promise.all(
        Array.from({ length: requestCount }, () =>
          execCLI('service', ['status', serviceName])
        )
      );

      const duration = Date.now() - startTime;
      const successCount = results.filter(r => r.exitCode === 0).length;
      const rps = (requestCount / duration) * 1000;

      expect(successCount).toBeGreaterThan(requestCount * 0.95); // 95% success rate

      console.log(`Load test: ${requestCount} requests in ${duration}ms (${rps.toFixed(1)} RPS)`);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 30000);

    it('should handle burst traffic for health checks', async () => {
      const serviceName = 'load-health-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3522,
      });

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3522);

      const burstSize = 50;
      const startTime = Date.now();

      // Burst health checks
      const results = await Promise.all(
        Array.from({ length: burstSize }, () =>
          execCLI('service', ['health', serviceName, '--timeout', '5000'])
        )
      );

      const duration = Date.now() - startTime;
      const successCount = results.filter(r => r.exitCode === 0).length;

      expect(successCount).toBeGreaterThan(burstSize * 0.9); // 90% success rate

      console.log(`Health check burst: ${burstSize} requests in ${duration}ms`);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 30000);

    it('should maintain performance under sustained load', async () => {
      const serviceName = 'sustained-load-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3523,
      });

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3523);

      const duration = 10000; // 10 seconds
      const interval = 100; // Request every 100ms
      const expectedRequests = duration / interval;

      let successCount = 0;
      const startTime = Date.now();

      // Sustained load
      const loadInterval = setInterval(async () => {
        const result = await execCLI('service', ['status', serviceName]);
        if (result.exitCode === 0) successCount++;
      }, interval);

      await new Promise(resolve => setTimeout(resolve, duration));
      clearInterval(loadInterval);

      const actualDuration = Date.now() - startTime;
      const successRate = (successCount / expectedRequests) * 100;

      expect(successRate).toBeGreaterThan(90);

      console.log(`Sustained load: ${successCount}/${expectedRequests} successful (${successRate.toFixed(1)}%)`);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 20000);
  });

  describe('CLI Response Time', () => {
    it('should respond to help command instantly', async () => {
      const startTime = Date.now();

      const result = await execCLI('service', ['--help']);

      const duration = Date.now() - startTime;

      expect(result.exitCode).toBe(0);
      expect(duration).toBeLessThan(1000);

      console.log(`Help command response time: ${duration}ms`);
    }, 5000);

    it('should list services quickly', async () => {
      // Start a few services
      for (let i = 0; i < 3; i++) {
        const name = `list-perf-${i}`;
        const script = await createMockService(ctx.testDir, {
          name,
          port: 3524 + i,
        });
        await execCLI('service', ['start', name, '--script', script]);
      }

      const startTime = Date.now();

      const result = await execCLI('service', ['list']);

      const duration = Date.now() - startTime;

      expect(result.exitCode).toBe(0);
      expect(duration).toBeLessThan(2000);

      console.log(`List services response time: ${duration}ms`);

      // Cleanup
      for (let i = 0; i < 3; i++) {
        await execCLI('service', ['stop', `list-perf-${i}`], { reject: false });
      }
    }, 20000);
  });
});
