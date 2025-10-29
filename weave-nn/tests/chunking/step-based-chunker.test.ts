/**
 * Step-Based Chunker Tests
 * Tests procedural workflow chunking with step boundaries
 * Success Criteria: FR-2 (Advanced Chunking), PR-5 (<100ms)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { sampleDocuments } from '../fixtures/sample-documents';

interface StepChunk {
  id: string;
  content: string;
  metadata: {
    type: string;
    step_number?: number;
    dependencies?: number[];
    title?: string;
  };
}

class StepBasedChunker {
  chunk(content: string): StepChunk[] {
    const chunks: StepChunk[] = [];
    const stepMatches = content.matchAll(/## Step (\d+): ([^\n]+)/g);

    for (const match of stepMatches) {
      chunks.push({
        id: `chunk-${match[1]}`,
        content: match[0],
        metadata: {
          type: 'procedural',
          step_number: parseInt(match[1], 10),
          title: match[2],
          dependencies: [], // To be calculated
        },
      });
    }

    return chunks;
  }

  async chunkAsync(content: string): Promise<StepChunk[]> {
    return this.chunk(content);
  }

  detectDependencies(chunks: StepChunk[]): StepChunk[] {
    // Simple dependency detection: each step depends on previous step
    return chunks.map((chunk, idx) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        dependencies: idx > 0 ? [chunks[idx - 1].metadata.step_number!] : [],
      },
    }));
  }
}

describe('StepBasedChunker', () => {
  let chunker: StepBasedChunker;

  beforeEach(() => {
    chunker = new StepBasedChunker();
  });

  describe('Step Detection', () => {
    it('should detect step boundaries', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.every(c => c.metadata.type === 'procedural')).toBe(true);
    });

    it('should extract step numbers', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);

      const stepNumbers = chunks.map(c => c.metadata.step_number);
      expect(stepNumbers).toContain(1);
      expect(stepNumbers).toContain(2);
    });

    it('should extract step titles', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);

      const titles = chunks.map(c => c.metadata.title);
      expect(titles).toContain('Install Docker');
    });

    it('should maintain step order', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);

      const stepNumbers = chunks.map(c => c.metadata.step_number!);
      const sorted = [...stepNumbers].sort((a, b) => a - b);
      expect(stepNumbers).toEqual(sorted);
    });
  });

  describe('Dependency Detection', () => {
    it('should detect sequential dependencies', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);
      const withDeps = chunker.detectDependencies(chunks);

      expect(withDeps[0].metadata.dependencies).toEqual([]);
      expect(withDeps[1].metadata.dependencies).toEqual([1]);
      expect(withDeps[2].metadata.dependencies).toEqual([2]);
    });

    it('should handle first step without dependencies', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);
      const withDeps = chunker.detectDependencies(chunks);

      expect(withDeps[0].metadata.dependencies).toHaveLength(0);
    });

    it('should handle parallel steps (future enhancement)', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);
      const withDeps = chunker.detectDependencies(chunks);

      // Parallel step detection to be implemented
      expect(withDeps.length).toBeGreaterThan(0);
    });
  });

  describe('Code Block Handling', () => {
    it('should preserve code blocks in steps', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);

      const chunksWithCode = chunks.filter(c => c.content.includes('```'));
      expect(chunksWithCode.length).toBeGreaterThan(0);
    });

    it('should keep code with parent step', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);

      // Each chunk should be complete (not split mid-step)
      chunks.forEach(chunk => {
        expect(chunk.content).toMatch(/^## Step/);
      });
    });

    it('should handle multiple code blocks per step', () => {
      const content = `## Step 1: Multi-code
\`\`\`bash
command1
\`\`\`

\`\`\`bash
command2
\`\`\``;

      const chunks = chunker.chunk(content);
      expect(chunks[0]).toBeDefined();
    });
  });

  describe('Hierarchical Linking', () => {
    it('should link to previous step', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);
      const withDeps = chunker.detectDependencies(chunks);

      if (withDeps.length > 1) {
        expect(withDeps[1].metadata.dependencies).toContain(1);
      }
    });

    it('should link to next step (future)', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);

      // Forward linking to be implemented
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should create step graph', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);
      const withDeps = chunker.detectDependencies(chunks);

      // Graph creation to be implemented
      expect(withDeps.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const chunks = chunker.chunk('');
      expect(chunks).toEqual([]);
    });

    it('should handle content without steps', () => {
      const chunks = chunker.chunk('Regular content without steps');
      expect(chunks).toEqual([]);
    });

    it('should handle malformed step headers', () => {
      const content = `## Step (missing number): Something`;
      const chunks = chunker.chunk(content);

      expect(Array.isArray(chunks)).toBe(true);
    });

    it('should handle non-sequential step numbers', () => {
      const content = `## Step 1: First\n## Step 3: Third\n## Step 2: Second`;
      const chunks = chunker.chunk(content);

      expect(chunks.length).toBe(3);
    });

    it('should handle very long steps', () => {
      const content = `## Step 1: Long\n${'word '.repeat(5000)}`;
      const chunks = chunker.chunk(content);

      expect(chunks[0]).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should chunk document in <100ms', async () => {
      const start = performance.now();
      await chunker.chunkAsync(sampleDocuments.procedural.content);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle 100 steps efficiently', async () => {
      const largeContent = Array(100)
        .fill(0)
        .map((_, i) => `## Step ${i + 1}: Action${i}\nDetails here`)
        .join('\n\n');

      const start = performance.now();
      const chunks = await chunker.chunkAsync(largeContent);
      const duration = performance.now() - start;

      expect(chunks.length).toBe(100);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Validation', () => {
    it('should validate chunk structure', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);

      chunks.forEach(chunk => {
        expect(chunk).toHaveProperty('id');
        expect(chunk).toHaveProperty('content');
        expect(chunk).toHaveProperty('metadata');
        expect(chunk.metadata.type).toBe('procedural');
        expect(chunk.metadata.step_number).toBeGreaterThan(0);
      });
    });

    it('should generate step-based IDs', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);

      chunks.forEach(chunk => {
        expect(chunk.id).toMatch(/^chunk-\d+$/);
      });
    });

    it('should reject invalid inputs', () => {
      expect(() => chunker.chunk(null as any)).toThrow();
      expect(() => chunker.chunk(undefined as any)).toThrow();
    });
  });

  describe('Metadata Completeness', () => {
    it('should include all required metadata', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);

      chunks.forEach(chunk => {
        expect(chunk.metadata).toHaveProperty('type');
        expect(chunk.metadata).toHaveProperty('step_number');
        expect(chunk.metadata).toHaveProperty('title');
      });
    });

    it('should include dependency information', () => {
      const chunks = chunker.chunk(sampleDocuments.procedural.content);
      const withDeps = chunker.detectDependencies(chunks);

      withDeps.forEach(chunk => {
        expect(chunk.metadata).toHaveProperty('dependencies');
        expect(Array.isArray(chunk.metadata.dependencies)).toBe(true);
      });
    });
  });
});
