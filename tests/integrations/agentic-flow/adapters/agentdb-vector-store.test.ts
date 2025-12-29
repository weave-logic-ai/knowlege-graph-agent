/**
 * AgentDB Vector Store Adapter Tests
 *
 * Tests for the AgentDB vector store adapter including initialization,
 * upsert, search, hybrid search, and fallback behavior.
 *
 * @module tests/integrations/agentic-flow/adapters/agentdb-vector-store
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AgentDBVectorStore,
  createAgentDBVectorStore,
  type AgentDBVectorConfig,
} from '../../../../src/integrations/agentic-flow/adapters/agentdb-vector-store.js';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Generate a random embedding vector
 */
function generateRandomEmbedding(dimensions: number = 384): Float32Array {
  const embedding = new Float32Array(dimensions);
  for (let i = 0; i < dimensions; i++) {
    embedding[i] = Math.random() * 2 - 1;
  }
  // Normalize
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += embedding[i] * embedding[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      embedding[i] /= norm;
    }
  }
  return embedding;
}

/**
 * Create test config
 */
function createTestConfig(
  overrides: Partial<AgentDBVectorConfig> = {}
): Partial<AgentDBVectorConfig> {
  return {
    backend: 'auto',
    dimensions: 128,
    enableGNN: true,
    gnnHeads: 4,
    enableCache: true,
    cacheSize: 100,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('AgentDBVectorStore', () => {
  let store: AgentDBVectorStore;

  beforeEach(() => {
    store = new AgentDBVectorStore(createTestConfig());
  });

  afterEach(async () => {
    if (store) {
      await store.close();
    }
  });

  // --------------------------------------------------------------------------
  // Constructor and Configuration Tests
  // --------------------------------------------------------------------------

  describe('constructor and configuration', () => {
    it('should create instance with default config', () => {
      const defaultStore = new AgentDBVectorStore();
      expect(defaultStore).toBeInstanceOf(AgentDBVectorStore);

      const config = defaultStore.getConfig();
      expect(config.backend).toBe('auto');
      expect(config.dimensions).toBe(384);
      expect(config.enableGNN).toBe(true);
    });

    it('should create instance with custom config', () => {
      const customStore = new AgentDBVectorStore({
        dimensions: 256,
        enableGNN: false,
        enableCache: false,
      });

      const config = customStore.getConfig();
      expect(config.dimensions).toBe(256);
      expect(config.enableGNN).toBe(false);
      expect(config.enableCache).toBe(false);
    });

    it('should return correct feature name', () => {
      expect(store.getFeatureName()).toBe('agentdb-vector-store');
    });
  });

  // --------------------------------------------------------------------------
  // Initialization Tests
  // --------------------------------------------------------------------------

  describe('initialization', () => {
    it('should initialize without AgentDB (fallback mode)', async () => {
      await store.initialize();

      const status = store.getStatus();
      expect(status.initialized).toBe(true);
      // In test environment, AgentDB is likely not available
      // so we test fallback behavior
    });

    it('should be idempotent on multiple initialize calls', async () => {
      await store.initialize();
      await store.initialize();
      await store.initialize();

      const status = store.getStatus();
      expect(status.initialized).toBe(true);
    });

    it('should return false for isAvailable when not initialized', () => {
      expect(store.isAvailable()).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Fallback Behavior Tests
  // --------------------------------------------------------------------------

  describe('fallback behavior (when AgentDB not available)', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should return empty results from search when not available', async () => {
      const embedding = generateRandomEmbedding(128);
      const results = await store.search(embedding, 10, 0.5);

      expect(results).toEqual([]);
    });

    it('should not throw on upsert when not available', async () => {
      const embedding = generateRandomEmbedding(128);

      await expect(
        store.upsert('test-id', 'test content', embedding, { type: 'test' })
      ).resolves.not.toThrow();
    });

    it('should not throw on batch upsert when not available', async () => {
      const entries = [
        {
          nodeId: 'test-1',
          content: 'content 1',
          embedding: generateRandomEmbedding(128),
        },
        {
          nodeId: 'test-2',
          content: 'content 2',
          embedding: generateRandomEmbedding(128),
        },
      ];

      await expect(store.upsertBatch(entries)).resolves.not.toThrow();
    });

    it('should return empty results from hybrid search when not available', async () => {
      const embedding = generateRandomEmbedding(128);
      const results = await store.hybridSearch('query', embedding, { limit: 10 });

      expect(results).toEqual([]);
    });

    it('should return fallback stats when not available', async () => {
      const stats = await store.getStats();

      expect(stats.totalVectors).toBe(0);
      expect(stats.indexSize).toBe(0);
      expect(stats.backendType).toBe('fallback');
      expect(stats.gnnEnabled).toBe(false);
    });

    it('should not throw on delete when not available', async () => {
      await expect(store.delete('non-existent')).resolves.not.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // Cache Tests
  // --------------------------------------------------------------------------

  describe('cache functionality', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should track cache statistics', async () => {
      const stats = await store.getStats();
      expect(stats.cacheHitRate).toBe(0); // No searches yet
    });

    it('should clear cache', () => {
      store.clearCache();
      // Should not throw
    });
  });

  // --------------------------------------------------------------------------
  // Factory Function Tests
  // --------------------------------------------------------------------------

  describe('createAgentDBVectorStore factory', () => {
    it('should create and initialize store', async () => {
      const factoryStore = await createAgentDBVectorStore(createTestConfig());

      const status = factoryStore.getStatus();
      expect(status.initialized).toBe(true);

      await factoryStore.close();
    });

    it('should create store with default config', async () => {
      const factoryStore = await createAgentDBVectorStore();

      const config = factoryStore.getConfig();
      expect(config.dimensions).toBe(384);

      await factoryStore.close();
    });
  });

  // --------------------------------------------------------------------------
  // Status and Reset Tests
  // --------------------------------------------------------------------------

  describe('status and reset', () => {
    it('should return correct initial status', () => {
      const status = store.getStatus();

      expect(status.available).toBe(false);
      expect(status.initialized).toBe(false);
      expect(status.lastChecked).toBeInstanceOf(Date);
    });

    it('should reset adapter state', async () => {
      await store.initialize();
      store.reset();

      const status = store.getStatus();
      expect(status.initialized).toBe(false);
      expect(status.available).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Close Tests
  // --------------------------------------------------------------------------

  describe('close', () => {
    it('should close without error', async () => {
      await store.initialize();
      await expect(store.close()).resolves.not.toThrow();
    });

    it('should handle close on uninitialized store', async () => {
      await expect(store.close()).resolves.not.toThrow();
    });
  });
});

// ============================================================================
// Integration Tests with Mock AgentDB
// ============================================================================

describe('AgentDBVectorStore with mocked AgentDB', () => {
  // These tests would be more comprehensive with a proper mock of AgentDB
  // For now, we test the interface and fallback behavior

  it('should handle search parameters correctly', async () => {
    const store = new AgentDBVectorStore({
      dimensions: 128,
      enableGNN: true,
    });
    await store.initialize();

    const embedding = generateRandomEmbedding(128);

    // Test various search parameters
    await store.search(embedding, 5, 0.3, true);
    await store.search(embedding, 10, 0.5, false);
    await store.search(embedding, 20, 0.7);

    await store.close();
  });

  it('should handle hybrid search options correctly', async () => {
    const store = new AgentDBVectorStore({
      dimensions: 128,
    });
    await store.initialize();

    const embedding = generateRandomEmbedding(128);

    // Test various hybrid search options
    await store.hybridSearch('test query', embedding, {
      limit: 10,
      vectorWeight: 0.7,
      textWeight: 0.3,
      minScore: 0.4,
      useGNN: true,
    });

    await store.hybridSearch('another query', embedding, {
      limit: 20,
    });

    await store.hybridSearch('simple query', embedding);

    await store.close();
  });

  it('should handle batch upsert with various entry formats', async () => {
    const store = new AgentDBVectorStore({
      dimensions: 128,
    });
    await store.initialize();

    const entries = [
      {
        nodeId: 'entry-1',
        content: 'Content for entry 1',
        embedding: generateRandomEmbedding(128),
        metadata: { type: 'document', tags: ['test'] },
      },
      {
        nodeId: 'entry-2',
        content: 'Content for entry 2',
        embedding: generateRandomEmbedding(128),
      },
      {
        nodeId: 'entry-3',
        content: '',
        embedding: generateRandomEmbedding(128),
        metadata: {},
      },
    ];

    await store.upsertBatch(entries);

    await store.close();
  });
});
