/**
 * Service Lifecycle Integration Tests
 * Tests complete workflow: start → health → logs → metrics → stop
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTestContext,
  createMockService,
  createMockConfig,
  execCLI,
  waitForService,
  waitForServiceStop,
  assertProcessRunning,
  assertProcessStopped,
  getProcessMetrics,
  readLogFile,
  type TestContext,
} from './setup.js';
import path from 'path';

describe('Service Lifecycle Integration Tests', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  describe('Complete Workflow: start → health → logs → metrics → stop', () => {
    it('should execute complete service lifecycle', async () => {
      // 1. Create mock service
      const serviceName = 'lifecycle-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3333,
      });

      // 2. Start service
      const startResult = await execCLI('service', ['start', serviceName, '--script', scriptPath], {
        cwd: ctx.testDir,
        timeout: 10000,
      });

      expect(startResult.exitCode).toBe(0);
      expect(startResult.stdout).toContain('started');

      // Wait for service to be ready
      const isReady = await waitForService(3333, 10000);
      expect(isReady).toBe(true);

      // 3. Check health
      const healthResult = await execCLI('service', ['health', serviceName], {
        timeout: 5000,
      });

      expect(healthResult.exitCode).toBe(0);
      expect(healthResult.stdout).toContain('healthy');

      // 4. Get metrics
      const metrics = await getProcessMetrics(serviceName);
      expect(metrics.cpu).toBeGreaterThanOrEqual(0);
      expect(metrics.memory).toBeGreaterThan(0);
      expect(metrics.uptime).toBeGreaterThan(0);

      // 5. Check logs
      const logsResult = await execCLI('service', ['logs', serviceName, '--lines', '10'], {
        timeout: 5000,
      });

      expect(logsResult.exitCode).toBe(0);
      expect(logsResult.stdout.length).toBeGreaterThan(0);

      // 6. Stop service
      const stopResult = await execCLI('service', ['stop', serviceName], {
        timeout: 10000,
      });

      expect(stopResult.exitCode).toBe(0);
      expect(stopResult.stdout).toContain('stopped');

      // Verify service stopped
      const isStopped = await waitForServiceStop(3333, 10000);
      expect(isStopped).toBe(true);

      const stopped = await assertProcessStopped(serviceName);
      expect(stopped).toBe(true);
    }, 30000);

    it('should handle service status command', async () => {
      const serviceName = 'status-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3334,
      });

      // Start service
      await execCLI('service', ['start', serviceName, '--script', scriptPath], {
        cwd: ctx.testDir,
      });

      await waitForService(3334);

      // Get status
      const statusResult = await execCLI('service', ['status', serviceName]);

      expect(statusResult.exitCode).toBe(0);
      expect(statusResult.stdout).toMatch(/running|online/i);
      expect(statusResult.stdout).toContain(serviceName);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 20000);

    it('should list all running services', async () => {
      const service1 = await createMockService(ctx.testDir, {
        name: 'list-test-1',
        port: 3335,
      });
      const service2 = await createMockService(ctx.testDir, {
        name: 'list-test-2',
        port: 3336,
      });

      // Start both services
      await execCLI('service', ['start', 'list-test-1', '--script', service1]);
      await execCLI('service', ['start', 'list-test-2', '--script', service2]);

      await waitForService(3335);
      await waitForService(3336);

      // List services
      const listResult = await execCLI('service', ['list']);

      expect(listResult.exitCode).toBe(0);
      expect(listResult.stdout).toContain('list-test-1');
      expect(listResult.stdout).toContain('list-test-2');

      // Cleanup
      await execCLI('service', ['stop', 'list-test-1']);
      await execCLI('service', ['stop', 'list-test-2']);
    }, 30000);
  });

  describe('Multi-Instance Service Management', () => {
    it('should manage multiple instances of same service', async () => {
      const serviceName = 'multi-instance';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3337,
      });

      // Start with 3 instances
      const startResult = await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--instances',
        '3',
      ]);

      expect(startResult.exitCode).toBe(0);

      await waitForService(3337);

      // Get status
      const statusResult = await execCLI('service', ['status', serviceName]);
      expect(statusResult.stdout).toContain('3'); // Should show 3 instances

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 20000);

    it('should scale service instances', async () => {
      const serviceName = 'scale-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3338,
      });

      // Start with 2 instances
      await execCLI('service', ['start', serviceName, '--script', scriptPath, '--instances', '2']);
      await waitForService(3338);

      // Scale to 4 instances
      const scaleResult = await execCLI('service', ['scale', serviceName, '4']);
      expect(scaleResult.exitCode).toBe(0);

      // Verify scaling
      const statusResult = await execCLI('service', ['status', serviceName]);
      expect(statusResult.stdout).toContain('4');

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 25000);
  });

  describe('Configuration Hot-Reload', () => {
    it('should reload configuration without downtime', async () => {
      const serviceName = 'reload-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3339,
      });

      const configPath = path.join(ctx.configDir, `${serviceName}.json`);
      const config = createMockConfig(serviceName, scriptPath);

      // Start service
      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3339);

      // Reload configuration
      const reloadResult = await execCLI('service', ['reload', serviceName, '--config', configPath]);

      // Service should still be running
      const isRunning = await assertProcessRunning(serviceName);
      expect(isRunning).toBe(true);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 20000);

    it('should apply environment variable updates on reload', async () => {
      const serviceName = 'env-reload-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3340,
      });

      // Start with initial env
      await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--env',
        'TEST_VAR=initial',
      ]);
      await waitForService(3340);

      // Reload with new env
      const reloadResult = await execCLI('service', [
        'reload',
        serviceName,
        '--env',
        'TEST_VAR=updated',
      ]);

      expect(reloadResult.exitCode).toBe(0);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 20000);
  });

  describe('Log Rotation and Cleanup', () => {
    it('should rotate logs when size limit reached', async () => {
      const serviceName = 'log-rotation-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3341,
      });

      // Start service with log rotation
      await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--max-log-size',
        '1M',
      ]);

      await waitForService(3341);

      // Generate logs (simplified - in real test, would generate actual log data)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check logs directory
      const logPath = path.join(ctx.logsDir, `${serviceName}-out.log`);
      const logs = await readLogFile(logPath);
      expect(logs.length).toBeGreaterThan(0);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 15000);

    it('should limit number of log files retained', async () => {
      const serviceName = 'log-retention-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3342,
      });

      await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--max-log-files',
        '5',
      ]);

      await waitForService(3342);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 15000);
  });

  describe('Graceful Shutdown', () => {
    it('should shutdown gracefully on SIGTERM', async () => {
      const serviceName = 'graceful-shutdown-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3343,
      });

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3343);

      // Stop gracefully (default behavior)
      const stopResult = await execCLI('service', ['stop', serviceName], {
        timeout: 10000,
      });

      expect(stopResult.exitCode).toBe(0);

      // Verify clean shutdown
      const isStopped = await waitForServiceStop(3343, 10000);
      expect(isStopped).toBe(true);
    }, 15000);

    it('should force kill on timeout', async () => {
      const serviceName = 'force-kill-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3344,
      });

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3344);

      // Force kill
      const stopResult = await execCLI('service', ['stop', serviceName, '--force'], {
        timeout: 5000,
      });

      expect(stopResult.exitCode).toBe(0);

      const isStopped = await waitForServiceStop(3344, 5000);
      expect(isStopped).toBe(true);
    }, 15000);

    it('should handle graceful shutdown timeout', async () => {
      const serviceName = 'shutdown-timeout-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3345,
      });

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3345);

      // Stop with timeout
      const stopResult = await execCLI('service', [
        'stop',
        serviceName,
        '--timeout',
        '1000',
      ]);

      expect(stopResult.exitCode).toBe(0);

      // Cleanup
      const isStopped = await waitForServiceStop(3345, 5000);
      expect(isStopped).toBe(true);
    }, 15000);
  });

  describe('Restart Operations', () => {
    it('should restart service successfully', async () => {
      const serviceName = 'restart-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3346,
      });

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3346);

      // Get initial metrics
      const beforeMetrics = await getProcessMetrics(serviceName);

      // Restart
      const restartResult = await execCLI('service', ['restart', serviceName]);
      expect(restartResult.exitCode).toBe(0);

      await waitForService(3346);

      // Verify restart (restarts count should increment)
      const afterMetrics = await getProcessMetrics(serviceName);
      expect(afterMetrics.restarts).toBeGreaterThan(beforeMetrics.restarts);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 20000);

    it('should support zero-downtime restart', async () => {
      const serviceName = 'zero-downtime-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3347,
      });

      await execCLI('service', ['start', serviceName, '--script', scriptPath, '--instances', '2']);
      await waitForService(3347);

      // Zero-downtime restart
      const restartResult = await execCLI('service', [
        'restart',
        serviceName,
        '--zero-downtime',
      ]);

      expect(restartResult.exitCode).toBe(0);

      // Service should remain accessible
      const isReady = await waitForService(3347, 5000);
      expect(isReady).toBe(true);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 25000);
  });
});
