/**
 * Semantic Boundary Chunker
 *
 * Detects topic shifts using keyword-based similarity (MVP).
 * Use case: User reflections, learned insights.
 * TODO Phase 2: Replace with embedding-based similarity
 */

import { BaseChunker } from './base-chunker.js';
import type { ChunkingConfig, ChunkingResult, ValidationResult, Chunk } from '../types.js';

export class SemanticBoundaryChunker extends BaseChunker {
  readonly name = 'semantic-boundary';

  async chunk(
    document: string,
    config: ChunkingConfig
  ): Promise<ChunkingResult> {
    const startTime = Date.now();
    this.logChunking('start', config);

    // Split into sentences
    const sentences = this.splitIntoSentences(document);

    // Detect semantic boundaries
    const boundaries = await this.detectSemanticBoundaries(sentences, config);

    // Create chunks at boundaries
    const chunks: Chunk[] = [];
    let currentChunk: string[] = [];
    let chunkIndex = 0;

    const docId = config.docId || 'unknown';
    const sourcePath = config.sourcePath || 'unknown';
    const maxTokens = config.maxTokens || 512;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      if (!sentence) continue;

      currentChunk.push(sentence);

      // Check if we hit a boundary or size limit
      const isBoundary = boundaries.includes(i);
      const chunkText = currentChunk.join(' ');
      const tokens = chunkText.length / 4; // Approximate

      if (isBoundary || tokens >= maxTokens || i === sentences.length - 1) {
        if (currentChunk.length > 0) {
          const chunk = this.createChunk(
            chunkText.trim(),
            chunkIndex++,
            docId,
            sourcePath,
            config,
            'semantic',
            'semantic'
          );

          chunk.metadata.boundary_type = 'semantic';

          // Add context enrichment
          if (config.includeContext) {
            const contextWindowSize = config.contextWindowSize || 50;
            chunk.metadata.context_before = this.extractContext(
              sentences,
              i - currentChunk.length,
              -contextWindowSize
            );
            chunk.metadata.context_after = this.extractContext(
              sentences,
              i,
              contextWindowSize
            );
          }

          chunks.push(chunk);
          currentChunk = [];
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const result = {
      chunks,
      stats: this.computeStats(chunks, durationMs),
      warnings: [],
    };

    this.logChunking('complete', config, result);
    return result;
  }

  validate(config: ChunkingConfig): ValidationResult {
    const baseValidation = this.validateCommonConfig(config);
    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];

    if (config.maxTokens && config.maxTokens < 128) {
      errors.push('maxTokens must be at least 128 for semantic chunking');
    }

    if (config.similarityThreshold && (config.similarityThreshold < 0 || config.similarityThreshold > 1)) {
      errors.push('similarityThreshold must be between 0 and 1');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  getDefaultConfig(): ChunkingConfig {
    return {
      maxTokens: 384,
      similarityThreshold: 0.75,
      minChunkSize: 128,
      includeContext: true,
      contextWindowSize: 50,
    };
  }

  /**
   * Detect semantic boundaries using keyword similarity (MVP)
   * TODO Phase 2: Replace with embedding-based similarity
   */
  private async detectSemanticBoundaries(
    sentences: string[],
    config: ChunkingConfig
  ): Promise<number[]> {
    const boundaries: number[] = [];
    const threshold = config.similarityThreshold || 0.75;

    for (let i = 1; i < sentences.length; i++) {
      const prevSentence = sentences[i - 1];
      const currSentence = sentences[i];
      if (!prevSentence || !currSentence) continue;

      const prevWords = new Set(prevSentence.toLowerCase().split(/\s+/));
      const currWords = new Set(currSentence.toLowerCase().split(/\s+/));

      const intersection = new Set([...prevWords].filter(x => currWords.has(x)));
      const union = new Set([...prevWords, ...currWords]);

      const similarity = union.size > 0 ? intersection.size / union.size : 0;

      if (similarity < threshold) {
        boundaries.push(i);
      }
    }

    return boundaries;
  }

  /**
   * Extract context window around position
   */
  private extractContext(
    sentences: string[],
    position: number,
    windowSize: number
  ): string {
    if (windowSize < 0) {
      // Context before
      const start = Math.max(0, position + windowSize);
      return sentences.slice(start, position).join(' ');
    } else {
      // Context after
      const end = Math.min(sentences.length, position + windowSize);
      return sentences.slice(position + 1, end).join(' ');
    }
  }
}
