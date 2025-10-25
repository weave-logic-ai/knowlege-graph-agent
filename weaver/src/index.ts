/**
 * Weaver - Unified MCP Server + Workflow Orchestrator
 *
 * Entry point for the Weaver service. This is the neural network junction
 * where multiple AI systems connect through a shared knowledge graph.
 *
 * Architecture:
 * - File Watcher (chokidar) - Monitors vault for changes
 * - Workflow Engine (workflow.dev) - Orchestrates durable workflows
 * - Shadow Cache (SQLite) - Fast metadata queries
 * - MCP Server (@modelcontextprotocol/sdk) - Exposes tools to AI agents
 * - Obsidian Client - Interacts with Obsidian Local REST API
 * - AI Gateway - Vercel AI Gateway for model calls
 * - Git Client - Auto-commit changes
 */

import { config, displayConfig } from './config/index.js';
import { logger } from './utils/logger.js';
import { createFileWatcher, type FileEvent } from './file-watcher/index.js';
import { createShadowCache, type ShadowCache } from './shadow-cache/index.js';
import { createWorkflowEngine, type WorkflowEngine } from './workflow-engine/index.js';
import { getExampleWorkflows } from './workflows/example-workflows.js';
import { getProofWorkflows } from './workflows/proof-workflows.js';
import { join } from 'path';

// Component instances
let fileWatcher: ReturnType<typeof createFileWatcher> | null = null;
let shadowCache: ShadowCache | null = null;
let workflowEngine: WorkflowEngine | null = null;

async function main() {
  try {
    // Display startup banner
    logger.info('🧵 Starting Weaver - Neural Network Junction for Weave-NN');
    logger.info('Configuration loaded', displayConfig());

    // Initialize Shadow Cache
    shadowCache = createShadowCache(config.shadowCache.dbPath, config.vault.path);
    logger.info('Shadow cache initialized', { dbPath: config.shadowCache.dbPath });

    // Perform initial vault sync
    logger.info('Starting initial vault sync...');
    await shadowCache.syncVault();
    const stats = shadowCache.getStats();
    logger.info('✅ Initial vault sync completed', {
      files: stats.totalFiles,
      tags: stats.totalTags,
      links: stats.totalLinks,
      dbSize: `${Math.round(stats.databaseSize / 1024)}KB`,
    });

    // Initialize Workflow Engine
    if (config.workflows.enabled) {
      workflowEngine = createWorkflowEngine();
      await workflowEngine.start();

      // Register example workflows
      const exampleWorkflows = getExampleWorkflows();
      exampleWorkflows.forEach((workflow) => {
        workflowEngine!.registerWorkflow(workflow);
      });

      // Register proof workflows
      const proofWorkflows = getProofWorkflows();
      proofWorkflows.forEach((workflow) => {
        workflowEngine!.registerWorkflow(workflow);
      });

      const totalWorkflows = exampleWorkflows.length + proofWorkflows.length;
      logger.info('Workflows registered', {
        total: totalWorkflows,
        example: exampleWorkflows.length,
        proof: proofWorkflows.length,
        workflows: [...exampleWorkflows, ...proofWorkflows].map((w) => w.id),
      });
    }

    // Initialize File Watcher
    fileWatcher = createFileWatcher({
      watchPath: config.vault.path,
      ignored: config.fileWatcher.ignore,
      debounceDelay: config.fileWatcher.debounce,
      enabled: config.fileWatcher.enabled,
    });

    // Register file event handler
    fileWatcher.on(async (event: FileEvent) => {
      logger.info('📝 File event detected', {
        type: event.type,
        path: event.relativePath,
        size: event.stats?.size,
      });

      // Update shadow cache based on event type
      if (shadowCache) {
        try {
          if (event.type === 'add' || event.type === 'change') {
            const absolutePath = join(config.vault.path, event.relativePath);
            await shadowCache.syncFile(absolutePath, event.relativePath);
            logger.debug('Shadow cache updated', { path: event.relativePath });
          } else if (event.type === 'unlink') {
            shadowCache.removeFile(event.relativePath);
            logger.debug('File removed from shadow cache', { path: event.relativePath });
          }
        } catch (error) {
          logger.error('Failed to update shadow cache', error instanceof Error ? error : new Error(String(error)), {
            path: event.relativePath,
          });
        }
      }

      // Trigger workflows based on event type
      if (workflowEngine) {
        try {
          await workflowEngine.triggerFileEvent(event);
        } catch (error) {
          logger.error('Failed to trigger workflows', error instanceof Error ? error : new Error(String(error)), {
            path: event.relativePath,
          });
        }
      }
    });

    await fileWatcher.start();

    // Initialize MCP Server
    // Note: MCP Server will be started separately via `node dist/mcp-server/index.js`
    // This is just documenting that shadow cache is available for MCP tools
    logger.debug('Shadow cache ready for MCP server', {
      dbPath: config.shadowCache.dbPath,
      vaultPath: config.vault.path,
    });

    // TODO: Initialize remaining components
    // - HTTP Server (health checks, metrics)

    const workflowStats = workflowEngine?.getStats();
    logger.info('✅ Weaver started successfully', {
      port: config.service.port,
      env: config.service.env,
      vaultPath: config.vault.path,
      fileWatcherEnabled: config.fileWatcher.enabled,
      workflowsEnabled: config.workflows.enabled,
      cacheStats: stats,
      workflowStats,
    });

    // Keep process alive
    process.on('SIGINT', async () => {
      logger.info('🛑 Received SIGINT, shutting down gracefully...');
      await cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('🛑 Received SIGTERM, shutting down gracefully...');
      await cleanup();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start Weaver', error instanceof Error ? error : new Error(String(error)));
    await cleanup();
    process.exit(1);
  }
}

/**
 * Cleanup resources on shutdown
 */
async function cleanup(): Promise<void> {
  try {
    if (fileWatcher) {
      await fileWatcher.stop();
    }
    if (workflowEngine) {
      await workflowEngine.stop();
    }
    if (shadowCache) {
      shadowCache.close();
    }
    // TODO: Cleanup other components (MCP server, etc.)
  } catch (error) {
    logger.error('Error during cleanup', error instanceof Error ? error : new Error(String(error)));
  }
}

// Start the service
main();
