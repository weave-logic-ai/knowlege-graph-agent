/**
 * Event-Based Chunker
 *
 * Chunks documents at event boundaries (task start/end, phase transitions).
 * Use case: Task execution experiences in learning loop.
 */

import { BaseChunker } from './base-chunker.js';
import type { ChunkingConfig, ChunkingResult, ValidationResult, Chunk } from '../types.js';

export class EventBasedChunker extends BaseChunker {
  readonly name = 'event-based';

  async chunk(
    document: string,
    config: ChunkingConfig
  ): Promise<ChunkingResult> {
    const startTime = Date.now();
    this.logChunking('start', config);

    // Check for empty document
    if (!document || document.trim().length === 0) {
      const durationMs = Date.now() - startTime;
      return {
        chunks: [],
        stats: this.computeStats([], durationMs),
        warnings: ['Document is empty'],
      };
    }

    const chunks: Chunk[] = [];
    const eventBoundaries = this.detectEventBoundaries(document, config);

    if (eventBoundaries.length === 0) {
      // No boundaries found, treat entire document as single chunk
      const chunk = this.createChunk(
        document.trim(),
        0,
        config.docId || 'unknown',
        config.sourcePath || 'unknown',
        config,
        'episodic',
        'episodic'
      );
      chunk.metadata.boundary_type = 'event';
      chunks.push(chunk);
    } else {
      // Split document at event boundaries
      let previousEnd = 0;

      for (let i = 0; i <= eventBoundaries.length; i++) {
        const boundary = eventBoundaries[i];
        const end = boundary ? boundary.position : document.length;

        const chunkContent = document.slice(previousEnd, end);

        if (chunkContent.trim().length > 0) {
          const chunk = this.createChunk(
            chunkContent.trim(),
            chunks.length,
            config.docId || 'unknown',
            config.sourcePath || 'unknown',
            config,
            'episodic',
            'episodic'
          );

          chunk.metadata.boundary_type = 'event';

          // Add temporal links
          if (config.temporalLinks && chunks.length > 0) {
            chunk.metadata.previous_chunk = chunks[chunks.length - 1].id;
            chunks[chunks.length - 1].metadata.next_chunk = chunk.id;
          }

          chunks.push(chunk);
        }

        if (boundary) {
          previousEnd = boundary.position;
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
    const commonValidation = this.validateCommonConfig(config);

    if (!commonValidation.valid) {
      return commonValidation;
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.eventBoundaries) {
      warnings.push('eventBoundaries not specified, using default: phase-transition');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  getDefaultConfig(): ChunkingConfig {
    return {
      maxTokens: 512,
      overlap: 20,
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
  ): Array<{ position: number; type: string }> {
    const boundaries: Array<{ position: number; type: string }> = [];

    // Define event boundary patterns based on config
    const patterns: Record<string, RegExp[]> = {
      'task-start': [
        /^## Task Start/gm,
        /^# Starting Task/gm,
        /^---\ntask_start:/gm,
      ],
      'task-end': [
        /^## Task Complete/gm,
        /^# Task Completed/gm,
        /^---\ntask_end:/gm,
      ],
      'phase-transition': [
        /^## Stage: Perception/gm,
        /^## Stage: Reasoning/gm,
        /^## Stage: Execution/gm,
        /^## Stage: Reflection/gm,
        /^---\nstage:/gm,
        /^# Perception/gm,
        /^# Reasoning/gm,
        /^# Execution/gm,
        /^# Reflection/gm,
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

    // Sort by position and remove duplicates
    boundaries.sort((a, b) => a.position - b.position);

    // Remove duplicate positions
    const uniqueBoundaries: typeof boundaries = [];
    let lastPosition = -1;

    for (const boundary of boundaries) {
      if (boundary.position !== lastPosition) {
        uniqueBoundaries.push(boundary);
        lastPosition = boundary.position;
      }
    }

    return uniqueBoundaries;
  }
}
