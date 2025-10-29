/**
 * Basic Learning Loop Example
 * Demonstrates simple task execution with the autonomous learning loop
 */

import { AutonomousLearningLoop } from '../../src/learning-loop';
import { ClaudeFlowClient } from '../../src/memory/claude-flow-client';
import { ClaudeClient } from '../../src/agents/claude-client';
import type { Task, Outcome } from '../../src/learning-loop/types';

async function main() {
  // 1. Initialize clients
  console.log('Initializing clients...');

  const claudeFlow = new ClaudeFlowClient({
    mcpServer: 'claude-flow',
    namespace: 'weaver_experiences'
  });

  const claudeClient = new ClaudeClient({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-3-5-sonnet-20241022'
  });

  // 2. Create learning loop
  console.log('Creating learning loop...');

  const loop = new AutonomousLearningLoop(claudeFlow, claudeClient);

  // 3. Define a task
  const task: Task = {
    id: 'basic_001',
    description: 'Analyze Q4 2024 sales data and identify top 3 growth opportunities',
    domain: 'analytics',
    priority: 'high'
  };

  console.log('\n' + '='.repeat(60));
  console.log('Task:', task.description);
  console.log('Domain:', task.domain);
  console.log('='.repeat(60) + '\n');

  // 4. Execute task
  try {
    const outcome: Outcome = await loop.execute(task);

    // 5. Display results
    console.log('\n' + '='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));

    if (outcome.success) {
      console.log('✅ Task completed successfully!');
      console.log('\nDuration:', outcome.duration + 'ms');
      console.log('Steps completed:', outcome.metrics.stepsCompleted + '/' + outcome.metrics.stepsTotal);
      console.log('Success rate:', (outcome.metrics.successRate * 100).toFixed(1) + '%');

      if (outcome.data) {
        console.log('\nOutput data:');
        console.log(JSON.stringify(outcome.data, null, 2));
      }
    } else {
      console.log('❌ Task failed');
      console.log('Error:', outcome.error?.message);

      if (outcome.logs && outcome.logs.length > 0) {
        console.log('\nExecution logs:');
        outcome.logs.forEach(log => console.log('  -', log));
      }
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
