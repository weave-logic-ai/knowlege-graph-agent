/**
 * Preference Signal Chunker Tests
 *
 * Tests for preference memory chunking at decision points.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { PreferenceSignalChunker } from '../../../src/chunking/plugins/preference-signal-chunker.js';
import type { ChunkingConfig } from '../../../src/chunking/types.js';

describe('PreferenceSignalChunker', () => {
  let chunker: PreferenceSignalChunker;

  beforeEach(() => {
    chunker = new PreferenceSignalChunker();
  });

  describe('Basic Functionality', () => {
    it('should have correct name', () => {
      expect(chunker.name).toBe('preference-signal');
    });

    it('should provide default config', () => {
      const config = chunker.getDefaultConfig();
      expect(config.maxTokens).toBe(256);
      expect(config.overlap).toBe(10);
      expect(config.decisionKeywords).toEqual([
        'selected plan',
        'satisfaction rating',
        'preference',
        'decision',
        'chose',
        'rejected',
      ]);
      expect(config.includeAlternatives).toBe(true);
    });

    it('should validate valid config', () => {
      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        decisionKeywords: ['selected', 'chose'],
      };

      const result = chunker.validate(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Decision Point Detection', () => {
    it('should detect "selected plan" decisions', async () => {
      const document = `We considered three approaches for the API design.

**Selected plan**: Use REST with JSON responses.

The alternatives were GraphQL and gRPC, but REST provides better compatibility.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        decisionKeywords: ['selected plan'],
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBeGreaterThan(0);
      const hasDecision = result.chunks.some(c =>
        c.content.toLowerCase().includes('selected plan')
      );
      expect(hasDecision).toBe(true);
    });

    it('should detect "decision" keywords', async () => {
      const document = `After reviewing the options, I made a decision to proceed with TypeScript.

The decision was based on type safety and better IDE support.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        decisionKeywords: ['decision'],
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBeGreaterThan(0);
      const hasDecision = result.chunks.some(c =>
        c.content.toLowerCase().includes('decision')
      );
      expect(hasDecision).toBe(true);
    });

    it('should detect multiple decision keywords', async () => {
      const document = `I chose option A because it was simpler.

Later, I rejected option B due to complexity.

My preference is for maintainable code.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        decisionKeywords: ['chose', 'rejected', 'preference'],
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBeGreaterThanOrEqual(3);
    });

    it('should detect satisfaction ratings', async () => {
      const document = `The implementation went well.

**Satisfaction rating**: 8/10

I would have preferred better documentation.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        decisionKeywords: ['satisfaction rating'],
      };

      const result = await chunker.chunk(document, config);

      const hasSatisfaction = result.chunks.some(c =>
        c.content.toLowerCase().includes('satisfaction rating')
      );
      expect(hasSatisfaction).toBe(true);
    });
  });

  describe('Alternatives Extraction', () => {
    it('should extract alternatives from bullet lists', async () => {
      const document = `We considered several frameworks:

- React (selected)
- Vue
- Angular
- Svelte

**Selected plan**: React for its ecosystem.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        includeAlternatives: true,
      };

      const result = await chunker.chunk(document, config);

      const hasAlternatives = result.chunks.some(c =>
        c.metadata.alternatives && c.metadata.alternatives.length > 0
      );
      expect(hasAlternatives).toBe(true);
    });

    it('should extract alternatives from numbered lists', async () => {
      const document = `Three database options:

1. PostgreSQL (chosen)
2. MySQL
3. MongoDB

Decision: PostgreSQL for ACID compliance.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        includeAlternatives: true,
      };

      const result = await chunker.chunk(document, config);

      const hasAlternatives = result.chunks.some(c =>
        c.metadata.alternatives && c.metadata.alternatives.length > 0
      );
      expect(hasAlternatives).toBe(true);
    });

    it('should not extract alternatives when disabled', async () => {
      const document = `Options considered:

- Option A
- Option B

Selected plan: Option A`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        includeAlternatives: false,
      };

      const result = await chunker.chunk(document, config);

      result.chunks.forEach(chunk => {
        expect(chunk.metadata.alternatives).toBeUndefined();
      });
    });
  });

  describe('Metadata', () => {
    it('should set correct metadata fields', async () => {
      const document = 'Decision: Use TypeScript for better type safety.';

      const config: ChunkingConfig = {
        docId: 'pref-doc-789',
        sourcePath: '/test/preferences.md',
      };

      const result = await chunker.chunk(document, config);

      const chunk = result.chunks[0];
      expect(chunk.metadata.doc_id).toBe('pref-doc-789');
      expect(chunk.metadata.source_path).toBe('/test/preferences.md');
      expect(chunk.metadata.content_type).toBe('preference');
      expect(chunk.metadata.memory_level).toBe('semantic');
      expect(chunk.metadata.strategy).toBe('preference-signal');
      expect(chunk.metadata.boundary_type).toBe('decision');
      expect(chunk.metadata.created_at).toBeInstanceOf(Date);
    });

    it('should store extracted alternatives in metadata', async () => {
      const document = `Considered:
- React
- Vue

Selected plan: React`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        includeAlternatives: true,
      };

      const result = await chunker.chunk(document, config);

      const chunkWithAlternatives = result.chunks.find(c =>
        c.metadata.alternatives && c.metadata.alternatives.length > 0
      );

      if (chunkWithAlternatives) {
        expect(chunkWithAlternatives.metadata.alternatives).toContain('React');
        expect(chunkWithAlternatives.metadata.alternatives).toContain('Vue');
      }
    });
  });

  describe('Statistics', () => {
    it('should compute correct statistics', async () => {
      const document = `Decision 1: Use REST API.

Decision 2: Use PostgreSQL.

Decision 3: Deploy on AWS.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        decisionKeywords: ['decision'],
      };

      const result = await chunker.chunk(document, config);

      expect(result.stats.totalChunks).toBeGreaterThan(0);
      expect(result.stats.strategy).toBe('preference-signal');
      expect(result.stats.avgChunkSize).toBeGreaterThan(0);
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

    it('should handle document with no decision points', async () => {
      const document = 'This is just regular text without any decisions.';

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
      };

      const result = await chunker.chunk(document, config);

      // Should create single chunk for entire document
      expect(result.chunks).toHaveLength(1);
      expect(result.chunks[0].content).toBe(document);
    });

    it('should handle case-insensitive keyword matching', async () => {
      const document = `SELECTED PLAN: Use uppercase.

selected plan: Use lowercase.

Selected Plan: Use titlecase.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        decisionKeywords: ['selected plan'],
      };

      const result = await chunker.chunk(document, config);

      // Should detect all variants
      expect(result.chunks.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle decisions at document boundaries', async () => {
      const document = `Selected plan: First decision.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks).toHaveLength(1);
      expect(result.chunks[0].content).toContain('Selected plan');
    });

    it('should handle custom decision keywords', async () => {
      const document = `I approve this approach.

I disapprove that method.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        decisionKeywords: ['approve', 'disapprove'],
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Context Window', () => {
    it('should include surrounding context for decisions', async () => {
      const document = `Background information about the project.

After careful consideration, I selected plan A.

This decision will impact future development.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        includeContext: true,
        contextWindowSize: 50,
      };

      const result = await chunker.chunk(document, config);

      const decisionChunk = result.chunks.find(c =>
        c.content.toLowerCase().includes('selected plan')
      );

      if (decisionChunk) {
        // Should include surrounding context
        expect(decisionChunk.content.length).toBeGreaterThan(50);
      }
    });
  });
});
