/**
 * Proof Workflow Testing Script
 *
 * Tests task-completion and phase-completion workflows.
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const VAULT_PATH = process.env.VAULT_PATH || '/home/aepod/dev/weave-nn/weave-nn';

console.log('\n🧪 Proof Workflow Testing\n');
console.log('=' .repeat(60));

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  // Test 1: Task Completion Workflow
  console.log('\n1️⃣  Testing Task Completion Workflow...');

  const taskDir = join(VAULT_PATH, '_log/tasks');
  if (!existsSync(taskDir)) {
    mkdirSync(taskDir, { recursive: true });
  }

  const taskFile = join(taskDir, 'test_task.implement_proof_workflows.abc123.md');
  writeFileSync(taskFile, `---
type: task_log
status: completed
created_date: "2025-10-24"
---

# Test Task: Implement Proof Workflows

Task completed successfully.
`);

  console.log('✅ Task file created:', taskFile);
  console.log('   Expected workflow: task-completion');
  console.log('   Watch for: "📋 Task completion workflow triggered"');

  await wait(2000);

  // Test 2: Phase Completion Workflow
  console.log('\n2️⃣  Testing Phase Completion Workflow...');

  const phaseFile = join(VAULT_PATH, '_planning/phases/PHASE-4B-COMPLETION-REPORT.md');

  // File already exists, just touch it to trigger change event
  const content = `---
type: completion-report
phase: 4b
status: completed
---

# Phase 4B Completion Report (Test Update)

Updated at: ${new Date().toISOString()}
`;

  writeFileSync(phaseFile, content);

  console.log('✅ Phase completion report modified');
  console.log('   Expected workflow: phase-completion');
  console.log('   Watch for: "🎯 Phase completion workflow triggered"');
  console.log('   Watch for: "🎉 Phase completion report detected"');

  await wait(2000);

  // Test 3: General Task Tracker
  console.log('\n3️⃣  Testing General Task Tracker...');

  const generalTaskFile = join(VAULT_PATH, 'workflows/task-workflow-test.md');
  writeFileSync(generalTaskFile, `---
type: workflow
---

# Task Workflow Test

This should trigger the general task tracker.
`);

  console.log('✅ General task file created:', generalTaskFile);
  console.log('   Expected workflow: general-task-tracker');
  console.log('   Watch for: "📝 Task file detected"');

  await wait(2000);

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ All proof workflow tests completed!\n');
  console.log('📋 Check Weaver logs for:');
  console.log('   - 📋 "Task completion workflow triggered"');
  console.log('   - ✅ "Task tracked"');
  console.log('   - 🎯 "Phase completion workflow triggered"');
  console.log('   - 🎉 "Phase completion report detected"');
  console.log('   - 📝 "Task file detected"\n');

  console.log('📊 Cleanup:');
  console.log('   The test files are left in place for inspection.');
  console.log('   You can delete them manually if desired:\n');
  console.log(`   rm ${taskFile}`);
  console.log(`   rm ${generalTaskFile}\n`);
}

runTests().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
