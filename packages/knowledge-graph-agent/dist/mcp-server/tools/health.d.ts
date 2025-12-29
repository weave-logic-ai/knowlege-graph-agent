/**
 * Health Check Tool
 *
 * MCP tool for checking the health status of the knowledge graph server.
 * Provides detailed diagnostics about all server components.
 *
 * @module mcp-server/tools/health
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler } from '../types/index.js';
import type { KnowledgeGraphDatabase } from '../../core/database.js';
import type { ShadowCache } from '../../core/cache.js';
/**
 * Health check tool definition
 */
export declare const healthCheckTool: Tool;
/**
 * Create handler for health check tool
 */
export declare function createHealthCheckHandler(database?: KnowledgeGraphDatabase, cache?: ShadowCache): ToolHandler;
//# sourceMappingURL=health.d.ts.map