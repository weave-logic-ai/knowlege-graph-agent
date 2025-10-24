/**
 * Workflow Testing Script
 *
 * Tests workflow execution by creating/modifying files and checking workflow logs.
 */

import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const VAULT_PATH = process.env.VAULT_PATH || '/home/aepod/dev/weave-nn/weave-nn';
const TEST_FILE = join(VAULT_PATH, 'concepts/workflow-test.md');

console.log('\n🧪 Workflow Testing Script\n');
console.log('=' .repeat(60));

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n1️⃣  Creating test file...');
  writeFileSync(TEST_FILE, `---
type: concept
title: Workflow Test
status: draft
tags:
  - test
  - workflow
---

# Workflow Test

This file tests the workflow engine.

[[knowledge-graph]]
`);
  console.log('✅ Test file created:', TEST_FILE);
  console.log('   Expected workflows: file-change-logger, markdown-analyzer, concept-tracker');

  await wait(2000); // Wait for workflows to execute

  console.log('\n2️⃣  Modifying test file...');
  writeFileSync(TEST_FILE, `---
type: concept
title: Workflow Test (Modified)
status: active
tags:
  - test
  - workflow
  - updated
---

# Workflow Test (Modified)

This file tests the workflow engine with modifications.

[[knowledge-graph]]
[[architecture]]
`);
  console.log('✅ Test file modified');
  console.log('   Expected workflows: file-change-logger, markdown-analyzer');

  await wait(2000);

  console.log('\n3️⃣  Deleting test file...');
  if (existsSync(TEST_FILE)) {
    unlinkSync(TEST_FILE);
  }
  console.log('✅ Test file deleted');
  console.log('   Expected workflows: file-change-logger, file-deletion-monitor');

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Tests completed!\n');
  console.log('📋 Check Weaver logs for workflow execution output:');
  console.log('   - ⚙️  "Workflow execution started" messages');
  console.log('   - 📄 "File change detected by workflow"');
  console.log('   - 📊 "Markdown file analyzed"');
  console.log('   - 💡 "New concept created"');
  console.log('   - 🗑️  "File deleted"');
  console.log('   - ✅ "Workflow execution completed" messages\n');

  console.log('📊 View workflow statistics:');
  console.log('   npx tsx scripts/workflow-stats.ts\n');
}

runTests().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
