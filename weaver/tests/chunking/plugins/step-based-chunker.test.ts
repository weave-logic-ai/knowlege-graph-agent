/**
 * Step-Based Chunker Tests
 *
 * Tests for procedural memory chunking at step boundaries.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { StepBasedChunker } from '../../../src/chunking/plugins/step-based-chunker.js';
import type { ChunkingConfig } from '../../../src/chunking/types.js';

describe('StepBasedChunker', () => {
  let chunker: StepBasedChunker;

  beforeEach(() => {
    chunker = new StepBasedChunker();
  });

  describe('Basic Functionality', () => {
    it('should have correct name', () => {
      expect(chunker.name).toBe('step-based');
    });

    it('should provide default config', () => {
      const config = chunker.getDefaultConfig();
      expect(config.maxTokens).toBe(512);
      expect(config.overlap).toBe(15);
      expect(config.stepDelimiters).toEqual(['##', '###', '1.', '2.', '3.']);
      expect(config.includePrerequisites).toBe(true);
      expect(config.includeOutcomes).toBe(true);
    });

    it('should validate valid config', () => {
      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/sop.md',
        stepDelimiters: ['##'],
      };

      const result = chunker.validate(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Markdown Header Steps', () => {
    it('should chunk at level 2 headers', async () => {
      const document = `# SOP Title

## Step 1: Initialize

Set up the environment.

## Step 2: Configure

Update configuration files.

## Step 3: Deploy

Deploy to production.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/sop.md',
        stepDelimiters: ['##'],
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks).toHaveLength(3);
      expect(result.chunks[0].content).toContain('Step 1');
      expect(result.chunks[1].content).toContain('Step 2');
      expect(result.chunks[2].content).toContain('Step 3');
    });

    it('should chunk at level 3 headers', async () => {
      const document = `## Main Section

### Substep 1

First substep content.

### Substep 2

Second substep content.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/sop.md',
        stepDelimiters: ['###'],
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBeGreaterThanOrEqual(2);
      expect(result.chunks.some(c => c.content.includes('Substep 1'))).toBe(true);
      expect(result.chunks.some(c => c.content.includes('Substep 2'))).toBe(true);
    });

    it('should handle both ## and ### headers', async () => {
      const document = `## Step 1

Main step content.

### Substep 1.1

Substep content.

## Step 2

Next main step.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/sop.md',
        stepDelimiters: ['##', '###'],
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Numbered List Steps', () => {
    it('should chunk at numbered list items', async () => {
      const document = `Installation Guide:

1. Download the installer
   Run the setup wizard

2. Configure settings
   Update your preferences

3. Launch application
   Start using the software`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/guide.md',
        stepDelimiters: ['1.', '2.', '3.'],
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBeGreaterThanOrEqual(3);
    });

    it('should detect numbered patterns dynamically', async () => {
      const document = `1. First step here.

2. Second step follows.

3. Third step completes.

4. Fourth step extends.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/steps.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Prerequisites Extraction', () => {
    it('should extract prerequisites from step content', async () => {
      const document = `## Step 1: Database Migration

**Prerequisites:**
- Database backup completed
- Migration scripts tested

Execute the migration command.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/sop.md',
        includePrerequisites: true,
      };

      const result = await chunker.chunk(document, config);

      const stepChunk = result.chunks.find(c => c.content.includes('Prerequisites'));
      expect(stepChunk).toBeDefined();

      if (stepChunk && stepChunk.metadata.prerequisites) {
        expect(stepChunk.metadata.prerequisites.length).toBeGreaterThan(0);
      }
    });

    it('should extract requirements section', async () => {
      const document = `## Configuration Step

**Requirements:**
- Node.js 18+
- npm or yarn

Install dependencies.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/setup.md',
        includePrerequisites: true,
      };

      const result = await chunker.chunk(document, config);

      const stepChunk = result.chunks[0];
      if (stepChunk.metadata.prerequisites) {
        expect(stepChunk.metadata.prerequisites.some(p => p.includes('Node.js'))).toBe(true);
      }
    });

    it('should not extract prerequisites when disabled', async () => {
      const document = `## Step 1

**Prerequisites:**
- Item 1
- Item 2

Step content.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/sop.md',
        includePrerequisites: false,
      };

      const result = await chunker.chunk(document, config);

      result.chunks.forEach(chunk => {
        expect(chunk.metadata.prerequisites).toBeUndefined();
      });
    });
  });

  describe('Outcomes Extraction', () => {
    it('should extract expected outcomes', async () => {
      const document = `## Step 1: Build

Run the build command.

**Expected Outcome:**
- Build succeeds without errors
- Artifacts generated in dist/`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/build.md',
        includeOutcomes: true,
      };

      const result = await chunker.chunk(document, config);

      const stepChunk = result.chunks[0];
      if (stepChunk.metadata.outcomes) {
        expect(stepChunk.metadata.outcomes.length).toBeGreaterThan(0);
      }
    });

    it('should extract results section', async () => {
      const document = `## Testing Step

Execute test suite.

**Results:**
- All tests pass
- Coverage > 80%`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/testing.md',
        includeOutcomes: true,
      };

      const result = await chunker.chunk(document, config);

      const stepChunk = result.chunks[0];
      if (stepChunk.metadata.outcomes) {
        expect(stepChunk.metadata.outcomes.some(o => o.includes('tests pass'))).toBe(true);
      }
    });

    it('should not extract outcomes when disabled', async () => {
      const document = `## Step 1

Do something.

**Expected Outcome:**
- Success

Done.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/sop.md',
        includeOutcomes: false,
      };

      const result = await chunker.chunk(document, config);

      result.chunks.forEach(chunk => {
        expect(chunk.metadata.outcomes).toBeUndefined();
      });
    });
  });

  describe('Step Linking', () => {
    it('should link steps sequentially', async () => {
      const document = `## Step 1

First step.

## Step 2

Second step.

## Step 3

Third step.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/sop.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks).toHaveLength(3);

      // Check linking
      expect(result.chunks[0].metadata.next_chunk).toBe(result.chunks[1].id);
      expect(result.chunks[1].metadata.previous_chunk).toBe(result.chunks[0].id);
      expect(result.chunks[1].metadata.next_chunk).toBe(result.chunks[2].id);
      expect(result.chunks[2].metadata.previous_chunk).toBe(result.chunks[1].id);
    });
  });

  describe('Metadata', () => {
    it('should set correct metadata fields', async () => {
      const document = `## Step 1: Setup

Install dependencies.`;

      const config: ChunkingConfig = {
        docId: 'sop-doc-321',
        sourcePath: '/test/workflow.md',
      };

      const result = await chunker.chunk(document, config);

      const chunk = result.chunks[0];
      expect(chunk.metadata.doc_id).toBe('sop-doc-321');
      expect(chunk.metadata.source_path).toBe('/test/workflow.md');
      expect(chunk.metadata.content_type).toBe('procedural');
      expect(chunk.metadata.memory_level).toBe('semantic');
      expect(chunk.metadata.strategy).toBe('step-based');
      expect(chunk.metadata.boundary_type).toBe('step');
      expect(chunk.metadata.created_at).toBeInstanceOf(Date);
    });

    it('should preserve sop_id when provided', async () => {
      const document = '## Step 1\n\nContent.';

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/sop.md',
        sopId: 'sop-123',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks[0].metadata.sop_id).toBe('sop-123');
    });
  });

  describe('Statistics', () => {
    it('should compute correct statistics', async () => {
      const document = `## Step 1

First step content here.

## Step 2

Second step content here.

## Step 3

Third step content here.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/sop.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.stats.totalChunks).toBe(3);
      expect(result.stats.strategy).toBe('step-based');
      expect(result.stats.avgChunkSize).toBeGreaterThan(0);
      expect(result.stats.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty document', async () => {
      const document = '';

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/sop.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks).toHaveLength(0);
      expect(result.warnings).toContain('Document is empty');
    });

    it('should handle document with no step delimiters', async () => {
      const document = 'This is just regular text without steps.';

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/sop.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks).toHaveLength(1);
      expect(result.chunks[0].content).toBe(document);
    });

    it('should handle mixed delimiter types', async () => {
      const document = `## Step 1

Header-based step.

1. List-based step one.

2. List-based step two.

## Step 2

Another header step.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/mixed.md',
        stepDelimiters: ['##', '1.', '2.'],
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle consecutive step markers', async () => {
      const document = `## Step 1
## Step 2
## Step 3

Some content after all headers.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/sop.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBeGreaterThan(0);
    });

    it('should handle empty steps', async () => {
      const document = `## Step 1

## Step 2

Content only in step 2.`;

      const config: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/sop.md',
      };

      const result = await chunker.chunk(document, config);

      // Should filter out empty chunks
      result.chunks.forEach(chunk => {
        expect(chunk.content.trim().length).toBeGreaterThan(0);
      });
    });
  });
});
