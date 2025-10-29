/**
 * Workflow DevKit - EmbeddedWorld Configuration
 *
 * Phase 15: Workflow Observability Integration
 *
 * EmbeddedWorld provides:
 * - Persistent workflow execution data (.workflow-data/)
 * - Local filesystem storage (no database needed)
 * - HTTP endpoint for step execution
 * - Durable execution (survives process restarts)
 * - Zero external infrastructure
 */

import { createEmbeddedWorld } from '@workflow/world-local';
import type { World } from '@workflow/world';
import { setWorld, stepEntrypoint, workflowEntrypoint } from '@workflow/core/runtime';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import path from 'path';
import { logger } from '../utils/logger.js';

/**
 * Initialize EmbeddedWorld for Weaver workflows
 *
 * Configuration:
 * - dataDir: .workflow-data/ (persistent JSON storage)
 * - port: 3000 (HTTP transport for step execution)
 * - name: weaver-workflows
 */
export const workflowWorld: World = createEmbeddedWorld({
  // Data directory - stores runs, steps, hooks, streams as JSON
  dataDir: path.join(process.cwd(), '.workflow-data'),

  // Port for HTTP transport (workflow step execution endpoint)
  port: 3000,
});

let httpServer: any | null = null;

/**
 * Load and return workflows as a map
 *
 * Import compiled workflows and return them for registration
 */
async function loadWorkflows(): Promise<Map<string, Function>> {
  logger.info('Loading workflows');

  try {
    // Dynamic import of the compiled workflow
    const { documentConnectionWorkflow } = await import('../workflows/kg/document-connection/index.js');

    // Create workflow map
    const workflows = new Map<string, Function>();

    // Register workflow with its ID
    const workflowId = 'workflow//document-connection';
    workflows.set(workflowId, documentConnectionWorkflow);

    logger.info('Workflows loaded', { count: workflows.size, ids: Array.from(workflows.keys()) });
    return workflows;
  } catch (error) {
    logger.error('Failed to load workflows', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Initialize the workflow world
 * Call this when starting the Weaver server
 */
export async function initializeWorkflowWorld(): Promise<World> {
  try {
    // Register the world instance with the runtime
    setWorld(workflowWorld);

    // Load workflows
    const workflows = await loadWorkflows();

    // Register workflows in globalThis for workflowEntrypoint
    if (!globalThis.__private_workflows) {
      globalThis.__private_workflows = workflows;
    } else {
      // Merge with existing
      workflows.forEach((fn, id) => {
        globalThis.__private_workflows.set(id, fn);
      });
    }

    // Create HTTP server for workflow execution
    const app = new Hono();

    // Register step endpoint (required for step execution)
    app.post('/.well-known/workflow/v1/step', async (c) => {
      const req = c.req.raw;
      const response = await stepEntrypoint(req);
      return response;
    });

    // Flow endpoint - pass empty string since workflows are in globalThis
    const flowHandler = workflowEntrypoint('');

    app.post('/.well-known/workflow/v1/flow', async (c) => {
      const req = c.req.raw;
      const response = await flowHandler(req);
      return response;
    });

    // Start HTTP server
    httpServer = serve({
      fetch: app.fetch,
      port: 3000,
    });

    console.log('✅ Workflow World initialized (EmbeddedWorld)');
    console.log(`📊 Observability: Inspect .workflow-data/ directory`);
    console.log(`🌐 HTTP endpoint: http://localhost:3000/.well-known/workflow/v1/step`);
    console.log(`📁 Data directory: ${path.join(process.cwd(), '.workflow-data')}`);
    return workflowWorld;
  } catch (error) {
    console.error('❌ Failed to initialize Workflow World:', error);
    throw error;
  }
}

/**
 * Shutdown the workflow world
 * Call this on application shutdown
 */
export async function shutdownWorkflowWorld() {
  try {
    // Stop HTTP server
    if (httpServer) {
      httpServer.close();
      httpServer = null;
      console.log('HTTP server stopped');
    }

    // Clear the world instance from runtime
    setWorld(undefined);
    console.log('✅ Workflow World shutdown complete');
  } catch (error) {
    console.error('❌ Failed to shutdown Workflow World:', error);
    throw error;
  }
}

// Export for use in workflows
export default workflowWorld;
