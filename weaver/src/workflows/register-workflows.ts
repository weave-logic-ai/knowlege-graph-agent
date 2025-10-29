/**
 * Register All Workflows
 *
 * Centralized registration of all workflow definitions
 */

import { WorkflowEngine } from '../workflow-engine/index.js';
import { logger } from '../utils/logger.js';

// Import all workflow modules
import { getExampleWorkflows } from './example-workflows.js';
import { getVectorDBWorkflows } from './vector-db-workflows.js';
import { getLearningLoopWorkflows } from './learning-loop-workflows.js';

/**
 * Register all workflows with the workflow engine
 */
export function registerAllWorkflows(engine: WorkflowEngine): void {
  logger.info('📋 Registering workflows...');

  // Get all workflow definitions
  const exampleWorkflows = getExampleWorkflows();
  const vectorDBWorkflows = getVectorDBWorkflows();
  const learningLoopWorkflows = getLearningLoopWorkflows();

  const allWorkflows = [
    ...exampleWorkflows,
    ...vectorDBWorkflows,
    ...learningLoopWorkflows,
  ];

  // Register each workflow
  for (const workflow of allWorkflows) {
    engine.registerWorkflow(workflow);
    logger.info('  ✅ Registered workflow', {
      id: workflow.id,
      name: workflow.name,
      triggers: workflow.triggers,
      enabled: workflow.enabled,
    });
  }

  logger.info(`✅ Registered ${allWorkflows.length} workflows total`);
  logger.info(`  📁 Example workflows: ${exampleWorkflows.length}`);
  logger.info(`  🗂️  Vector DB workflows: ${vectorDBWorkflows.length}`);
  logger.info(`  🎓 Learning loop workflows: ${learningLoopWorkflows.length}`);
}

/**
 * Get workflow summary for logging/debugging
 */
export function getWorkflowSummary(engine: WorkflowEngine): {
  total: number;
  enabled: number;
  byCategory: Record<string, number>;
} {
  const registry = engine.getRegistry();
  const allWorkflows = registry.getAllWorkflows();

  const byCategory: Record<string, number> = {
    example: 0,
    'vector-db': 0,
    'learning-loop': 0,
    other: 0,
  };

  for (const workflow of allWorkflows) {
    if (workflow.id.startsWith('file-')) {
      byCategory.example++;
    } else if (workflow.id.startsWith('vector-db:')) {
      byCategory['vector-db']++;
    } else if (workflow.id.startsWith('learning-loop:')) {
      byCategory['learning-loop']++;
    } else {
      byCategory.other++;
    }
  }

  return {
    total: allWorkflows.length,
    enabled: allWorkflows.filter(w => w.enabled).length,
    byCategory,
  };
}
