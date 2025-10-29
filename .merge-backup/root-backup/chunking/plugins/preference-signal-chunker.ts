/**
 * Preference Signal Chunker
 *
 * Chunks at decision points (plan selection, satisfaction ratings).
 * Use case: A/B testing choices, user feedback.
 */

import { BaseChunker } from './base-chunker.js';
import type { ChunkingConfig, ChunkingResult, ValidationResult, Chunk } from '../types.js';

export class PreferenceSignalChunker extends BaseChunker {
  readonly name = 'preference-signal';

  async chunk(
    document: string,
    config: ChunkingConfig
  ): Promise<ChunkingResult> {
    const startTime = Date.now();
    this.logChunking('start', config);

    const chunks: Chunk[] = [];
    const decisionPoints = this.detectDecisionPoints(document, config);

    const docId = config.docId || 'unknown';
    const sourcePath = config.sourcePath || 'unknown';

    // Create chunk for each decision point
    for (let i = 0; i < decisionPoints.length; i++) {
      const dp = decisionPoints[i];
      if (!dp) continue;

      const chunk = this.createChunk(
        dp.content.trim(),
        i,
        docId,
        sourcePath,
        config,
        'preference',
        'atomic'
      );

      chunk.metadata.boundary_type = 'decision';

      // Extract alternatives if configured
      if (config.includeAlternatives) {
        const alternatives = this.extractAlternatives(dp.content);
        if (alternatives.length > 0) {
          chunk.metadata.concepts = alternatives;
        }
      }

      chunks.push(chunk);
    }

    const durationMs = Date.now() - startTime;
    const result = {
      chunks,
      stats: this.computeStats(chunks, durationMs),
      warnings: chunks.length === 0 ? ['No decision points detected'] : [],
    };

    this.logChunking('complete', config, result);
    return result;
  }

  validate(config: ChunkingConfig): ValidationResult {
    const baseValidation = this.validateCommonConfig(config);
    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];

    if (!config.decisionKeywords || config.decisionKeywords.length === 0) {
      warnings.push('No decision keywords specified, using defaults');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  getDefaultConfig(): ChunkingConfig {
    return {
      maxTokens: 128,
      decisionKeywords: [
        'selected plan',
        'satisfaction rating',
        'preference',
        'chosen approach',
        'decision',
      ],
      includeAlternatives: true,
    };
  }

  /**
   * Detect decision points in document
   */
  private detectDecisionPoints(
    document: string,
    config: ChunkingConfig
  ): Array<{ content: string; position: number }> {
    const decisionPoints: Array<{ content: string; position: number }> = [];
    const keywords = config.decisionKeywords || this.getDefaultConfig().decisionKeywords || [];

    const lines = document.split('\n');
    let currentDecision: string[] = [];
    let decisionStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const lowerLine = line.toLowerCase();

      // Check if line contains decision keyword
      const isDecisionLine = keywords.some(kw => lowerLine.includes(kw.toLowerCase()));

      if (isDecisionLine) {
        if (decisionStart === -1) {
          decisionStart = i;
        }
        currentDecision.push(line);

        // Look ahead for context (next 2-3 lines)
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const nextLine = lines[j];
          if (nextLine) {
            currentDecision.push(nextLine);
          }
        }

        decisionPoints.push({
          content: currentDecision.join('\n'),
          position: decisionStart,
        });

        currentDecision = [];
        decisionStart = -1;
      }
    }

    return decisionPoints;
  }

  /**
   * Extract alternatives from decision point content
   */
  private extractAlternatives(content: string): string[] {
    const alternatives: string[] = [];

    // Look for bullet points or numbered lists
    const listPattern = /^[\s-]*[\*\-\d]+[\.\)]\s*(.+)$/gm;
    let match;

    while ((match = listPattern.exec(content)) !== null) {
      if (match[1]) {
        alternatives.push(match[1].trim());
      }
    }

    return alternatives;
  }
}
