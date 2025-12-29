/**
 * Tool Registry
 *
 * Central registry for all MCP tools. Manages tool definitions and handlers.
 *
 * @module mcp-server/tools/registry
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolHandlerEntry, ToolCategory } from '../types/index.js';
import type { KnowledgeGraphDatabase } from '../../core/database.js';
import type { ShadowCache } from '../../core/cache.js';
/**
 * Initialize tools with dependencies
 *
 * @param database - Knowledge graph database instance
 * @param cache - Shadow cache instance
 * @param projectRoot - Project root path
 */
export declare function initializeTools(database?: KnowledgeGraphDatabase, cache?: ShadowCache, projectRoot?: string): Promise<void>;
/**
 * Get shared database instance
 */
export declare function getDatabase(): KnowledgeGraphDatabase | undefined;
/**
 * Get shared cache instance
 */
export declare function getCache(): ShadowCache | undefined;
/**
 * Get shared project root
 */
export declare function getProjectRoot(): string | undefined;
/**
 * Register a tool with its handler
 *
 * @param name - Tool name
 * @param definition - Tool definition
 * @param handler - Tool handler function
 * @param category - Optional category name
 */
export declare function registerTool(name: string, definition: Tool, handler: ToolHandler, category?: string): void;
/**
 * Get tool handler by name
 *
 * @param name - Tool name
 * @returns Tool handler or undefined
 */
export declare function getToolHandler(name: string): ToolHandler | undefined;
/**
 * Get tool definition by name
 *
 * @param name - Tool name
 * @returns Tool definition or undefined
 */
export declare function getToolDefinition(name: string): Tool | undefined;
/**
 * Get all tool definitions
 *
 * @returns Array of all tool definitions
 */
export declare function getToolDefinitions(): Tool[];
/**
 * Get all tool categories
 *
 * @returns Array of tool categories
 */
export declare function getToolCategories(): ToolCategory[];
/**
 * Check if a tool is registered
 *
 * @param name - Tool name
 * @returns true if tool is registered
 */
export declare function hasToolRegistered(name: string): boolean;
/**
 * Get count of registered tools
 *
 * @returns Number of registered tools
 */
export declare function getToolCount(): number;
/**
 * Clear all registered tools (for testing)
 */
export declare function clearRegistry(): void;
/**
 * Get the tool registry Map
 *
 * @returns The tool registry Map
 */
export declare function getToolRegistry(): Map<string, ToolHandlerEntry>;
//# sourceMappingURL=registry.d.ts.map