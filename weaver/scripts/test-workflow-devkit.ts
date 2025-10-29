#!/usr/bin/env tsx
/**
 * Phase 15 - Workflow DevKit Integration Test
 *
 * Tests the complete Workflow DevKit integration:
 * - EmbeddedWorld initialization
 * - Workflow execution via start() API
 * - .workflow-data/ persistence
 * - Observability features
 */

import path from 'path';
import { start } from '@workflow/core/runtime';
import { initializeWorkflowWorld, shutdownWorkflowWorld } from '../dist/workflow-engine.js';
import { documentConnectionWorkflow } from '../dist/workflows/document-connection.js';

async function main() {
  console.log('\n🧪 Phase 15 - Workflow DevKit Integration Test\n');
  console.log('━'.repeat(60));

  try {
    // Step 1: Initialize EmbeddedWorld
    console.log('\n1️⃣  Initializing Workflow DevKit EmbeddedWorld...');
    await initializeWorkflowWorld();

    // Step 2: Prepare test parameters
    const vaultRoot = path.resolve(process.cwd(), '..', 'weave-nn');
    const testFile = 'weave-nn-project-hub.md';

    console.log('\n2️⃣  Starting workflow execution...');
    console.log(`   Vault: ${vaultRoot}`);
    console.log(`   Test file: ${testFile}`);
    console.log(`   Workflow ID: ${(documentConnectionWorkflow as any).workflowId}`);

    // Step 3: Start the workflow using Workflow DevKit's start() API
    const run = await start(documentConnectionWorkflow, [{
      filePath: path.join(vaultRoot, testFile),
      vaultRoot,
      eventType: 'change' as const,
      dryRun: true,
    }]);

    console.log(`\n3️⃣  Workflow started successfully!`);
    console.log(`   Run ID: ${run.runId}`);

    // Step 4: Wait for workflow completion
    console.log('\n4️⃣  Waiting for workflow to complete...');
    const result = await run.returnValue;

    // Step 5: Display results
    console.log('\n5️⃣  Workflow execution complete!');
    console.log('━'.repeat(60));
    console.log(`   ✅ Success: ${result.success}`);
    console.log(`   🔗 Connections: ${result.connections}`);
    console.log(`   📝 Files modified: ${result.filesModified.length}`);
    console.log(`   ⏱️  Duration: ${result.duration}ms`);

    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }

    // Step 6: Verify observability
    console.log('\n6️⃣  Verifying Workflow DevKit features...');
    console.log('   📊 Check execution data: ls -la .workflow-data/');
    console.log('   📁 Runs directory: .workflow-data/runs/');
    console.log('   🔍 Steps directory: .workflow-data/steps/');
    console.log('   🌐 HTTP endpoint: http://localhost:3000/.well-known/workflow/v1/step');

    // Step 7: Shutdown
    console.log('\n7️⃣  Shutting down Workflow World...');
    await shutdownWorkflowWorld();

    console.log('\n✅ Phase 15 Integration Test Complete!');
    console.log('━'.repeat(60));
    console.log('\n📚 Next steps:');
    console.log('   • Inspect .workflow-data/ directory for execution logs');
    console.log('   • Verify workflow observability features');
    console.log('   • Test with other workflows');
    console.log('   • Add web UI for workflow inspection (optional)');
    console.log('');

    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Workflow DevKit Test Failed:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }

    // Cleanup on error
    try {
      await shutdownWorkflowWorld();
    } catch (shutdownError) {
      console.error('Failed to shutdown:', shutdownError);
    }

    process.exit(1);
  }
}

main();
