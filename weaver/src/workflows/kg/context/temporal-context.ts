/**
 * Temporal Context Analyzer
 *
 * Analyzes temporal relationships between files, including creation dates,
 * modification patterns, and phase/period associations.
 */

import { readFile, stat } from 'fs/promises';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { logger } from '../../../utils/logger.js';

export interface TemporalContext {
  /** When this file was created */
  createdDate?: Date;
  /** When this file was last modified */
  modifiedDate?: Date;
  /** Files created around the same time (±7 days) */
  recentFiles: string[];
  /** Phase/period this file belongs to */
  phase?: string;
}

/**
 * Analyze temporal context for a file
 */
export async function analyzeTemporalContext(
  filePath: string,
  vaultRoot: string
): Promise<TemporalContext> {
  try {
    // Try to get dates from frontmatter first, then fall back to file stats
    const content = await readFile(filePath, 'utf-8');
    const { data } = matter(content);

    let createdDate: Date | undefined;
    let modifiedDate: Date | undefined;

    // Check frontmatter for dates
    if (data.created_date) {
      createdDate = new Date(data.created_date);
    }
    if (data.modified_date) {
      modifiedDate = new Date(data.modified_date);
    }

    // Fall back to file system stats if needed
    if (!createdDate || !modifiedDate) {
      try {
        const stats = await stat(filePath);
        if (!createdDate) createdDate = stats.birthtime;
        if (!modifiedDate) modifiedDate = stats.mtime;
      } catch (statError) {
        logger.debug('Could not get file stats', { filePath });
      }
    }

    // Extract phase information
    const phase = extractPhase(filePath, data);

    // Find files created around the same time
    const recentFiles = createdDate
      ? await findRecentFiles(vaultRoot, createdDate, filePath)
      : [];

    return {
      createdDate,
      modifiedDate,
      recentFiles,
      phase,
    };
  } catch (error) {
    logger.error(
      'Error analyzing temporal context',
      error instanceof Error ? error : new Error(String(error)),
      { filePath }
    );

    return {
      recentFiles: [],
    };
  }
}

/**
 * Extract phase/period information from file
 */
function extractPhase(filePath: string, frontmatter: any): string | undefined {
  // Check frontmatter first
  if (frontmatter.phase) return frontmatter.phase;
  if (frontmatter.period) return frontmatter.period;
  if (frontmatter.sprint) return `sprint-${frontmatter.sprint}`;

  // Check filename patterns
  const phaseMatch = filePath.match(/phase[-_]?(\d+)/i);
  if (phaseMatch) return `phase-${phaseMatch[1]}`;

  const weekMatch = filePath.match(/week[-_]?(\d+)/i);
  if (weekMatch) return `week-${weekMatch[1]}`;

  const sprintMatch = filePath.match(/sprint[-_]?(\d+)/i);
  if (sprintMatch) return `sprint-${sprintMatch[1]}`;

  return undefined;
}

/**
 * Find files created within a time window of the target date
 */
async function findRecentFiles(
  vaultRoot: string,
  targetDate: Date,
  excludePath: string
): Promise<string[]> {
  try {
    // Find all markdown files
    const files = await fg('**/*.md', {
      cwd: vaultRoot,
      ignore: ['node_modules/**', '.git/**', '.obsidian/**', '**/dist/**'],
      absolute: false,
    });

    const recentFiles: Array<{ path: string; date: Date; diff: number }> = [];
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    // Limit to 200 files for performance
    const filesToCheck = files.slice(0, 200);

    for (const file of filesToCheck) {
      const fullPath = `${vaultRoot}/${file}`;
      if (fullPath === excludePath) continue;

      try {
        const content = await readFile(fullPath, 'utf-8');
        const { data } = matter(content);

        let fileDate: Date | undefined;

        // Try frontmatter first
        if (data.created_date) {
          fileDate = new Date(data.created_date);
        } else {
          // Fall back to file stats
          try {
            const stats = await stat(fullPath);
            fileDate = stats.birthtime;
          } catch {
            // Skip if can't get stats
            continue;
          }
        }

        if (fileDate) {
          const diff = Math.abs(fileDate.getTime() - targetDate.getTime());

          if (diff <= sevenDays) {
            recentFiles.push({ path: file, date: fileDate, diff });
          }
        }
      } catch {
        // Skip files that can't be read or parsed
      }
    }

    // Sort by time difference (closest first) and return top 10
    return recentFiles
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 10)
      .map(f => f.path);
  } catch (error) {
    logger.error(
      'Error finding recent files',
      error instanceof Error ? error : new Error(String(error)),
      { vaultRoot }
    );
    return [];
  }
}

/**
 * Check if two files are from the same phase
 */
export function areSamePhase(phase1?: string, phase2?: string): boolean {
  if (!phase1 || !phase2) return false;
  return phase1 === phase2;
}

/**
 * Calculate temporal similarity score (0-1)
 */
export function calculateTemporalSimilarity(
  temporal1: TemporalContext,
  temporal2: TemporalContext
): number {
  let score = 0;

  // Same phase = strong connection
  if (areSamePhase(temporal1.phase, temporal2.phase)) {
    score += 0.5;
  }

  // Created within 7 days of each other
  if (temporal1.createdDate && temporal2.createdDate) {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const diff = Math.abs(
      temporal1.createdDate.getTime() - temporal2.createdDate.getTime()
    );

    if (diff <= sevenDays) {
      // Linear decay: closer = higher score
      const daysDiff = diff / (24 * 60 * 60 * 1000);
      score += 0.3 * (1 - daysDiff / 7);
    }
  }

  // Modified around the same time (active together)
  if (temporal1.modifiedDate && temporal2.modifiedDate) {
    const twoDays = 2 * 24 * 60 * 60 * 1000;
    const diff = Math.abs(
      temporal1.modifiedDate.getTime() - temporal2.modifiedDate.getTime()
    );

    if (diff <= twoDays) {
      score += 0.2;
    }
  }

  return Math.min(score, 1.0);
}

/**
 * Get time-based context description
 */
export function getTemporalDescription(temporal: TemporalContext): string {
  const parts: string[] = [];

  if (temporal.phase) {
    parts.push(`Phase: ${temporal.phase}`);
  }

  if (temporal.createdDate) {
    const date = temporal.createdDate.toISOString().split('T')[0];
    parts.push(`Created: ${date}`);
  }

  if (temporal.recentFiles.length > 0) {
    parts.push(`${temporal.recentFiles.length} contemporary files`);
  }

  return parts.length > 0 ? parts.join(' | ') : 'No temporal context';
}
