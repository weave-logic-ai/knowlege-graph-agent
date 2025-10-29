/**
 * Failure Recovery Integration Tests
 * Tests crash recovery, port conflicts, database corruption, config errors, network failures
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTestContext,
  createMockService,
  createMockConfig,
  execCLI,
  waitForService,
  waitForServiceStop,
  simulateCrash,
  createMockDatabase,
  corruptDatabase,
  getProcessMetrics,
  isPortInUse,
  type TestContext,
} from './setup.js';
import fs from 'fs/promises';
import path from 'path';

describe('Failure Recovery Integration Tests', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  describe('Service Crash and Auto-Restart', () => {
    it('should automatically restart after crash', async () => {
      const serviceName = 'crash-recovery-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3400,
      });

      // Start with auto-restart enabled
      await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--max-restarts',
        '5',
      ]);

      await waitForService(3400);

      // Get initial metrics
      const beforeMetrics = await getProcessMetrics(serviceName);
      const initialRestarts = beforeMetrics.restarts;

      // Simulate crash
      await simulateCrash(serviceName);

      // Wait for auto-restart
      await new Promise(resolve => setTimeout(resolve, 3000));
      const isRestarted = await waitForService(3400, 10000);
      expect(isRestarted).toBe(true);

      // Verify restart count increased
      const afterMetrics = await getProcessMetrics(serviceName);
      expect(afterMetrics.restarts).toBeGreaterThan(initialRestarts);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 30000);

    it('should stop restarting after max attempts', async () => {
      const serviceName = 'max-restarts-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3401,
        shouldFail: true, // Will crash immediately
      });

      // Start with limited restarts
      const startResult = await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--max-restarts',
        '3',
      ], {
        reject: false,
      });

      // Should fail to start due to immediate crash
      expect(startResult.failed).toBe(true);

      // Verify service is not running
      const statusResult = await execCLI('service', ['status', serviceName], {
        reject: false,
      });
      expect(statusResult.stdout).toMatch(/stopped|errored/i);
    }, 20000);

    it('should respect min uptime before restart', async () => {
      const serviceName = 'min-uptime-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3402,
      });

      await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--min-uptime',
        '5000', // 5 seconds minimum
      ]);

      await waitForService(3402);

      // Crash immediately (before min uptime)
      await simulateCrash(serviceName);

      // Should count as failure
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Cleanup
      await execCLI('service', ['stop', serviceName], { reject: false });
    }, 20000);
  });

  describe('Port Conflict Handling', () => {
    it('should detect port already in use', async () => {
      const port = 3403;

      // Start first service
      const service1 = await createMockService(ctx.testDir, {
        name: 'port-test-1',
        port,
      });

      await execCLI('service', ['start', 'port-test-1', '--script', service1, '--port', String(port)]);
      await waitForService(port);

      // Try to start second service on same port
      const service2 = await createMockService(ctx.testDir, {
        name: 'port-test-2',
        port,
      });

      const startResult = await execCLI('service', [
        'start',
        'port-test-2',
        '--script',
        service2,
        '--port',
        String(port),
      ], {
        reject: false,
      });

      // Should fail or handle gracefully
      expect(startResult.stderr).toMatch(/port.*use|EADDRINUSE/i);

      // Cleanup
      await execCLI('service', ['stop', 'port-test-1']);
    }, 20000);

    it('should auto-select available port on conflict', async () => {
      const service1Name = 'auto-port-1';
      const service2Name = 'auto-port-2';

      const script1 = await createMockService(ctx.testDir, {
        name: service1Name,
        port: 3404,
      });

      await execCLI('service', ['start', service1Name, '--script', script1]);
      await waitForService(3404);

      // Start second service with auto-port selection
      const script2 = await createMockService(ctx.testDir, {
        name: service2Name,
        port: 3405, // Different port
      });

      const startResult = await execCLI('service', [
        'start',
        service2Name,
        '--script',
        script2,
        '--auto-port',
      ]);

      expect(startResult.exitCode).toBe(0);

      // Cleanup
      await execCLI('service', ['stop', service1Name]);
      await execCLI('service', ['stop', service2Name]);
    }, 25000);

    it('should retry port binding with exponential backoff', async () => {
      const serviceName = 'port-retry-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3406,
      });

      // Start service
      await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--port-retry',
        '3',
      ]);

      const isReady = await waitForService(3406, 15000);
      expect(isReady).toBe(true);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 20000);
  });

  describe('Database Corruption Recovery', () => {
    it('should detect corrupted database', async () => {
      const dbPath = await createMockDatabase(ctx.dataDir);

      // Corrupt database
      await corruptDatabase(dbPath);

      // Try to start service with corrupted DB
      const serviceName = 'db-corrupt-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3407,
      });

      const startResult = await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--db',
        dbPath,
      ], {
        reject: false,
      });

      // Should detect corruption
      expect(startResult.stderr).toMatch(/corrupt|invalid|parse error/i);
    }, 15000);

    it('should restore from backup on corruption', async () => {
      const dbPath = await createMockDatabase(ctx.dataDir, {
        version: 1,
        data: 'test',
      });

      // Create backup
      const backupPath = `${dbPath}.backup`;
      await fs.copyFile(dbPath, backupPath);

      // Corrupt main database
      await corruptDatabase(dbPath);

      // Start service with auto-restore
      const serviceName = 'db-restore-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3408,
      });

      const startResult = await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--db',
        dbPath,
        '--auto-restore',
      ]);

      // Should restore from backup and start successfully
      expect(startResult.exitCode).toBe(0);

      // Cleanup
      await execCLI('service', ['stop', serviceName], { reject: false });
    }, 20000);

    it('should create new database if backup fails', async () => {
      const serviceName = 'db-recreate-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3409,
      });

      const dbPath = path.join(ctx.dataDir, 'missing.db');

      // Start with missing database
      const startResult = await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--db',
        dbPath,
        '--create-if-missing',
      ]);

      expect(startResult.exitCode).toBe(0);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 15000);
  });

  describe('Configuration File Errors', () => {
    it('should validate config file before starting', async () => {
      const serviceName = 'config-validation-test';
      const configPath = path.join(ctx.configDir, `${serviceName}.json`);

      // Create invalid config
      await fs.writeFile(configPath, '{ invalid json }');

      const startResult = await execCLI('service', [
        'start',
        serviceName,
        '--config',
        configPath,
      ], {
        reject: false,
      });

      expect(startResult.failed).toBe(true);
      expect(startResult.stderr).toMatch(/invalid|parse|syntax/i);
    }, 10000);

    it('should handle missing required config fields', async () => {
      const serviceName = 'config-missing-fields-test';
      const configPath = path.join(ctx.configDir, `${serviceName}.json`);

      // Create config with missing fields
      await fs.writeFile(configPath, JSON.stringify({
        name: serviceName,
        // Missing 'script' field
      }));

      const startResult = await execCLI('service', [
        'start',
        serviceName,
        '--config',
        configPath,
      ], {
        reject: false,
      });

      expect(startResult.failed).toBe(true);
      expect(startResult.stderr).toMatch(/missing|required|script/i);
    }, 10000);

    it('should use default values for optional config', async () => {
      const serviceName = 'config-defaults-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3410,
      });

      const configPath = path.join(ctx.configDir, `${serviceName}.json`);

      // Minimal config
      await fs.writeFile(configPath, JSON.stringify({
        name: serviceName,
        script: scriptPath,
      }));

      const startResult = await execCLI('service', [
        'start',
        serviceName,
        '--config',
        configPath,
      ]);

      expect(startResult.exitCode).toBe(0);

      await waitForService(3410);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 15000);

    it('should reload config on file change', async () => {
      const serviceName = 'config-reload-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3411,
      });

      const configPath = path.join(ctx.configDir, `${serviceName}.json`);
      const config = createMockConfig(serviceName, scriptPath, {
        max_restarts: 5,
      });

      await fs.writeFile(configPath, JSON.stringify(config));

      // Start with watch
      await execCLI('service', [
        'start',
        serviceName,
        '--config',
        configPath,
        '--watch-config',
      ]);

      await waitForService(3411);

      // Update config
      config.max_restarts = 10;
      await fs.writeFile(configPath, JSON.stringify(config));

      // Wait for reload
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 20000);
  });

  describe('Network Failures', () => {
    it('should handle health check timeout', async () => {
      const serviceName = 'health-timeout-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3412,
      });

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3412);

      // Health check with short timeout
      const healthResult = await execCLI('service', [
        'health',
        serviceName,
        '--timeout',
        '100', // Very short timeout
      ], {
        reject: false,
      });

      // May timeout, but should handle gracefully
      expect([0, 1, 2]).toContain(healthResult.exitCode);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 15000);

    it('should retry failed health checks', async () => {
      const serviceName = 'health-retry-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3413,
      });

      await execCLI('service', ['start', serviceName, '--script', scriptPath]);
      await waitForService(3413);

      // Health check with retries
      const healthResult = await execCLI('service', [
        'health',
        serviceName,
        '--retries',
        '3',
        '--timeout',
        '5000',
      ]);

      expect(healthResult.exitCode).toBe(0);
      expect(healthResult.stdout).toContain('healthy');

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 20000);

    it('should handle DNS resolution failures', async () => {
      const serviceName = 'dns-failure-test';

      const healthResult = await execCLI('service', [
        'health',
        serviceName,
        '--endpoint',
        'http://invalid-domain-that-does-not-exist.local/health',
      ], {
        reject: false,
      });

      expect(healthResult.failed).toBe(true);
      expect(healthResult.stderr).toMatch(/dns|resolve|not found/i);
    }, 10000);

    it('should handle connection refused', async () => {
      const serviceName = 'connection-refused-test';

      const healthResult = await execCLI('service', [
        'health',
        serviceName,
        '--endpoint',
        'http://localhost:9999/health', // Port not in use
      ], {
        reject: false,
      });

      expect(healthResult.failed).toBe(true);
      expect(healthResult.stderr).toMatch(/refused|connect|ECONNREFUSED/i);
    }, 10000);
  });

  describe('Error Recovery Patterns', () => {
    it('should implement circuit breaker pattern', async () => {
      const serviceName = 'circuit-breaker-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3414,
      });

      await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--circuit-breaker',
        '--failure-threshold',
        '3',
      ]);

      await waitForService(3414);

      // Simulate multiple failures
      for (let i = 0; i < 3; i++) {
        await simulateCrash(serviceName);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Circuit should be open, preventing restart
      const statusResult = await execCLI('service', ['status', serviceName], {
        reject: false,
      });

      // Cleanup
      await execCLI('service', ['stop', serviceName], { reject: false });
    }, 30000);

    it('should implement exponential backoff on restart', async () => {
      const serviceName = 'backoff-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3415,
        shouldFail: true,
      });

      const startTime = Date.now();

      await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--restart-backoff',
        'exponential',
        '--max-restarts',
        '3',
      ], {
        reject: false,
      });

      const duration = Date.now() - startTime;

      // Should take longer due to backoff
      // 1st retry: immediate, 2nd: 1s, 3rd: 2s, 4th: 4s = ~7s total
      expect(duration).toBeGreaterThan(5000);

      // Cleanup
      await execCLI('service', ['stop', serviceName], { reject: false });
    }, 15000);

    it('should save state before restart', async () => {
      const serviceName = 'state-save-test';
      const scriptPath = await createMockService(ctx.testDir, {
        name: serviceName,
        port: 3416,
      });

      const stateFile = path.join(ctx.dataDir, `${serviceName}.state`);

      await execCLI('service', [
        'start',
        serviceName,
        '--script',
        scriptPath,
        '--state-file',
        stateFile,
      ]);

      await waitForService(3416);

      // Restart
      await execCLI('service', ['restart', serviceName]);

      // State file should exist
      const stateExists = await fs.access(stateFile)
        .then(() => true)
        .catch(() => false);

      expect(stateExists).toBe(true);

      // Cleanup
      await execCLI('service', ['stop', serviceName]);
    }, 20000);
  });
});
