#!/usr/bin/env node
/**
 * Knowledge Graph MCP Server CLI
 *
 * Entry point for running the MCP server from command line.
 * Initializes database, cache, and server components.
 *
 * @module mcp-server/bin
 */

import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Import server components
import { createDatabase, type KnowledgeGraphDatabase } from '../core/database.js';
import { loadShadowCache, type ShadowCache } from '../core/cache.js';

// Import tool registry functions
import {
  initializeTools,
  getToolDefinitions,
  getToolHandler,
  getToolCount,
} from './tools/index.js';

// Import agent registry
import { getRegistry, registerDefaultAgents } from '../agents/index.js';

/**
 * Server configuration from environment
 */
interface ServerConfig {
  projectRoot: string;
  dbPath: string;
  logLevel: string;
}

/**
 * Parse configuration from environment
 */
function parseConfig(): ServerConfig {
  const projectRoot = process.env.KG_PROJECT_ROOT || process.cwd();
  const dbPath = process.env.KG_DB_PATH || resolve(projectRoot, '.kg/knowledge.db');
  const logLevel = process.env.KG_LOG_LEVEL || 'info';

  return { projectRoot, dbPath, logLevel };
}

/**
 * Ensure required directories exist
 */
function ensureDirectories(config: ServerConfig): void {
  const kgDir = resolve(config.projectRoot, '.kg');
  if (!existsSync(kgDir)) {
    mkdirSync(kgDir, { recursive: true });
    console.error(`Created .kg directory at ${kgDir}`);
  }
}

/**
 * Initialize the MCP server with all components
 */
async function initializeServer(
  config: ServerConfig
): Promise<{
  database: KnowledgeGraphDatabase;
  cache: ShadowCache;
}> {
  console.error('Initializing Knowledge Graph MCP Server...');
  console.error(`  Project root: ${config.projectRoot}`);
  console.error(`  Database: ${config.dbPath}`);

  // Ensure directories exist
  ensureDirectories(config);

  // Initialize database
  console.error('  Initializing database...');
  const database = createDatabase(config.dbPath);
  const stats = database.getStats();
  console.error(`  Database ready: ${stats.totalNodes} nodes, ${stats.totalEdges} edges`);

  // Initialize cache
  console.error('  Initializing cache...');
  const cache = await loadShadowCache(config.projectRoot);
  const cacheStats = cache.getStats();
  console.error(`  Cache ready: ${cacheStats.totalEntries} entries`);

  // Initialize agent registry
  console.error('  Initializing agent registry...');
  const agentRegistry = getRegistry();
  registerDefaultAgents(agentRegistry);
  console.error(`  Agent registry ready: ${agentRegistry.listTypes().length} types registered`);

  // Initialize tools with database, cache, and project root
  console.error('  Initializing MCP tools...');
  await initializeTools(database, cache, config.projectRoot);
  console.error(`  Tools initialized: ${getToolCount()} tools registered`);

  return { database, cache };
}

/**
 * Handle graceful shutdown
 */
function setupShutdownHandlers(
  database: KnowledgeGraphDatabase,
  cache: ShadowCache
): void {
  const shutdown = async (signal: string) => {
    console.error(`\nReceived ${signal}, shutting down...`);

    try {
      // Save cache
      console.error('  Saving cache...');
      await cache.save();

      // Close database
      console.error('  Closing database...');
      database.close();

      // Terminate agents
      console.error('  Terminating agents...');
      const agentRegistry = getRegistry();
      await agentRegistry.terminateAll();

      console.error('Shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

/**
 * Start stdio transport for MCP
 */
async function startStdioServer(): Promise<void> {
  // In a real implementation, this would use the MCP SDK's StdioServerTransport
  // For now, we'll read from stdin and write to stdout in JSON-RPC format

  const readline = await import('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', async (line: string) => {
    try {
      const request = JSON.parse(line);

      if (request.method === 'tools/list') {
        const tools = getToolDefinitions();
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: { tools },
        };
        console.log(JSON.stringify(response));
      } else if (request.method === 'tools/call') {
        const { name, arguments: args } = request.params;
        const handler = getToolHandler(name);
        if (!handler) {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32602,
              message: `Tool not found: ${name}`,
            },
          };
          console.log(JSON.stringify(response));
          return;
        }

        const result = await handler(args || {});
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        };
        console.log(JSON.stringify(response));
      } else if (request.method === 'initialize') {
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'knowledge-graph-mcp-server',
              version: '0.3.0',
            },
          },
        };
        console.log(JSON.stringify(response));
      } else {
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`,
          },
        };
        console.log(JSON.stringify(response));
      }
    } catch (error) {
      const response = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: error instanceof Error ? error.message : 'Parse error',
        },
      };
      console.log(JSON.stringify(response));
    }
  });

  console.error('MCP Server listening on stdio...');
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Parse configuration
    const config = parseConfig();

    // Initialize server components
    const { database, cache } = await initializeServer(config);

    // Setup shutdown handlers
    setupShutdownHandlers(database, cache);

    // Start MCP server
    await startStdioServer();

    console.error('Knowledge Graph MCP Server ready');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run main
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
