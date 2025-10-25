/**
 * Test Script for Workflow MCP Tools
 *
 * Tests the trigger_workflow and list_workflows tools to ensure they
 * correctly integrate with the workflow engine.
 */

import { createWorkflowEngine } from '../src/workflow-engine/index.js';
import { getExampleWorkflows } from '../src/workflows/example-workflows.js';
import { getProofWorkflows } from '../src/workflows/proof-workflows.js';
import { createTriggerWorkflowHandler } from '../src/mcp-server/tools/workflow/trigger-workflow.js';
import { createListWorkflowsHandler } from '../src/mcp-server/tools/workflow/list-workflows.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  try {
    logger.info('🧪 Testing Workflow MCP Tools');

    // Initialize workflow engine
    const workflowEngine = createWorkflowEngine();
    await workflowEngine.start();

    // Register workflows
    const exampleWorkflows = getExampleWorkflows();
    const proofWorkflows = getProofWorkflows();
    [...exampleWorkflows, ...proofWorkflows].forEach((workflow) => {
      workflowEngine.registerWorkflow(workflow);
    });

    logger.info('Workflow engine initialized', {
      total: exampleWorkflows.length + proofWorkflows.length,
    });

    // Create tool handlers
    const listWorkflowsHandler = createListWorkflowsHandler(workflowEngine);
    const triggerWorkflowHandler = createTriggerWorkflowHandler(workflowEngine);

    // Test 1: List all workflows
    logger.info('\n📋 Test 1: List all workflows');
    const listResult1 = await listWorkflowsHandler({});
    logger.info('Result:', JSON.stringify(listResult1, null, 2));

    // Test 2: List only enabled workflows
    logger.info('\n📋 Test 2: List enabled workflows');
    const listResult2 = await listWorkflowsHandler({ enabled: true });
    logger.info('Result:', JSON.stringify(listResult2, null, 2));

    // Test 3: List workflows by category
    logger.info('\n📋 Test 3: List proof workflows');
    const listResult3 = await listWorkflowsHandler({ category: 'proof' });
    logger.info('Result:', JSON.stringify(listResult3, null, 2));

    // Test 4: Trigger workflow synchronously
    logger.info('\n⚙️ Test 4: Trigger workflow (sync)');
    const triggerResult1 = await triggerWorkflowHandler({
      workflowId: 'file-change-logger',
      input: { test: 'sync execution' },
      async: false,
    });
    logger.info('Result:', JSON.stringify(triggerResult1, null, 2));

    // Test 5: Trigger workflow asynchronously
    logger.info('\n⚙️ Test 5: Trigger workflow (async)');
    const triggerResult2 = await triggerWorkflowHandler({
      workflowId: 'markdown-analyzer',
      input: { test: 'async execution' },
      async: true,
    });
    logger.info('Result:', JSON.stringify(triggerResult2, null, 2));

    // Wait a moment for async workflow to complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Test 6: Try to trigger non-existent workflow
    logger.info('\n⚙️ Test 6: Trigger non-existent workflow (should fail)');
    const triggerResult3 = await triggerWorkflowHandler({
      workflowId: 'non-existent-workflow',
      async: false,
    });
    logger.info('Result:', JSON.stringify(triggerResult3, null, 2));

    // Cleanup
    await workflowEngine.stop();

    logger.info('\n✅ All tests completed successfully');
  } catch (error) {
    logger.error('Test failed', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

main();
