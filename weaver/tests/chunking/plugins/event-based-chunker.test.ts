/**
 * Event-Based Chunker Tests
 *
 * Tests for episodic memory chunking at event boundaries.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { EventBasedChunker } from '../../../src/chunking/plugins/event-based-chunker.js';
import type { ChunkingConfig } from '../../../src/chunking/types.js';

describe('EventBasedChunker', () => {
  let chunker: EventBasedChunker;

  beforeEach(() => {
    chunker = new EventBasedChunker();
  });

  describe('Basic Functionality', () => {
    it('should have correct name', () => {
      expect(chunker.name).toBe('event-based');
    });

    it('should provide default config', () => {
      const config = chunker.getDefaultConfig();
      expect(config.maxTokens).toBe(512);
      expect(config.overlap).toBe(20);
      expect(config.eventBoundaries).toBe('phase-transition');
      expect(config.temporalLinks).toBe(true);
    });

    it('should validate valid config', () => {
      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        maxTokens: 512,
        eventBoundaries: 'phase-transition',
      };

      const result = chunker.validate(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate missing docId', () => {
      const config: ChunkingConfig = {
        sourcePath: '/test/path.md',
        maxTokens: 512,
      };

      const result = chunker.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('docId is required');
    });
  });

  describe('Phase Transition Chunking', () => {
    it('should chunk at stage boundaries', async () => {
      const document = `## Stage: Perception

User asked to implement a new feature.

## Stage: Reasoning

Analyzed requirements and decided on approach.

## Stage: Execution

Implemented the feature with tests.

## Stage: Reflection

The implementation worked well. Learned about testing patterns.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        eventBoundaries: 'phase-transition',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks).toHaveLength(4);
      expect(result.chunks[0].content).toContain('Perception');
      expect(result.chunks[1].content).toContain('Reasoning');
      expect(result.chunks[2].content).toContain('Execution');
      expect(result.chunks[3].content).toContain('Reflection');
    });

    it('should chunk at frontmatter stage boundaries', async () => {
      const document = `---
stage: perception
---

User asked to implement a new feature.

---
stage: reasoning
---

Analyzed requirements.

---
stage: execution
---

Implemented the feature.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        eventBoundaries: 'phase-transition',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBeGreaterThanOrEqual(3);
      expect(result.chunks[0].metadata.content_type).toBe('episodic');
      expect(result.chunks[0].metadata.memory_level).toBe('episodic');
    });
  });

  describe('Temporal Linking', () => {
    it('should link chunks when temporalLinks is enabled', async () => {
      const document = `## Stage: Perception

First event.

## Stage: Reasoning

Second event.

## Stage: Execution

Third event.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        temporalLinks: true,
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks).toHaveLength(3);

      // First chunk should have next_chunk but no previous_chunk
      expect(result.chunks[0].metadata.previous_chunk).toBeUndefined();
      expect(result.chunks[0].metadata.next_chunk).toBe(result.chunks[1].id);

      // Middle chunk should have both links
      expect(result.chunks[1].metadata.previous_chunk).toBe(result.chunks[0].id);
      expect(result.chunks[1].metadata.next_chunk).toBe(result.chunks[2].id);

      // Last chunk should have previous_chunk but no next_chunk
      expect(result.chunks[2].metadata.previous_chunk).toBe(result.chunks[1].id);
      expect(result.chunks[2].metadata.next_chunk).toBeUndefined();
    });

    it('should not link chunks when temporalLinks is disabled', async () => {
      const document = `## Stage: Perception

First event.

## Stage: Reasoning

Second event.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        temporalLinks: false,
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks).toHaveLength(2);
      expect(result.chunks[0].metadata.next_chunk).toBeUndefined();
      expect(result.chunks[1].metadata.previous_chunk).toBeUndefined();
    });
  });

  describe('Metadata', () => {
    it('should set correct metadata fields', async () => {
      const document = `## Stage: Perception

Test event.`;

      const config: ChunkingConfig = {
        docId: 'test-doc-123',
        sourcePath: '/test/path.md',
      };

      const result = await chunker.chunk(document, config);

      const chunk = result.chunks[0];
      expect(chunk.metadata.doc_id).toBe('test-doc-123');
      expect(chunk.metadata.source_path).toBe('/test/path.md');
      expect(chunk.metadata.index).toBe(0);
      expect(chunk.metadata.content_type).toBe('episodic');
      expect(chunk.metadata.memory_level).toBe('episodic');
      expect(chunk.metadata.strategy).toBe('event-based');
      expect(chunk.metadata.boundary_type).toBe('event');
      expect(chunk.metadata.size_tokens).toBeGreaterThan(0);
      expect(chunk.metadata.created_at).toBeInstanceOf(Date);
    });

    it('should calculate token counts correctly', async () => {
      const document = `## Stage: Perception

This is a test sentence with approximately twenty tokens in it for testing purposes.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
      };

      const result = await chunker.chunk(document, config);

      const chunk = result.chunks[0];
      // Approximate: ~25 words × 4 chars/token ≈ 100 chars ≈ 25 tokens
      expect(chunk.metadata.size_tokens).toBeGreaterThan(10);
      expect(chunk.metadata.size_tokens).toBeLessThan(100);
    });
  });

  describe('Statistics', () => {
    it('should compute correct statistics', async () => {
      const document = `## Stage: Perception

First event with some content.

## Stage: Reasoning

Second event with different content.

## Stage: Execution

Third event with more content here.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.stats.totalChunks).toBe(3);
      expect(result.stats.strategy).toBe('event-based');
      expect(result.stats.avgChunkSize).toBeGreaterThan(0);
      expect(result.stats.minChunkSize).toBeGreaterThan(0);
      expect(result.stats.maxChunkSize).toBeGreaterThan(0);
      expect(result.stats.totalTokens).toBeGreaterThan(0);
      expect(result.stats.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.stats.minChunkSize).toBeLessThanOrEqual(result.stats.avgChunkSize);
      expect(result.stats.maxChunkSize).toBeGreaterThanOrEqual(result.stats.avgChunkSize);
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

    it('should handle document with no boundaries', async () => {
      const document = 'This is a document without any stage markers.';

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
      };

      const result = await chunker.chunk(document, config);

      // Should create single chunk for entire document
      expect(result.chunks).toHaveLength(1);
      expect(result.chunks[0].content).toBe(document);
    });

    it('should handle document with only whitespace between boundaries', async () => {
      const document = `## Stage: Perception



## Stage: Reasoning



`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
      };

      const result = await chunker.chunk(document, config);

      // Should filter out empty chunks
      expect(result.chunks.length).toBeLessThanOrEqual(2);
    });

    it('should handle single stage marker', async () => {
      const document = `## Stage: Perception

This is the only event.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks).toHaveLength(1);
      expect(result.chunks[0].content).toContain('Perception');
    });

    it('should handle consecutive stage markers', async () => {
      const document = `## Stage: Perception
## Stage: Reasoning
## Stage: Execution

Some content here.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
      };

      const result = await chunker.chunk(document, config);

      // Should handle boundaries properly
      expect(result.chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Learning Session Integration', () => {
    it('should preserve learning_session_id when provided', async () => {
      const document = `## Stage: Perception

Test content.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        learningSessionId: 'session-123',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks[0].metadata.learning_session_id).toBe('session-123');
    });

    it('should preserve stage information when provided', async () => {
      const document = `## Stage: Perception

Test content.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        stage: 'perception',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks[0].metadata.stage).toBe('perception');
    });
  });
});
