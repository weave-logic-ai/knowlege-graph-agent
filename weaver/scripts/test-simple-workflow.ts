/**
 * Simple Workflow Test - No Complex Bundling
 *
 * Tests the simplified workflow structure following Workflow DevKit docs
 */

import { initializeWorkflowWorld, shutdownWorkflowWorld } from '../dist/workflow-engine/embedded-world.js';
import { start } from '@workflow/core/runtime';
import { documentConnectionWorkflow } from '../dist/workflows/kg/document-connection/index.js';
import path from 'path';

async function main() {
  console.log('\n🧪 Testing Simplified Workflow\n');

  try {
    // Initialize workflow world
    console.log('1. Initializing Workflow World...');
    await initializeWorkflowWorld();

    // Start workflow execution
    console.log('\n2. Starting workflow execution...');
    const testFilePath = path.join(process.cwd(), 'weave-nn', 'README.md');

    const run = await start(documentConnectionWorkflow, [{
      filePath: testFilePath,
      vaultRoot: path.join(process.cwd(), 'weave-nn'),
      eventType: 'change' as const,
      dryRun: true,
    }]);

    console.log(`   Run ID: ${run.id}`);

    // Wait for result
    console.log('\n3. Waiting for result...');
    const result = await run.returnValue;

    console.log('\n✅ Workflow completed successfully!');
    console.log(`   Connections found: ${result.connections}`);
    console.log(`   Files modified: ${result.filesModified.length}`);
    console.log(`   Duration: ${result.duration}ms`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('\n4. Shutting down...');
    await shutdownWorkflowWorld();
    process.exit(0);
  }
}

main();
