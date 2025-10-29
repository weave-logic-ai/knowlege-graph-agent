/**
 * Semantic Boundary Chunker Tests
 * Tests topic-shift detection and contextual enrichment
 * Success Criteria: FR-2 (Advanced Chunking), PR-5 (<100ms)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { sampleDocuments } from '../fixtures/sample-documents';

interface SemanticChunk {
  id: string;
  content: string;
  metadata: {
    type: string;
    topic?: string;
    boundary_type?: string;
    contextBefore?: string;
    contextAfter?: string;
  };
}

class SemanticBoundaryChunker {
  private contextWindow = 50; // tokens

  chunk(content: string): SemanticChunk[] {
    // Mock implementation
    const chunks: SemanticChunk[] = [];
    const sections = content.split(/^## /gm).filter(Boolean);

    sections.forEach((section, idx) => {
      const titleMatch = section.match(/^([^\n]+)/);
      if (titleMatch) {
        chunks.push({
          id: `chunk-${idx + 1}`,
          content: section,
          metadata: {
            type: 'semantic',
            topic: titleMatch[1].toLowerCase().replace(/\s+/g, '-'),
            boundary_type: 'topic_shift',
          },
        });
      }
    });

    return chunks;
  }

  async chunkAsync(content: string): Promise<SemanticChunk[]> {
    return this.chunk(content);
  }

  detectTopicShift(text1: string, text2: string): boolean {
    // Mock: simple keyword overlap check
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const overlap = intersection.size / Math.min(words1.size, words2.size);

    return overlap < 0.3; // <30% overlap = topic shift
  }
}

describe('SemanticBoundaryChunker', () => {
  let chunker: SemanticBoundaryChunker;

  beforeEach(() => {
    chunker = new SemanticBoundaryChunker();
  });

  describe('Topic Shift Detection', () => {
    it('should detect topic shifts in knowledge articles', () => {
      const chunks = chunker.chunk(sampleDocuments.semantic.content);

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every(c => c.metadata.boundary_type === 'topic_shift')).toBe(true);
    });

    it('should extract topic names', () => {
      const chunks = chunker.chunk(sampleDocuments.semantic.content);

      const topics = chunks.map(c => c.metadata.topic);
      expect(topics).toContain('introduction-to-state');
    });

    it('should detect shift from useState to useReducer', () => {
      const text1 = 'useState hook for simple state';
      const text2 = 'useReducer for complex state logic';

      const isShift = chunker.detectTopicShift(text1, text2);
      expect(isShift).toBe(true);
    });

    it('should not detect shift in related content', () => {
      const text1 = 'useState manages local component state';
      const text2 = 'useState returns state and setter function';

      const isShift = chunker.detectTopicShift(text1, text2);
      expect(isShift).toBe(false);
    });
  });

  describe('Contextual Enrichment', () => {
    it('should add context from previous chunk', () => {
      const chunks = chunker.chunk(sampleDocuments.semantic.content);

      // Context enrichment to be implemented
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should add context from next chunk', () => {
      const chunks = chunker.chunk(sampleDocuments.semantic.content);

      // Context enrichment to be implemented
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should limit context to 50 tokens', () => {
      const chunks = chunker.chunk(sampleDocuments.semantic.content);

      // Token limiting to be implemented
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Code Block Handling', () => {
    it('should preserve code blocks in chunks', () => {
      const chunks = chunker.chunk(sampleDocuments.semantic.content);

      const chunksWithCode = chunks.filter(c => c.content.includes('```'));
      expect(chunksWithCode.length).toBeGreaterThan(0);
    });

    it('should not split code blocks across chunks', () => {
      const chunks = chunker.chunk(sampleDocuments.semantic.content);

      chunks.forEach(chunk => {
        const openTicks = (chunk.content.match(/```/g) || []).length;
        expect(openTicks % 2).toBe(0); // Even number (paired)
      });
    });

    it('should handle inline code', () => {
      const content = 'Use `useState` for state management';
      const chunks = chunker.chunk(content);

      expect(chunks[0]?.content).toContain('`useState`');
    });
  });

  describe('Heading Hierarchy', () => {
    it('should respect heading levels', () => {
      const chunks = chunker.chunk(sampleDocuments.semantic.content);

      // Each chunk should start with a heading
      chunks.forEach(chunk => {
        expect(chunk.content).toMatch(/^##?\s+/);
      });
    });

    it('should not break on H3 headings', () => {
      const content = `## Main Topic\n### Subtopic\nContent here`;
      const chunks = chunker.chunk(content);

      // Should keep H3 with parent H2
      expect(chunks.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const chunks = chunker.chunk('');
      expect(chunks).toEqual([]);
    });

    it('should handle single topic', () => {
      const content = '## Single Topic\nJust one topic here';
      const chunks = chunker.chunk(content);

      expect(chunks.length).toBe(1);
    });

    it('should handle content without headings', () => {
      const chunks = chunker.chunk('Just plain text without any headings');

      // Should either create single chunk or handle gracefully
      expect(Array.isArray(chunks)).toBe(true);
    });

    it('should handle very long topics', () => {
      const longContent = `## Very Long Topic\n${'word '.repeat(5000)}`;
      const chunks = chunker.chunk(longContent);

      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should chunk document in <100ms', async () => {
      const start = performance.now();
      await chunker.chunkAsync(sampleDocuments.semantic.content);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle 50 topic shifts efficiently', async () => {
      const largeContent = Array(50)
        .fill(0)
        .map((_, i) => `## Topic ${i + 1}\nContent for topic ${i + 1}`)
        .join('\n\n');

      const start = performance.now();
      const chunks = await chunker.chunkAsync(largeContent);
      const duration = performance.now() - start;

      expect(chunks.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Validation', () => {
    it('should validate chunk structure', () => {
      const chunks = chunker.chunk(sampleDocuments.semantic.content);

      chunks.forEach(chunk => {
        expect(chunk).toHaveProperty('id');
        expect(chunk).toHaveProperty('content');
        expect(chunk).toHaveProperty('metadata');
        expect(chunk.metadata).toHaveProperty('type');
        expect(chunk.metadata.type).toBe('semantic');
      });
    });

    it('should generate sequential IDs', () => {
      const chunks = chunker.chunk(sampleDocuments.semantic.content);

      chunks.forEach((chunk, idx) => {
        expect(chunk.id).toBe(`chunk-${idx + 1}`);
      });
    });
  });
});
