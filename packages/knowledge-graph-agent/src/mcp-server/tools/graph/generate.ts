/**
 * Graph Generate Tool
 *
 * MCP tool for generating or regenerating the knowledge graph from documentation.
 *
 * @module mcp-server/tools/graph/generate
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolResult } from '../../types/index.js';
import { join } from 'path';

/**
 * Graph generate tool definition
 */
export const graphGenerateTool: Tool = {
  name: 'kg_graph_generate',
  description: 'Generate or regenerate the knowledge graph from documentation files. Scans markdown files and creates nodes with relationships based on wikilinks and markdown links.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      docsPath: {
        type: 'string',
        description: 'Path to documentation directory relative to project root (default: "docs")',
        default: 'docs',
      },
      force: {
        type: 'boolean',
        description: 'Force regeneration even if the graph appears up to date',
        default: false,
      },
      incremental: {
        type: 'boolean',
        description: 'Perform incremental update instead of full regeneration',
        default: false,
      },
    },
  },
};

/**
 * Create graph generate handler
 *
 * @param projectRoot - Project root directory path
 * @returns Tool handler function
 */
export function createGraphGenerateHandler(projectRoot?: string): ToolHandler {
  return async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const { docsPath = 'docs', force = false, incremental = false } = params || {};

    try {
      // Validate project root
      if (!projectRoot) {
        return {
          success: false,
          error: 'Project root not configured. Initialize the MCP server with a valid project path.',
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      // Compute full paths
      const outputPath = join(projectRoot, docsPath as string);
      const dbPath = join(projectRoot, '.kg', 'knowledge-graph.db');

      // Dynamic import to avoid circular dependencies
      const { generateAndSave, updateGraph } = await import('../../../generators/graph-generator.js');

      let result: {
        success: boolean;
        stats: {
          filesScanned?: number;
          nodesCreated?: number;
          edgesCreated?: number;
          added?: number;
          updated?: number;
          removed?: number;
          errors: string[];
        };
      };

      if (incremental && !force) {
        // Perform incremental update
        const updateResult = await updateGraph(dbPath, outputPath);
        result = {
          success: updateResult.errors.length === 0,
          stats: {
            added: updateResult.added,
            updated: updateResult.updated,
            removed: updateResult.removed,
            nodesCreated: updateResult.added,
            errors: updateResult.errors,
          },
        };
      } else {
        // Full generation
        result = await generateAndSave(
          { projectRoot, outputPath },
          dbPath
        );
      }

      // Format response
      const response: Record<string, unknown> = {
        mode: incremental && !force ? 'incremental' : 'full',
        filesProcessed: result.stats.filesScanned || 0,
        nodesGenerated: result.stats.nodesCreated || 0,
        edgesCreated: result.stats.edgesCreated || 0,
      };

      if (incremental && !force) {
        response.nodesAdded = result.stats.added || 0;
        response.nodesUpdated = result.stats.updated || 0;
        response.nodesRemoved = result.stats.removed || 0;
      }

      if (result.stats.errors.length > 0) {
        response.errors = result.stats.errors;
        response.errorCount = result.stats.errors.length;
      }

      return {
        success: result.success,
        data: response,
        metadata: {
          executionTime: Date.now() - startTime,
          projectRoot,
          docsPath,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { executionTime: Date.now() - startTime },
      };
    }
  };
}
