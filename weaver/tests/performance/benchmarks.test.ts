/**
 * Performance Benchmark Suite
 *
 * Establishes performance baselines for all core Weaver systems.
 * Tests throughput, latency, memory usage, and sustained operation.
 *
 * @group performance
 * @group benchmarks
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createShadowCache } from '../../src/shadow-cache/index.js';
import { createWorkflowEngine } from '../../src/workflow-engine/index.js';
import { FileWatcher } from '../../src/file-watcher/index.js';
import { initializeActivityLogger } from '../../src/vault-logger/activity-logger.js';

const TEST_VAULT_PATH = join(__dirname, '..', '..', '.test-vault-perf');
const TEST_DB_PATH = join(TEST_VAULT_PATH, '.weaver', 'shadow-cache-perf.db');

// Performance targets
const TARGETS = {
  fileWatcherThroughput: 200, // events/second
  shadowCacheThroughput: 100, // files/second
  workflowLatencyP95: 100, // milliseconds
  mcpToolLatencyP95: 50, // milliseconds
  memoryGrowthPerHour: 10, // MB/hour
  avgCpuUsage: 25, // percent
};

describe('Phase 10: Performance Benchmarking', () => {
  let testVaultCleanup: (() => void) | null = null;

  beforeAll(() => {
    // Create test vault
    if (existsSync(TEST_VAULT_PATH)) {
      rmSync(TEST_VAULT_PATH, { recursive: true, force: true });
    }
    mkdirSync(TEST_VAULT_PATH, { recursive: true });
    mkdirSync(join(TEST_VAULT_PATH, '.weaver'), { recursive: true });

    testVaultCleanup = () => {
      if (existsSync(TEST_VAULT_PATH)) {
        rmSync(TEST_VAULT_PATH, { recursive: true, force: true });
      }
    };
  });

  afterAll(() => {
    testVaultCleanup?.();
  });

  describe('Task 2.1: File Watcher Throughput', () => {
    it('should process > 200 file events per second', async () => {
      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver'],
        debounceDelay: 50, // Reduced for benchmark
        enabled: true,
      });

      let eventsProcessed = 0;
      fileWatcher.on(() => {
        eventsProcessed++;
      });

      await fileWatcher.start();

      // Create 100 files rapidly
      const startTime = Date.now();
      const numFiles = 100;

      for (let i = 0; i < numFiles; i++) {
        writeFileSync(
          join(TEST_VAULT_PATH, `bench-file-${i}.md`),
          `# Benchmark File ${i}\n\nContent ${i}`
        );
      }

      // Wait for all events to be processed
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const duration = (Date.now() - startTime) / 1000; // seconds
      const throughput = eventsProcessed / duration;

      await fileWatcher.stop();

      console.log(`File Watcher Throughput: ${throughput.toFixed(2)} events/second`);
      expect(throughput).toBeGreaterThan(TARGETS.fileWatcherThroughput);
      expect(eventsProcessed).toBeGreaterThanOrEqual(numFiles);
    }, 30000); // 30 second timeout

    it('should handle high-frequency file changes', async () => {
      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver'],
        debounceDelay: 50,
        enabled: true,
      });

      let changeEventsProcessed = 0;
      fileWatcher.on((event) => {
        if (event.type === 'change') {
          changeEventsProcessed++;
        }
      });

      // Create test file
      const testFile = join(TEST_VAULT_PATH, 'rapid-change.md');
      writeFileSync(testFile, 'Initial content');

      await fileWatcher.start();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Rapidly modify file
      const startTime = Date.now();
      const numChanges = 50;

      for (let i = 0; i < numChanges; i++) {
        writeFileSync(testFile, `Updated content ${i}`);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      const duration = (Date.now() - startTime) / 1000;

      await fileWatcher.stop();

      console.log(`Change Events Processed: ${changeEventsProcessed} in ${duration.toFixed(2)}s`);
      expect(changeEventsProcessed).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Task 2.2: Shadow Cache Throughput', () => {
    it('should sync > 100 files per second', async () => {
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);

      // Create 500 test files
      const numFiles = 500;
      for (let i = 0; i < numFiles; i++) {
        writeFileSync(
          join(TEST_VAULT_PATH, `sync-bench-${i}.md`),
          `# Sync Benchmark ${i}\n\n## Section\n\nContent for file ${i}`
        );
      }

      // Benchmark sync operation
      const startTime = Date.now();
      await shadowCache.syncVault();
      const duration = (Date.now() - startTime) / 1000;

      const stats = shadowCache.getStats();
      const throughput = stats.totalFiles / duration;

      shadowCache.close();

      console.log(`Shadow Cache Sync: ${stats.totalFiles} files in ${duration.toFixed(3)}s`);
      console.log(`Throughput: ${throughput.toFixed(2)} files/second`);

      expect(throughput).toBeGreaterThan(TARGETS.shadowCacheThroughput);
      expect(stats.totalFiles).toBeGreaterThanOrEqual(numFiles);
    }, 60000);

    it('should handle incremental sync efficiently', async () => {
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);

      // Initial sync
      await shadowCache.syncVault();
      const initialStats = shadowCache.getStats();

      // Add 50 new files
      const numNewFiles = 50;
      for (let i = 0; i < numNewFiles; i++) {
        writeFileSync(
          join(TEST_VAULT_PATH, `incremental-${i}.md`),
          `# Incremental ${i}`
        );
      }

      // Benchmark incremental sync
      const startTime = Date.now();
      await shadowCache.syncVault();
      const duration = Date.now() - startTime;

      const finalStats = shadowCache.getStats();
      const newFiles = finalStats.totalFiles - initialStats.totalFiles;

      shadowCache.close();

      console.log(`Incremental Sync: ${newFiles} new files in ${duration}ms`);
      expect(duration).toBeLessThan(1000); // Should be very fast
      expect(newFiles).toBeGreaterThanOrEqual(numNewFiles);
    }, 30000);
  });

  describe('Task 2.3: Workflow Execution Latency', () => {
    it('should execute workflows with < 100ms p95 latency', async () => {
      const workflowEngine = createWorkflowEngine();
      await workflowEngine.start();

      const latencies: number[] = [];
      const numExecutions = 100;

      // Benchmark workflow execution
      for (let i = 0; i < numExecutions; i++) {
        const startTime = Date.now();

        await workflowEngine.triggerFileEvent({
          type: 'add',
          path: join(TEST_VAULT_PATH, `workflow-bench-${i}.md`),
          relativePath: `workflow-bench-${i}.md`,
        });

        const latency = Date.now() - startTime;
        latencies.push(latency);
      }

      await workflowEngine.stop();

      // Calculate p95 latency
      latencies.sort((a, b) => a - b);
      const p95Index = Math.floor(latencies.length * 0.95);
      const p95Latency = latencies[p95Index];
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

      console.log(`Workflow Latency - Avg: ${avgLatency.toFixed(2)}ms, P95: ${p95Latency}ms`);

      expect(p95Latency).toBeLessThan(TARGETS.workflowLatencyP95);
      expect(avgLatency).toBeLessThan(50); // Average should be even better
    }, 60000);

    it('should handle concurrent workflow executions', async () => {
      const workflowEngine = createWorkflowEngine();
      await workflowEngine.start();

      const startTime = Date.now();
      const numConcurrent = 20;

      // Execute multiple workflows concurrently
      await Promise.all(
        Array.from({ length: numConcurrent }, (_, i) =>
          workflowEngine.triggerFileEvent({
            type: 'add',
            path: join(TEST_VAULT_PATH, `concurrent-${i}.md`),
            relativePath: `concurrent-${i}.md`,
          })
        )
      );

      const duration = Date.now() - startTime;
      const avgLatency = duration / numConcurrent;

      await workflowEngine.stop();

      console.log(`Concurrent Workflows: ${numConcurrent} in ${duration}ms (avg ${avgLatency.toFixed(2)}ms)`);
      expect(avgLatency).toBeLessThan(100);
    }, 30000);
  });

  describe('Task 2.4: Service Initialization Performance', () => {
    it('should initialize all services quickly', async () => {
      const measurements: Record<string, number> = {};

      // Activity Logger
      let start = Date.now();
      const activityLogger = await initializeActivityLogger(TEST_VAULT_PATH);
      measurements.activityLogger = Date.now() - start;

      // Shadow Cache
      start = Date.now();
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);
      measurements.shadowCache = Date.now() - start;

      // Workflow Engine
      start = Date.now();
      const workflowEngine = createWorkflowEngine();
      await workflowEngine.start();
      measurements.workflowEngine = Date.now() - start;

      // File Watcher
      start = Date.now();
      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver'],
        debounceDelay: 1000,
        enabled: true,
      });
      measurements.fileWatcher = Date.now() - start;

      const totalInit = Object.values(measurements).reduce((a, b) => a + b, 0);

      console.log('Service Initialization Times:');
      Object.entries(measurements).forEach(([service, time]) => {
        console.log(`  ${service}: ${time}ms`);
      });
      console.log(`  Total: ${totalInit}ms`);

      // Cleanup
      await workflowEngine.stop();
      shadowCache.close();
      await activityLogger.shutdown();

      expect(totalInit).toBeLessThan(5000);
      expect(measurements.activityLogger).toBeLessThan(1000);
      expect(measurements.shadowCache).toBeLessThan(500);
      expect(measurements.workflowEngine).toBeLessThan(1000);
      expect(measurements.fileWatcher).toBeLessThan(500);
    });
  });

  describe('Task 2.5: Memory Usage Patterns', () => {
    it('should have stable memory usage', async () => {
      const activityLogger = await initializeActivityLogger(TEST_VAULT_PATH);
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);
      const workflowEngine = createWorkflowEngine();
      await workflowEngine.start();

      // Get initial memory
      const initialMemory = process.memoryUsage();

      // Simulate sustained operation (10 seconds)
      for (let i = 0; i < 100; i++) {
        // Create file
        writeFileSync(
          join(TEST_VAULT_PATH, `mem-test-${i}.md`),
          `# Memory Test ${i}\n\n${'Lorem ipsum '.repeat(100)}`
        );

        // Sync to shadow cache
        await shadowCache.syncVault();

        // Trigger workflow
        await workflowEngine.triggerFileEvent({
          type: 'add',
          path: join(TEST_VAULT_PATH, `mem-test-${i}.md`),
          relativePath: `mem-test-${i}.md`,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Get final memory
      const finalMemory = process.memoryUsage();

      // Calculate memory growth
      const heapGrowth = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024; // MB
      const projectedHourlyGrowth = (heapGrowth / 10) * 3600; // MB/hour

      console.log(`Memory Growth: ${heapGrowth.toFixed(2)}MB over 10s`);
      console.log(`Projected Hourly Growth: ${projectedHourlyGrowth.toFixed(2)}MB/hour`);
      console.log(`Heap Used: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);

      // Cleanup
      await workflowEngine.stop();
      shadowCache.close();
      await activityLogger.shutdown();

      expect(projectedHourlyGrowth).toBeLessThan(TARGETS.memoryGrowthPerHour);
    }, 30000);
  });

  describe('Task 2.6: Shutdown Performance', () => {
    it('should shutdown quickly and cleanly', async () => {
      const activityLogger = await initializeActivityLogger(TEST_VAULT_PATH);
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);
      const workflowEngine = createWorkflowEngine();
      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver'],
        debounceDelay: 1000,
        enabled: true,
      });

      await workflowEngine.start();
      await fileWatcher.start();

      // Benchmark shutdown
      const startTime = Date.now();

      await fileWatcher.stop();
      await workflowEngine.stop();
      shadowCache.close();
      await activityLogger.shutdown();

      const shutdownTime = Date.now() - startTime;

      console.log(`Shutdown Time: ${shutdownTime}ms`);
      expect(shutdownTime).toBeLessThan(2000);
    });
  });

  describe('Task 2.7: End-to-End Performance', () => {
    it('should handle complete file lifecycle efficiently', async () => {
      const activityLogger = await initializeActivityLogger(TEST_VAULT_PATH);
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);
      const workflowEngine = createWorkflowEngine();
      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver'],
        debounceDelay: 100,
        enabled: true,
      });

      await workflowEngine.start();

      let eventsProcessed = 0;
      fileWatcher.on(async (event) => {
        // Shadow cache sync
        if (event.type === 'add' || event.type === 'change') {
          await shadowCache.syncFile(event.path, event.relativePath);
        }

        // Workflow trigger
        await workflowEngine.triggerFileEvent(event);

        eventsProcessed++;
      });

      await fileWatcher.start();

      // Benchmark complete lifecycle
      const startTime = Date.now();
      const numFiles = 50;

      for (let i = 0; i < numFiles; i++) {
        writeFileSync(
          join(TEST_VAULT_PATH, `e2e-${i}.md`),
          `# End-to-End Test ${i}\n\nContent ${i}`
        );
      }

      // Wait for all events to be processed
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const duration = Date.now() - startTime;
      const avgLatency = duration / eventsProcessed;

      console.log(`End-to-End Performance:`);
      console.log(`  Files: ${numFiles}`);
      console.log(`  Events Processed: ${eventsProcessed}`);
      console.log(`  Total Time: ${duration}ms`);
      console.log(`  Avg Latency: ${avgLatency.toFixed(2)}ms`);

      // Cleanup
      await fileWatcher.stop();
      await workflowEngine.stop();
      shadowCache.close();
      await activityLogger.shutdown();

      expect(avgLatency).toBeLessThan(200); // Reasonable end-to-end latency
      expect(eventsProcessed).toBeGreaterThanOrEqual(numFiles);
    }, 60000);
  });
});
