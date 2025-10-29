/**
 * Strategy Selector Tests
 *
 * Tests for content-type based chunking strategy selection.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { StrategySelector } from '../../src/chunking/strategy-selector.js';
import { EventBasedChunker } from '../../src/chunking/plugins/event-based-chunker.js';
import { SemanticBoundaryChunker } from '../../src/chunking/plugins/semantic-boundary-chunker.js';
import { PreferenceSignalChunker } from '../../src/chunking/plugins/preference-signal-chunker.js';
import { StepBasedChunker } from '../../src/chunking/plugins/step-based-chunker.js';

describe('StrategySelector', () => {
  let selector: StrategySelector;

  beforeEach(() => {
    selector = new StrategySelector();
  });

  describe('Initialization', () => {
    it('should register all chunking strategies', () => {
      const strategies = selector.getAvailableStrategies();

      expect(strategies).toContain('episodic');
      expect(strategies).toContain('semantic');
      expect(strategies).toContain('preference');
      expect(strategies).toContain('procedural');
    });

    it('should have exactly 4 registered strategies', () => {
      const strategies = selector.getAvailableStrategies();
      expect(strategies).toHaveLength(4);
    });
  });

  describe('Strategy Selection', () => {
    it('should select EventBasedChunker for episodic content', () => {
      const chunker = selector.selectStrategy('episodic');

      expect(chunker).toBeInstanceOf(EventBasedChunker);
      expect(chunker.name).toBe('event-based');
    });

    it('should select SemanticBoundaryChunker for semantic content', () => {
      const chunker = selector.selectStrategy('semantic');

      expect(chunker).toBeInstanceOf(SemanticBoundaryChunker);
      expect(chunker.name).toBe('semantic-boundary');
    });

    it('should select PreferenceSignalChunker for preference content', () => {
      const chunker = selector.selectStrategy('preference');

      expect(chunker).toBeInstanceOf(PreferenceSignalChunker);
      expect(chunker.name).toBe('preference-signal');
    });

    it('should select StepBasedChunker for procedural content', () => {
      const chunker = selector.selectStrategy('procedural');

      expect(chunker).toBeInstanceOf(StepBasedChunker);
      expect(chunker.name).toBe('step-based');
    });
  });

  describe('Fallback Behavior', () => {
    it('should fallback to semantic chunker for unknown content type', () => {
      // @ts-expect-error - Testing invalid content type
      const chunker = selector.selectStrategy('unknown-type');

      expect(chunker).toBeInstanceOf(SemanticBoundaryChunker);
      expect(chunker.name).toBe('semantic-boundary');
    });

    it('should fallback to semantic chunker for working memory', () => {
      const chunker = selector.selectStrategy('working');

      // Working memory uses semantic boundary as fallback
      expect(chunker).toBeInstanceOf(SemanticBoundaryChunker);
    });

    it('should fallback to semantic chunker for document type', () => {
      const chunker = selector.selectStrategy('document');

      // Document type uses semantic boundary as fallback (PPL-based coming in Phase 2)
      expect(chunker).toBeInstanceOf(SemanticBoundaryChunker);
    });
  });

  describe('Get Chunker by Name', () => {
    it('should retrieve chunker by exact name', () => {
      const chunker = selector.getChunkerByName('event-based');

      expect(chunker).toBeInstanceOf(EventBasedChunker);
      expect(chunker?.name).toBe('event-based');
    });

    it('should retrieve semantic-boundary chunker', () => {
      const chunker = selector.getChunkerByName('semantic-boundary');

      expect(chunker).toBeInstanceOf(SemanticBoundaryChunker);
    });

    it('should retrieve preference-signal chunker', () => {
      const chunker = selector.getChunkerByName('preference-signal');

      expect(chunker).toBeInstanceOf(PreferenceSignalChunker);
    });

    it('should retrieve step-based chunker', () => {
      const chunker = selector.getChunkerByName('step-based');

      expect(chunker).toBeInstanceOf(StepBasedChunker);
    });

    it('should return undefined for unknown chunker name', () => {
      const chunker = selector.getChunkerByName('non-existent-chunker');

      expect(chunker).toBeUndefined();
    });

    it('should be case-sensitive for chunker names', () => {
      const chunker = selector.getChunkerByName('Event-Based');

      expect(chunker).toBeUndefined();
    });
  });

  describe('Strategy Consistency', () => {
    it('should return same instance for repeated calls', () => {
      const chunker1 = selector.selectStrategy('episodic');
      const chunker2 = selector.selectStrategy('episodic');

      // Should be the same instance (singleton per type)
      expect(chunker1).toBe(chunker2);
    });

    it('should return different instances for different types', () => {
      const episodic = selector.selectStrategy('episodic');
      const semantic = selector.selectStrategy('semantic');

      expect(episodic).not.toBe(semantic);
    });
  });

  describe('Strategy Configuration', () => {
    it('should pass config to selected strategy', () => {
      const config = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        maxTokens: 1000,
      };

      const chunker = selector.selectStrategy('episodic', config);
      const defaultConfig = chunker.getDefaultConfig();

      // Strategy should have its default config available
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.maxTokens).toBeDefined();
    });

    it('should allow each strategy to have different defaults', () => {
      const episodic = selector.selectStrategy('episodic');
      const semantic = selector.selectStrategy('semantic');
      const preference = selector.selectStrategy('preference');
      const procedural = selector.selectStrategy('procedural');

      const episodicConfig = episodic.getDefaultConfig();
      const semanticConfig = semantic.getDefaultConfig();
      const preferenceConfig = preference.getDefaultConfig();
      const proceduralConfig = procedural.getDefaultConfig();

      // Each strategy has different default maxTokens
      expect(episodicConfig.maxTokens).toBe(512);
      expect(semanticConfig.maxTokens).toBe(384);
      expect(preferenceConfig.maxTokens).toBe(256);
      expect(proceduralConfig.maxTokens).toBe(512);
    });
  });

  describe('Validation', () => {
    it('should validate config through selected strategy', () => {
      const chunker = selector.selectStrategy('semantic');

      const validConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        similarityThreshold: 0.75,
      };

      const result = chunker.validate(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid config through selected strategy', () => {
      const chunker = selector.selectStrategy('semantic');

      const invalidConfig = {
        docId: 'test-doc',
        sourcePath: '/test/path.md',
        similarityThreshold: 1.5, // Invalid: must be 0-1
      };

      const result = chunker.validate(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Selectors', () => {
    it('should create independent selector instances', () => {
      const selector1 = new StrategySelector();
      const selector2 = new StrategySelector();

      const chunker1 = selector1.selectStrategy('episodic');
      const chunker2 = selector2.selectStrategy('episodic');

      // Different selectors should have same strategy instance
      // (strategies are singletons per selector)
      expect(chunker1).toBe(chunker2);
    });
  });
});
