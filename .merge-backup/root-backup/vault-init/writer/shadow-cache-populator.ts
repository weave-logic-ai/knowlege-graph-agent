/**
 * Shadow Cache Populator
 *
 * Integrates with Weaver shadow cache system to populate cache with vault files.
 */

import { createShadowCache } from '../../shadow-cache/index.js';
import { logger } from '../../utils/logger.js';

/**
 * Populate shadow cache with newly created vault files
 */
export async function populateShadowCache(
  vaultPath: string,
  cachePath: string,
  filesCreated: string[]
): Promise<void> {
  logger.info('Populating shadow cache', {
    vaultPath,
    cachePath,
    fileCount: filesCreated.length,
  });

  try {
    // Create shadow cache instance
    const cache = createShadowCache(cachePath, vaultPath);

    // Sync all created files to cache
    for (const absolutePath of filesCreated) {
      // Skip non-markdown files
      if (!absolutePath.endsWith('.md')) {
        continue;
      }

      // Convert to relative path
      const relativePath = absolutePath.replace(vaultPath + '/', '');

      try {
        await cache.syncFile(absolutePath, relativePath);
        logger.debug('Cached file', { path: relativePath });
      } catch (error) {
        logger.warn('Failed to cache file', {
          path: relativePath,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue with other files
      }
    }

    // Get cache stats
    const stats = cache.getStats();
    logger.info('✅ Shadow cache populated', {
      totalFiles: stats.totalFiles,
      totalTags: stats.totalTags,
      totalLinks: stats.totalLinks,
    });

    // Close cache connection
    cache.close();
  } catch (error) {
    logger.error('Failed to populate shadow cache', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Verify shadow cache population
 */
export async function verifyShadowCache(vaultPath: string, cachePath: string): Promise<boolean> {
  try {
    const cache = createShadowCache(cachePath, vaultPath);

    // Get stats
    const stats = cache.getStats();

    // Check if cache has data
    const hasData = stats.totalFiles > 0;

    // Close cache
    cache.close();

    return hasData;
  } catch (error) {
    logger.error('Failed to verify shadow cache', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}
