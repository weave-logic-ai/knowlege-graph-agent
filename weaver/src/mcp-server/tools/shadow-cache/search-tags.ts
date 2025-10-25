/**
 * Search Tags Tool
 *
 * MCP tool for searching files by tag with wildcard support.
 * Queries the shadow cache tags table and returns matching files
 * with tag frequency information.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import { logger } from '../../../utils/logger.js';
import { ShadowCacheDatabase } from '../../../shadow-cache/database.js';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Tool definition for search_tags
 */
export const searchTagsTool: Tool = {
  name: 'search_tags',
  description: 'Search files by tag with wildcard support. Returns files matching the tag pattern with frequency information.',
  inputSchema: {
    type: 'object',
    properties: {
      tag: {
        type: 'string',
        description: 'Tag to search for. Supports wildcards: * (any characters), ? (single character). Examples: "python*", "dev-*", "*-complete"',
      },
      sort: {
        type: 'string',
        enum: ['path', 'filename', 'modified', 'frequency'],
        description: 'Sort results by: path (default), filename, modified date, or tag frequency',
        default: 'path',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (1-1000)',
        minimum: 1,
        maximum: 1000,
        default: 100,
      },
      offset: {
        type: 'number',
        description: 'Number of results to skip for pagination',
        minimum: 0,
        default: 0,
      },
    },
    required: ['tag'],
  },
};

/**
 * Convert wildcard pattern to SQL LIKE pattern
 * * -> %
 * ? -> _
 */
function wildcardToSqlPattern(pattern: string): string {
  return pattern
    .replace(/\*/g, '%')
    .replace(/\?/g, '_');
}

/**
 * Interface for tag search result
 */
interface TagSearchResult {
  file_id: number;
  path: string;
  filename: string;
  directory: string;
  type: string | null;
  status: string | null;
  title: string | null;
  modified_at: string;
  tag: string;
  tag_count: number; // Total number of tags on this file
}

/**
 * Handler function for search_tags tool
 */
export const searchTagsHandler: ToolHandler = async (params: any): Promise<ToolResult> => {
  const startTime = Date.now();

  try {
    const {
      tag,
      sort = 'path',
      limit = 100,
      offset = 0,
    } = params;

    // Validate inputs
    if (!tag || typeof tag !== 'string') {
      return {
        success: false,
        error: 'Tag parameter is required and must be a string',
      };
    }

    if (limit < 1 || limit > 1000) {
      return {
        success: false,
        error: 'Limit must be between 1 and 1000',
      };
    }

    if (offset < 0) {
      return {
        success: false,
        error: 'Offset must be non-negative',
      };
    }

    // Open shadow cache database
    const vaultPath = process.env['WEAVER_VAULT_PATH'] || join(homedir(), 'Documents', 'vault');
    const dbPath = join(vaultPath, '.weaver', 'shadow-cache.db');
    const db = new ShadowCacheDatabase(dbPath);

    try {
      // Convert wildcard pattern to SQL LIKE pattern
      const sqlPattern = wildcardToSqlPattern(tag);

      // Determine sort order
      let orderBy = 'f.path';
      switch (sort) {
        case 'filename':
          orderBy = 'f.filename';
          break;
        case 'modified':
          orderBy = 'f.modified_at DESC';
          break;
        case 'frequency':
          orderBy = 'tag_count DESC, f.path';
          break;
        default:
          orderBy = 'f.path';
      }

      // Build query with tag frequency
      const query = `
        SELECT
          f.id as file_id,
          f.path,
          f.filename,
          f.directory,
          f.type,
          f.status,
          f.title,
          f.modified_at,
          t.tag,
          (SELECT COUNT(*) FROM file_tags ft2 WHERE ft2.file_id = f.id) as tag_count
        FROM files f
        JOIN file_tags ft ON f.id = ft.file_id
        JOIN tags t ON ft.tag_id = t.id
        WHERE t.tag LIKE ?
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;

      const rawDb = db.getDatabase();
      const stmt = rawDb.prepare(query);
      const results = stmt.all(sqlPattern, limit, offset) as TagSearchResult[];

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT f.id) as total
        FROM files f
        JOIN file_tags ft ON f.id = ft.file_id
        JOIN tags t ON ft.tag_id = t.id
        WHERE t.tag LIKE ?
      `;
      const countStmt = rawDb.prepare(countQuery);
      const countResult = countStmt.get(sqlPattern) as { total: number };

      // Group results by file (in case a file has multiple matching tags)
      const filesMap = new Map<number, any>();
      for (const result of results) {
        if (!filesMap.has(result.file_id)) {
          filesMap.set(result.file_id, {
            path: result.path,
            filename: result.filename,
            directory: result.directory,
            type: result.type,
            status: result.status,
            title: result.title,
            modified_at: result.modified_at,
            matched_tags: [result.tag],
            total_tags: result.tag_count,
          });
        } else {
          // Add additional matching tag
          const file = filesMap.get(result.file_id);
          if (!file.matched_tags.includes(result.tag)) {
            file.matched_tags.push(result.tag);
          }
        }
      }

      const files = Array.from(filesMap.values());

      const executionTime = Date.now() - startTime;

      logger.info('Search tags completed', {
        tag,
        pattern: sqlPattern,
        matched: files.length,
        total: countResult.total,
        executionTime,
      });

      db.close();

      return {
        success: true,
        data: {
          query: {
            tag,
            pattern: sqlPattern,
            sort,
            limit,
            offset,
          },
          results: files,
          pagination: {
            total: countResult.total,
            limit,
            offset,
            returned: files.length,
            has_more: offset + files.length < countResult.total,
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
    logger.error('Search tags failed', error instanceof Error ? error : new Error(String(error)));

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        executionTime,
      },
    };
  }
};
