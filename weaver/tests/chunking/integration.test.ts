/**
 * Chunking Integration Tests
 *
 * End-to-end tests for the complete chunking system including
 * strategy selection, chunking, and metadata generation.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { StrategySelector } from '../../src/chunking/strategy-selector.js';
import type { ChunkingConfig, ContentType } from '../../src/chunking/types.js';

describe('Chunking Integration', () => {
  let selector: StrategySelector;

  beforeEach(() => {
    selector = new StrategySelector();
  });

  describe('End-to-End Episodic Memory', () => {
    it('should process complete task experience document', async () => {
      const document = `## Stage: Perception

User asked: "Please implement a login form with validation."

## Stage: Reasoning

Analyzed requirements:
- Email and password fields
- Client-side validation
- Error messages
- Submit button

Decided to use React with Formik for form handling.

## Stage: Execution

Created LoginForm component with validation schema.
Implemented email format validation and password strength checks.
Added error message display logic.

## Stage: Reflection

Implementation successful. Form works well with good UX.
Learned about Formik's validation patterns.
Future improvement: Add "forgot password" link.`;

      const config: ChunkingConfig = {
        docId: 'task-exp-001',
        sourcePath: '/sessions/2024-01-15/task-001.md',
        learningSessionId: 'session-20240115',
        temporalLinks: true,
        eventBoundaries: 'phase-transition',
      };

      const chunker = selector.selectStrategy('episodic');
      const result = await chunker.chunk(document, config);

      // Verify chunking
      expect(result.chunks).toHaveLength(4);
      expect(result.chunks[0].content).toContain('Perception');
      expect(result.chunks[1].content).toContain('Reasoning');
      expect(result.chunks[2].content).toContain('Execution');
      expect(result.chunks[3].content).toContain('Reflection');

      // Verify temporal linking
      expect(result.chunks[0].metadata.next_chunk).toBe(result.chunks[1].id);
      expect(result.chunks[1].metadata.previous_chunk).toBe(result.chunks[0].id);
      expect(result.chunks[3].metadata.previous_chunk).toBe(result.chunks[2].id);

      // Verify metadata
      result.chunks.forEach(chunk => {
        expect(chunk.metadata.doc_id).toBe('task-exp-001');
        expect(chunk.metadata.content_type).toBe('episodic');
        expect(chunk.metadata.memory_level).toBe('episodic');
        expect(chunk.metadata.learning_session_id).toBe('session-20240115');
        expect(chunk.metadata.strategy).toBe('event-based');
      });

      // Verify statistics
      expect(result.stats.totalChunks).toBe(4);
      expect(result.stats.avgChunkSize).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Semantic Memory', () => {
    it('should process complete reflection document', async () => {
      const document = `# React State Management Insights

I've learned that useState is great for simple component state. It works well for toggles, form inputs, and local UI state.

For more complex state, useReducer provides better organization. It's especially useful when state updates depend on previous state. The reducer pattern makes state changes more predictable.

Context API solves prop drilling but comes with performance trade-offs. Every context update re-renders all consumers. For frequently changing data, consider splitting contexts or using a state management library.

Redux remains valuable for large applications. The explicit action/reducer pattern provides excellent debugging through time-travel. However, the boilerplate can be overwhelming for smaller projects.`;

      const config: ChunkingConfig = {
        docId: 'reflection-001',
        sourcePath: '/reflections/react-state-management.md',
        similarityThreshold: 0.3, // Lower threshold for more topic detection
        includeContext: true,
        contextWindowSize: 50,
        concepts: ['react', 'state-management', 'hooks'],
      };

      const chunker = selector.selectStrategy('semantic');
      const result = await chunker.chunk(document, config);

      // Should detect topic shifts (useState → useReducer → Context → Redux)
      expect(result.chunks.length).toBeGreaterThanOrEqual(3);

      // Verify context enrichment
      const hasContext = result.chunks.some(c =>
        c.metadata.context_before || c.metadata.context_after
      );
      expect(hasContext).toBe(true);

      // Verify metadata
      result.chunks.forEach(chunk => {
        expect(chunk.metadata.doc_id).toBe('reflection-001');
        expect(chunk.metadata.content_type).toBe('semantic');
        expect(chunk.metadata.memory_level).toBe('semantic');
        expect(chunk.metadata.strategy).toBe('semantic-boundary');
        expect(chunk.metadata.concepts).toContain('react');
      });
    });
  });

  describe('End-to-End Preference Memory', () => {
    it('should process complete decision document', async () => {
      const document = `# Database Selection Decision

We evaluated three database options:

- PostgreSQL (enterprise-grade, ACID compliance)
- MongoDB (flexible schema, horizontal scaling)
- MySQL (widespread support, mature ecosystem)

After team discussion, we **selected plan**: PostgreSQL

**Reasons for decision:**
1. ACID compliance required for financial transactions
2. Strong JSON support for flexible data
3. Better performance for complex queries
4. Team has PostgreSQL experience

**Rejected alternatives:**
- MongoDB: Concerns about consistency guarantees
- MySQL: Limited JSON capabilities

**Satisfaction rating**: 9/10

Very confident in this choice. PostgreSQL provides the reliability we need while remaining flexible.`;

      const config: ChunkingConfig = {
        docId: 'decision-001',
        sourcePath: '/decisions/database-selection.md',
        includeAlternatives: true,
        decisionKeywords: ['selected plan', 'satisfaction rating', 'decision'],
      };

      const chunker = selector.selectStrategy('preference');
      const result = await chunker.chunk(document, config);

      // Should detect decision points
      expect(result.chunks.length).toBeGreaterThan(0);

      // Verify alternatives extraction
      const hasAlternatives = result.chunks.some(c =>
        c.metadata.alternatives && c.metadata.alternatives.length > 0
      );
      expect(hasAlternatives).toBe(true);

      // Verify satisfaction rating captured
      const hasSatisfaction = result.chunks.some(c =>
        c.content.toLowerCase().includes('satisfaction rating')
      );
      expect(hasSatisfaction).toBe(true);

      // Verify metadata
      result.chunks.forEach(chunk => {
        expect(chunk.metadata.doc_id).toBe('decision-001');
        expect(chunk.metadata.content_type).toBe('preference');
        expect(chunk.metadata.strategy).toBe('preference-signal');
      });
    });
  });

  describe('End-to-End Procedural Memory', () => {
    it('should process complete SOP document', async () => {
      const document = `# Deployment Standard Operating Procedure

## Step 1: Pre-Deployment Checks

**Prerequisites:**
- Code reviewed and approved
- All tests passing
- Staging environment verified

**Actions:**
1. Run final test suite
2. Check database migrations
3. Verify environment variables

**Expected Outcome:**
- Zero test failures
- Migration scripts validated

## Step 2: Database Migration

**Prerequisites:**
- Database backup completed
- Migration scripts tested in staging

**Actions:**
1. Create production database backup
2. Run migration in transaction
3. Verify schema changes

**Expected Outcome:**
- Schema updated successfully
- No data loss
- Application can connect

## Step 3: Application Deployment

**Prerequisites:**
- Docker image built
- Kubernetes manifests updated

**Actions:**
1. Push Docker image to registry
2. Apply Kubernetes manifests
3. Monitor pod startup
4. Run smoke tests

**Expected Outcome:**
- Pods running healthy
- API endpoints responding
- No error logs`;

      const config: ChunkingConfig = {
        docId: 'sop-001',
        sourcePath: '/sops/deployment.md',
        sopId: 'sop-deploy-v1',
        includePrerequisites: true,
        includeOutcomes: true,
        stepDelimiters: ['##'],
      };

      const chunker = selector.selectStrategy('procedural');
      const result = await chunker.chunk(document, config);

      // Should chunk into 3 steps
      expect(result.chunks).toHaveLength(3);

      // Verify sequential linking
      expect(result.chunks[0].metadata.next_chunk).toBe(result.chunks[1].id);
      expect(result.chunks[1].metadata.previous_chunk).toBe(result.chunks[0].id);
      expect(result.chunks[1].metadata.next_chunk).toBe(result.chunks[2].id);

      // Verify prerequisites extraction
      const hasPrerequisites = result.chunks.some(c =>
        c.metadata.prerequisites && c.metadata.prerequisites.length > 0
      );
      expect(hasPrerequisites).toBe(true);

      // Verify outcomes extraction
      const hasOutcomes = result.chunks.some(c =>
        c.metadata.outcomes && c.metadata.outcomes.length > 0
      );
      expect(hasOutcomes).toBe(true);

      // Verify metadata
      result.chunks.forEach(chunk => {
        expect(chunk.metadata.doc_id).toBe('sop-001');
        expect(chunk.metadata.sop_id).toBe('sop-deploy-v1');
        expect(chunk.metadata.content_type).toBe('procedural');
        expect(chunk.metadata.strategy).toBe('step-based');
      });
    });
  });

  describe('Multi-Strategy Workflow', () => {
    it('should handle different content types in sequence', async () => {
      const contentTypes: ContentType[] = ['episodic', 'semantic', 'preference', 'procedural'];
      const documents = {
        episodic: '## Stage: Perception\n\nTask started.\n\n## Stage: Reflection\n\nTask completed.',
        semantic: 'First topic here. Second topic follows.',
        preference: 'Selected plan: Use TypeScript.',
        procedural: '## Step 1\n\nFirst step.\n\n## Step 2\n\nSecond step.',
      };

      for (const contentType of contentTypes) {
        const config: ChunkingConfig = {
          docId: `test-${contentType}`,
          sourcePath: `/test/${contentType}.md`,
        };

        const chunker = selector.selectStrategy(contentType);
        const result = await chunker.chunk(documents[contentType], config);

        // All strategies should produce chunks
        expect(result.chunks.length).toBeGreaterThan(0);

        // All chunks should have correct content type
        result.chunks.forEach(chunk => {
          expect(chunk.metadata.content_type).toBe(contentType);
        });
      }
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle empty documents gracefully', async () => {
      const contentTypes: ContentType[] = ['episodic', 'semantic', 'preference', 'procedural'];

      for (const contentType of contentTypes) {
        const config: ChunkingConfig = {
          docId: 'test-empty',
          sourcePath: '/test/empty.md',
        };

        const chunker = selector.selectStrategy(contentType);
        const result = await chunker.chunk('', config);

        expect(result.chunks).toHaveLength(0);
        expect(result.warnings).toContain('Document is empty');
      }
    });

    it('should validate config before chunking', async () => {
      const chunker = selector.selectStrategy('semantic');

      const invalidConfig: ChunkingConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        similarityThreshold: 1.5, // Invalid
      };

      const validation = chunker.validate(invalidConfig);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Statistics', () => {
    it('should provide detailed statistics for large documents', async () => {
      // Generate large document
      const paragraphs = [];
      for (let i = 0; i < 50; i++) {
        paragraphs.push(`Paragraph ${i}: ${'Lorem ipsum dolor sit amet. '.repeat(20)}`);
      }
      const largeDocument = paragraphs.join('\n\n');

      const config: ChunkingConfig = {
        docId: 'large-doc',
        sourcePath: '/test/large.md',
        maxTokens: 200,
      };

      const chunker = selector.selectStrategy('semantic');
      const result = await chunker.chunk(largeDocument, config);

      // Should create multiple chunks
      expect(result.chunks.length).toBeGreaterThan(10);

      // Statistics should be comprehensive
      expect(result.stats.totalChunks).toBe(result.chunks.length);
      expect(result.stats.totalTokens).toBeGreaterThan(0);
      expect(result.stats.avgChunkSize).toBeGreaterThan(0);
      expect(result.stats.minChunkSize).toBeLessThanOrEqual(result.stats.avgChunkSize);
      expect(result.stats.maxChunkSize).toBeGreaterThanOrEqual(result.stats.avgChunkSize);
      expect(result.stats.durationMs).toBeGreaterThan(0);
    });
  });

  describe('Chunk Metadata Completeness', () => {
    it('should generate complete metadata for all chunk types', async () => {
      const config: ChunkingConfig = {
        docId: 'metadata-test',
        sourcePath: '/test/metadata.md',
        learningSessionId: 'session-123',
        stage: 'execution',
        concepts: ['testing', 'chunking'],
        sopId: 'sop-456',
      };

      const episodicChunker = selector.selectStrategy('episodic');
      const episodicResult = await episodicChunker.chunk('## Stage: Perception\n\nTest.', config);

      const chunk = episodicResult.chunks[0];

      // Core identifiers
      expect(chunk.id).toBeDefined();
      expect(chunk.metadata.chunk_id).toBeDefined();
      expect(chunk.metadata.doc_id).toBe('metadata-test');
      expect(chunk.metadata.source_path).toBe('/test/metadata.md');
      expect(chunk.metadata.index).toBe(0);

      // Content classification
      expect(chunk.metadata.content_type).toBe('episodic');
      expect(chunk.metadata.memory_level).toBe('episodic');

      // Chunking metadata
      expect(chunk.metadata.strategy).toBe('event-based');
      expect(chunk.metadata.size_tokens).toBeGreaterThan(0);
      expect(chunk.metadata.boundary_type).toBe('event');

      // Temporal metadata
      expect(chunk.metadata.created_at).toBeInstanceOf(Date);

      // Learning metadata
      expect(chunk.metadata.learning_session_id).toBe('session-123');
      expect(chunk.metadata.stage).toBe('execution');
      expect(chunk.metadata.concepts).toContain('testing');
      expect(chunk.metadata.sop_id).toBe('sop-456');
    });
  });
});
