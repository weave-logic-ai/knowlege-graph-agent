/**
 * Base Chunker Abstract Class
 * Phase 13 - Task 1.1 - SPARC Specification Phase
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
   */
  protected validateCommonConfig(config: ChunkingConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.maxTokens !== undefined && config.maxTokens < 1) {
      errors.push('maxTokens must be at least 1');
    }

    if (config.overlap !== undefined && config.overlap < 0) {
      errors.push('overlap must be non-negative');
    }

    if (config.contextWindowSize !== undefined && config.contextWindowSize < 0) {
      errors.push('contextWindowSize must be non-negative');
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
}
