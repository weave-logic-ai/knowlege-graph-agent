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

    const chunks: Chunk[] = [];
    const steps = this.detectSteps(document, config);

    const docId = config.docId || 'unknown';
    const sourcePath = config.sourcePath || 'unknown';

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step) continue;

      const chunk = this.createChunk(
        step.content.trim(),
        i,
        docId,
        sourcePath,
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
        const prevChunk = chunks[i - 1];
        if (prevChunk) {
          chunk.metadata.previous_chunk = prevChunk.id;
          prevChunk.metadata.next_chunk = chunk.id;
        }
      }

      chunks.push(chunk);
    }

    const durationMs = Date.now() - startTime;
    const result = {
      chunks,
      stats: this.computeStats(chunks, durationMs),
      warnings: chunks.length === 0 ? ['No steps detected'] : [],
    };

    this.logChunking('complete', config, result);
    return result;
  }

  validate(config: ChunkingConfig): ValidationResult {
    const baseValidation = this.validateCommonConfig(config);
    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];

    if (config.maxTokens && config.maxTokens < 128) {
      warnings.push('maxTokens < 128 may result in incomplete steps');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  getDefaultConfig(): ChunkingConfig {
    return {
      maxTokens: 384,
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
    const delimiters = config.stepDelimiters || this.getDefaultConfig().stepDelimiters || [];

    const lines = document.split('\n');
    let currentStep: string[] = [];
    let currentTitle = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Check if line is a step delimiter
      const isStepStart = delimiters.some(delim => line.trim().startsWith(delim));

      if (isStepStart) {
        // Save previous step
        if (currentStep.length > 0) {
          steps.push({
            content: currentStep.join('\n'),
            title: currentTitle,
          });
        }

        // Start new step
        currentTitle = line.trim();
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
      if (match[1]) {
        const items = match[1].split(/[,;]/).map(s => s.trim());
        prereqs.push(...items);
      }
    }

    return prereqs;
  }
}
