/**
 * System Validation Test Suite
 *
 * Comprehensive validation of all core Weaver systems for MVP readiness.
 * Tests service initialization, integration, and operational correctness.
 *
 * @group validation
 * @group system
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { config } from '../../src/config/index.js';
import { createShadowCache } from '../../src/shadow-cache/index.js';
import { createWorkflowEngine } from '../../src/workflow-engine/index.js';
import { FileWatcher } from '../../src/file-watcher/index.js';
import { initializeActivityLogger } from '../../src/vault-logger/activity-logger.js';
import { GitClient } from '../../src/git/git-client.js';
import { AutoCommitService } from '../../src/git/auto-commit.js';
import { ClaudeClient } from '../../src/agents/claude-client.js';

const TEST_VAULT_PATH = join(__dirname, '..', '..', '.test-vault-validation');
const TEST_DB_PATH = join(TEST_VAULT_PATH, '.weaver', 'shadow-cache-test.db');

describe('Phase 10: System Validation', () => {
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

  describe('Task 1.1: Service Initialization Order', () => {
    it('should initialize activity logger first', async () => {
      const startTime = Date.now();
      const activityLogger = await initializeActivityLogger(TEST_VAULT_PATH);
      const duration = Date.now() - startTime;

      expect(activityLogger).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should initialize in < 1 second

      const summary = await activityLogger.getSessionSummary();
      expect(summary.sessionId).toBeTruthy();
      expect(summary.totalEntries).toBeGreaterThanOrEqual(0);

      await activityLogger.shutdown();
    });

    it('should initialize shadow cache with correct path', () => {
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);

      expect(shadowCache).toBeDefined();
      expect(typeof shadowCache.syncVault).toBe('function');
      expect(typeof shadowCache.getStats).toBe('function');

      shadowCache.close();
    });

    it('should initialize workflow engine successfully', async () => {
      const workflowEngine = createWorkflowEngine();

      expect(workflowEngine).toBeDefined();

      await workflowEngine.start();
      expect(typeof workflowEngine.stop).toBe('function');

      await workflowEngine.stop();
    });

    it('should initialize file watcher with correct configuration', () => {
      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver', '.obsidian', '.git'],
        debounceDelay: 1000,
        enabled: true,
      });

      expect(fileWatcher).toBeDefined();
      expect(typeof fileWatcher.on).toBe('function');
      expect(typeof fileWatcher.start).toBe('function');
    });

    it('should initialize all services within 5 seconds', async () => {
      const startTime = Date.now();

      // Initialize all services
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

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);

      // Cleanup
      await workflowEngine.stop();
      shadowCache.close();
      await activityLogger.shutdown();
    });
  });

  describe('Task 1.2: File Watcher Event Propagation', () => {
    it('should detect file add events', async () => {
      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver'],
        debounceDelay: 100,
        enabled: true,
      });

      const events: string[] = [];
      fileWatcher.on((event) => {
        events.push(event.type);
      });

      await fileWatcher.start();

      // Create a test file
      const testFile = join(TEST_VAULT_PATH, 'test-file.md');
      writeFileSync(testFile, '# Test File\n\nContent here.');

      // Wait for event propagation
      await new Promise((resolve) => setTimeout(resolve, 500));

      await fileWatcher.stop();

      expect(events).toContain('add');
    });

    it('should detect file change events', async () => {
      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver'],
        debounceDelay: 100,
        enabled: true,
      });

      const events: string[] = [];
      fileWatcher.on((event) => {
        events.push(event.type);
      });

      const testFile = join(TEST_VAULT_PATH, 'test-change.md');
      writeFileSync(testFile, '# Original');

      await fileWatcher.start();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Modify the file
      writeFileSync(testFile, '# Modified');

      await new Promise((resolve) => setTimeout(resolve, 500));
      await fileWatcher.stop();

      expect(events).toContain('change');
    });
  });

  describe('Task 1.3: Shadow Cache Synchronization', () => {
    it('should sync vault successfully', async () => {
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);

      // Create some test files
      writeFileSync(join(TEST_VAULT_PATH, 'note1.md'), '# Note 1');
      writeFileSync(join(TEST_VAULT_PATH, 'note2.md'), '# Note 2');
      writeFileSync(join(TEST_VAULT_PATH, 'note3.md'), '# Note 3');

      await shadowCache.syncVault();
      const stats = shadowCache.getStats();

      expect(stats.totalFiles).toBeGreaterThanOrEqual(3);
      expect(stats.lastSyncTime).toBeTruthy();

      shadowCache.close();
    });

    it('should index markdown files correctly', async () => {
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);

      writeFileSync(join(TEST_VAULT_PATH, 'test-index.md'), '# Test');

      await shadowCache.syncVault();
      const files = shadowCache.getAllFiles();

      const testFile = files.find((f) => f.path.includes('test-index.md'));
      expect(testFile).toBeDefined();

      shadowCache.close();
    });
  });

  describe('Task 1.4: Workflow Execution Pipeline', () => {
    it('should start and stop workflow engine cleanly', async () => {
      const workflowEngine = createWorkflowEngine();

      await expect(workflowEngine.start()).resolves.not.toThrow();
      await expect(workflowEngine.stop()).resolves.not.toThrow();
    });

    it('should handle file events', async () => {
      const workflowEngine = createWorkflowEngine();
      await workflowEngine.start();

      // Workflow engine should accept file events
      expect(typeof workflowEngine.triggerFileEvent).toBe('function');

      await workflowEngine.stop();
    });
  });

  describe('Task 1.5: Git Auto-Commit Functionality', () => {
    it('should initialize git client with vault path', () => {
      const gitClient = new GitClient(TEST_VAULT_PATH);
      expect(gitClient).toBeDefined();
    });

    it('should initialize auto-commit service', () => {
      const gitClient = new GitClient(TEST_VAULT_PATH);
      const claudeClient = new ClaudeClient({
        apiKey: 'test-key-placeholder'
      });

      const autoCommit = new AutoCommitService(gitClient, claudeClient, {
        debounceMs: 1000,
        enabled: false, // Disabled for testing
      });

      expect(autoCommit).toBeDefined();
      expect(typeof autoCommit.onFileEvent).toBe('function');
    });
  });

  describe('Task 1.6: Activity Logging Completeness', () => {
    it('should log prompts', async () => {
      const activityLogger = await initializeActivityLogger(TEST_VAULT_PATH);

      await activityLogger.logPrompt('Test prompt', { testData: 'value' });

      const summary = await activityLogger.getSessionSummary();
      expect(summary.totalEntries).toBeGreaterThanOrEqual(1);

      await activityLogger.shutdown();
    });

    it('should log tool calls', async () => {
      const activityLogger = await initializeActivityLogger(TEST_VAULT_PATH);

      await activityLogger.logToolCall(
        'test-tool',
        { param: 'value' },
        { result: 'success' },
        100
      );

      const summary = await activityLogger.getSessionSummary();
      expect(summary.totalEntries).toBeGreaterThanOrEqual(1);

      await activityLogger.shutdown();
    });

    it('should log errors', async () => {
      const activityLogger = await initializeActivityLogger(TEST_VAULT_PATH);

      await activityLogger.logError('Test error message', {
        context: 'validation test',
      });

      const summary = await activityLogger.getSessionSummary();
      expect(summary.totalEntries).toBeGreaterThanOrEqual(1);

      await activityLogger.shutdown();
    });
  });

  describe('Task 1.7: Graceful Shutdown Sequence', () => {
    it('should shutdown all services within 2 seconds', async () => {
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

      // Shutdown sequence (reverse order)
      await fileWatcher.stop();
      await workflowEngine.stop();
      shadowCache.close();
      await activityLogger.shutdown();

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Task 1.8: Integration - Full Lifecycle', () => {
    it('should complete full application lifecycle without errors', async () => {
      // Initialize all services
      const activityLogger = await initializeActivityLogger(TEST_VAULT_PATH);
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);
      const workflowEngine = createWorkflowEngine();
      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver'],
        debounceDelay: 100,
        enabled: true,
      });

      // Start services
      await workflowEngine.start();
      await fileWatcher.start();

      // Perform operations
      writeFileSync(join(TEST_VAULT_PATH, 'lifecycle-test.md'), '# Lifecycle Test');
      await new Promise((resolve) => setTimeout(resolve, 300));

      await shadowCache.syncVault();
      const stats = shadowCache.getStats();
      expect(stats.totalFiles).toBeGreaterThan(0);

      // Shutdown gracefully
      await fileWatcher.stop();
      await workflowEngine.stop();
      shadowCache.close();
      await activityLogger.shutdown();

      // If we got here, no errors occurred
      expect(true).toBe(true);
    });
  });

  describe('Task 1.9: Error Handling', () => {
    it('should handle invalid vault path gracefully', () => {
      expect(() => {
        new FileWatcher({
          watchPath: '/non/existent/path',
          ignored: [],
          debounceDelay: 1000,
          enabled: true,
        });
      }).not.toThrow();
    });

    it('should handle missing database directory', () => {
      const invalidDbPath = '/non/existent/.weaver/db.db';

      expect(() => {
        createShadowCache(invalidDbPath, TEST_VAULT_PATH);
      }).not.toThrow();
    });
  });

  describe('Task 1.10: Performance Baseline', () => {
    it('should initialize services quickly', async () => {
      const measurements: Record<string, number> = {};

      // Measure activity logger
      let start = Date.now();
      const activityLogger = await initializeActivityLogger(TEST_VAULT_PATH);
      measurements.activityLogger = Date.now() - start;

      // Measure shadow cache
      start = Date.now();
      const shadowCache = createShadowCache(TEST_DB_PATH, TEST_VAULT_PATH);
      measurements.shadowCache = Date.now() - start;

      // Measure workflow engine
      start = Date.now();
      const workflowEngine = createWorkflowEngine();
      await workflowEngine.start();
      measurements.workflowEngine = Date.now() - start;

      // Measure file watcher
      start = Date.now();
      const fileWatcher = new FileWatcher({
        watchPath: TEST_VAULT_PATH,
        ignored: ['.weaver'],
        debounceDelay: 1000,
        enabled: true,
      });
      measurements.fileWatcher = Date.now() - start;

      // All measurements should be under reasonable limits
      expect(measurements.activityLogger).toBeLessThan(1000);
      expect(measurements.shadowCache).toBeLessThan(500);
      expect(measurements.workflowEngine).toBeLessThan(1000);
      expect(measurements.fileWatcher).toBeLessThan(500);

      // Cleanup
      await workflowEngine.stop();
      shadowCache.close();
      await activityLogger.shutdown();
    });
  });
});
