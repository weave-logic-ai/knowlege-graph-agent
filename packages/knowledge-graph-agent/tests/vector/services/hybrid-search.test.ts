/**
 * Hybrid Search Tests
 *
 * Tests for the HybridSearch service that combines vector similarity
 * search with full-text search.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HybridSearch, createHybridSearch } from '../../../src/vector/services/hybrid-search.js';
import type { FTSProvider, FTSResult } from '../../../src/vector/services/hybrid-search.js';
import type { EnhancedVectorStore } from '../../../src/vector/services/vector-store.js';
import type { EmbeddingService, EmbeddingResult } from '../../../src/vector/services/embedding-service.js';
import type { SearchResult } from '../../../src/vector/types.js';

// Create mock implementations
const createMockEmbeddingService = (): EmbeddingService => {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    embed: vi.fn().mockResolvedValue({
      embedding: new Float32Array(384).fill(0.1),
      durationMs: 10,
      tokenCount: 5,
    } as EmbeddingResult),
    embedBatch: vi.fn().mockResolvedValue({
      embeddings: [],
      durationMs: 10,
      successCount: 0,
      errorCount: 0,
    }),
    getDimensions: vi.fn().mockReturnValue(384),
    getConfig: vi.fn().mockReturnValue({
      model: 'test-model',
      dimensions: 384,
      maxLength: 512,
      batchSize: 32,
      normalize: true,
      pooling: 'mean',
      quantized: false,
    }),
    isReady: vi.fn().mockReturnValue(true),
    getModelInfo: vi.fn().mockReturnValue({
      model: 'test-model',
      dimensions: 384,
      quantized: false,
    }),
  } as unknown as EmbeddingService;
};

const createMockVectorStore = (results: SearchResult[] = []): EnhancedVectorStore => {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    insert: vi.fn().mockResolvedValue(undefined),
    batchInsert: vi.fn().mockResolvedValue({ inserted: 0, skipped: 0, errors: [] }),
    search: vi.fn().mockResolvedValue(results),
    hybridSearch: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(true),
    getStats: vi.fn().mockReturnValue({
      totalVectors: 0,
      dimensions: 384,
      indexType: 'hnsw',
      memoryUsage: 0,
      lastUpdated: new Date(),
    }),
    clear: vi.fn().mockResolvedValue(undefined),
    isReady: vi.fn().mockReturnValue(true),
    size: vi.fn().mockReturnValue(0),
    has: vi.fn().mockReturnValue(false),
    getAllIds: vi.fn().mockReturnValue([]),
    getConfig: vi.fn().mockReturnValue({}),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as EnhancedVectorStore;
};

const createMockFTSProvider = (results: FTSResult[] = []): FTSProvider => {
  return {
    search: vi.fn().mockResolvedValue(results),
  };
};

describe('HybridSearch', () => {
  let mockEmbeddingService: EmbeddingService;
  let mockVectorStore: EnhancedVectorStore;
  let hybridSearch: HybridSearch;

  beforeEach(() => {
    mockEmbeddingService = createMockEmbeddingService();
    mockVectorStore = createMockVectorStore();
    hybridSearch = new HybridSearch(mockVectorStore, mockEmbeddingService);
  });

  describe('constructor', () => {
    it('should create with default configuration', () => {
      const config = hybridSearch.getConfig();

      expect(config.vectorWeight).toBe(0.6);
      expect(config.ftsWeight).toBe(0.4);
      expect(config.limit).toBe(20);
      expect(config.minScore).toBe(0.3);
      expect(config.hybridBoost).toBe(1.2);
      expect(config.normalizeScores).toBe(true);
    });

    it('should accept custom configuration', () => {
      const search = new HybridSearch(mockVectorStore, mockEmbeddingService, {
        vectorWeight: 0.8,
        ftsWeight: 0.2,
        limit: 50,
      });
      const config = search.getConfig();

      expect(config.vectorWeight).toBe(0.8);
      expect(config.ftsWeight).toBe(0.2);
      expect(config.limit).toBe(50);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      hybridSearch.updateConfig({ limit: 100, minScore: 0.5 });
      const config = hybridSearch.getConfig();

      expect(config.limit).toBe(100);
      expect(config.minScore).toBe(0.5);
      expect(config.vectorWeight).toBe(0.6); // Unchanged
    });
  });

  describe('setFTSProvider', () => {
    it('should set the FTS provider', async () => {
      const mockFTSProvider = createMockFTSProvider([
        { id: 'doc1', content: 'Test content', score: 0.9 },
      ]);

      hybridSearch.setFTSProvider(mockFTSProvider);

      const response = await hybridSearch.search({ query: 'test' });

      expect(mockFTSProvider.search).toHaveBeenCalledWith('test', expect.any(Number));
    });
  });

  describe('search', () => {
    it('should return results with statistics', async () => {
      const response = await hybridSearch.search({ query: 'test query' });

      expect(response.query).toBe('test query');
      expect(response.results).toBeInstanceOf(Array);
      expect(response.stats).toBeDefined();
      expect(response.stats.totalDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('should call embedding service and vector store', async () => {
      await hybridSearch.search({ query: 'search term' });

      expect(mockEmbeddingService.embed).toHaveBeenCalledWith('search term');
      expect(mockVectorStore.search).toHaveBeenCalled();
    });

    it('should respect limit parameter', async () => {
      const vectorResults: SearchResult[] = Array.from({ length: 50 }, (_, i) => ({
        id: `doc${i}`,
        score: 1 - i * 0.01,
        metadata: { content: `Content ${i}` },
      }));

      mockVectorStore = createMockVectorStore(vectorResults);
      hybridSearch = new HybridSearch(mockVectorStore, mockEmbeddingService);

      const response = await hybridSearch.search({ query: 'test', limit: 10 });

      expect(response.results.length).toBeLessThanOrEqual(10);
    });

    it('should filter by minimum score', async () => {
      const vectorResults: SearchResult[] = [
        { id: 'doc1', score: 0.9, metadata: { content: 'High score' } },
        { id: 'doc2', score: 0.5, metadata: { content: 'Medium score' } },
        { id: 'doc3', score: 0.1, metadata: { content: 'Low score' } },
      ];

      mockVectorStore = createMockVectorStore(vectorResults);
      hybridSearch = new HybridSearch(mockVectorStore, mockEmbeddingService);

      const response = await hybridSearch.search({ query: 'test', minScore: 0.4 });

      // All results should have combinedScore >= 0.4
      for (const result of response.results) {
        expect(result.combinedScore).toBeGreaterThanOrEqual(0.4);
      }
    });

    it('should handle empty results', async () => {
      const response = await hybridSearch.search({ query: 'no results' });

      expect(response.results).toEqual([]);
      expect(response.stats.finalResultCount).toBe(0);
    });

    it('should return correct search statistics', async () => {
      const response = await hybridSearch.search({ query: 'test' });

      expect(response.stats).toHaveProperty('totalDurationMs');
      expect(response.stats).toHaveProperty('vectorSearchMs');
      expect(response.stats).toHaveProperty('ftsSearchMs');
      expect(response.stats).toHaveProperty('mergeMs');
      expect(response.stats).toHaveProperty('vectorResultCount');
      expect(response.stats).toHaveProperty('ftsResultCount');
      expect(response.stats).toHaveProperty('finalResultCount');
    });
  });

  describe('hybrid merging', () => {
    it('should combine vector and FTS results', async () => {
      const vectorResults: SearchResult[] = [
        { id: 'doc1', score: 0.9, metadata: { content: 'Vector match' } },
        { id: 'doc2', score: 0.8, metadata: { content: 'Vector only' } },
      ];

      const ftsResults: FTSResult[] = [
        { id: 'doc1', content: 'FTS match', score: 0.9 },
        { id: 'doc3', content: 'FTS only', score: 0.8 },
      ];

      const localVectorStore = createMockVectorStore(vectorResults);
      const localEmbeddingService = createMockEmbeddingService();
      const localHybridSearch = new HybridSearch(localVectorStore, localEmbeddingService, {
        minScore: 0.1, // Lower threshold to include all results
        normalizeScores: false, // Disable normalization for predictable results
      });
      localHybridSearch.setFTSProvider(createMockFTSProvider(ftsResults));

      const response = await localHybridSearch.search({ query: 'test' });

      // doc1 should be marked as hybrid (appears in both)
      const doc1 = response.results.find(r => r.nodeId === 'doc1');
      expect(doc1).toBeDefined();
      expect(doc1?.source).toBe('hybrid');
      expect(doc1?.vectorScore).toBeGreaterThan(0);
      expect(doc1?.ftsScore).toBeGreaterThan(0);

      // doc2 should be vector-only
      const doc2 = response.results.find(r => r.nodeId === 'doc2');
      expect(doc2).toBeDefined();
      expect(doc2?.source).toBe('vector');

      // doc3 should be fts-only
      const doc3 = response.results.find(r => r.nodeId === 'doc3');
      expect(doc3).toBeDefined();
      expect(doc3?.source).toBe('fts');
    });

    it('should apply hybrid boost to results in both', async () => {
      const vectorResults: SearchResult[] = [
        { id: 'doc1', score: 0.8, metadata: {} },
      ];

      const ftsResults: FTSResult[] = [
        { id: 'doc1', content: 'Match', score: 0.8 },
      ];

      mockVectorStore = createMockVectorStore(vectorResults);
      hybridSearch = new HybridSearch(mockVectorStore, mockEmbeddingService, {
        hybridBoost: 1.5,
        vectorWeight: 0.5,
        ftsWeight: 0.5,
      });
      hybridSearch.setFTSProvider(createMockFTSProvider(ftsResults));

      const response = await hybridSearch.search({ query: 'test' });

      // Combined score should be boosted
      const result = response.results.find(r => r.nodeId === 'doc1');
      expect(result?.combinedScore).toBeGreaterThan(0.8); // Boosted above base
    });

    it('should rank results by combined score', async () => {
      const vectorResults: SearchResult[] = [
        { id: 'low-vector', score: 0.3, metadata: {} },
        { id: 'high-vector', score: 0.9, metadata: {} },
      ];

      mockVectorStore = createMockVectorStore(vectorResults);
      hybridSearch = new HybridSearch(mockVectorStore, mockEmbeddingService);

      const response = await hybridSearch.search({ query: 'test' });

      // Should be sorted by combined score descending
      for (let i = 1; i < response.results.length; i++) {
        expect(response.results[i - 1].combinedScore).toBeGreaterThanOrEqual(
          response.results[i].combinedScore
        );
      }
    });
  });

  describe('weight configuration', () => {
    it('should respect custom vector weight', async () => {
      const vectorResults: SearchResult[] = [
        { id: 'doc1', score: 1.0, metadata: {} },
      ];

      mockVectorStore = createMockVectorStore(vectorResults);
      hybridSearch = new HybridSearch(mockVectorStore, mockEmbeddingService, {
        vectorWeight: 1.0,
        ftsWeight: 0.0,
      });

      const response = await hybridSearch.search({ query: 'test' });

      const result = response.results.find(r => r.nodeId === 'doc1');
      // With 100% vector weight, combined score should equal vector score
      expect(result?.combinedScore).toBeCloseTo(result?.vectorScore ?? 0, 1);
    });

    it('should allow query-level weight overrides', async () => {
      const vectorResults: SearchResult[] = [
        { id: 'doc1', score: 0.8, metadata: {} },
      ];

      mockVectorStore = createMockVectorStore(vectorResults);
      hybridSearch = new HybridSearch(mockVectorStore, mockEmbeddingService);

      const response = await hybridSearch.search({
        query: 'test',
        vectorWeight: 0.9,
        ftsWeight: 0.1,
      });

      // Results should use the query-level weights
      expect(response.stats.vectorResultCount).toBeGreaterThan(0);
    });
  });

  describe('node type filtering', () => {
    it('should filter by node types', async () => {
      const vectorResults: SearchResult[] = [
        { id: 'doc1', score: 0.9, metadata: { type: 'article' } },
        { id: 'doc2', score: 0.8, metadata: { type: 'note' } },
        { id: 'doc3', score: 0.7, metadata: { type: 'article' } },
      ];

      mockVectorStore = createMockVectorStore(vectorResults);
      hybridSearch = new HybridSearch(mockVectorStore, mockEmbeddingService);

      const response = await hybridSearch.search({
        query: 'test',
        nodeTypes: ['article'],
      });

      for (const result of response.results) {
        expect(result.metadata?.type).toBe('article');
      }
    });
  });

  describe('error handling', () => {
    it('should handle vector search failure gracefully', async () => {
      mockVectorStore.search = vi.fn().mockRejectedValue(new Error('Vector search failed'));

      const response = await hybridSearch.search({ query: 'test' });

      // Should still return FTS results if available
      expect(response.results).toBeInstanceOf(Array);
      expect(response.stats.vectorResultCount).toBe(0);
    });

    it('should handle FTS failure gracefully', async () => {
      const mockFTSProvider = createMockFTSProvider([]);
      mockFTSProvider.search = vi.fn().mockRejectedValue(new Error('FTS failed'));

      hybridSearch.setFTSProvider(mockFTSProvider);

      const vectorResults: SearchResult[] = [
        { id: 'doc1', score: 0.9, metadata: {} },
      ];
      mockVectorStore = createMockVectorStore(vectorResults);
      hybridSearch = new HybridSearch(mockVectorStore, mockEmbeddingService);
      hybridSearch.setFTSProvider(mockFTSProvider);

      const response = await hybridSearch.search({ query: 'test' });

      // Should still return vector results
      expect(response.results).toBeInstanceOf(Array);
      expect(response.stats.ftsResultCount).toBe(0);
    });

    it('should handle embedding service failure gracefully', async () => {
      mockEmbeddingService.embed = vi.fn().mockRejectedValue(new Error('Embedding failed'));

      // The implementation handles errors gracefully and returns empty results
      const response = await hybridSearch.search({ query: 'test' });

      expect(response.results).toEqual([]);
      expect(response.stats.vectorResultCount).toBe(0);
    });
  });
});

describe('createHybridSearch', () => {
  it('should create a HybridSearch instance', () => {
    const mockEmbeddingService = createMockEmbeddingService();
    const mockVectorStore = createMockVectorStore();

    const search = createHybridSearch(mockVectorStore, mockEmbeddingService);

    expect(search).toBeInstanceOf(HybridSearch);
  });

  it('should accept custom configuration', () => {
    const mockEmbeddingService = createMockEmbeddingService();
    const mockVectorStore = createMockVectorStore();

    const search = createHybridSearch(mockVectorStore, mockEmbeddingService, {
      limit: 100,
      minScore: 0.5,
    });

    const config = search.getConfig();
    expect(config.limit).toBe(100);
    expect(config.minScore).toBe(0.5);
  });
});

describe('Performance', () => {
  it('should complete search within 200ms', async () => {
    const mockEmbeddingService = createMockEmbeddingService();
    const mockVectorStore = createMockVectorStore([
      { id: 'doc1', score: 0.9, metadata: {} },
    ]);
    const hybridSearch = new HybridSearch(mockVectorStore, mockEmbeddingService);

    const start = Date.now();
    await hybridSearch.search({ query: 'test' });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(200);
  });
});
