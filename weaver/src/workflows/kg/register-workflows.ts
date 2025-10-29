/**
 * Knowledge Graph Workflow Registration
 *
 * Helper functions to register all knowledge graph workflows
 * with the workflow engine.
 */

import type { WorkflowEngine } from '../../workflow-engine/index.js';
import { createDocumentConnectionWorkflow } from './document-connection.js';
import { logger } from '../../utils/logger.js';

/**
 * Register all knowledge graph workflows with the engine
 *
 * @param vaultRoot - Absolute path to vault root
 * @param engine - Workflow engine instance
 */
export async function registerKnowledgeGraphWorkflows(
  vaultRoot: string,
  engine: WorkflowEngine
): Promise<void> {
  logger.info('Registering knowledge graph workflows', { vaultRoot });

  const registeredWorkflows: string[] = [];

  try {
    // Register document connection workflow
    const docConnectionWorkflow = createDocumentConnectionWorkflow(vaultRoot);
    engine.registerWorkflow(docConnectionWorkflow);
    registeredWorkflows.push(docConnectionWorkflow.id);

    logger.info('✅ Registered knowledge graph workflows', {
      count: registeredWorkflows.length,
      workflows: registeredWorkflows,
    });

    // Future workflows will be registered here:
    // - Hub maintenance workflow
    // - Orphan resolution workflow
    // - Primitive extraction workflow
    // - Cascade update workflow
  } catch (error) {
    logger.error(
      'Failed to register knowledge graph workflows',
      error instanceof Error ? error : new Error(String(error)),
      { registeredSoFar: registeredWorkflows }
    );
    throw error;
  }
}

/**
 * Unregister all knowledge graph workflows
 *
 * @param engine - Workflow engine instance
 */
export async function unregisterKnowledgeGraphWorkflows(engine: WorkflowEngine): Promise<void> {
  logger.info('Unregistering knowledge graph workflows');

  const workflows = ['document-connection'];
  // Future: Add more workflow IDs

  for (const workflowId of workflows) {
    try {
      engine.unregisterWorkflow(workflowId);
    } catch (error) {
      logger.warn('Failed to unregister workflow', {
        workflowId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info('Knowledge graph workflows unregistered', {
    count: workflows.length,
  });
}

/**
 * Get list of registered knowledge graph workflow IDs
 */
export function getKnowledgeGraphWorkflowIds(): string[] {
  return [
    'document-connection',
    // Future workflows:
    // 'hub-maintenance',
    // 'orphan-resolution',
    // 'primitive-extraction',
    // 'cascade-update',
  ];
}
