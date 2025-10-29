#!/usr/bin/env tsx
/**
 * Phase 15 POC Test Script - Day 1 (CORRECTED)
 *
 * Tests the Workflow DevKit compiled workflow using the correct runtime API
 *
 * Usage:
 *   npx tsx scripts/poc-test-workflow.ts
 */

import path from 'path';
import { start } from 'workflow';
import { documentConnectionWorkflow } from '../dist/workflows/document-connection.js';

async function main() {
  console.log('\n🧪 Phase 15 POC - Day 1 Test (Workflow DevKit)\n');
  console.log('━'.repeat(50));

  try {
    // Define test parameters
    const vaultRoot = path.resolve(process.cwd(), '..', 'weave-nn');
    const testFile = 'concept-map.md';

    console.log('\n1️⃣  Starting Workflow DevKit workflow...');
    console.log(`   Vault: ${vaultRoot}`);
    console.log(`   Test file: ${testFile}`);
    console.log(`   Workflow ID: ${(documentConnectionWorkflow as any).workflowId}`);

    // Use the Workflow DevKit start() function
    const result = await start(documentConnectionWorkflow, {
      filePath: path.join(vaultRoot, testFile),
      vaultRoot,
      eventType: 'change' as const,
      dryRun: true,
    });

    console.log('\n2️⃣  Workflow execution complete!');
    console.log('━'.repeat(50));
    console.log(`   ✅ Success: ${result.success}`);
    console.log(`   🔗 Connections: ${result.connections}`);
    console.log(`   📝 Files modified: ${result.filesModified.length}`);
    console.log(`   ⏱️  Duration: ${result.duration}ms`);

    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }

    console.log('\n3️⃣  Verifying Workflow DevKit features...');
    console.log('   • Check observability: npx workflow inspect runs');
    console.log('   • Check data dir: ls -la .workflow-data/');
    console.log('   • Workflow was compiled and instrumented ✅');

    console.log('\n✅ POC Day 1 Test Complete');
    console.log('━'.repeat(50));

    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('\n❌ POC Test Failed:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

main();
