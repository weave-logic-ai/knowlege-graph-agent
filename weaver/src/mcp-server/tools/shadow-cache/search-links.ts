/**
 * Search Links Tool
 *
 * MCP tool for searching file relationships (links) in the shadow cache.
 * Supports source → target queries, target ← source queries, and bidirectional searches.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import { logger } from '../../../utils/logger.js';
import { ShadowCacheDatabase } from '../../../shadow-cache/database.js';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Tool definition for search_links
 */
export const searchLinksTool: Tool = {
  name: 'search_links',
  description: 'Search file relationships (links) in the vault. Query outgoing links (source → target), incoming links (target ← source), or bidirectional connections.',
  inputSchema: {
    type: 'object',
    properties: {
      source_file: {
        type: 'string',
        description: 'Path of the source file to find outgoing links from. Can be partial path (will match files containing this string).',
      },
      target_file: {
        type: 'string',
        description: 'Path of the target file to find incoming links to. Can be partial path (will match files containing this string).',
      },
      bidirectional: {
        type: 'boolean',
        description: 'If true, find files with links in both directions (A links to B AND B links to A)',
        default: false,
      },
      link_type: {
        type: 'string',
        enum: ['all', 'wikilink', 'markdown'],
        description: 'Filter by link type: all (default), wikilink ([[link]]), or markdown ([text](link))',
        default: 'all',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (1-1000)',
        minimum: 1,
        maximum: 1000,
        default: 100,
      },
    },
  },
};

/**
 * Interface for link search result
 */
interface LinkResult {
  link_id: number;
  source_file_id: number;
  source_path: string;
  source_filename: string;
  source_type: string | null;
  target_path: string;
  link_type: 'wikilink' | 'markdown';
  link_text: string | null;
  target_exists: boolean;
  target_file_id: number | null;
  target_filename: string | null;
}

/**
 * Handler function for search_links tool
 */
export const searchLinksHandler: ToolHandler = async (params: any): Promise<ToolResult> => {
  const startTime = Date.now();

  try {
    const {
      source_file,
      target_file,
      bidirectional = false,
      link_type = 'all',
      limit = 100,
    } = params;

    // Validate inputs
    if (!source_file && !target_file) {
      return {
        success: false,
        error: 'Either source_file or target_file must be specified',
      };
    }

    if (limit < 1 || limit > 1000) {
      return {
        success: false,
        error: 'Limit must be between 1 and 1000',
      };
    }

    // Open shadow cache database
    const vaultPath = process.env['WEAVER_VAULT_PATH'] || join(homedir(), 'Documents', 'vault');
    const dbPath = join(vaultPath, '.weaver', 'shadow-cache.db');
    const db = new ShadowCacheDatabase(dbPath);

    try {
      const rawDb = db.getDatabase();
      let results: LinkResult[] = [];

      if (bidirectional && source_file && target_file) {
        // Find bidirectional links (A → B AND B → A)
        const query = `
          SELECT DISTINCT
            l1.id as link_id,
            l1.source_file_id,
            f1.path as source_path,
            f1.filename as source_filename,
            f1.type as source_type,
            l1.target_path,
            l1.link_type,
            l1.link_text,
            CASE WHEN f2.id IS NOT NULL THEN 1 ELSE 0 END as target_exists,
            f2.id as target_file_id,
            f2.filename as target_filename
          FROM links l1
          JOIN files f1 ON l1.source_file_id = f1.id
          LEFT JOIN files f2 ON l1.target_path = f2.path
          WHERE
            f1.path LIKE ?
            AND l1.target_path LIKE ?
            ${link_type !== 'all' ? 'AND l1.link_type = ?' : ''}
            AND EXISTS (
              SELECT 1 FROM links l2
              JOIN files f3 ON l2.source_file_id = f3.id
              WHERE f3.path LIKE ?
              AND l2.target_path LIKE ?
            )
          ORDER BY f1.path, l1.target_path
          LIMIT ?
        `;

        const sourcePattern = `%${source_file}%`;
        const targetPattern = `%${target_file}%`;
        const args = link_type !== 'all'
          ? [sourcePattern, targetPattern, link_type, targetPattern, sourcePattern, limit]
          : [sourcePattern, targetPattern, targetPattern, sourcePattern, limit];

        const stmt = rawDb.prepare(query);
        results = stmt.all(...args) as LinkResult[];

      } else if (source_file) {
        // Find outgoing links from source
        const query = `
          SELECT
            l.id as link_id,
            l.source_file_id,
            f1.path as source_path,
            f1.filename as source_filename,
            f1.type as source_type,
            l.target_path,
            l.link_type,
            l.link_text,
            CASE WHEN f2.id IS NOT NULL THEN 1 ELSE 0 END as target_exists,
            f2.id as target_file_id,
            f2.filename as target_filename
          FROM links l
          JOIN files f1 ON l.source_file_id = f1.id
          LEFT JOIN files f2 ON l.target_path = f2.path
          WHERE
            f1.path LIKE ?
            ${link_type !== 'all' ? 'AND l.link_type = ?' : ''}
          ORDER BY f1.path, l.target_path
          LIMIT ?
        `;

        const pattern = `%${source_file}%`;
        const args = link_type !== 'all' ? [pattern, link_type, limit] : [pattern, limit];
        const stmt = rawDb.prepare(query);
        results = stmt.all(...args) as LinkResult[];

      } else if (target_file) {
        // Find incoming links to target
        const query = `
          SELECT
            l.id as link_id,
            l.source_file_id,
            f1.path as source_path,
            f1.filename as source_filename,
            f1.type as source_type,
            l.target_path,
            l.link_type,
            l.link_text,
            CASE WHEN f2.id IS NOT NULL THEN 1 ELSE 0 END as target_exists,
            f2.id as target_file_id,
            f2.filename as target_filename
          FROM links l
          JOIN files f1 ON l.source_file_id = f1.id
          LEFT JOIN files f2 ON l.target_path = f2.path
          WHERE
            l.target_path LIKE ?
            ${link_type !== 'all' ? 'AND l.link_type = ?' : ''}
          ORDER BY l.target_path, f1.path
          LIMIT ?
        `;

        const pattern = `%${target_file}%`;
        const args = link_type !== 'all' ? [pattern, link_type, limit] : [pattern, limit];
        const stmt = rawDb.prepare(query);
        results = stmt.all(...args) as LinkResult[];
      }

      // Transform results into more user-friendly format
      const links = results.map(r => ({
        source: {
          path: r.source_path,
          filename: r.source_filename,
          type: r.source_type,
        },
        target: {
          path: r.target_path,
          filename: r.target_filename,
          exists: r.target_exists,
        },
        link: {
          type: r.link_type,
          text: r.link_text,
        },
      }));

      // Calculate statistics
      const uniqueSources = new Set(results.map(r => r.source_path)).size;
      const uniqueTargets = new Set(results.map(r => r.target_path)).size;
      const brokenLinks = results.filter(r => !r.target_exists).length;
      const linkTypeCount = {
        wikilink: results.filter(r => r.link_type === 'wikilink').length,
        markdown: results.filter(r => r.link_type === 'markdown').length,
      };

      const executionTime = Date.now() - startTime;

      logger.info('Search links completed', {
        source_file,
        target_file,
        bidirectional,
        link_type,
        found: results.length,
        executionTime,
      });

      db.close();

      return {
        success: true,
        data: {
          query: {
            source_file,
            target_file,
            bidirectional,
            link_type,
            limit,
          },
          links,
          statistics: {
            total_links: results.length,
            unique_sources: uniqueSources,
            unique_targets: uniqueTargets,
            broken_links: brokenLinks,
            by_type: linkTypeCount,
          },
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
    logger.error('Search links failed', error instanceof Error ? error : new Error(String(error)));

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        executionTime,
      },
    };
  }
};
