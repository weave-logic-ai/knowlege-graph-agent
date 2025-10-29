/**
 * Test Hybrid System - Verify Next.js + CLI Integration
 *
 * This script tests the complete hybrid system:
 * 1. Check if Next.js server is running
 * 2. Test workflow API endpoints
 * 3. Verify CLI can communicate with server
 * 4. Run a test workflow execution
 */

import chalk from 'chalk';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const WORKFLOW_SERVER = process.env.WORKFLOW_SERVER || 'http://localhost:3001';
const results: TestResult[] = [];

/**
 * Run a test with timing
 */
async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  console.log(chalk.blue(`\n🧪 ${name}...`));

  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ name, passed: true, duration });
    console.log(chalk.green(`✓ ${name} (${duration}ms)`));
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, duration, error: errorMsg });
    console.log(chalk.red(`✗ ${name} (${duration}ms)`));
    console.log(chalk.gray(`  Error: ${errorMsg}`));
  }
}

/**
 * Test 1: Server Health Check
 */
async function testServerHealth(): Promise<void> {
  const response = await fetch(`${WORKFLOW_SERVER}/api/workflows`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Server returned status ${response.status}`);
  }

  const data = await response.json();
  if (!data.workflows || !Array.isArray(data.workflows)) {
    throw new Error('Invalid response format');
  }

  console.log(chalk.gray(`  Found ${data.workflows.length} workflows`));
}

/**
 * Test 2: List Workflows
 */
async function testListWorkflows(): Promise<void> {
  const response = await fetch(`${WORKFLOW_SERVER}/api/workflows`);
  const data = await response.json();

  const docWorkflow = data.workflows.find((w: any) => w.id === 'document-connection');
  if (!docWorkflow) {
    throw new Error('document-connection workflow not found');
  }

  console.log(chalk.gray(`  Found workflow: ${docWorkflow.name}`));
}

/**
 * Test 3: Execute Workflow (Dry Run)
 */
async function testWorkflowExecution(): Promise<void> {
  // Create a temporary test file
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');

  const testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'weaver-test-'));
  const testFile = path.join(testDir, 'test.md');

  try {
    // Write test file
    await fs.writeFile(testFile, '---\ntitle: Test Document\n---\n\n# Test\n\nThis is a test document.');

    // Execute workflow
    const response = await fetch(`${WORKFLOW_SERVER}/api/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePath: testFile,
        vaultRoot: testDir,
        eventType: 'change',
        dryRun: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Workflow execution failed');
    }

    const result = await response.json();

    if (!result.runId) {
      throw new Error('No runId in response');
    }

    if (!result.result.success) {
      throw new Error(result.result.error || 'Workflow did not succeed');
    }

    console.log(chalk.gray(`  Run ID: ${result.runId}`));
    console.log(chalk.gray(`  Duration: ${result.result.duration}ms`));
    console.log(chalk.gray(`  Connections: ${result.result.connections}`));
  } finally {
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
  }
}

/**
 * Test 4: Workflow DevKit Endpoints
 */
async function testWorkflowDevKitEndpoints(): Promise<void> {
  // Test that the Workflow DevKit endpoints exist
  const endpoints = [
    '/.well-known/workflow/v1/flow',
    '/.well-known/workflow/v1/step',
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(`${WORKFLOW_SERVER}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    // We expect 400 or 500, not 404 (which would mean endpoint doesn't exist)
    if (response.status === 404) {
      throw new Error(`Endpoint ${endpoint} not found`);
    }
  }

  console.log(chalk.gray(`  Verified ${endpoints.length} Workflow DevKit endpoints`));
}

/**
 * Main test runner
 */
async function main(): Promise<void> {
  console.log(chalk.bold.blue('\n🚀 Weaver Hybrid System Test Suite\n'));
  console.log(chalk.gray(`Server: ${WORKFLOW_SERVER}`));

  // Check if server is running first
  try {
    await fetch(WORKFLOW_SERVER);
  } catch {
    console.log(chalk.red('\n❌ Workflow server is not running'));
    console.log(chalk.yellow('Start it with: npm run dev:web\n'));
    process.exit(1);
  }

  // Run tests
  await runTest('Test 1: Server Health Check', testServerHealth);
  await runTest('Test 2: List Workflows', testListWorkflows);
  await runTest('Test 3: Execute Workflow (Dry Run)', testWorkflowExecution);
  await runTest('Test 4: Workflow DevKit Endpoints', testWorkflowDevKitEndpoints);

  // Print summary
  console.log(chalk.bold.blue('\n📊 Test Summary\n'));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total: ${total} tests`);
  console.log(chalk.green(`Passed: ${passed}`));
  if (failed > 0) {
    console.log(chalk.red(`Failed: ${failed}`));
  }
  console.log(chalk.gray(`Duration: ${totalDuration}ms`));

  // Print failed tests
  if (failed > 0) {
    console.log(chalk.bold.red('\n❌ Failed Tests:\n'));
    results.filter(r => !r.passed).forEach(r => {
      console.log(chalk.red(`  ${r.name}`));
      if (r.error) {
        console.log(chalk.gray(`    ${r.error}`));
      }
    });
  }

  // Exit with appropriate code
  if (failed > 0) {
    console.log(chalk.red('\n❌ Some tests failed\n'));
    process.exit(1);
  } else {
    console.log(chalk.green('\n✅ All tests passed!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.gray('  1. Try the CLI: npm run dev:cli workflow status'));
    console.log(chalk.gray('  2. Run a workflow: npm run dev:cli workflow run document-connection README.md'));
    console.log(chalk.gray('  3. Test dry-run: npm run dev:cli workflow test document-connection README.md\n'));
  }
}

// Run tests
main().catch(error => {
  console.error(chalk.red('\n❌ Test suite failed:'), error);
  process.exit(1);
});
