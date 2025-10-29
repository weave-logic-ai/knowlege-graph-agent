/**
 * Weaver - Main Application Entry Point
 *
 * Unified MCP server + workflow orchestrator for Weave-NN's local-first knowledge graph
 */

import { join } from 'path';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { initializeActivityLogger } from './vault-logger/activity-logger.js';
import { createShadowCache } from './shadow-cache/index.js';
import { createWorkflowEngine } from './workflow-engine/index.js';
import { FileWatcher } from './file-watcher/index.js';
import { WeaverMCPServer } from './mcp-server/index.js';
import { initializeTools } from './mcp-server/tools/registry.js';
import { GitClient } from './git/git-client.js';
import { AutoCommitService } from './git/auto-commit.js';
import { ClaudeClient } from './agents/claude-client.js';
import { ClaudeFlowMemoryClient } from './memory/claude-flow-client.js';
import { VaultMemorySync } from './memory/vault-sync.js';
import { RulesEngine } from './agents/rules-engine.js';
import type { FileEvent } from './file-watcher/types.js';
import { initializeWorkflowWorld, shutdownWorkflowWorld } from './workflow-engine/embedded-world.js';

// Global service instances for shutdown handling
let shadowCache: any;
let workflowEngine: any;
let workflowWorld: any = null;
let fileWatcher: FileWatcher | null = null;
let mcpServer: WeaverMCPServer | null = null;
let autoCommitService: AutoCommitService | null = null;
let rulesEngine: RulesEngine | null = null;

async function main() {
  try {
    logger.info('Starting Weaver application', {
      vaultPath: config.vault.path,
      featureAiEnabled: config.features.aiEnabled,
      featureMcpServer: config.features.mcpEnabled,
      gitAutoCommit: config.git.autoCommit,
    });

    // Initialize activity logger first for 100% transparency
    const activityLogger = await initializeActivityLogger(config.vault.path);
    activityLogger.setPhase('startup');
    activityLogger.setTask('Initialize Weaver application');

    await activityLogger.logPrompt('Starting Weaver application', {
      vaultPath: config.vault.path,
      features: {
        ai: config.features.aiEnabled,
        mcp: config.features.mcpEnabled,
        git: config.git.autoCommit,
      },
      timestamp: new Date().toISOString(),
    });

    logger.info('Activity logger initialized', {
      logDirectory: '.activity-logs',
      sessionId: (await activityLogger.getSessionSummary()).sessionId,
    });

    // 1. Initialize Shadow Cache
    logger.info('Initializing shadow cache...');
    const shadowCacheDbPath = join(config.vault.path, '.weaver', 'shadow-cache.db');
    shadowCache = createShadowCache(shadowCacheDbPath, config.vault.path);

    await activityLogger.logToolCall(
      'shadowCache.init',
      { dbPath: shadowCacheDbPath, vaultPath: config.vault.path },
      { status: 'created' },
      0
    );

    // Perform initial vault sync
    logger.info('Syncing vault to shadow cache...');
    await shadowCache.syncVault();
    const stats = shadowCache.getStats();
    logger.info('✅ Shadow cache initialized', stats);

    await activityLogger.logToolCall(
      'shadowCache.syncVault',
      { vaultPath: config.vault.path },
      { filesIndexed: stats.totalFiles, ...stats },
      0
    );

    // 2. Initialize Workflow Engine
    logger.info('Initializing workflow engine...');
    workflowEngine = createWorkflowEngine();

    // Initialize with vault root and register workflows
    await workflowEngine.initialize(config.vault.path);

    await workflowEngine.start();
    logger.info('✅ Workflow engine started');

    await activityLogger.logToolCall(
      'workflowEngine.start',
      { vaultRoot: config.vault.path },
      { status: 'running', workflowsRegistered: workflowEngine.getRegistry().getAllWorkflows().length },
      0
    );

    // 2b. Initialize Workflow DevKit EmbeddedWorld
    logger.info('Initializing Workflow DevKit EmbeddedWorld...');
    workflowWorld = await initializeWorkflowWorld();
    logger.info('✅ EmbeddedWorld initialized (HTTP endpoint: http://localhost:3000)');

    await activityLogger.logToolCall(
      'workflowWorld.init',
      { dataDir: '.workflow-data', port: 3000 },
      { status: 'running', endpoint: '/.well-known/workflow/v1/step' },
      0
    );

    // 3. Initialize File Watcher
    logger.info('Initializing file watcher...');
    fileWatcher = new FileWatcher({
      watchPath: config.vault.path,
      ignored: ['.weaver', '.obsidian', '.git', 'node_modules', '.archive'],
      debounceDelay: config.vault.fileWatcher.debounce || 1000,
      enabled: true,
    });

    // Register file watcher event handlers
    fileWatcher.on(async (event: FileEvent) => {
      try {
        // Update shadow cache
        if (event.type === 'add' || event.type === 'change') {
          await shadowCache.syncFile(event.path, event.relativePath);
        } else if (event.type === 'unlink') {
          shadowCache.removeFile(event.relativePath);
        }

        // Trigger workflows
        await workflowEngine.triggerFileEvent(event);

      } catch (error) {
        logger.error('Error handling file event', error instanceof Error ? error : new Error(String(error)), {
          event: event.type,
          path: event.relativePath,
        });
      }
    });

    await fileWatcher.start();
    logger.info('✅ File watcher started');

    await activityLogger.logToolCall(
      'fileWatcher.start',
      { watchPath: config.vault.path },
      { status: 'watching' },
      0
    );

    // 4. Initialize MCP Server (if enabled)
    if (config.features.mcpEnabled) {
      logger.info('Initializing MCP server...');
      mcpServer = new WeaverMCPServer(
        {
          name: 'weaver',
          version: '1.0.0',
        },
        shadowCache,
        config.vault.path,
        workflowEngine
      );

      // Initialize tools
      await initializeTools(shadowCache, config.vault.path, workflowEngine);

      logger.info('✅ MCP server initialized');

      await activityLogger.logToolCall(
        'mcpServer.init',
        { name: 'weaver', version: '1.0.0' },
        { status: 'ready', tools: 10 },
        0
      );
    }

    // 5. Initialize Git Auto-Commit (if enabled)
    if (config.git.autoCommit && config.features.aiEnabled) {
      logger.info('Initializing git auto-commit...');
      const gitClient = new GitClient(config.vault.path);
      const claudeClient = new ClaudeClient({ apiKey: config.ai.anthropicApiKey! });
      autoCommitService = new AutoCommitService(
        gitClient,
        claudeClient,
        {
          debounceMs: config.git.commitDebounceMs || 300000, // 5 minutes
          enabled: true,
        }
      );

      // Register file watcher handler for auto-commit
      fileWatcher.on((event: FileEvent) => {
        if (event.type === 'add' || event.type === 'change') {
          autoCommitService!.onFileEvent(event);
        }
      });

      logger.info('✅ Git auto-commit initialized');

      await activityLogger.logToolCall(
        'gitAutoCommit.init',
        { debounceMs: config.git.commitDebounceMs },
        { status: 'enabled' },
        0
      );
    }

    // 6. Initialize Agent Rules Engine (if AI enabled)
    if (config.features.aiEnabled) {
      logger.info('Initializing agent rules engine...');
      const claudeClient = new ClaudeClient({ apiKey: config.ai.anthropicApiKey! });
      const memoryClient = new ClaudeFlowMemoryClient();
      const vaultSync = new VaultMemorySync({
        memoryClient,
        shadowCache,
        vaultPath: config.vault.path,
        obsidianApiUrl: config.obsidian.apiUrl,
        obsidianApiKey: config.obsidian.apiKey,
        conflictLogPath: './data/memory-conflicts.log',
      });

      rulesEngine = new RulesEngine({
        claudeClient,
        vaultSync,
      });

      // Register file watcher handler for rules
      fileWatcher.on(async (event: FileEvent) => {
        if (event.type === 'add' || event.type === 'change') {
          // Map FileEvent to RuleTrigger and execute rules
          const triggerType = event.type === 'add' ? 'file:add' : 'file:change';
          await rulesEngine!.executeRules({
            type: triggerType,
            fileEvent: event,
            metadata: { timestamp: new Date().toISOString() },
          });
        }
      });

      logger.info('✅ Agent rules engine initialized');

      await activityLogger.logToolCall(
        'rulesEngine.init',
        {},
        { status: 'enabled', rulesRegistered: 0 },
        0
      );
    }

    // All services initialized
    const initializedServices = [
      'activity-logger',
      'shadow-cache',
      'workflow-engine',
      'workflow-devkit',
      'file-watcher',
    ];

    if (config.features.mcpEnabled) initializedServices.push('mcp-server');
    if (config.git.autoCommit) initializedServices.push('git-auto-commit');
    if (config.features.aiEnabled) initializedServices.push('agent-rules');

    await activityLogger.logResults({
      status: 'ready',
      services: initializedServices,
      message: 'Weaver application started successfully',
      stats: shadowCache.getStats(),
    });

    logger.info('✅ Weaver application started successfully', {
      services: initializedServices.length,
      filesIndexed: stats.totalFiles,
    });

    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      activityLogger.setTask('Shutdown Weaver application');
      await activityLogger.logPrompt('Shutting down Weaver application', {
        signal,
        timestamp: new Date().toISOString(),
      });

      // Stop services in reverse order
      if (fileWatcher) {
        await fileWatcher.stop();
        logger.info('File watcher stopped');
      }

      if (rulesEngine) {
        // Rules engine doesn't have a shutdown method
        logger.info('Rules engine stopped');
      }

      if (workflowWorld) {
        await shutdownWorkflowWorld();
        logger.info('Workflow World (EmbeddedWorld) stopped');
      }

      if (workflowEngine) {
        await workflowEngine.stop();
        logger.info('Workflow engine stopped');
      }

      if (shadowCache) {
        shadowCache.close();
        logger.info('Shadow cache closed');
      }

      await activityLogger.shutdown();
      logger.info('Shutdown complete');

      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Keep process running (if MCP server not running on stdio)
    if (!config.features.mcpEnabled) {
      await new Promise(() => {});
    } else {
      // If MCP server is enabled, run it on stdio
      await mcpServer!.run();
    }
  } catch (error) {
    logger.error('Failed to start Weaver application', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error in main', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  });
}

export { main };
