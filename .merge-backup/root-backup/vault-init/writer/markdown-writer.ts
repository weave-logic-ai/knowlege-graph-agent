/**
 * Markdown Writer
 *
 * Safe atomic file writing for markdown files.
 */

import { writeFile, rename, unlink, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { existsSync } from 'fs';
import { logger } from '../../utils/logger.js';

/**
 * Write markdown file atomically using temp file + rename
 * This ensures that files are never partially written
 */
export async function writeMarkdownFile(filePath: string, content: string): Promise<void> {
  const dir = dirname(filePath);
  const tempPath = `${filePath}.tmp`;

  try {
    // Ensure directory exists
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Write to temporary file
    await writeFile(tempPath, content, 'utf-8');

    // Atomic rename (this is atomic on most filesystems)
    await rename(tempPath, filePath);

    logger.debug('Wrote markdown file', { path: filePath, size: content.length });
  } catch (error) {
    // Clean up temp file if it exists
    try {
      if (existsSync(tempPath)) {
        await unlink(tempPath);
      }
    } catch {
      logger.warn('Failed to clean up temp file', { path: tempPath });
    }

    logger.error('Failed to write markdown file', error instanceof Error ? error : new Error(String(error)), {
      path: filePath,
    });
    throw error;
  }
}

/**
 * Write multiple markdown files in batch
 */
export async function writeMarkdownFiles(
  files: Array<{ path: string; content: string }>
): Promise<{ successful: string[]; failed: Array<{ path: string; error: string }> }> {
  const successful: string[] = [];
  const failed: Array<{ path: string; error: string }> = [];

  for (const file of files) {
    try {
      await writeMarkdownFile(file.path, file.content);
      successful.push(file.path);
    } catch (error) {
      failed.push({
        path: file.path,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { successful, failed };
}

/**
 * Validate markdown content before writing
 */
export function validateMarkdownContent(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for minimum content length
  if (content.length < 10) {
    errors.push('Content too short (minimum 10 characters)');
  }

  // Check for frontmatter (if present, must be valid)
  if (content.startsWith('---')) {
    const frontmatterEnd = content.indexOf('---', 3);
    if (frontmatterEnd === -1) {
      errors.push('Frontmatter not properly closed');
    }
  }

  // Check for extremely large files (> 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (content.length > maxSize) {
    errors.push(`Content too large (${content.length} bytes, max ${maxSize} bytes)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
