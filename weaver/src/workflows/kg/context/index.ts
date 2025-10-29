/**
 * Context Analysis System
 *
 * Main entry point for building comprehensive document context by combining
 * directory, temporal, and primitive analysis.
 */

import type { FileEvent } from '../../../file-watcher/types.js';
import {
  analyzeDirectoryContext,
  calculateDirectorySimilarity,
  type DirectoryContext,
} from './directory-context.js';
import {
  analyzeTemporalContext,
  calculateTemporalSimilarity,
  type TemporalContext,
} from './temporal-context.js';
import {
  extractPrimitives,
  calculatePrimitiveOverlap,
  type Primitives,
} from './primitive-extractor.js';
import { logger } from '../../../utils/logger.js';

/**
 * Complete document context combining all analysis types
 */
export interface DocumentContext {
  /** File path relative to vault root */
  filePath: string;
  /** Directory structure and purpose */
  directory: DirectoryContext;
  /** Temporal relationships and phase */
  temporal: TemporalContext;
  /** Platforms, patterns, and features */
  primitives: Primitives;
}

/**
 * Build comprehensive document context from a file event
 *
 * This is the main entry point for context analysis. It runs all three
 * analyzers in parallel and combines their results.
 *
 * @param fileEvent - File system event containing file path and metadata
 * @param vaultRoot - Absolute path to vault root directory
 * @returns Complete document context
 */
export async function buildDocumentContext(
  fileEvent: FileEvent,
  vaultRoot: string
): Promise<DocumentContext> {
  try {
    logger.debug('Building document context', {
      filePath: fileEvent.relativePath,
    });

    // Run all analyzers in parallel for performance
    const [directory, temporal, primitives] = await Promise.all([
      analyzeDirectoryContext(fileEvent.path, vaultRoot),
      analyzeTemporalContext(fileEvent.path, vaultRoot),
      extractPrimitives(fileEvent.path),
    ]);

    const context: DocumentContext = {
      filePath: fileEvent.relativePath,
      directory,
      temporal,
      primitives,
    };

    logger.debug('Document context built', {
      filePath: fileEvent.relativePath,
      purpose: directory.purpose,
      phase: temporal.phase,
      domain: primitives.domain,
    });

    return context;
  } catch (error) {
    logger.error(
      'Error building document context',
      error instanceof Error ? error : new Error(String(error)),
      { filePath: fileEvent.relativePath }
    );

    // Return minimal context on error
    return {
      filePath: fileEvent.relativePath,
      directory: {
        directory: '.',
        purpose: 'general',
        parentDirectory: '',
        level: 0,
        relatedDirectories: [],
      },
      temporal: {
        recentFiles: [],
      },
      primitives: {
        platforms: [],
        patterns: [],
        features: [],
        domain: 'general',
      },
    };
  }
}

/**
 * Calculate overall similarity score between two document contexts
 *
 * Combines directory, temporal, and primitive similarity with weighted scoring.
 *
 * @param context1 - First document context
 * @param context2 - Second document context
 * @returns Similarity score from 0 to 1
 */
export function calculateContextSimilarity(
  context1: DocumentContext,
  context2: DocumentContext
): number {
  // Weighted similarity calculation
  const directorySimilarity = calculateDirectorySimilarity(
    context1.directory,
    context2.directory
  );
  const temporalSimilarity = calculateTemporalSimilarity(
    context1.temporal,
    context2.temporal
  );
  const primitiveSimilarity = calculatePrimitiveOverlap(
    context1.primitives,
    context2.primitives
  );

  // Weights: directory (40%), primitives (35%), temporal (25%)
  const score =
    directorySimilarity * 0.4 +
    primitiveSimilarity * 0.35 +
    temporalSimilarity * 0.25;

  return Math.min(score, 1.0);
}

/**
 * Get human-readable context summary
 */
export function getContextSummary(context: DocumentContext): string {
  const parts: string[] = [];

  parts.push(`📁 ${context.directory.purpose}`);

  if (context.temporal.phase) {
    parts.push(`📅 ${context.temporal.phase}`);
  }

  parts.push(`🔧 ${context.primitives.domain}`);

  if (context.primitives.platforms.length > 0) {
    parts.push(`⚙️  ${context.primitives.platforms.slice(0, 2).join(', ')}`);
  }

  return parts.join(' • ');
}

/**
 * Filter contexts by minimum similarity threshold
 *
 * @param targetContext - Context to compare against
 * @param candidates - Candidate contexts to filter
 * @param threshold - Minimum similarity score (0-1)
 * @returns Filtered and sorted contexts
 */
export function filterBySimilarity(
  targetContext: DocumentContext,
  candidates: DocumentContext[],
  threshold = 0.3
): Array<{ context: DocumentContext; similarity: number }> {
  const results = candidates
    .map(candidate => ({
      context: candidate,
      similarity: calculateContextSimilarity(targetContext, candidate),
    }))
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);

  return results;
}

// Re-export types and utilities
export type { DirectoryContext, TemporalContext, Primitives };
export {
  analyzeDirectoryContext,
  analyzeTemporalContext,
  extractPrimitives,
  calculateDirectorySimilarity,
  calculateTemporalSimilarity,
  calculatePrimitiveOverlap,
};
