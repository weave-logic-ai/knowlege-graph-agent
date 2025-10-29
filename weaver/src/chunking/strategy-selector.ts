/**
 * Strategy Selector
 *
 * Selects the appropriate chunking strategy based on content type.
 */

import type { ContentType, Chunker, ChunkingConfig } from './types.js';
import { EventBasedChunker } from './plugins/event-based-chunker.js';
import { SemanticBoundaryChunker } from './plugins/semantic-boundary-chunker.js';
import { PreferenceSignalChunker } from './plugins/preference-signal-chunker.js';
import { StepBasedChunker } from './plugins/step-based-chunker.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('chunking:selector');

export class StrategySelector {
  private chunkers: Map<ContentType, Chunker> = new Map();

  constructor() {
    this.registerChunkers();
  }

  /**
   * Register all available chunking strategies
   */
  private registerChunkers(): void {
    this.chunkers.set('episodic', new EventBasedChunker());
    this.chunkers.set('semantic', new SemanticBoundaryChunker());
    this.chunkers.set('preference', new PreferenceSignalChunker());
    this.chunkers.set('procedural', new StepBasedChunker());

    // Working memory: no chunking (return document as-is)
    // Document: PPL-based chunker (Phase 2)

    logger.debug('Registered chunking strategies', {
      strategies: Array.from(this.chunkers.keys()),
    });
  }

  /**
   * Select chunking strategy based on content type
   */
  selectStrategy(contentType: ContentType, _config?: ChunkingConfig): Chunker {
    const chunker = this.chunkers.get(contentType);

    if (!chunker) {
      logger.warn(`No chunker registered for content type: ${contentType}, using semantic boundary`);
      const fallback = this.chunkers.get('semantic');
      if (!fallback) {
        throw new Error('Semantic boundary chunker not available');
      }
      return fallback;
    }

    logger.debug('Selected chunking strategy', {
      contentType,
      strategy: chunker.name,
    });

    return chunker;
  }

  /**
   * Get all available strategies
   */
  getAvailableStrategies(): ContentType[] {
    return Array.from(this.chunkers.keys());
  }

  /**
   * Get default config for a content type
   */
  getDefaultConfig(contentType: ContentType): ChunkingConfig {
    const chunker = this.selectStrategy(contentType);
    return chunker.getDefaultConfig();
  }
}
