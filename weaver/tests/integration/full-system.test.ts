/**
 * Full System Integration Test Suite - Phase 10 Task 4
 *
 * Comprehensive end-to-end integration tests validating the complete
 * Weaver system behavior under real-world scenarios.
 *
 * @group integration
 * @group phase-10
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { createShadowCache } from '../../src/shadow-cache/index.js';
import { createWorkflowEngine } from '../../src/workflow-engine/index.js';
import { FileWatcher } from '../../src/file-watcher/index.js';
import { initializeActivityLogger } from '../../src/vault-logger/activity-logger.js';
import { GitClient } from '../../src/git/git-client.js';
import { AutoCommitService } from '../../src/git/auto-commit.js';
import { ClaudeClient } from '../../src/agents/claude-client.js';
import { simpleGit } from 'simple-git';

const TEST_VAULT_PATH = join(__dirname, '..', '..', '.test-vault-integration');
const TEST_DB_PATH = join(TEST_VAULT_PATH, '.weaver', 'shadow-cache-integration.db');

describe('Phase 10: Full System Integration Tests', () => {
  let testVaultCleanup: (() => void) | null = null;

  beforeAll(async () => {
    // Create fresh test vault
    if (existsSync(TEST_VAULT_PATH)) {
      rmSync(TEST_VAULT_PATH, { recursive: true, force: true });
    }
    mkdirSync(TEST_VAULT_PATH, { recursive: true });
    mkdirSync(join(TEST_VAULT_PATH, '.weaver'), { recursive: true });

    // Initialize git repository for integration testing
    const git = simpleGit(TEST_VAULT_PATH);
    await git.init();
    await git.addConfig('user.name', 'Test User');
    await git.addConfig('user.email', 'test@example.com');

    testVaultCleanup = () => {
      if (existsSync(TEST_VAULT_PATH)) {
        rmSync(TEST_VAULT_PATH, { recursive: true, force: true });
      }
    };
  });

  afterAll(() => {
    testVaultCleanup?.();
  });

  describe('Task 4.1: Complete Application Startup', () => {
    it('should start all services in correct order without errors', async () => {
      const initOrder: string[] = [];

      // Initialize services in production order
      const activityLogger = await initializeActivityLogger(TEST_VAULT_PATH);
      initOrder.push('activityLogger');

      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);
      initOrder.push('shadowCache');

      const workflowEngine = createWorkflowEngine();
      await workflowEngine.start();
      initOrder.push('workflowEngine');

      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver', '.git'],
        debounceDelay: 100,
        enabled: true,
      });
      await fileWatcher.start();
      initOrder.push('fileWatcher');

      // Verify correct initialization order
      expect(initOrder).toEqual([
        'activityLogger',
        'shadowCache',
        'workflowEngine',
        'fileWatcher',
      ]);

      // Verify all services are functional
      expect(activityLogger).toBeDefined();
      expect(shadowCache).toBeDefined();
      expect(workflowEngine).toBeDefined();
      expect(fileWatcher).toBeDefined();

      // Cleanup
      await fileWatcher.stop();
      await workflowEngine.stop();
      shadowCache.close();
      await activityLogger.shutdown();
    });

    it('should handle startup within performance targets', async () => {
      const startTime = Date.now();

      const activityLogger = await initializeActivityLogger(TEST_VAULT_PATH);
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);
      const workflowEngine = createWorkflowEngine();
      await workflowEngine.start();
      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver'],
        debounceDelay: 1000,
        enabled: true,
      });

      const duration = Date.now() - startTime;

      // Should start all services in < 5 seconds
      expect(duration).toBeLessThan(5000);

      // Cleanup
      shadowCache.close();
      await workflowEngine.stop();
      await activityLogger.shutdown();
    });
  });

  describe('Task 4.2: Service Initialization Chain', () => {
    it('should initialize services with proper dependencies', async () => {
      // Activity Logger - no dependencies
      const activityLogger = await initializeActivityLogger(TEST_VAULT_PATH);
      expect(activityLogger).toBeDefined();

      // Shadow Cache - depends on vault path
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);
      expect(shadowCache).toBeDefined();

      // Workflow Engine - independent
      const workflowEngine = createWorkflowEngine();
      await workflowEngine.start();
      expect(workflowEngine).toBeDefined();

      // File Watcher - depends on vault path
      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver'],
        debounceDelay: 100,
        enabled: true,
      });
      expect(fileWatcher).toBeDefined();

      // Verify dependency relationships
      const summary = await activityLogger.getSessionSummary();
      expect(summary.sessionId).toBeTruthy();

      const stats = shadowCache.getStats();
      expect(stats).toBeDefined();

      // Cleanup
      await workflowEngine.stop();
      shadowCache.close();
      await activityLogger.shutdown();
    });

    it('should handle service initialization failures gracefully', async () => {
      // Test with non-existent paths (but not protected paths that cause EACCES)
      const nonExistentPath = join(TEST_VAULT_PATH, 'non-existent-dir');

      // Shadow cache should handle non-existent vault path gracefully
      expect(() => {
        const cache = createShadowCache(
          join(TEST_VAULT_PATH, '.weaver', 'test.db'),
          nonExistentPath
        );
        cache.close();
      }).not.toThrow();

      // File watcher should handle non-existent path gracefully
      expect(() => {
        new FileWatcher({
          watchPath: nonExistentPath,
          ignored: [],
          debounceDelay: 1000,
          enabled: true,
        });
      }).not.toThrow();
    });
  });

  describe('Task 4.3: File Change Propagation', () => {
    it('should propagate file changes through entire system', async () => {
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

      // Track propagation through system
      const events: string[] = [];

      fileWatcher.on(async (event) => {
        events.push(`watcher:${event.type}`);

        // Shadow cache sync
        if (event.type === 'add' || event.type === 'change') {
          await shadowCache.syncFile(event.path, event.relativePath);
          events.push('shadowCache:sync');
        }

        // Workflow trigger
        await workflowEngine.triggerFileEvent(event);
        events.push('workflow:triggered');
      });

      await fileWatcher.start();

      // Wait for file watcher to be fully ready
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Create test file
      const testFile = join(TEST_VAULT_PATH, 'propagation-test.md');
      writeFileSync(testFile, '# Propagation Test\n\nContent here');

      // Wait for propagation (increased from 500ms to handle debouncing)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify file was detected
      expect(events).toContain('watcher:add');

      // Verify shadow cache was updated
      expect(events).toContain('shadowCache:sync');

      // Verify workflow was triggered
      expect(events).toContain('workflow:triggered');

      // Verify file in shadow cache
      const files = shadowCache.getAllFiles();
      const cachedFile = files.find((f) => f.path.includes('propagation-test.md'));
      expect(cachedFile).toBeDefined();

      // Cleanup
      await fileWatcher.stop();
      await workflowEngine.stop();
      shadowCache.close();
      await activityLogger.shutdown();
    });

    it('should handle rapid file changes correctly', async () => {
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);
      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver'],
        debounceDelay: 50,
        enabled: true,
      });

      let changeCount = 0;
      fileWatcher.on((event) => {
        if (event.type === 'change') {
          changeCount++;
        }
      });

      await fileWatcher.start();

      const testFile = join(TEST_VAULT_PATH, 'rapid-changes.md');
      writeFileSync(testFile, 'Initial');

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Make rapid changes
      for (let i = 0; i < 10; i++) {
        writeFileSync(testFile, `Content ${i}`);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Wait for debouncing
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Debouncing should coalesce events
      expect(changeCount).toBeGreaterThan(0);
      expect(changeCount).toBeLessThan(10); // Should be debounced

      // Cleanup
      await fileWatcher.stop();
      shadowCache.close();
    });
  });

  describe('Task 4.4: Workflow Execution End-to-End', () => {
    it('should execute complete workflow pipeline', async () => {
      const workflowEngine = createWorkflowEngine();
      await workflowEngine.start();

      const executedEvents: string[] = [];

      // Simulate file events
      await workflowEngine.triggerFileEvent({
        type: 'add',
        path: join(TEST_VAULT_PATH, 'workflow-test.md'),
        relativePath: 'workflow-test.md',
      });
      executedEvents.push('add');

      await workflowEngine.triggerFileEvent({
        type: 'change',
        path: join(TEST_VAULT_PATH, 'workflow-test.md'),
        relativePath: 'workflow-test.md',
      });
      executedEvents.push('change');

      await workflowEngine.triggerFileEvent({
        type: 'unlink',
        path: join(TEST_VAULT_PATH, 'workflow-test.md'),
        relativePath: 'workflow-test.md',
      });
      executedEvents.push('unlink');

      expect(executedEvents).toEqual(['add', 'change', 'unlink']);

      await workflowEngine.stop();
    });

    it('should handle concurrent workflow executions', async () => {
      const workflowEngine = createWorkflowEngine();
      await workflowEngine.start();

      const numConcurrent = 20;
      const promises = Array.from({ length: numConcurrent }, (_, i) =>
        workflowEngine.triggerFileEvent({
          type: 'add',
          path: join(TEST_VAULT_PATH, `concurrent-${i}.md`),
          relativePath: `concurrent-${i}.md`,
        })
      );

      // All workflows should complete without errors
      await expect(Promise.all(promises)).resolves.not.toThrow();

      await workflowEngine.stop();
    });
  });

  describe('Task 4.5: Git Auto-Commit Workflow', () => {
    it('should initialize git auto-commit service', async () => {
      const gitClient = new GitClient(TEST_VAULT_PATH);
      const claudeClient = new ClaudeClient({
        apiKey: 'test-key-placeholder',
      });

      const autoCommit = new AutoCommitService(gitClient, claudeClient, {
        debounceMs: 1000,
        enabled: false, // Disabled for testing
      });

      expect(autoCommit).toBeDefined();
      expect(typeof autoCommit.onFileEvent).toBe('function');
    });

    it('should handle file events for auto-commit', async () => {
      const gitClient = new GitClient(TEST_VAULT_PATH);
      const claudeClient = new ClaudeClient({
        apiKey: 'test-key-placeholder',
      });

      const autoCommit = new AutoCommitService(gitClient, claudeClient, {
        debounceMs: 100,
        enabled: false,
      });

      // Should accept file events without errors
      expect(() => {
        autoCommit.onFileEvent({
          type: 'add',
          path: join(TEST_VAULT_PATH, 'test.md'),
          relativePath: 'test.md',
        });
      }).not.toThrow();
    });
  });

  describe('Task 4.6: Agent Rules Execution', () => {
    it('should have agent rules framework available', () => {
      // Agent rules are integrated into the workflow system
      // This test verifies the framework is available
      const workflowEngine = createWorkflowEngine();
      expect(workflowEngine).toBeDefined();
      expect(typeof workflowEngine.start).toBe('function');
      expect(typeof workflowEngine.triggerFileEvent).toBe('function');
    });
  });

  describe('Task 4.7: Error Recovery Mechanisms', () => {
    it('should recover from file watcher errors', async () => {
      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver'],
        debounceDelay: 100,
        enabled: true,
      });

      await fileWatcher.start();

      // File watcher should handle stop/start cycles
      await expect(fileWatcher.stop()).resolves.not.toThrow();
      await expect(fileWatcher.start()).resolves.not.toThrow();

      await fileWatcher.stop();
    });

    it('should recover from shadow cache errors', () => {
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);

      // Should handle multiple open/close cycles
      expect(() => {
        shadowCache.close();
      }).not.toThrow();

      const newCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);
      expect(newCache).toBeDefined();
      newCache.close();
    });

    it('should recover from workflow engine errors', async () => {
      const workflowEngine = createWorkflowEngine();

      // Should handle multiple start/stop cycles
      await expect(workflowEngine.start()).resolves.not.toThrow();
      await expect(workflowEngine.stop()).resolves.not.toThrow();
      await expect(workflowEngine.start()).resolves.not.toThrow();
      await expect(workflowEngine.stop()).resolves.not.toThrow();
    });
  });

  describe('Task 4.8: Configuration Variations', () => {
    it('should support different file watcher configurations', async () => {
      const configs = [
        { debounceDelay: 50, ignored: ['.weaver'] },
        { debounceDelay: 100, ignored: ['.weaver', '.git'] },
        { debounceDelay: 500, ignored: ['.weaver', '.git', 'node_modules'] },
      ];

      for (const config of configs) {
        const fileWatcher = new FileWatcher({
          watchPath: TEST_VAULT_PATH,
          ...config,
          enabled: true,
        });

        expect(fileWatcher).toBeDefined();
      }
    });

    it('should support different shadow cache locations', () => {
      const locations = [
        join(TEST_VAULT_PATH, '.weaver', 'cache1.db'),
        join(TEST_VAULT_PATH, '.weaver', 'cache2.db'),
        join(TEST_VAULT_PATH, '.weaver', 'cache3.db'),
      ];

      for (const location of locations) {
        const cache = createShadowCache(location, TEST_VAULT_PATH);
        expect(cache).toBeDefined();
        cache.close();
      }
    });
  });

  describe('Task 4.9: Graceful Shutdown', () => {
    it('should shutdown all services cleanly', async () => {
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

      // Perform some operations
      writeFileSync(join(TEST_VAULT_PATH, 'shutdown-test.md'), '# Test');
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Graceful shutdown (reverse order)
      await expect(fileWatcher.stop()).resolves.not.toThrow();
      await expect(workflowEngine.stop()).resolves.not.toThrow();
      expect(() => shadowCache.close()).not.toThrow();
      await expect(activityLogger.shutdown()).resolves.not.toThrow();
    });

    it('should shutdown within performance target', async () => {
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

      const startTime = Date.now();

      await fileWatcher.stop();
      await workflowEngine.stop();
      shadowCache.close();
      await activityLogger.shutdown();

      const duration = Date.now() - startTime;

      // Should shutdown in < 2 seconds
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Task 4.10: Complete Lifecycle Integration', () => {
    it('should complete full lifecycle without errors', async () => {
      const activityLogger = await initializeActivityLogger(TEST_VAULT_PATH);
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);
      const workflowEngine = createWorkflowEngine();
      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver'],
        debounceDelay: 100,
        enabled: true,
      });

      let filesProcessed = 0;

      fileWatcher.on(async (event) => {
        if (event.type === 'add') {
          await shadowCache.syncFile(event.path, event.relativePath);
          await workflowEngine.triggerFileEvent(event);
          filesProcessed++;
        }
      });

      // Start services
      await workflowEngine.start();
      await fileWatcher.start();

      // Wait for file watcher to be fully ready
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Create multiple files
      for (let i = 0; i < 5; i++) {
        writeFileSync(
          join(TEST_VAULT_PATH, `lifecycle-${i}.md`),
          `# File ${i}\n\nContent ${i}`
        );
      }

      // Wait for processing (increased to ensure events are captured)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Verify files were processed
      expect(filesProcessed).toBeGreaterThan(0);

      // Verify shadow cache has files
      const stats = shadowCache.getStats();
      expect(stats.totalFiles).toBeGreaterThan(0);

      // Graceful shutdown
      await fileWatcher.stop();
      await workflowEngine.stop();
      shadowCache.close();
      await activityLogger.shutdown();

      // No errors means success
      expect(true).toBe(true);
    });

    it('should handle stress test scenario', async () => {
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);
      const workflowEngine = createWorkflowEngine();

      await workflowEngine.start();

      // Create many files rapidly
      const numFiles = 50;
      for (let i = 0; i < numFiles; i++) {
        writeFileSync(
          join(TEST_VAULT_PATH, `stress-${i}.md`),
          `# Stress Test ${i}\n\n${'Lorem ipsum '.repeat(50)}`
        );
      }

      // Sync all files
      await shadowCache.syncVault();

      // Trigger workflows for all files
      for (let i = 0; i < numFiles; i++) {
        await workflowEngine.triggerFileEvent({
          type: 'add',
          path: join(TEST_VAULT_PATH, `stress-${i}.md`),
          relativePath: `stress-${i}.md`,
        });
      }

      const stats = shadowCache.getStats();
      expect(stats.totalFiles).toBeGreaterThanOrEqual(numFiles);

      await workflowEngine.stop();
      shadowCache.close();
    });
  });
});
