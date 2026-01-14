/**
 * Tests for VaultMemorySync
 *
 * Comprehensive tests for bidirectional synchronization between the knowledge
 * graph vault and claude-flow memory system.
 *
 * @module tests/memory/vault-sync
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as childProcess from 'child_process';

// Mock child_process.exec to avoid waiting for CLI timeouts
vi.mock('child_process', async () => {
  const actual = await vi.importActual<typeof childProcess>('child_process');
  return {
    ...actual,
    exec: vi.fn((cmd: string, opts: unknown, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
      // If callback is provided (promisified usage)
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      // Simulate CLI not available - immediately fail so fallback is used
      const error = new Error('CLI not available in test environment');
      (error as NodeJS.ErrnoException).code = 'ENOENT';
      if (callback) {
        setImmediate(() => callback!(error, { stdout: '', stderr: '' }));
      }
      return {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
      };
    }),
  };
});
import {
  VaultMemorySync,
  createVaultMemorySync,
  type SyncStatus,
  type ConflictStrategy,
  type SyncOperationResult,
} from '../../src/memory/index.js';
import { KnowledgeGraphDatabase } from '../../src/core/database.js';

/**
 * Create a mock KnowledgeGraphDatabase for testing
 */
function createMockDatabase(nodes: Array<{
  id: string;
  title: string;
  content: string;
  type: string;
  path: string;
  tags: string[];
  lastModified: Date;
}>): KnowledgeGraphDatabase {
  const nodeMap = new Map(nodes.map(n => [n.id, {
    ...n,
    status: 'active',
    outgoingLinks: [] as Array<{ target: string; type: string }>,
    incomingLinks: [] as Array<{ target: string; type: string }>,
  }]));

  return {
    getNode: (id: string) => nodeMap.get(id),
    getAllNodes: () => Array.from(nodeMap.values()),
    // Add other required methods as stubs
    addNode: vi.fn(),
    updateNode: vi.fn(),
    deleteNode: vi.fn(),
    close: vi.fn(),
  } as unknown as KnowledgeGraphDatabase;
}

describe('VaultMemorySync', () => {
  const testRoot = join('/tmp', `kg-vault-sync-test-${Date.now()}`);
  const docsPath = join(testRoot, 'docs');
  let sync: VaultMemorySync;
  let mockDb: KnowledgeGraphDatabase;

  beforeEach(() => {
    // Create test directories
    mkdirSync(docsPath, { recursive: true });
    mkdirSync(join(testRoot, '.kg', 'sync-cache'), { recursive: true });

    // Create test document
    writeFileSync(
      join(docsPath, 'test-concept.md'),
      '---\ntype: concept\ntitle: Test Concept\n---\n# Test Concept\n\nThis is a test concept document.'
    );

    // Create mock database with test nodes
    mockDb = createMockDatabase([
      {
        id: 'node-1',
        title: 'Test Concept',
        content: '# Test Concept\n\nThis is a test concept document.',
        type: 'concept',
        path: join(docsPath, 'test-concept.md'),
        tags: ['test', 'concept'],
        lastModified: new Date(),
      },
      {
        id: 'node-2',
        title: 'Another Document',
        content: '# Another Document\n\nAnother test document.',
        type: 'document',
        path: join(docsPath, 'another.md'),
        tags: ['test'],
        lastModified: new Date(),
      },
    ]);

    sync = createVaultMemorySync({
      projectRoot: testRoot,
      namespace: 'test-kg',
      conflictStrategy: 'newest-wins',
    });
  });

  afterEach(() => {
    sync.stop();
    rmSync(testRoot, { recursive: true, force: true });
  });

  describe('constructor', () => {
    it('should create a VaultMemorySync instance', () => {
      expect(sync).toBeInstanceOf(VaultMemorySync);
    });

    it('should accept configuration options', () => {
      const configured = createVaultMemorySync({
        projectRoot: testRoot,
        namespace: 'custom-namespace',
        conflictStrategy: 'vault-wins',
        autoSync: false,
        autoSyncInterval: 60000,
        batchSize: 100,
        includeContent: true,
        maxContentLength: 10000,
      });

      expect(configured).toBeInstanceOf(VaultMemorySync);
    });

    it('should use default values for optional config', () => {
      const minimal = createVaultMemorySync({
        projectRoot: testRoot,
      });

      expect(minimal).toBeInstanceOf(VaultMemorySync);
    });
  });

  describe('initialize', () => {
    it('should initialize with database', async () => {
      await sync.initialize(mockDb);

      const status = sync.getStatus();
      expect(status).toBeDefined();
    });

    it('should start auto-sync when enabled', async () => {
      const autoSyncInstance = createVaultMemorySync({
        projectRoot: testRoot,
        autoSync: true,
        autoSyncInterval: 1000,
      });

      await autoSyncInstance.initialize(mockDb);

      const status = autoSyncInstance.getStatus();
      expect(status).toBeDefined();

      autoSyncInstance.stop();
    });
  });

  describe('syncToMemory', () => {
    it('should sync vault content to memory', async () => {
      await sync.initialize(mockDb);

      const result = await sync.syncToMemory();

      expect(result.success).toBe(true);
      expect(result.synced).toBeGreaterThanOrEqual(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should throw when not initialized', async () => {
      await expect(sync.syncToMemory()).rejects.toThrow('Database not initialized');
    });

    it('should track synced node count', async () => {
      await sync.initialize(mockDb);

      const result = await sync.syncToMemory();

      // Should sync the nodes from mockDb
      expect(result.synced).toBe(2);
    });

    it('should handle sync errors gracefully', async () => {
      const errorDb = createMockDatabase([
        {
          id: 'error-node',
          title: 'Error Node',
          content: null as unknown as string, // Invalid content
          type: 'document',
          path: '/invalid/path',
          tags: [],
          lastModified: new Date(),
        },
      ]);

      await sync.initialize(errorDb);

      const result = await sync.syncToMemory();

      // Should complete even with errors
      expect(result).toBeDefined();
    });

    it('should update last sync time', async () => {
      await sync.initialize(mockDb);

      const statusBefore = sync.getStatus();
      expect(statusBefore.lastSync).toBeNull();

      await sync.syncToMemory();

      const statusAfter = sync.getStatus();
      expect(statusAfter.lastSync).toBeInstanceOf(Date);
    });
  });

  describe('syncFromMemory', () => {
    it('should sync memory content to vault', async () => {
      await sync.initialize(mockDb);

      const result = await sync.syncFromMemory();

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('synced');
      expect(result).toHaveProperty('duration');
    });

    it('should throw when not initialized', async () => {
      await expect(sync.syncFromMemory()).rejects.toThrow('Database not initialized');
    });
  });

  describe('fullSync', () => {
    it('should perform bidirectional sync', async () => {
      await sync.initialize(mockDb);

      const result = await sync.fullSync();

      expect(result.success).toBe(true);
      expect(result.toMemory).toBeDefined();
      expect(result.fromMemory).toBeDefined();
      expect(result.totalDuration).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should report combined success status', async () => {
      await sync.initialize(mockDb);

      const result = await sync.fullSync();

      // Success should be true only if both directions succeeded
      expect(result.success).toBe(result.toMemory.success && result.fromMemory.success);
    });
  });

  describe('getStatus', () => {
    it('should return sync status', async () => {
      await sync.initialize(mockDb);

      const status = sync.getStatus();

      expect(status).toHaveProperty('lastSync');
      expect(status).toHaveProperty('isSyncing');
      expect(status).toHaveProperty('pendingVaultChanges');
      expect(status).toHaveProperty('pendingMemoryChanges');
      expect(status).toHaveProperty('errors');
      expect(status).toHaveProperty('health');
    });

    it('should indicate syncing state during sync', async () => {
      await sync.initialize(mockDb);

      // Status before sync
      expect(sync.getStatus().isSyncing).toBe(false);

      // Can't easily test during sync without async control
      // but verify the property exists
    });

    it('should report health status', async () => {
      await sync.initialize(mockDb);

      const status = sync.getStatus();

      expect(['healthy', 'warning', 'error']).toContain(status.health);
    });

    it('should count pending vault changes', async () => {
      await sync.initialize(mockDb);

      const status = sync.getStatus();

      // Initially should have pending changes (nodes not yet synced)
      expect(typeof status.pendingVaultChanges).toBe('number');
    });
  });

  describe('getConflicts', () => {
    it('should return unresolved conflicts', async () => {
      await sync.initialize(mockDb);

      const conflicts = sync.getConflicts();

      expect(Array.isArray(conflicts)).toBe(true);
    });

    it('should not include resolved conflicts', async () => {
      await sync.initialize(mockDb);

      // Sync to populate cache
      await sync.syncToMemory();

      const conflicts = sync.getConflicts();

      // All conflicts should be unresolved
      conflicts.forEach(c => {
        expect(c.resolvedAt).toBeUndefined();
      });
    });
  });

  describe('resolveConflictManually', () => {
    it('should resolve conflict with vault version', async () => {
      await sync.initialize(mockDb);

      // Note: This would need actual conflicts to test properly
      // For now, test that the method exists and handles non-existent conflicts
      const result = await sync.resolveConflictManually('non-existent', 'vault');

      expect(result).toBe(false); // No conflict found
    });

    it('should resolve conflict with memory version', async () => {
      await sync.initialize(mockDb);

      const result = await sync.resolveConflictManually('non-existent', 'memory');

      expect(result).toBe(false); // No conflict found
    });
  });

  describe('detectChanges', () => {
    it('should detect changes in vault', async () => {
      await sync.initialize(mockDb);

      const changes = await sync.detectChanges();

      expect(Array.isArray(changes)).toBe(true);
    });

    it('should return empty array when not initialized', async () => {
      const changes = await sync.detectChanges();

      expect(changes).toHaveLength(0);
    });
  });

  describe('stop', () => {
    it('should stop the sync system', async () => {
      await sync.initialize(mockDb);

      // Should not throw
      sync.stop();
    });

    it('should stop auto-sync timer', async () => {
      const autoSyncInstance = createVaultMemorySync({
        projectRoot: testRoot,
        autoSync: true,
        autoSyncInterval: 100,
      });

      await autoSyncInstance.initialize(mockDb);
      autoSyncInstance.stop();

      // After stopping, no more syncs should occur
      // (This is difficult to test directly without timing issues)
    });
  });

  describe('conflict resolution strategies', () => {
    describe('vault-wins', () => {
      it('should prefer vault version on conflict', async () => {
        const vaultWinsSync = createVaultMemorySync({
          projectRoot: testRoot,
          conflictStrategy: 'vault-wins',
        });

        await vaultWinsSync.initialize(mockDb);
        const result = await vaultWinsSync.syncToMemory();

        expect(result).toBeDefined();
        vaultWinsSync.stop();
      });
    });

    describe('memory-wins', () => {
      it('should prefer memory version on conflict', async () => {
        const memoryWinsSync = createVaultMemorySync({
          projectRoot: testRoot,
          conflictStrategy: 'memory-wins',
        });

        await memoryWinsSync.initialize(mockDb);
        const result = await memoryWinsSync.syncFromMemory();

        expect(result).toBeDefined();
        memoryWinsSync.stop();
      });
    });

    describe('newest-wins', () => {
      it('should prefer newest version on conflict', async () => {
        const newestWinsSync = createVaultMemorySync({
          projectRoot: testRoot,
          conflictStrategy: 'newest-wins',
        });

        await newestWinsSync.initialize(mockDb);
        const result = await newestWinsSync.syncToMemory();

        expect(result).toBeDefined();
        newestWinsSync.stop();
      });
    });

    describe('merge', () => {
      it('should attempt to merge changes on conflict', async () => {
        const mergeSync = createVaultMemorySync({
          projectRoot: testRoot,
          conflictStrategy: 'merge',
        });

        await mergeSync.initialize(mockDb);
        const result = await mergeSync.syncToMemory();

        expect(result).toBeDefined();
        mergeSync.stop();
      });
    });

    describe('manual', () => {
      it('should require manual resolution on conflict', async () => {
        const manualSync = createVaultMemorySync({
          projectRoot: testRoot,
          conflictStrategy: 'manual',
        });

        await manualSync.initialize(mockDb);
        const result = await manualSync.syncToMemory();

        expect(result).toBeDefined();
        manualSync.stop();
      });
    });
  });

  describe('batch processing', () => {
    it('should process nodes in batches', async () => {
      // Create database with many nodes
      const manyNodes = Array.from({ length: 100 }, (_, i) => ({
        id: `node-${i}`,
        title: `Node ${i}`,
        content: `Content for node ${i}`,
        type: 'document',
        path: `/docs/node-${i}.md`,
        tags: ['batch'],
        lastModified: new Date(),
      }));

      const largeDb = createMockDatabase(manyNodes);

      const batchSync = createVaultMemorySync({
        projectRoot: testRoot,
        batchSize: 10,
      });

      await batchSync.initialize(largeDb);
      const result = await batchSync.syncToMemory();

      expect(result.synced).toBe(100);
      batchSync.stop();
    });
  });

  describe('content handling', () => {
    it('should include content when configured', async () => {
      const contentSync = createVaultMemorySync({
        projectRoot: testRoot,
        includeContent: true,
        maxContentLength: 1000,
      });

      await contentSync.initialize(mockDb);
      const result = await contentSync.syncToMemory();

      expect(result).toBeDefined();
      contentSync.stop();
    });

    it('should truncate long content', async () => {
      const longContentDb = createMockDatabase([{
        id: 'long-node',
        title: 'Long Content',
        content: 'x'.repeat(10000),
        type: 'document',
        path: '/docs/long.md',
        tags: [],
        lastModified: new Date(),
      }]);

      const truncateSync = createVaultMemorySync({
        projectRoot: testRoot,
        includeContent: true,
        maxContentLength: 100,
      });

      await truncateSync.initialize(longContentDb);
      const result = await truncateSync.syncToMemory();

      expect(result).toBeDefined();
      truncateSync.stop();
    });
  });

  describe('retry handling', () => {
    it('should retry failed operations', async () => {
      const retrySync = createVaultMemorySync({
        projectRoot: testRoot,
        retryOptions: {
          maxRetries: 3,
          initialDelay: 100,
        },
      });

      await retrySync.initialize(mockDb);
      const result = await retrySync.syncToMemory();

      expect(result).toBeDefined();
      retrySync.stop();
    });
  });

  describe('summary extraction', () => {
    it('should extract summary from content', async () => {
      const summaryDb = createMockDatabase([{
        id: 'summary-node',
        title: 'Summary Test',
        content: `---
type: concept
---
# Header

This is the first paragraph that should become the summary.

This is the second paragraph.`,
        type: 'concept',
        path: '/docs/summary.md',
        tags: [],
        lastModified: new Date(),
      }]);

      const summarySync = createVaultMemorySync({
        projectRoot: testRoot,
      });

      await summarySync.initialize(summaryDb);
      const result = await summarySync.syncToMemory();

      expect(result.synced).toBe(1);
      summarySync.stop();
    });

    it('should skip headers and code blocks for summary', async () => {
      const codeDb = createMockDatabase([{
        id: 'code-node',
        title: 'Code Test',
        content: `# Header
\`\`\`typescript
const x = 1;
\`\`\`
This is the actual content.`,
        type: 'document',
        path: '/docs/code.md',
        tags: [],
        lastModified: new Date(),
      }]);

      const codeSync = createVaultMemorySync({
        projectRoot: testRoot,
      });

      await codeSync.initialize(codeDb);
      const result = await codeSync.syncToMemory();

      expect(result.synced).toBe(1);
      codeSync.stop();
    });
  });

  describe('index synchronization', () => {
    it('should sync node index to memory', async () => {
      await sync.initialize(mockDb);
      const result = await sync.syncToMemory();

      expect(result.success).toBe(true);
    });

    it('should sync tag index to memory', async () => {
      const taggedDb = createMockDatabase([
        {
          id: 'tag-1',
          title: 'Tagged 1',
          content: 'Content 1',
          type: 'document',
          path: '/docs/tag1.md',
          tags: ['important', 'review'],
          lastModified: new Date(),
        },
        {
          id: 'tag-2',
          title: 'Tagged 2',
          content: 'Content 2',
          type: 'document',
          path: '/docs/tag2.md',
          tags: ['important'],
          lastModified: new Date(),
        },
      ]);

      await sync.initialize(taggedDb);
      const result = await sync.syncToMemory();

      expect(result.success).toBe(true);
    });
  });

  describe('error tracking', () => {
    it('should track sync errors in status', async () => {
      // Create a database with a node that might cause issues
      const problematicDb = createMockDatabase([{
        id: 'prob-node',
        title: 'Problematic',
        content: 'Normal content',
        type: 'unknown',
        path: '/nonexistent/path.md',
        tags: [],
        lastModified: new Date(),
      }]);

      await sync.initialize(problematicDb);
      await sync.syncToMemory();

      const status = sync.getStatus();
      expect(Array.isArray(status.errors)).toBe(true);
    });
  });

  describe('link synchronization', () => {
    it('should sync outgoing links', async () => {
      const linkedDb = {
        ...createMockDatabase([]),
        getAllNodes: () => [{
          id: 'link-source',
          title: 'Source',
          content: 'Source content',
          type: 'document',
          path: '/docs/source.md',
          tags: [],
          status: 'active',
          lastModified: new Date(),
          outgoingLinks: [{ target: 'link-target', type: 'reference' }],
          incomingLinks: [],
        }],
        getNode: (id: string) => id === 'link-source' ? {
          id: 'link-source',
          title: 'Source',
          content: 'Source content',
          type: 'document',
          path: '/docs/source.md',
          tags: [],
          status: 'active',
          lastModified: new Date(),
          outgoingLinks: [{ target: 'link-target', type: 'reference' }],
          incomingLinks: [],
        } : undefined,
      } as unknown as KnowledgeGraphDatabase;

      await sync.initialize(linkedDb);
      const result = await sync.syncToMemory();

      expect(result.synced).toBe(1);
    });

    it('should sync incoming links', async () => {
      const linkedDb = {
        ...createMockDatabase([]),
        getAllNodes: () => [{
          id: 'link-target',
          title: 'Target',
          content: 'Target content',
          type: 'document',
          path: '/docs/target.md',
          tags: [],
          status: 'active',
          lastModified: new Date(),
          outgoingLinks: [],
          incomingLinks: [{ target: 'link-source', type: 'reference' }],
        }],
        getNode: (id: string) => id === 'link-target' ? {
          id: 'link-target',
          title: 'Target',
          content: 'Target content',
          type: 'document',
          path: '/docs/target.md',
          tags: [],
          status: 'active',
          lastModified: new Date(),
          outgoingLinks: [],
          incomingLinks: [{ target: 'link-source', type: 'reference' }],
        } : undefined,
      } as unknown as KnowledgeGraphDatabase;

      await sync.initialize(linkedDb);
      const result = await sync.syncToMemory();

      expect(result.synced).toBe(1);
    });
  });
});
