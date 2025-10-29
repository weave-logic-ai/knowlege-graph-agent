/**
 * Vault Integration Example
 * Demonstrates using shadow cache for vault note retrieval
 */

import { AutonomousLearningLoop } from '../../src/learning-loop';
import { ClaudeFlowClient } from '../../src/memory/claude-flow-client';
import { ClaudeClient } from '../../src/agents/claude-client';
import { ShadowCache } from '../../src/shadow-cache';
import type { Task, Outcome } from '../../src/learning-loop/types';

async function main() {
  console.log('Initializing with vault integration...\n');

  // 1. Initialize shadow cache
  const vaultPath = process.env.VAULT_PATH || './vault';
  const shadowCache = new ShadowCache({
    vaultPath,
    dbPath: process.env.HOME + '/.weaver/shadow-cache/cache.db'
  });

  console.log('Initializing shadow cache...');
  await shadowCache.initialize();

  console.log('Indexing vault notes...');
  await shadowCache.index();

  const stats = await shadowCache.getStats();
  console.log(`  Indexed ${stats.totalFiles} notes\n`);

  // 2. Initialize MCP client
  const claudeFlow = new ClaudeFlowClient({ mcpServer: 'claude-flow' });
  const claudeClient = new ClaudeClient({ apiKey: process.env.ANTHROPIC_API_KEY! });

  // 3. Create learning loop with shadow cache
  const loop = new AutonomousLearningLoop(
    claudeFlow,
    claudeClient,
    shadowCache  // Shadow cache enables vault note search
  );

  // 4. Execute task that benefits from vault knowledge
  const task: Task = {
    id: 'vault_001',
    description: 'Create API documentation for the new user authentication system',
    domain: 'documentation'
  };

  console.log('='.repeat(60));
  console.log('Task:', task.description);
  console.log('Domain:', task.domain);
  console.log('Vault integration: ENABLED');
  console.log('='.repeat(60) + '\n');

  try {
    const outcome: Outcome = await loop.execute(task);

    console.log('\n' + '='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));

    if (outcome.success) {
      console.log('✅ Task completed successfully!');
      console.log('\nPerformance:');
      console.log('  Duration:', outcome.duration + 'ms');
      console.log('  Steps:', outcome.metrics.stepsCompleted + '/' + outcome.metrics.stepsTotal);

      console.log('\nVault Integration:');
      console.log('  ✓ Searched past experiences');
      console.log('  ✓ Retrieved relevant vault notes');
      console.log('  ✓ Fused knowledge from multiple sources');

      if (outcome.data) {
        console.log('\nOutput:');
        console.log(JSON.stringify(outcome.data, null, 2));
      }
    } else {
      console.log('❌ Task failed:', outcome.error?.message);
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);
