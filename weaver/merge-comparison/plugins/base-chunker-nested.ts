/**
 * Base Chunker Abstract Class
 *
 * Provides common functionality for all chunking strategies.
 */

import type {
  Chunker,
  ChunkingConfig,
  ChunkingResult,
  ChunkingStats,
  ValidationResult,
  Chunk,
  ContentType,
  MemoryLevel,
} from '../types.js';
import { logger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { countTokens } from '../utils/tokenizer.js';

export abstract class BaseChunker implements Chunker {
  abstract readonly name: string;

  abstract chunk(
    document: string,
    config: ChunkingConfig
  ): Promise<ChunkingResult>;

  abstract validate(config: ChunkingConfig): ValidationResult;

  abstract getDefaultConfig(): ChunkingConfig;

  /**
   * Helper: Create chunk with metadata
   */
  protected createChunk(
    content: string,
    index: number,
    docId: string,
    sourcePath: string,
    config: ChunkingConfig,
    contentType: ContentType = 'document',
    memoryLevel: MemoryLevel = 'atomic'
  ): Chunk {
    const chunkId = `chunk-${uuidv4()}`;

    const chunk: Chunk = {
      id: chunkId,
      content,
      metadata: {
        chunk_id: chunkId,
        doc_id: docId,
        source_path: sourcePath,
        index,
        strategy: this.name,
        size_tokens: countTokens(content),
        overlap_tokens: config.overlap || 0,
        created_at: new Date(),
        content_type: contentType,
        memory_level: memoryLevel,
      },
    };

    // Copy optional metadata from config
    if (config.learningSessionId) {
      chunk.metadata.learning_session_id = config.learningSessionId;
    }
    if (config.stage) {
      chunk.metadata.stage = config.stage;
    }
    if (config.concepts) {
      chunk.metadata.concepts = config.concepts;
    }
    if (config.sopId) {
      chunk.metadata.sop_id = config.sopId;
    }

    return chunk;
  }

  /**
   * Helper: Count tokens in text
   */
  protected countTokens(text: string): number {
    return countTokens(text);
  }

  /**
   * Helper: Compute statistics
   */
  protected computeStats(
    chunks: Chunk[],
    durationMs: number
  ): ChunkingStats {
    if (chunks.length === 0) {
      return {
        totalChunks: 0,
        avgChunkSize: 0,
        minChunkSize: 0,
        maxChunkSize: 0,
        totalTokens: 0,
        strategy: this.name,
        durationMs,
      };
    }

    const sizes = chunks.map(c => c.metadata.size_tokens);

    return {
      totalChunks: chunks.length,
      avgChunkSize: sizes.reduce((a, b) => a + b, 0) / sizes.length,
      minChunkSize: Math.min(...sizes),
      maxChunkSize: Math.max(...sizes),
      totalTokens: sizes.reduce((a, b) => a + b, 0),
      strategy: this.name,
      durationMs,
    };
  }

  /**
   * Helper: Log chunking process
   */
  protected logChunking(
    phase: 'start' | 'complete',
    config: ChunkingConfig,
    result?: ChunkingResult
  ): void {
    if (phase === 'start') {
      logger.debug(`Starting ${this.name} chunking`, { config });
    } else if (result) {
      logger.info(`✅ ${this.name} chunking complete`, {
        strategy: this.name,
        chunks: result.stats.totalChunks,
        avgSize: Math.round(result.stats.avgChunkSize),
        duration: result.stats.durationMs,
      });
    }
  }

  /**
   * Helper: Split into sentences
   */
  protected splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Helper: Split into lines
   */
  protected splitIntoLines(text: string): string[] {
    return text.split('\n');
  }

  /**
   * Helper: Validate common configuration
   */
  protected validateCommonConfig(config: ChunkingConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.maxTokens && config.maxTokens < 64) {
      errors.push('maxTokens must be at least 64');
    }

    if (config.maxTokens && config.maxTokens > 8192) {
      warnings.push('maxTokens > 8192 may exceed model context limits');
    }

    if (config.overlap && (config.overlap < 0 || config.overlap > 100)) {
      errors.push('overlap must be between 0 and 100');
    }

    if (config.similarityThreshold && (config.similarityThreshold < 0 || config.similarityThreshold > 1)) {
      errors.push('similarityThreshold must be between 0 and 1');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
