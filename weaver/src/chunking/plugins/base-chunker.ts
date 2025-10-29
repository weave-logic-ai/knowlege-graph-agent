/**
 * Base Chunker Abstract Class
 * Phase 13 - Task 1.1 - SPARC Specification Phase
 *
 * Provides common functionality for all chunking strategies.
 * Merged version with Phase 12 enhancements.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Chunk,
  ChunkMetadata,
  ChunkingConfig,
  ValidationResult,
  ChunkingResult,
  ChunkingStats,
  ContentType,
  MemoryLevel,
} from '../types.js';

export abstract class BaseChunker {
  abstract readonly name: string;

  abstract chunk(document: string, config: ChunkingConfig): Promise<ChunkingResult>;
  abstract validate(config: ChunkingConfig): ValidationResult;
  abstract getDefaultConfig(): ChunkingConfig;

  /**
   * Create a chunk with metadata
   * Parameter order matches implementation usage:
   * (content, index, docId, sourcePath, config, contentType, memoryLevel)
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
    const chunk_id = uuidv4();
    const size_tokens = this.countTokens(content);

    const metadata: ChunkMetadata = {
      chunk_id,
      doc_id: docId,
      source_path: sourcePath,
      index,
      content_type: contentType,
      memory_level: memoryLevel,
      strategy: this.name,
      size_tokens,
      overlap_tokens: config.overlap || 0,
      created_at: new Date(),
    };

    return {
      id: chunk_id,
      content,
      metadata
    };
  }

  protected countTokens(content: string): number {
    return Math.ceil(content.length / 4);
  }

  protected validateChunk(chunk: Chunk): boolean {
    return !!(chunk.content?.trim() && chunk.metadata.chunk_id && chunk.metadata.source_path);
  }

  /**
   * Validate common configuration parameters
   * Enhanced with Phase 12 validation rules
   */
  protected validateCommonConfig(config: ChunkingConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Enhanced validation with better bounds checking
    if (config.maxTokens !== undefined) {
      if (config.maxTokens < 1) {
        errors.push('maxTokens must be at least 1');
      }
      if (config.maxTokens > 8192) {
        warnings.push('maxTokens > 8192 may exceed model context limits');
      }
    }

    if (config.overlap !== undefined) {
      if (config.overlap < 0 || config.overlap > 100) {
        errors.push('overlap must be between 0 and 100');
      }
    }

    if (config.contextWindowSize !== undefined && config.contextWindowSize < 0) {
      errors.push('contextWindowSize must be non-negative');
    }

    if (config.similarityThreshold !== undefined) {
      if (config.similarityThreshold < 0 || config.similarityThreshold > 1) {
        errors.push('similarityThreshold must be between 0 and 1');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Compute statistics from chunks
   */
  protected computeStats(chunks: Chunk[], durationMs: number): ChunkingStats {
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
    const totalTokens = sizes.reduce((sum, size) => sum + size, 0);

    return {
      totalChunks: chunks.length,
      avgChunkSize: totalTokens / chunks.length,
      minChunkSize: Math.min(...sizes),
      maxChunkSize: Math.max(...sizes),
      totalTokens,
      strategy: this.name,
      durationMs,
    };
  }

  /**
   * Log chunking operation (start or complete)
   * Enhanced with Phase 12 structured logging
   */
  protected logChunking(
    phase: 'start' | 'complete',
    config: ChunkingConfig,
    result?: ChunkingResult
  ): void {
    if (phase === 'start') {
      console.debug(`[${this.name}] Starting chunking with config:`, config);
    } else if (result) {
      console.debug(`[${this.name}] Chunking complete:`, {
        chunks: result.chunks.length,
        stats: result.stats,
        warnings: result.warnings,
      });
    }
  }

  /**
   * Helper: Split into sentences (Phase 12 utility)
   */
  protected splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Helper: Split into lines (Phase 12 utility)
   */
  protected splitIntoLines(text: string): string[] {
    return text.split('\n');
  }
}
