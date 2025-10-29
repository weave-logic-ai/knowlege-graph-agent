/**
 * Directory Context Analyzer
 *
 * Analyzes directory structure to understand file organization,
 * hierarchy, and infer purpose from directory patterns.
 */

import { dirname, basename, relative } from 'path';
import { logger } from '../../../utils/logger.js';

export interface DirectoryContext {
  /** Directory path relative to vault root */
  directory: string;
  /** Directory purpose inferred from path */
  purpose: string;
  /** Parent directory */
  parentDirectory: string;
  /** Directory level (0 = root) */
  level: number;
  /** Related directories (siblings, parents) */
  relatedDirectories: string[];
}

/**
 * Analyze directory context for a file
 */
export async function analyzeDirectoryContext(
  filePath: string,
  vaultRoot: string
): Promise<DirectoryContext> {
  try {
    const relativePath = relative(vaultRoot, filePath);
    const directory = dirname(relativePath);
    const parts = directory === '.' ? [] : directory.split('/');

    // Infer purpose from directory name
    const purpose = inferDirectoryPurpose(directory);

    return {
      directory,
      purpose,
      parentDirectory: parts.length > 0 ? dirname(directory) : '',
      level: parts.length,
      relatedDirectories: findRelatedDirectories(directory, parts),
    };
  } catch (error) {
    logger.error(
      'Error analyzing directory context',
      error instanceof Error ? error : new Error(String(error)),
      { filePath, vaultRoot }
    );

    // Return safe defaults
    return {
      directory: '.',
      purpose: 'general',
      parentDirectory: '',
      level: 0,
      relatedDirectories: [],
    };
  }
}

/**
 * Infer directory purpose from path patterns
 */
function inferDirectoryPurpose(directory: string): string {
  const lowerDir = directory.toLowerCase();

  // Planning and project management
  if (lowerDir.includes('_planning')) return 'planning';
  if (lowerDir.includes('phases')) return 'planning';
  if (lowerDir.includes('specs')) return 'specification';
  if (lowerDir.includes('_sops')) return 'process';

  // Documentation
  if (lowerDir.includes('/docs') || lowerDir === 'docs') return 'documentation';
  if (lowerDir.includes('/documentation') || lowerDir === 'documentation') return 'documentation';
  if (lowerDir.includes('/guides') || lowerDir === 'guides') return 'documentation';

  // Source code
  if (lowerDir.includes('/src') || lowerDir === 'src' || lowerDir.startsWith('src/')) return 'source-code';
  if (lowerDir.includes('/lib') || lowerDir === 'lib' || lowerDir.startsWith('lib/')) return 'source-code';
  if (lowerDir.includes('/packages') || lowerDir === 'packages' || lowerDir.startsWith('packages/')) return 'source-code';

  // Testing
  if (lowerDir.includes('/tests') || lowerDir === 'tests' || lowerDir.startsWith('tests/')) return 'testing';
  if (lowerDir.includes('/test') || lowerDir === 'test' || lowerDir.startsWith('test/')) return 'testing';
  if (lowerDir.includes('/__tests__')) return 'testing';

  // Research
  if (lowerDir.includes('research')) return 'research';
  if (lowerDir.includes('analysis')) return 'research';

  // Archive and historical
  if (lowerDir.includes('/archive')) return 'archived';
  if (lowerDir.includes('/deprecated')) return 'archived';
  if (lowerDir.includes('/old')) return 'archived';

  // Configuration
  if (lowerDir.includes('/config')) return 'configuration';
  if (lowerDir.includes('/.config')) return 'configuration';

  // Scripts and tools
  if (lowerDir.includes('/scripts')) return 'tooling';
  if (lowerDir.includes('/tools')) return 'tooling';

  // Examples and templates
  if (lowerDir.includes('/examples')) return 'examples';
  if (lowerDir.includes('/templates')) return 'templates';

  return 'general';
}

/**
 * Find directories related to the current one
 */
function findRelatedDirectories(directory: string, parts: string[]): string[] {
  const related: string[] = [];

  // Add parent directory
  if (parts.length > 1) {
    related.push(parts.slice(0, -1).join('/'));
  }

  // Add grandparent for deep hierarchies
  if (parts.length > 2) {
    related.push(parts.slice(0, -2).join('/'));
  }

  // Potential sibling directories (same parent)
  // These will be validated against actual filesystem later
  if (parts.length > 0) {
    const parentPath = parts.slice(0, -1).join('/');
    const lastPart = parts[parts.length - 1];

    // Common sibling patterns
    const siblingPatterns = [
      'docs',
      'tests',
      'src',
      'examples',
      'config',
      'scripts',
    ];

    for (const pattern of siblingPatterns) {
      if (pattern !== lastPart) {
        const potentialSibling = parentPath ? `${parentPath}/${pattern}` : pattern;
        related.push(potentialSibling);
      }
    }
  }

  return related;
}

/**
 * Check if two directories share a common purpose
 */
export function haveSimilarPurpose(purpose1: string, purpose2: string): boolean {
  // Exact match
  if (purpose1 === purpose2) return true;

  // Related purposes
  const relatedPurposes: Record<string, string[]> = {
    'source-code': ['testing', 'configuration'],
    'documentation': ['planning', 'specification'],
    'planning': ['specification', 'process'],
    'research': ['analysis', 'documentation'],
  };

  const related = relatedPurposes[purpose1] || [];
  return related.includes(purpose2);
}

/**
 * Calculate directory similarity score (0-1)
 */
export function calculateDirectorySimilarity(
  dir1: DirectoryContext,
  dir2: DirectoryContext
): number {
  let score = 0;

  // Same directory = perfect match
  if (dir1.directory === dir2.directory) return 1.0;

  // Same parent directory
  if (dir1.parentDirectory === dir2.parentDirectory && dir1.parentDirectory !== '') {
    score += 0.4;
  }

  // Similar purpose
  if (haveSimilarPurpose(dir1.purpose, dir2.purpose)) {
    score += 0.3;
  }

  // Similar level in hierarchy (within 1 level)
  if (Math.abs(dir1.level - dir2.level) <= 1) {
    score += 0.2;
  }

  // Related directories
  if (dir1.relatedDirectories.includes(dir2.directory) ||
      dir2.relatedDirectories.includes(dir1.directory)) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}
