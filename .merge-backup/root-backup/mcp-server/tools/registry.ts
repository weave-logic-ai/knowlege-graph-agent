/**
 * Tool Registry System
 *
 * Central registry for all MCP tools provided by the Weaver server.
 * Organizes tools by category and provides lookup and validation functions.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// Shadow cache tools
import {
  queryFilesTool,
  getFileTool,
  getFileContentTool,
} from './shadow-cache/index.js';
import { searchTagsTool } from './shadow-cache/search-tags.js';
import { searchLinksTool } from './shadow-cache/search-links.js';
import { getStatsTool } from './shadow-cache/get-stats.js';

// Workflow tools
import {
  triggerWorkflowTool,
  listWorkflowsTool,
  getWorkflowStatusTool,
  getWorkflowHistoryTool,
} from './workflow/index.js';

/**
 * Represents a category of related tools
 */
export interface ToolCategory {
  name: string;
  description: string;
  tools: Tool[];
}

/**
 * All tool categories organized by functionality
 *
 * Categories:
 * - shadow-cache: Query and retrieve vault metadata from SQLite cache
 * - workflow: Trigger and monitor workflow executions
 */
export const toolCategories: ToolCategory[] = [
  {
    name: 'shadow-cache',
    description: 'Shadow cache query and metadata tools',
    tools: [
      queryFilesTool,
      getFileTool,
      getFileContentTool,
      searchTagsTool,
      searchLinksTool,
      getStatsTool,
    ],
  },
  {
    name: 'workflow',
    description: 'Workflow trigger and status tools',
    tools: [
      triggerWorkflowTool,
      listWorkflowsTool,
      getWorkflowStatusTool,
      getWorkflowHistoryTool,
    ],
  },
];

/**
 * Get all tool definitions from all categories
 *
 * @returns Array of all registered Tool definitions
 */
export function getToolDefinitions(): Tool[] {
  return toolCategories.flatMap((category) => category.tools);
}

/**
 * Find a tool by its name
 *
 * @param name - Tool name to search for
 * @returns Tool definition if found, undefined otherwise
 */
export function getToolByName(name: string): Tool | undefined {
  return getToolDefinitions().find((tool) => tool.name === name);
}

/**
 * Validate that a tool definition has all required fields
 *
 * @param tool - Tool definition to validate
 * @returns true if valid, false otherwise
 */
export function validateToolDefinition(tool: Tool): boolean {
  return !!(
    tool.name &&
    tool.description &&
    tool.inputSchema
  );
}

/**
 * Get all tools in a specific category
 *
 * @param categoryName - Name of the category
 * @returns Array of tools in the category, empty array if not found
 */
export function getToolsByCategory(categoryName: string): Tool[] {
  const category = toolCategories.find((cat) => cat.name === categoryName);
  return category?.tools ?? [];
}

/**
 * Get statistics about registered tools
 *
 * @returns Object with tool counts by category
 */
export function getToolStats(): {
  total: number;
  byCategory: Record<string, number>;
} {
  const byCategory: Record<string, number> = {};

  for (const category of toolCategories) {
    byCategory[category.name] = category.tools.length;
  }

  return {
    total: getToolDefinitions().length,
    byCategory,
  };
}

/**
 * Tool handler registry for mapping tool names to handler functions
 */
import type { ToolHandler, ToolHandlerEntry } from '../types/index.js';
import { logger } from '../../utils/logger.js';

const toolRegistry = new Map<string, ToolHandlerEntry>();

/**
 * Register a tool with its handler
 *
 * @param definition - Tool definition
 * @param handler - Tool handler function
 */
export function registerTool(definition: Tool, handler: ToolHandler): void {
  if (!validateToolDefinition(definition)) {
    throw new Error(`Invalid tool definition: ${definition.name}`);
  }

  if (toolRegistry.has(definition.name)) {
    logger.warn(`Overwriting existing tool: ${definition.name}`);
  }

  toolRegistry.set(definition.name, { definition, handler });
  logger.debug(`Registered tool: ${definition.name}`);
}

/**
 * Get tool handler by name
 *
 * @param name - Tool name
 * @returns Tool handler function or undefined
 */
export function getToolHandler(name: string): ToolHandler | undefined {
  const entry = toolRegistry.get(name);
  return entry?.handler;
}

/**
 * Initialize all tools
 *
 * Called during server startup to register all available tools.
 * Requires shadow cache and vault path to be provided.
 *
 * @param shadowCache - Shadow cache instance
 * @param vaultPath - Absolute path to vault root
 * @param workflowEngine - Workflow engine instance (optional)
 */
export async function initializeTools(shadowCache?: any, vaultPath?: string, workflowEngine?: any): Promise<void> {
  logger.info('Initializing MCP tools...');

  // Register shadow cache tools if available
  if (shadowCache && vaultPath) {
    try {
      // Import shadow cache handlers dynamically
      const shadowCacheModule = await import('./shadow-cache/index.js');
      const searchTagsModule = await import('./shadow-cache/search-tags.js');
      const searchLinksModule = await import('./shadow-cache/search-links.js');
      const getStatsModule = await import('./shadow-cache/get-stats.js');

      const {
        createQueryFilesHandler,
        createGetFileHandler,
        createGetFileContentHandler,
      } = shadowCacheModule;

      registerTool(queryFilesTool, createQueryFilesHandler(shadowCache));
      registerTool(getFileTool, createGetFileHandler(shadowCache, vaultPath));
      registerTool(getFileContentTool, createGetFileContentHandler(vaultPath));
      registerTool(searchTagsTool, searchTagsModule.searchTagsHandler);
      registerTool(searchLinksTool, searchLinksModule.searchLinksHandler);
      registerTool(getStatsTool, getStatsModule.getStatsHandler);

      logger.info('Registered 6 shadow cache tools');
    } catch (error) {
      logger.error('Failed to load shadow cache tools:', error as Error);
    }
  }

  // Register workflow tools if available
  if (workflowEngine) {
    try {
      // Import workflow handlers dynamically
      const workflowModule = await import('./workflow/index.js');
      const {
        createTriggerWorkflowHandler,
        createListWorkflowsHandler,
        createGetWorkflowStatusHandler,
        createGetWorkflowHistoryHandler,
      } = workflowModule;

      registerTool(triggerWorkflowTool, createTriggerWorkflowHandler(workflowEngine));
      registerTool(listWorkflowsTool, createListWorkflowsHandler(workflowEngine));
      registerTool(getWorkflowStatusTool, createGetWorkflowStatusHandler(workflowEngine));
      registerTool(getWorkflowHistoryTool, createGetWorkflowHistoryHandler(workflowEngine));

      logger.info('Registered 4 workflow tools (trigger_workflow, list_workflows, get_workflow_status, get_workflow_history)');
    } catch (error) {
      logger.error('Failed to load workflow tools:', error as Error);
    }
  }

  // TODO: Import and register system tools (health check, etc.)

  const toolCount = toolRegistry.size;
  logger.info(`Initialized ${toolCount} tools`);
}
