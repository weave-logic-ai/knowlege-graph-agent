/**
 * Query Files Tool
 *
 * MCP tool for querying files from the shadow cache with filtering and pagination.
 * Supports filtering by directory, type, status, and tags.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { ShadowCache, CachedFile } from '../../../shadow-cache/index.js';
import { logger } from '../../../utils/logger.js';

/**
 * Query parameters for filtering files
 */
export interface QueryFilesParams {
  directory?: string;
  type?: string;
  status?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}

/**
 * Tool definition for query_files
 */
export const queryFilesTool: Tool = {
  name: 'query_files',
  description: 'Query files from the shadow cache with optional filters and pagination. Returns file metadata without content.',
  inputSchema: {
    type: 'object',
    properties: {
      directory: {
        type: 'string',
        description: 'Filter by directory path (e.g., "technical", "concepts")',
      },
      type: {
        type: 'string',
        description: 'Filter by file type from frontmatter (e.g., "concept", "feature", "technical")',
      },
      status: {
        type: 'string',
        description: 'Filter by status from frontmatter (e.g., "active", "draft", "archived")',
      },
      tag: {
        type: 'string',
        description: 'Filter by tag (e.g., "graph", "neural", "mcp")',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 50)',
        minimum: 1,
        maximum: 500,
      },
      offset: {
        type: 'number',
        description: 'Number of results to skip for pagination (default: 0)',
        minimum: 0,
      },
    },
    additionalProperties: false,
  },
};

/**
 * Create handler function for query_files tool
 *
 * @param shadowCache - Shadow cache instance
 * @returns Tool handler function
 */
export function createQueryFilesHandler(shadowCache: ShadowCache): ToolHandler {
  return async (params: QueryFilesParams): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      // Validate parameters
      const limit = Math.min(params.limit || 50, 500);
      const offset = Math.max(params.offset || 0, 0);

      logger.debug('Querying files from shadow cache', {
        directory: params.directory,
        type: params.type,
        status: params.status,
        tag: params.tag,
        limit,
        offset,
      });

      // Get files based on filters
      let files: CachedFile[];

      if (params.tag) {
        // Filter by tag
        files = shadowCache.getFilesByTag(params.tag);
      } else if (params.directory) {
        // Filter by directory
        files = shadowCache.getFilesByDirectory(params.directory);
      } else if (params.type) {
        // Filter by type
        files = shadowCache.getFilesByType(params.type);
      } else if (params.status) {
        // Filter by status
        files = shadowCache.getFilesByStatus(params.status);
      } else {
        // Get all files
        files = shadowCache.getAllFiles();
      }

      // Apply additional filters if multiple criteria specified
      if (params.directory && params.tag) {
        const tagFiles = shadowCache.getFilesByTag(params.tag);
        const tagFilePaths = new Set(tagFiles.map(f => f.path));
        files = files.filter(f => tagFilePaths.has(f.path));
      }

      if (params.type && (params.directory || params.tag)) {
        files = files.filter(f => f.type === params.type);
      }

      if (params.status && (params.directory || params.tag || params.type)) {
        files = files.filter(f => f.status === params.status);
      }

      // Apply pagination
      const total = files.length;
      const paginatedFiles = files.slice(offset, offset + limit);

      // Parse frontmatter JSON for each file
      const filesWithParsedFrontmatter = paginatedFiles.map(file => ({
        ...file,
        frontmatter: file.frontmatter ? JSON.parse(file.frontmatter) : null,
      }));

      const executionTime = Date.now() - startTime;

      logger.debug('Files query completed', {
        total,
        returned: paginatedFiles.length,
        executionTime,
      });

      return {
        success: true,
        data: {
          files: filesWithParsedFrontmatter,
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        metadata: {
          executionTime,
          cacheHit: true,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      logger.error('Failed to query files', error instanceof Error ? error : new Error(String(error)), {
        params,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          executionTime,
          cacheHit: false,
        },
      };
    }
  };
}
