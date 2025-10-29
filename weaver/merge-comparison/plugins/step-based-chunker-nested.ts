/**
 * Step-Based Chunker
 *
 * Chunks at step boundaries (markdown headers, numbered lists).
 * Use case: SOPs, workflow steps, tutorials.
 */

import { BaseChunker } from './base-chunker.js';
import type { ChunkingConfig, ChunkingResult, ValidationResult, Chunk } from '../types.js';

export class StepBasedChunker extends BaseChunker {
  readonly name = 'step-based';

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
    const steps = this.detectSteps(document, config);

    if (steps.length === 0) {
      // No steps detected, treat entire document as single chunk
      const chunk = this.createChunk(
        document.trim(),
        0,
        config.docId || 'unknown',
        config.sourcePath || 'unknown',
        config,
        'procedural',
        'semantic'
      );
      chunk.metadata.boundary_type = 'step';
      chunks.push(chunk);

      const durationMs = Date.now() - startTime;
      const result = { chunks, stats: this.computeStats(chunks, durationMs), warnings: [] };
      this.logChunking('complete', config, result);
      return result;
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      const chunk = this.createChunk(
        step.content.trim(),
        i,
        config.docId || 'unknown',
        config.sourcePath || 'unknown',
        config,
        'procedural',
        'atomic'
      );

      chunk.metadata.boundary_type = 'step';

      // Extract step metadata
      if (config.includePrerequisites) {
        const prereqs = this.extractPrerequisites(step.content);
        if (prereqs.length > 0) {
          chunk.metadata.concepts = prereqs;
        }
      }

      // Link to previous step
      if (i > 0) {
        chunk.metadata.previous_chunk = chunks[i - 1].id;
        chunks[i - 1].metadata.next_chunk = chunk.id;
      }

      chunks.push(chunk);
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

    if (config.maxTokens && config.maxTokens < 128) {
      warnings.push('maxTokens < 128 may result in incomplete steps');
    }

    if (!config.stepDelimiters || config.stepDelimiters.length === 0) {
      warnings.push('No step delimiters specified, using defaults');
    }

    return {
      valid: errors.length === 0,
      errors: [...commonValidation.errors, ...errors],
      warnings: [...commonValidation.warnings, ...warnings],
    };
  }

  getDefaultConfig(): ChunkingConfig {
    return {
      maxTokens: 512,
      overlap: 15,
      stepDelimiters: ['##', '###', '1.', '2.', '3.'],
      includePrerequisites: true,
      includeOutcomes: true,
    };
  }

  /**
   * Detect steps in document
   */
  private detectSteps(
    document: string,
    config: ChunkingConfig
  ): Array<{ content: string; title: string }> {
    const steps: Array<{ content: string; title: string }> = [];
    const delimiters = config.stepDelimiters || this.getDefaultConfig().stepDelimiters!;

    const lines = document.split('\n');
    let currentStep: string[] = [];
    let currentTitle = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if line is a step delimiter
      const isStepStart = delimiters.some(delim => {
        if (delim.startsWith('#')) {
          // Markdown heading
          return trimmed.startsWith(delim + ' ');
        } else {
          // Numbered list
          return /^\d+[\.\)]\s/.test(trimmed);
        }
      });

      if (isStepStart) {
        // Save previous step
        if (currentStep.length > 0) {
          steps.push({
            content: currentStep.join('\n'),
            title: currentTitle,
          });
        }

        // Start new step
        currentTitle = trimmed;
        currentStep = [line];
      } else {
        currentStep.push(line);
      }
    }

    // Save final step
    if (currentStep.length > 0) {
      steps.push({
        content: currentStep.join('\n'),
        title: currentTitle,
      });
    }

    return steps;
  }

  /**
   * Extract prerequisites from step content
   */
  private extractPrerequisites(content: string): string[] {
    const prereqs: string[] = [];

    // Look for "Prerequisites:", "Requires:", etc.
    const prereqPattern = /(?:prerequisites?|requires?|needs?):\s*(.+)/gi;
    let match;

    while ((match = prereqPattern.exec(content)) !== null) {
      const items = match[1].split(/[,;]/).map(s => s.trim());
      prereqs.push(...items);
    }

    return prereqs;
  }
}
