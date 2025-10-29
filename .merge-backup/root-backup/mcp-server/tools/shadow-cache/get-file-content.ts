/**
 * Get File Content Tool
 *
 * MCP tool for retrieving file content directly from the filesystem.
 * Handles text encoding and binary file detection.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';
import { logger } from '../../../utils/logger.js';

/**
 * Get file content parameters
 */
export interface GetFileContentParams {
  path: string;
  encoding?: 'utf8' | 'base64' | 'auto';
}

/**
 * Tool definition for get_file_content
 */
export const getFileContentTool: Tool = {
  name: 'get_file_content',
  description: 'Read file content directly from the filesystem. Supports text and binary files with encoding options.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path to the file in the vault (e.g., "concepts/graph-topology.md")',
      },
      encoding: {
        type: 'string',
        enum: ['utf8', 'base64', 'auto'],
        description: 'File encoding: utf8 for text, base64 for binary, auto to detect (default: auto)',
        default: 'auto',
      },
    },
    required: ['path'],
    additionalProperties: false,
  },
};

/**
 * Detect if file is binary by checking for null bytes in first 8KB
 *
 * @param filePath - Absolute path to file
 * @returns true if file appears to be binary
 */
function isBinaryFile(filePath: string): boolean {
  try {
    const buffer = readFileSync(filePath);
    const chunkSize = Math.min(8192, buffer.length);

    for (let i = 0; i < chunkSize; i++) {
      if (buffer[i] === 0) {
        return true; // Found null byte, likely binary
      }
    }

    return false;
  } catch {
    // If we can't read it, assume it's not binary
    return false;
  }
}

/**
 * Create handler function for get_file_content tool
 *
 * @param vaultPath - Absolute path to vault root
 * @returns Tool handler function
 */
export function createGetFileContentHandler(vaultPath: string): ToolHandler {
  return async (params: GetFileContentParams): Promise<ToolResult> => {
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

      // Construct absolute path
      const absolutePath = join(vaultPath, params.path);

      logger.debug('Reading file content', {
        path: params.path,
        encoding: params.encoding || 'auto',
      });

      // Check if file exists
      try {
        statSync(absolutePath);
      } catch {
        return {
          success: false,
          error: `File not found: ${params.path}`,
          metadata: {
            executionTime: Date.now() - startTime,
          },
        };
      }

      // Determine encoding
      let encoding: 'utf8' | 'base64' = 'utf8';
      let isBinary = false;

      if (params.encoding === 'base64') {
        encoding = 'base64';
        isBinary = true;
      } else if (params.encoding === 'utf8') {
        encoding = 'utf8';
        isBinary = false;
      } else {
        // Auto-detect
        isBinary = isBinaryFile(absolutePath);
        encoding = isBinary ? 'base64' : 'utf8';
      }

      // Read file
      let content: string;
      let fileSize: number;

      try {
        if (encoding === 'base64') {
          const buffer = readFileSync(absolutePath);
          content = buffer.toString('base64');
          fileSize = buffer.length;
        } else {
          content = readFileSync(absolutePath, 'utf-8');
          fileSize = Buffer.byteLength(content, 'utf-8');
        }
      } catch (error) {
        return {
          success: false,
          error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
          metadata: {
            executionTime: Date.now() - startTime,
          },
        };
      }

      const executionTime = Date.now() - startTime;

      logger.debug('File content read successfully', {
        path: params.path,
        encoding,
        isBinary,
        size: fileSize,
        executionTime,
      });

      return {
        success: true,
        data: {
          path: params.path,
          content,
          encoding,
          isBinary,
          size: fileSize,
        },
        metadata: {
          executionTime,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      logger.error('Failed to get file content', error instanceof Error ? error : new Error(String(error)), {
        params,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          executionTime,
        },
      };
    }
  };
}
