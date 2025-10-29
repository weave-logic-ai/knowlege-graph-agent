/**
 * Event-Based Chunker
 *
 * Chunks documents at event boundaries (task start/end, phase transitions).
 * Use case: Task execution experiences in learning loop.
 *
 * Merged version with Phase 12 enhancements:
 * - Empty document handling
 * - Improved boundary detection with deduplication
 * - Enhanced pattern matching
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

    // Phase 12 enhancement: Empty document handling
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

    const docId = config.docId || 'unknown';
    const sourcePath = config.sourcePath || 'unknown';

    // Phase 12 enhancement: Handle case with no boundaries
    if (eventBoundaries.length === 0) {
      const chunk = this.createChunk(
        document.trim(),
        0,
        docId,
        sourcePath,
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

        if (chunkContent && chunkContent.trim().length > 0) {
          const chunk = this.createChunk(
            chunkContent.trim(),
            chunks.length,
            docId,
            sourcePath,
            config,
            'episodic',
            'episodic'
          );

          // Override metadata for event-based chunks
          chunk.metadata.boundary_type = 'event';

          // Add temporal links
          if (config.temporalLinks && chunks.length > 0) {
            const prevChunk = chunks[chunks.length - 1];
            if (prevChunk) {
              chunk.metadata.previous_chunk = prevChunk.id;
              prevChunk.metadata.next_chunk = chunk.id;
            }
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
    const baseValidation = this.validateCommonConfig(config);
    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];

    // Phase 12 enhancement: Warning instead of error for missing eventBoundaries
    if (!config.eventBoundaries) {
      warnings.push('eventBoundaries not specified, using default: phase-transition');
    }

    return { valid: errors.length === 0, errors, warnings };
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
   * Phase 12 enhancement: Enhanced pattern matching and deduplication
   */
  private detectEventBoundaries(
    document: string,
    config: ChunkingConfig
  ): Array<{ position: number; type: EventBoundaryType }> {
    const boundaries: Array<{ position: number; type: EventBoundaryType }> = [];

    // Define event boundary patterns based on config
    // Phase 12 enhancement: Extended pattern support
    const patterns: Record<EventBoundaryType, RegExp[]> = {
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

    // Sort by position
    boundaries.sort((a, b) => a.position - b.position);

    // Phase 12 enhancement: Remove duplicate positions
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
