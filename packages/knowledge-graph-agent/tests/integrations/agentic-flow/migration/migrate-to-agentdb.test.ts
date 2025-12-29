/**
 * Migration to AgentDB Tests
 *
 * Tests for the vector store migration utilities including batch migration,
 * progress tracking, validation, and error handling.
 *
 * @module tests/integrations/agentic-flow/migration/migrate-to-agentdb
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  VectorStoreMigration,
  migrateToAgentDB,
  createMigrationPlan,
  type ISourceVectorStore,
  type ITargetVectorStore,
  type MigrationProgress,
  type MigrationOptions,
} from '../../../../src/integrations/agentic-flow/migration/migrate-to-agentdb.js';

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Create a mock source vector store
 */
function createMockSourceStore(
  entries: Map<string, { id: string; vector: number[]; metadata: Record<string, unknown> }>
): ISourceVectorStore {
  return {
    getAllIds: () => Array.from(entries.keys()),
    get: async (id: string) => {
      const entry = entries.get(id);
      return entry || null;
    },
    getStats: () => ({ totalVectors: entries.size }),
    search: async ({ vector, k = 10 }) => {
      // Simple mock search - return first k entries
      const results: Array<{ id: string; score: number; metadata: Record<string, unknown> }> = [];
      let count = 0;
      for (const [id, entry] of entries) {
        if (count >= k) break;
        results.push({ id, score: 0.95, metadata: entry.metadata });
        count++;
      }
      return results;
    },
  };
}

/**
 * Create a mock target vector store
 */
function createMockTargetStore(): {
  store: ITargetVectorStore;
  data: Map<string, { content: string; embedding: Float32Array; metadata: Record<string, unknown> }>;
} {
  const data = new Map<string, { content: string; embedding: Float32Array; metadata: Record<string, unknown> }>();

  const store: ITargetVectorStore = {
    upsertBatch: async (entries) => {
      for (const entry of entries) {
        data.set(entry.nodeId, {
          content: entry.content,
          embedding: entry.embedding,
          metadata: entry.metadata || {},
        });
      }
    },
    search: async (queryEmbedding, limit = 10, threshold = 0.5) => {
      // Simple mock search - return first entries with high similarity
      const results: Array<{
        nodeId: string;
        content: string;
        similarity: number;
        metadata: Record<string, unknown>;
      }> = [];

      let count = 0;
      for (const [nodeId, entry] of data) {
        if (count >= limit) break;
        results.push({
          nodeId,
          content: entry.content,
          similarity: 0.99,
          metadata: entry.metadata,
        });
        count++;
      }

      return results;
    },
    getStats: async () => ({
      totalVectors: data.size,
      indexSize: data.size * 1024,
      cacheHitRate: 0.8,
    }),
  };

  return { store, data };
}

/**
 * Generate test entries for source store
 */
function generateTestEntries(count: number): Map<string, { id: string; vector: number[]; metadata: Record<string, unknown> }> {
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    const vector = Array.from({ length: 128 }, () => Math.random() * 2 - 1);
    entries.set(`entry-${i}`, {
      id: `entry-${i}`,
      vector,
      metadata: { content: `Content for entry ${i}`, index: i },
    });
  }
  return entries;
}

// ============================================================================
// Tests
// ============================================================================

describe('VectorStoreMigration', () => {
  let migration: VectorStoreMigration;

  beforeEach(() => {
    migration = new VectorStoreMigration();
  });

  // --------------------------------------------------------------------------
  // Basic Migration Tests
  // --------------------------------------------------------------------------

  describe('basic migration', () => {
    it('should migrate empty source successfully', async () => {
      const sourceEntries = new Map();
      const source = createMockSourceStore(sourceEntries);
      const { store: target } = createMockTargetStore();

      const result = await migration.migrate(source, target);

      expect(result.success).toBe(true);
      expect(result.totalMigrated).toBe(0);
      expect(result.totalFailed).toBe(0);
      expect(result.totalSkipped).toBe(0);
    });

    it('should migrate small dataset successfully', async () => {
      const sourceEntries = generateTestEntries(10);
      const source = createMockSourceStore(sourceEntries);
      const { store: target, data } = createMockTargetStore();

      const result = await migration.migrate(source, target, {
        batchSize: 5,
        validateAfterMigration: false,
      });

      expect(result.success).toBe(true);
      expect(result.totalMigrated).toBe(10);
      expect(data.size).toBe(10);
    });

    it('should migrate in batches', async () => {
      const sourceEntries = generateTestEntries(25);
      const source = createMockSourceStore(sourceEntries);
      const { store: target, data } = createMockTargetStore();

      const result = await migration.migrate(source, target, {
        batchSize: 10,
        validateAfterMigration: false,
      });

      expect(result.success).toBe(true);
      expect(result.totalMigrated).toBe(25);
      expect(data.size).toBe(25);
      expect(result.stats.sourceCount).toBe(25);
    });
  });

  // --------------------------------------------------------------------------
  // Progress Tracking Tests
  // --------------------------------------------------------------------------

  describe('progress tracking', () => {
    it('should report progress during migration', async () => {
      const sourceEntries = generateTestEntries(20);
      const source = createMockSourceStore(sourceEntries);
      const { store: target } = createMockTargetStore();

      const progressUpdates: MigrationProgress[] = [];

      await migration.migrate(source, target, {
        batchSize: 5,
        validateAfterMigration: false,
        onProgress: (progress) => {
          progressUpdates.push({ ...progress });
        },
      });

      // Should have progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);

      // First should be preparing phase
      expect(progressUpdates[0].phase).toBe('preparing');

      // Last should be complete phase
      const lastUpdate = progressUpdates[progressUpdates.length - 1];
      expect(lastUpdate.phase).toBe('complete');
      expect(lastUpdate.percentage).toBe(100);
    });

    it('should report correct batch information', async () => {
      const sourceEntries = generateTestEntries(30);
      const source = createMockSourceStore(sourceEntries);
      const { store: target } = createMockTargetStore();

      const progressUpdates: MigrationProgress[] = [];

      await migration.migrate(source, target, {
        batchSize: 10,
        validateAfterMigration: false,
        onProgress: (progress) => {
          progressUpdates.push({ ...progress });
        },
      });

      // Should have 3 batches
      const migratingUpdates = progressUpdates.filter(p => p.phase === 'migrating');
      expect(migratingUpdates.length).toBe(3);

      // Verify total batches
      expect(migratingUpdates[0].totalBatches).toBe(3);
    });

    it('should handle progress callback errors gracefully', async () => {
      const sourceEntries = generateTestEntries(5);
      const source = createMockSourceStore(sourceEntries);
      const { store: target } = createMockTargetStore();

      const result = await migration.migrate(source, target, {
        batchSize: 5,
        validateAfterMigration: false,
        onProgress: () => {
          throw new Error('Progress callback error');
        },
      });

      // Migration should still succeed despite callback errors
      expect(result.success).toBe(true);
      expect(result.totalMigrated).toBe(5);
    });
  });

  // --------------------------------------------------------------------------
  // Dry Run Tests
  // --------------------------------------------------------------------------

  describe('dry run mode', () => {
    it('should not modify target in dry run mode', async () => {
      const sourceEntries = generateTestEntries(10);
      const source = createMockSourceStore(sourceEntries);
      const { store: target, data } = createMockTargetStore();

      const result = await migration.migrate(source, target, {
        batchSize: 5,
        dryRun: true,
        validateAfterMigration: false,
      });

      expect(result.success).toBe(true);
      expect(result.totalMigrated).toBe(10);
      // Target should be empty because dry run
      expect(data.size).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // Error Handling Tests
  // --------------------------------------------------------------------------

  describe('error handling', () => {
    it('should fail migration when error occurs and skipOnError is false', async () => {
      const sourceEntries = generateTestEntries(10);
      const source = createMockSourceStore(sourceEntries);

      // Create target that throws on upsert
      const failingTarget: ITargetVectorStore = {
        upsertBatch: async () => {
          throw new Error('Database connection failed');
        },
        search: async () => [],
        getStats: async () => ({ totalVectors: 0, indexSize: 0, cacheHitRate: 0 }),
      };

      const result = await migration.migrate(source, failingTarget, {
        batchSize: 5,
        validateAfterMigration: false,
        skipOnError: false,
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should continue migration when error occurs and skipOnError is true', async () => {
      const sourceEntries = generateTestEntries(20);
      const source = createMockSourceStore(sourceEntries);

      let callCount = 0;
      const sometimesFailingTarget: ITargetVectorStore = {
        upsertBatch: async (entries) => {
          callCount++;
          // Fail on first batch only
          if (callCount === 1) {
            throw new Error('Temporary failure');
          }
        },
        search: async () => [],
        getStats: async () => ({ totalVectors: 0, indexSize: 0, cacheHitRate: 0 }),
      };

      const result = await migration.migrate(source, sometimesFailingTarget, {
        batchSize: 10,
        validateAfterMigration: false,
        skipOnError: true,
      });

      // Should not be fully successful but should have some migrated
      expect(result.totalFailed).toBe(10); // First batch failed
      expect(result.totalMigrated).toBe(10); // Second batch succeeded
    });
  });

  // --------------------------------------------------------------------------
  // Statistics Tests
  // --------------------------------------------------------------------------

  describe('statistics', () => {
    it('should calculate migration statistics', async () => {
      const sourceEntries = generateTestEntries(50);
      const source = createMockSourceStore(sourceEntries);
      const { store: target } = createMockTargetStore();

      const result = await migration.migrate(source, target, {
        batchSize: 10,
        validateAfterMigration: false,
      });

      expect(result.stats).toBeDefined();
      expect(result.stats.sourceCount).toBe(50);
      // avgRate may be 0 if migration is very fast, so check it's defined and non-negative
      expect(result.stats.avgRate).toBeGreaterThanOrEqual(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('migrateToAgentDB helper', () => {
  it('should provide convenient migration function', async () => {
    const sourceEntries = generateTestEntries(5);
    const source = createMockSourceStore(sourceEntries);
    const { store: target, data } = createMockTargetStore();

    const result = await migrateToAgentDB(source, target, {
      validateAfterMigration: false,
    });

    expect(result.success).toBe(true);
    expect(result.totalMigrated).toBe(5);
    expect(data.size).toBe(5);
  });
});

describe('createMigrationPlan', () => {
  it('should create migration plan for small dataset', async () => {
    const sourceEntries = generateTestEntries(100);
    const source = createMockSourceStore(sourceEntries);

    const plan = await createMigrationPlan(source);

    expect(plan.totalVectors).toBe(100);
    expect(plan.estimatedBatches).toBe(1);
    expect(plan.estimatedDuration).toBeGreaterThan(0);
    expect(plan.recommendations).toContain('Run with dryRun: true first to validate source data');
  });

  it('should provide recommendations for large datasets', async () => {
    // Create a mock source that reports large size
    const largeSource: ISourceVectorStore = {
      getAllIds: () => Array.from({ length: 150000 }, (_, i) => `entry-${i}`),
      get: async () => null,
    };

    const plan = await createMigrationPlan(largeSource);

    expect(plan.totalVectors).toBe(150000);
    expect(plan.recommendations).toContain('Consider increasing batch size to 500 for better throughput');
    expect(plan.recommendations).toContain('Enable parallel batches (parallelBatches: 4) for faster migration');
  });

  it('should handle empty source', async () => {
    const emptySource = createMockSourceStore(new Map());

    const plan = await createMigrationPlan(emptySource);

    expect(plan.totalVectors).toBe(0);
    expect(plan.estimatedBatches).toBe(0);
  });
});
