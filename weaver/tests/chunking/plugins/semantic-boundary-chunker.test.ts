/**
 * Semantic Boundary Chunker Tests
 *
 * Tests for semantic memory chunking at topic shift boundaries.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { SemanticBoundaryChunker } from '../../../src/chunking/plugins/semantic-boundary-chunker.js';
import type { ChunkingConfig } from '../../../src/chunking/types.js';

describe('SemanticBoundaryChunker', () => {
  let chunker: SemanticBoundaryChunker;

  beforeEach(() => {
    chunker = new SemanticBoundaryChunker();
  });

  describe('Basic Functionality', () => {
    it('should have correct name', () => {
      expect(chunker.name).toBe('semantic-boundary');
    });

    it('should provide default config', () => {
      const config = chunker.getDefaultConfig();
      expect(config.maxTokens).toBe(384);
      expect(config.similarityThreshold).toBe(0.75);
      expect(config.minChunkSize).toBe(128);
      expect(config.includeContext).toBe(true);
      expect(config.contextWindowSize).toBe(50);
    });

    it('should validate valid config', () => {
      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        maxTokens: 384,
        similarityThreshold: 0.75,
      };

      const result = chunker.validate(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate invalid similarity threshold', () => {
      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        similarityThreshold: 1.5,
      };

      const result = chunker.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('similarityThreshold must be between 0 and 1');
    });
  });

  describe('Topic Shift Detection', () => {
    it('should detect topic shifts with low similarity', async () => {
      const document = `The machine learning model performed well on the test dataset. We achieved 95% accuracy with minimal overfitting. The training process took approximately 3 hours.

Regarding the user interface redesign, we chose a minimalist approach. The new color scheme uses blue and white tones. Navigation has been simplified to three main sections.

Database optimization showed significant improvements. Query response times decreased by 40%. We implemented proper indexing on frequently accessed columns.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        similarityThreshold: 0.3, // Low threshold = more chunks
      };

      const result = await chunker.chunk(document, config);

      // Should detect 3 distinct topics
      expect(result.chunks.length).toBeGreaterThanOrEqual(3);
    });

    it('should create fewer chunks with high similarity threshold', async () => {
      const document = `The machine learning model performed well. We achieved good accuracy. The training was successful.

The model training process worked effectively. We got excellent results. The accuracy was high.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        similarityThreshold: 0.9, // High threshold = fewer chunks
      };

      const result = await chunker.chunk(document, config);

      // High similarity threshold should group similar sentences
      expect(result.chunks.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Context Enrichment', () => {
    it('should add context before and after when enabled', async () => {
      const document = `First paragraph provides introduction. This sets the stage for what follows.

Main content discusses the key topic. This is the important part. We focus on details here.

Final paragraph wraps up the discussion. It provides closure and next steps.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        includeContext: true,
        contextWindowSize: 50,
        similarityThreshold: 0.3,
      };

      const result = await chunker.chunk(document, config);

      // At least one chunk should have context
      const hasContextBefore = result.chunks.some(c => c.metadata.context_before && c.metadata.context_before.length > 0);
      const hasContextAfter = result.chunks.some(c => c.metadata.context_after && c.metadata.context_after.length > 0);

      expect(hasContextBefore || hasContextAfter).toBe(true);
    });

    it('should not add context when disabled', async () => {
      const document = `First sentence here. Second sentence follows.

Third sentence in new paragraph. Fourth sentence continues.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        includeContext: false,
      };

      const result = await chunker.chunk(document, config);

      // No chunks should have context
      result.chunks.forEach(chunk => {
        expect(chunk.metadata.context_before).toBeUndefined();
        expect(chunk.metadata.context_after).toBeUndefined();
      });
    });

    it('should respect context window size', async () => {
      const document = `${'Very long introduction sentence. '.repeat(20)}

Main content here.

${'Very long conclusion sentence. '.repeat(20)}`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        includeContext: true,
        contextWindowSize: 50, // 50 tokens max
      };

      const result = await chunker.chunk(document, config);

      // Context should not exceed window size (50 tokens ≈ 200 chars)
      result.chunks.forEach(chunk => {
        if (chunk.metadata.context_before) {
          const tokens = Math.ceil(chunk.metadata.context_before.length / 4);
          expect(tokens).toBeLessThanOrEqual(60); // Allow some margin
        }
        if (chunk.metadata.context_after) {
          const tokens = Math.ceil(chunk.metadata.context_after.length / 4);
          expect(tokens).toBeLessThanOrEqual(60);
        }
      });
    });
  });

  describe('Token Limits', () => {
    it('should respect maxTokens limit', async () => {
      const document = `${'This is a test sentence. '.repeat(100)}`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        maxTokens: 100,
      };

      const result = await chunker.chunk(document, config);

      // All chunks should be under maxTokens
      result.chunks.forEach(chunk => {
        expect(chunk.metadata.size_tokens).toBeLessThanOrEqual(100);
      });
    });

    it('should enforce minimum chunk size', async () => {
      const document = `Short. Tiny. Small. Brief. Mini. Compact. Little. Petite.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        minChunkSize: 50,
      };

      const result = await chunker.chunk(document, config);

      // Most chunks should meet minimum size
      const tooSmall = result.chunks.filter(c => c.metadata.size_tokens < 50);
      expect(tooSmall.length).toBeLessThan(result.chunks.length);
    });
  });

  describe('Metadata', () => {
    it('should set correct metadata fields', async () => {
      const document = 'Test sentence for metadata.';

      const config: ChunkingConfig = {
        docId: 'test-doc-456',
        sourcePath: '/test/reflection.md',
      };

      const result = await chunker.chunk(document, config);

      const chunk = result.chunks[0];
      expect(chunk.metadata.doc_id).toBe('test-doc-456');
      expect(chunk.metadata.source_path).toBe('/test/reflection.md');
      expect(chunk.metadata.index).toBe(0);
      expect(chunk.metadata.content_type).toBe('semantic');
      expect(chunk.metadata.memory_level).toBe('semantic');
      expect(chunk.metadata.strategy).toBe('semantic-boundary');
      expect(chunk.metadata.boundary_type).toBe('semantic');
      expect(chunk.metadata.created_at).toBeInstanceOf(Date);
    });
  });

  describe('Statistics', () => {
    it('should compute correct statistics', async () => {
      const document = `First topic with several sentences. This continues the first topic. More content for first topic.

Second topic starts here. This is different from the first. Second topic continues.

Third topic is introduced. Final thoughts on third topic.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        similarityThreshold: 0.3,
      };

      const result = await chunker.chunk(document, config);

      expect(result.stats.totalChunks).toBeGreaterThan(0);
      expect(result.stats.strategy).toBe('semantic-boundary');
      expect(result.stats.avgChunkSize).toBeGreaterThan(0);
      expect(result.stats.totalTokens).toBeGreaterThan(0);
      expect(result.stats.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty document', async () => {
      const document = '';

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks).toHaveLength(0);
      expect(result.warnings).toContain('Document is empty');
    });

    it('should handle single sentence', async () => {
      const document = 'This is a single sentence.';

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks).toHaveLength(1);
      expect(result.chunks[0].content).toBe(document);
    });

    it('should handle document with no sentence delimiters', async () => {
      const document = 'This is all one long text without proper punctuation';

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks).toHaveLength(1);
    });

    it('should handle very high similarity (identical sentences)', async () => {
      const document = 'Same sentence. Same sentence. Same sentence. Same sentence.';

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        similarityThreshold: 0.75,
      };

      const result = await chunker.chunk(document, config);

      // Should group identical sentences together
      expect(result.chunks.length).toBeLessThanOrEqual(2);
    });

    it('should handle mixed punctuation', async () => {
      const document = 'First sentence! Second question? Third statement. Fourth exclamation!';

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Concepts Extraction', () => {
    it('should preserve concepts when provided', async () => {
      const document = 'Discussion about machine learning and neural networks.';

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        concepts: ['machine-learning', 'neural-networks'],
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks[0].metadata.concepts).toContain('machine-learning');
      expect(result.chunks[0].metadata.concepts).toContain('neural-networks');
    });
  });
});
