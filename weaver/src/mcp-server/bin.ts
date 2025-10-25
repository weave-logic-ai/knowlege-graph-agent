#!/usr/bin/env node
/**
 * MCP Server Binary Entry Point
 *
 * Standalone entry point for running the Weaver MCP server.
 * This allows the MCP server to be run independently from the main service.
 */

import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { createShadowCache } from '../shadow-cache/index.js';
import { createWorkflowEngine, type WorkflowEngine } from '../workflow-engine/index.js';
import { getExampleWorkflows } from '../workflows/example-workflows.js';
import { getProofWorkflows } from '../workflows/proof-workflows.js';
import { WeaverMCPServer } from './index.js';

async function main() {
  try {
    logger.info('🧵 Starting Weaver MCP Server');
    logger.info('Configuration loaded', {
      dbPath: config.shadowCache.dbPath,
      vaultPath: config.vault.path,
      workflowsEnabled: config.workflows.enabled,
    });

    // Initialize shadow cache
    const shadowCache = createShadowCache(config.shadowCache.dbPath, config.vault.path);
    logger.info('Shadow cache initialized');

    // Initialize workflow engine if enabled
    let workflowEngine: WorkflowEngine | undefined;
    if (config.workflows.enabled) {
      workflowEngine = createWorkflowEngine();
      await workflowEngine.start();

      // Register example workflows
      const exampleWorkflows = getExampleWorkflows();
      const engine = workflowEngine; // Store reference to avoid TS errors
      exampleWorkflows.forEach((workflow) => {
        engine.registerWorkflow(workflow);
      });

      // Register proof workflows
      const proofWorkflows = getProofWorkflows();
      proofWorkflows.forEach((workflow) => {
        engine.registerWorkflow(workflow);
      });

      const totalWorkflows = exampleWorkflows.length + proofWorkflows.length;
      logger.info('Workflows registered', {
        total: totalWorkflows,
        workflows: [...exampleWorkflows, ...proofWorkflows].map((w) => w.id),
      });
    }

    // Create and start MCP server
    const mcpServer = new WeaverMCPServer(
      {
        name: 'weaver-mcp-server',
        version: '0.1.0',
      },
      shadowCache,
      config.vault.path,
      workflowEngine
    );

    await mcpServer.run();

    // Handle graceful shutdown
    const cleanup = async () => {
      logger.info('🛑 Shutting down MCP server...');
      await mcpServer.shutdown();
      if (workflowEngine) {
        await workflowEngine.stop();
      }
      shadowCache.close();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    logger.info('✅ Weaver MCP Server started successfully');
    logger.info('Listening on stdio transport');
  } catch (error) {
    logger.error('Failed to start MCP server', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

main();
