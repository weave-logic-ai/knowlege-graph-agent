/**
 * Get File Tool
 *
 * MCP tool for retrieving metadata for a specific file from the shadow cache.
 * Optionally includes file content from the filesystem.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import type { ShadowCache } from '../../../shadow-cache/index.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../../../utils/logger.js';

/**
 * Get file parameters
 */
export interface GetFileParams {
  path: string;
  includeContent?: boolean;
}

/**
 * Tool definition for get_file
 */
export const getFileTool: Tool = {
  name: 'get_file',
  description: 'Get metadata for a specific file from the shadow cache. Optionally include file content from filesystem.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path to the file in the vault (e.g., "concepts/graph-topology.md")',
      },
      includeContent: {
        type: 'boolean',
        description: 'Whether to include file content from filesystem (default: false)',
        default: false,
      },
    },
    required: ['path'],
    additionalProperties: false,
  },
};

/**
 * Create handler function for get_file tool
 *
 * @param shadowCache - Shadow cache instance
 * @param vaultPath - Absolute path to vault root
 * @returns Tool handler function
 */
export function createGetFileHandler(shadowCache: ShadowCache, vaultPath: string): ToolHandler {
  return async (params: GetFileParams): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      // Validate path
      if (!params.path || params.path.trim() === '') {
        return {
          success: false,
          error: 'Path parameter is required and cannot be empty',
          metadata: {
            executionTime: Date.now() - startTime,
          },
        };
      }

      logger.debug('Getting file from shadow cache', {
        path: params.path,
        includeContent: params.includeContent,
      });

      // Get file from cache
      const file = shadowCache.getFile(params.path);

      if (!file) {
        return {
          success: false,
          error: `File not found in cache: ${params.path}`,
          metadata: {
            executionTime: Date.now() - startTime,
            cacheHit: false,
          },
        };
      }

      // Parse frontmatter
      const frontmatter = file.frontmatter ? JSON.parse(file.frontmatter) : null;

      // Get tags for the file
      const db = (shadowCache as any).db; // Access private db property
      const tags = db.getFileTags(file.id);

      // Get links for the file
      const outgoingLinks = db.getOutgoingLinks(file.id);
      const incomingLinks = db.getIncomingLinks(file.path);

      // Build response
      const response: any = {
        ...file,
        frontmatter,
        tags,
        outgoingLinks: outgoingLinks.map((link: any) => ({
          targetPath: link.target_path,
          linkType: link.link_type,
          linkText: link.link_text,
        })),
        incomingLinks: incomingLinks.map((link: any) => ({
          sourceFileId: link.source_file_id,
          linkType: link.link_type,
          linkText: link.link_text,
        })),
      };

      // Optionally include content
      if (params.includeContent) {
        try {
          const absolutePath = join(vaultPath, params.path);
          const content = readFileSync(absolutePath, 'utf-8');
          response.content = content;
        } catch (error) {
          logger.warn('Failed to read file content from filesystem', {
            path: params.path,
            error: error instanceof Error ? error.message : String(error),
          });
          response.contentError = 'Failed to read file content';
        }
      }

      const executionTime = Date.now() - startTime;

      logger.debug('File retrieved successfully', {
        path: params.path,
        hasContent: !!response.content,
        executionTime,
      });

      return {
        success: true,
        data: response,
        metadata: {
          executionTime,
          cacheHit: true,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      logger.error('Failed to get file', error instanceof Error ? error : new Error(String(error)), {
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
