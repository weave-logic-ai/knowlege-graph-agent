/**
 * Event-Based Chunker
 *
 * Chunks documents at event boundaries (task start/end, phase transitions).
 * Use case: Task execution experiences in learning loop.
 */

import { BaseChunker } from './base-chunker.js';
import type { ChunkingConfig, ChunkingResult, ValidationResult, Chunk, EventBoundaryType } from '../types.js';

export class EventBasedChunker extends BaseChunker {
  readonly name = 'event-based';

  async chunk(
    document: string,
    config: ChunkingConfig
  ): Promise<ChunkingResult> {
    const startTime = Date.now();
    this.logChunking('start', config);

    const chunks: Chunk[] = [];
    const eventBoundaries = this.detectEventBoundaries(document, config);

    const docId = config.docId || 'unknown';
    const sourcePath = config.sourcePath || 'unknown';

    // Split document at event boundaries
    let previousEnd = 0;
    for (let i = 0; i < eventBoundaries.length; i++) {
      const boundary = eventBoundaries[i];
      const chunkContent = document.slice(previousEnd, boundary?.position);

      if (chunkContent && chunkContent.trim().length > 0) {
        const chunk = this.createChunk(
          chunkContent.trim(),
          i,
          docId,
          sourcePath,
          config,
          'episodic',
          'episodic'
        );

        // Override metadata for event-based chunks
        chunk.metadata.boundary_type = 'event';

        // Add temporal links
        if (config.temporalLinks && i > 0) {
          const prevChunk = chunks[i - 1];
          if (prevChunk) {
            chunk.metadata.previous_chunk = prevChunk.id;
            prevChunk.metadata.next_chunk = chunk.id;
          }
        }

        chunks.push(chunk);
      }

      previousEnd = boundary?.position || previousEnd;
    }

    // Add final chunk
    const finalContent = document.slice(previousEnd).trim();
    if (finalContent.length > 0) {
      const finalChunk = this.createChunk(
        finalContent,
        chunks.length,
        docId,
        sourcePath,
        config,
        'episodic',
        'episodic'
      );
      finalChunk.metadata.boundary_type = 'event';

      if (config.temporalLinks && chunks.length > 0) {
        const lastChunk = chunks[chunks.length - 1];
        if (lastChunk) {
          finalChunk.metadata.previous_chunk = lastChunk.id;
          lastChunk.metadata.next_chunk = finalChunk.id;
        }
      }

      chunks.push(finalChunk);
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

    if (!config.eventBoundaries) {
      errors.push('eventBoundaries is required for event-based chunking');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  getDefaultConfig(): ChunkingConfig {
    return {
      eventBoundaries: 'phase-transition',
      temporalLinks: true,
      includeContext: true,
      contextWindowSize: 50,
    };
  }

  /**
   * Detect event boundaries in document
   */
  private detectEventBoundaries(
    document: string,
    config: ChunkingConfig
  ): Array<{ position: number; type: EventBoundaryType }> {
    const boundaries: Array<{ position: number; type: EventBoundaryType }> = [];

    // Define event boundary patterns based on config
    const patterns: Record<EventBoundaryType, RegExp[]> = {
      'task-start': [
        /^## Task Start/gm,
        /^# Starting Task/gm,
      ],
      'task-end': [
        /^## Task Complete/gm,
        /^# Task Completed/gm,
      ],
      'phase-transition': [
        /^## Stage: Perception/gm,
        /^## Stage: Reasoning/gm,
        /^## Stage: Execution/gm,
        /^## Stage: Reflection/gm,
        /^---\nstage:/gm,
      ],
    };

    const boundaryType = config.eventBoundaries || 'phase-transition';
    const boundaryPatterns = patterns[boundaryType] || patterns['phase-transition'];

    for (const pattern of boundaryPatterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(document)) !== null) {
        boundaries.push({
          position: match.index,
          type: boundaryType,
        });
      }
    }

    // Sort by position
    boundaries.sort((a, b) => a.position - b.position);

    return boundaries;
  }
}
