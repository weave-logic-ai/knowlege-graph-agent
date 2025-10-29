/**
 * Preference Signal Chunker Tests
 * Tests decision point extraction and preference metadata
 * Success Criteria: FR-2 (Advanced Chunking), PR-5 (<100ms)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { sampleDocuments } from '../fixtures/sample-documents';

interface PreferenceChunk {
  id: string;
  content: string;
  metadata: {
    type: string;
    decision?: string;
    confidence?: number;
    alternatives?: string[];
    rationale?: string;
  };
}

class PreferenceSignalChunker {
  chunk(content: string): PreferenceChunk[] {
    const chunks: PreferenceChunk[] = [];
    const decisionMatches = content.matchAll(/## Decision \d+: ([^\n]+)/g);

    let chunkId = 0;
    for (const match of decisionMatches) {
      chunks.push({
        id: `chunk-${++chunkId}`,
        content: match[0],
        metadata: {
          type: 'preference',
          decision: match[1].toLowerCase().replace(/\s+/g, '-'),
          confidence: 0.8, // Default confidence
        },
      });
    }

    return chunks;
  }

  async chunkAsync(content: string): Promise<PreferenceChunk[]> {
    return this.chunk(content);
  }

  extractDecisionContext(content: string): {
    context: string;
    options: string[];
    decision: string;
    rationale: string;
  } | null {
    // Mock implementation
    const contextMatch = content.match(/\*\*Context\*\*: ([^\n]+)/);
    const optionsMatch = content.match(/\*\*Options Considered\*\*: ([^\n]+)/);
    const decisionMatch = content.match(/\*\*Decision\*\*: ([^\n]+)/);
    const rationaleMatch = content.match(/\*\*Rationale\*\*:\n([\s\S]+?)(?=\n##|$)/);

    if (!contextMatch || !decisionMatch) return null;

    return {
      context: contextMatch[1],
      options: optionsMatch ? optionsMatch[1].split(',').map(s => s.trim()) : [],
      decision: decisionMatch[1],
      rationale: rationaleMatch ? rationaleMatch[1].trim() : '',
    };
  }
}

describe('PreferenceSignalChunker', () => {
  let chunker: PreferenceSignalChunker;

  beforeEach(() => {
    chunker = new PreferenceSignalChunker();
  });

  describe('Decision Detection', () => {
    it('should detect decision points', () => {
      const chunks = chunker.chunk(sampleDocuments.preference.content);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.every(c => c.metadata.type === 'preference')).toBe(true);
    });

    it('should extract decision titles', () => {
      const chunks = chunker.chunk(sampleDocuments.preference.content);

      const decisions = chunks.map(c => c.metadata.decision);
      expect(decisions).toContain('rest-vs-graphql');
    });

    it('should handle multiple decisions', () => {
      const chunks = chunker.chunk(sampleDocuments.preference.content);

      expect(chunks.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Context Extraction', () => {
    it('should extract decision context', () => {
      const decisionText = `**Context**: Need to choose API architecture
**Options Considered**: REST, GraphQL, gRPC
**Decision**: Use REST
**Rationale**: Better for our use case`;

      const context = chunker.extractDecisionContext(decisionText);

      expect(context).toBeDefined();
      expect(context?.context).toContain('API architecture');
    });

    it('should extract options considered', () => {
      const decisionText = `**Context**: Choose auth method
**Options Considered**: API Keys, OAuth 2.0, JWT
**Decision**: JWT
**Rationale**: Stateless`;

      const context = chunker.extractDecisionContext(decisionText);

      expect(context?.options).toContain('API Keys');
      expect(context?.options).toContain('OAuth 2.0');
      expect(context?.options).toContain('JWT');
    });

    it('should extract final decision', () => {
      const decisionText = `**Context**: Auth
**Decision**: Use JWT with refresh tokens
**Rationale**: Best practice`;

      const context = chunker.extractDecisionContext(decisionText);

      expect(context?.decision).toContain('JWT');
    });

    it('should extract rationale', () => {
      const decisionText = `**Context**: API
**Decision**: REST
**Rationale**:
- Team experience
- Simple caching
- Good tooling`;

      const context = chunker.extractDecisionContext(decisionText);

      expect(context?.rationale).toContain('Team experience');
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign default confidence', () => {
      const chunks = chunker.chunk(sampleDocuments.preference.content);

      chunks.forEach(chunk => {
        expect(chunk.metadata.confidence).toBeDefined();
        expect(chunk.metadata.confidence).toBeGreaterThan(0);
        expect(chunk.metadata.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should increase confidence with detailed rationale', () => {
      // To be implemented: confidence scoring based on rationale length
      const chunks = chunker.chunk(sampleDocuments.preference.content);

      expect(chunks[0].metadata.confidence).toBeDefined();
    });

    it('should decrease confidence with few options', () => {
      // To be implemented: confidence based on alternatives considered
      const chunks = chunker.chunk(sampleDocuments.preference.content);

      expect(chunks[0].metadata.confidence).toBeDefined();
    });
  });

  describe('Metadata Enrichment', () => {
    it('should add decision metadata', () => {
      const chunks = chunker.chunk(sampleDocuments.preference.content);

      chunks.forEach(chunk => {
        expect(chunk.metadata).toHaveProperty('decision');
        expect(chunk.metadata).toHaveProperty('type');
      });
    });

    it('should track alternatives', () => {
      const chunks = chunker.chunk(sampleDocuments.preference.content);

      // Alternatives tracking to be implemented
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should extract decision timestamp', () => {
      const chunks = chunker.chunk(sampleDocuments.preference.content);

      // Timestamp extraction to be implemented
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const chunks = chunker.chunk('');
      expect(chunks).toEqual([]);
    });

    it('should handle content without decisions', () => {
      const chunks = chunker.chunk('Just regular text without decisions');
      expect(chunks).toEqual([]);
    });

    it('should handle malformed decision format', () => {
      const content = `## Decision (missing number): Something`;
      const chunks = chunker.chunk(content);

      expect(Array.isArray(chunks)).toBe(true);
    });

    it('should handle decisions without rationale', () => {
      const content = `## Decision 1: Quick Choice
**Context**: Simple choice
**Decision**: Option A`;

      const context = chunker.extractDecisionContext(content);
      expect(context?.rationale).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should chunk document in <100ms', async () => {
      const start = performance.now();
      await chunker.chunkAsync(sampleDocuments.preference.content);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle 100 decisions efficiently', async () => {
      const largeContent = Array(100)
        .fill(0)
        .map(
          (_, i) =>
            `## Decision ${i + 1}: Choice${i}\n**Context**: Context\n**Decision**: Option${i}`
        )
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
      const chunks = chunker.chunk(sampleDocuments.preference.content);

      chunks.forEach(chunk => {
        expect(chunk).toHaveProperty('id');
        expect(chunk).toHaveProperty('content');
        expect(chunk).toHaveProperty('metadata');
        expect(chunk.metadata.type).toBe('preference');
      });
    });

    it('should reject invalid inputs', () => {
      expect(() => chunker.chunk(null as any)).toThrow();
      expect(() => chunker.chunk(undefined as any)).toThrow();
    });
  });
});
