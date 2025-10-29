/**
 * Get Stats Tool
 *
 * MCP tool for retrieving shadow cache statistics and health information.
 * Provides counts, cache health metrics, and database information.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import { logger } from '../../../utils/logger.js';
import { ShadowCacheDatabase } from '../../../shadow-cache/database.js';
import { join } from 'path';
import { homedir } from 'os';
import { statSync, existsSync } from 'fs';

/**
 * Tool definition for get_stats
 */
export const getStatsTool: Tool = {
  name: 'get_stats',
  description: 'Get shadow cache statistics and health information. Provides file counts, tag counts, link counts, and cache health metrics.',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['files', 'tags', 'links', 'health', 'all'],
        description: 'Category of statistics to retrieve: files (file counts and types), tags (tag usage), links (link relationships), health (cache health), or all (everything)',
        default: 'all',
      },
      include_details: {
        type: 'boolean',
        description: 'Include detailed breakdowns (e.g., files by type, top tags, etc.)',
        default: false,
      },
    },
  },
};

/**
 * Get file statistics
 */
function getFileStats(db: ShadowCacheDatabase, includeDetails: boolean): any {
  const rawDb = db.getDatabase();

  // Basic counts
  const totalFiles = rawDb.prepare('SELECT COUNT(*) as count FROM files').get() as { count: number };

  const stats: any = {
    total: totalFiles.count,
  };

  if (includeDetails) {
    // Files by type
    const byType = rawDb.prepare(`
      SELECT type, COUNT(*) as count
      FROM files
      WHERE type IS NOT NULL
      GROUP BY type
      ORDER BY count DESC
    `).all() as Array<{ type: string; count: number }>;

    // Files by status
    const byStatus = rawDb.prepare(`
      SELECT status, COUNT(*) as count
      FROM files
      WHERE status IS NOT NULL
      GROUP BY status
      ORDER BY count DESC
    `).all() as Array<{ status: string; count: number }>;

    // Files by directory (top 10)
    const byDirectory = rawDb.prepare(`
      SELECT directory, COUNT(*) as count
      FROM files
      GROUP BY directory
      ORDER BY count DESC
      LIMIT 10
    `).all() as Array<{ directory: string; count: number }>;

    // Recently modified files (last 7 days)
    const recentlyModified = rawDb.prepare(`
      SELECT COUNT(*) as count
      FROM files
      WHERE julianday('now') - julianday(modified_at) <= 7
    `).get() as { count: number };

    stats.by_type = byType;
    stats.by_status = byStatus;
    stats.top_directories = byDirectory;
    stats.recently_modified = recentlyModified.count;
  }

  return stats;
}

/**
 * Get tag statistics
 */
function getTagStats(db: ShadowCacheDatabase, includeDetails: boolean): any {
  const rawDb = db.getDatabase();

  // Basic counts
  const totalTags = rawDb.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number };
  const totalTagAssignments = rawDb.prepare('SELECT COUNT(*) as count FROM file_tags').get() as { count: number };

  const stats: any = {
    total_tags: totalTags.count,
    total_assignments: totalTagAssignments.count,
  };

  if (includeDetails) {
    // Most used tags (top 20)
    const topTags = rawDb.prepare(`
      SELECT t.tag, COUNT(ft.file_id) as file_count
      FROM tags t
      LEFT JOIN file_tags ft ON t.id = ft.tag_id
      GROUP BY t.tag
      ORDER BY file_count DESC
      LIMIT 20
    `).all() as Array<{ tag: string; file_count: number }>;

    // Files per tag statistics
    const tagUsageStats = rawDb.prepare(`
      SELECT
        AVG(tag_count) as avg_tags_per_file,
        MAX(tag_count) as max_tags_per_file,
        MIN(tag_count) as min_tags_per_file
      FROM (
        SELECT file_id, COUNT(*) as tag_count
        FROM file_tags
        GROUP BY file_id
      )
    `).get() as {
      avg_tags_per_file: number;
      max_tags_per_file: number;
      min_tags_per_file: number;
    };

    // Unused tags
    const unusedTags = rawDb.prepare(`
      SELECT COUNT(*) as count
      FROM tags t
      LEFT JOIN file_tags ft ON t.id = ft.tag_id
      WHERE ft.tag_id IS NULL
    `).get() as { count: number };

    stats.top_tags = topTags;
    stats.usage_stats = tagUsageStats;
    stats.unused_tags = unusedTags.count;
  }

  return stats;
}

/**
 * Get link statistics
 */
function getLinkStats(db: ShadowCacheDatabase, includeDetails: boolean): any {
  const rawDb = db.getDatabase();

  // Basic counts
  const totalLinks = rawDb.prepare('SELECT COUNT(*) as count FROM links').get() as { count: number };

  const stats: any = {
    total: totalLinks.count,
  };

  if (includeDetails) {
    // Links by type
    const byType = rawDb.prepare(`
      SELECT link_type, COUNT(*) as count
      FROM links
      GROUP BY link_type
      ORDER BY count DESC
    `).all() as Array<{ link_type: string; count: number }>;

    // Broken links (targets that don't exist)
    const brokenLinks = rawDb.prepare(`
      SELECT COUNT(*) as count
      FROM links l
      LEFT JOIN files f ON l.target_path = f.path
      WHERE f.id IS NULL
    `).get() as { count: number };

    // Most linked-to files (top 10)
    const mostLinkedTo = rawDb.prepare(`
      SELECT l.target_path, COUNT(*) as link_count
      FROM links l
      GROUP BY l.target_path
      ORDER BY link_count DESC
      LIMIT 10
    `).all() as Array<{ target_path: string; link_count: number }>;

    // Files with most outgoing links (top 10)
    const mostOutgoing = rawDb.prepare(`
      SELECT f.path, COUNT(l.id) as link_count
      FROM files f
      JOIN links l ON f.id = l.source_file_id
      GROUP BY f.path
      ORDER BY link_count DESC
      LIMIT 10
    `).all() as Array<{ path: string; link_count: number }>;

    // Orphaned files (no incoming or outgoing links)
    const orphanedFiles = rawDb.prepare(`
      SELECT COUNT(*) as count
      FROM files f
      WHERE NOT EXISTS (SELECT 1 FROM links WHERE source_file_id = f.id)
        AND NOT EXISTS (SELECT 1 FROM links WHERE target_path = f.path)
    `).get() as { count: number };

    stats.by_type = byType;
    stats.broken_links = brokenLinks.count;
    stats.most_linked_to = mostLinkedTo;
    stats.most_outgoing = mostOutgoing;
    stats.orphaned_files = orphanedFiles.count;
  }

  return stats;
}

/**
 * Get cache health information
 */
function getCacheHealth(db: ShadowCacheDatabase, dbPath: string): any {
  const rawDb = db.getDatabase();

  // Get cache metadata
  const version = rawDb.prepare("SELECT value FROM cache_metadata WHERE key = 'version'").get() as { value: string } | undefined;
  const lastSync = rawDb.prepare("SELECT value FROM cache_metadata WHERE key = 'last_full_sync'").get() as { value: string } | undefined;

  // Database file info
  let dbSize = 0;
  let dbExists = false;
  if (existsSync(dbPath)) {
    dbExists = true;
    const stats = statSync(dbPath);
    dbSize = stats.size;
  }

  // Get page info
  const pageInfo = rawDb.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as { size: number };

  // Calculate time since last sync
  let hoursSinceSync = null;
  if (lastSync?.value) {
    const lastSyncDate = new Date(lastSync.value);
    const now = new Date();
    hoursSinceSync = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);
  }

  // Check for recent activity
  const recentUpdates = rawDb.prepare(`
    SELECT COUNT(*) as count
    FROM files
    WHERE julianday('now') - julianday(cache_updated_at) <= 1
  `).get() as { count: number };

  // Determine health status
  let status = 'healthy';
  const issues = [];

  if (!lastSync?.value) {
    status = 'warning';
    issues.push('No full sync recorded');
  } else if (hoursSinceSync && hoursSinceSync > 168) {
    // More than 7 days
    status = 'warning';
    issues.push('Cache is stale (last sync > 7 days)');
  }

  if (!dbExists) {
    status = 'error';
    issues.push('Database file not found');
  }

  return {
    status,
    version: version?.value || 'unknown',
    last_full_sync: lastSync?.value || null,
    hours_since_sync: hoursSinceSync ? Math.round(hoursSinceSync * 10) / 10 : null,
    recent_updates: recentUpdates.count,
    database: {
      exists: dbExists,
      path: dbPath,
      size_bytes: dbSize,
      size_mb: Math.round((dbSize / (1024 * 1024)) * 100) / 100,
      page_size: pageInfo.size,
    },
    issues: issues.length > 0 ? issues : null,
  };
}

/**
 * Handler function for get_stats tool
 */
export const getStatsHandler: ToolHandler = async (params: any): Promise<ToolResult> => {
  const startTime = Date.now();

  try {
    const {
      category = 'all',
      include_details = false,
    } = params;

    // Open shadow cache database
    const vaultPath = process.env['WEAVER_VAULT_PATH'] || join(homedir(), 'Documents', 'vault');
    const dbPath = join(vaultPath, '.weaver', 'shadow-cache.db');
    const db = new ShadowCacheDatabase(dbPath);

    try {
      const stats: any = {};

      // Collect requested statistics
      if (category === 'all' || category === 'files') {
        stats.files = getFileStats(db, include_details);
      }

      if (category === 'all' || category === 'tags') {
        stats.tags = getTagStats(db, include_details);
      }

      if (category === 'all' || category === 'links') {
        stats.links = getLinkStats(db, include_details);
      }

      if (category === 'all' || category === 'health') {
        stats.health = getCacheHealth(db, dbPath);
      }

      const executionTime = Date.now() - startTime;

      logger.info('Get stats completed', {
        category,
        include_details,
        executionTime,
      });

      db.close();

      return {
        success: true,
        data: {
          category,
          include_details,
          vault_path: vaultPath,
          stats,
        },
        metadata: {
          executionTime,
        },
      };
    } finally {
      db.close();
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Get stats failed', error instanceof Error ? error : new Error(String(error)));

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        executionTime,
      },
    };
  }
};
