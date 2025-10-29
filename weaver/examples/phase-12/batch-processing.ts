/**
 * Batch Processing Example
 * Demonstrates processing multiple tasks efficiently
 */

import { AutonomousLearningLoop } from '../../src/learning-loop';
import { ClaudeFlowClient } from '../../src/memory/claude-flow-client';
import { ClaudeClient } from '../../src/agents/claude-client';
import type { Task, Outcome } from '../../src/learning-loop/types';

async function main() {
  // Initialize
  const claudeFlow = new ClaudeFlowClient({ mcpServer: 'claude-flow' });
  const claudeClient = new ClaudeClient({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const loop = new AutonomousLearningLoop(claudeFlow, claudeClient);

  // Define multiple tasks
  const tasks: Task[] = [
    {
      id: 'batch_001',
      description: 'Analyze user engagement metrics for mobile app',
      domain: 'analytics',
      priority: 'high'
    },
    {
      id: 'batch_002',
      description: 'Research best practices for API rate limiting',
      domain: 'research',
      priority: 'medium'
    },
    {
      id: 'batch_003',
      description: 'Generate weekly status report for engineering team',
      domain: 'documentation',
      priority: 'low'
    },
    {
      id: 'batch_004',
      description: 'Optimize database query performance for reporting dashboard',
      domain: 'engineering',
      priority: 'high'
    },
    {
      id: 'batch_005',
      description: 'Create user onboarding tutorial content',
      domain: 'content',
      priority: 'medium'
    }
  ];

  console.log('\n' + '='.repeat(70));
  console.log('BATCH PROCESSING');
  console.log('='.repeat(70));
  console.log(`Total tasks: ${tasks.length}`);
  console.log('='.repeat(70) + '\n');

  // Option 1: Sequential processing
  console.log('Method 1: Sequential Processing\n');

  const startSequential = Date.now();
  const sequentialResults: Outcome[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log(`[${i + 1}/${tasks.length}] Processing: ${task.description.substring(0, 50)}...`);

    const outcome = await loop.execute(task);
    sequentialResults.push(outcome);

    const status = outcome.success ? '✅' : '❌';
    console.log(`${status} Completed in ${outcome.duration}ms\n`);
  }

  const sequentialDuration = Date.now() - startSequential;

  console.log('Sequential Processing Complete:');
  console.log(`  Total time: ${sequentialDuration}ms`);
  console.log(`  Average time per task: ${(sequentialDuration / tasks.length).toFixed(0)}ms`);

  const sequentialSuccess = sequentialResults.filter(r => r.success).length;
  console.log(`  Success rate: ${sequentialSuccess}/${tasks.length} (${((sequentialSuccess / tasks.length) * 100).toFixed(0)}%)\n`);

  // Option 2: Parallel processing (batched)
  console.log('\n' + '='.repeat(70));
  console.log('Method 2: Parallel Processing (Batch size: 3)\n');

  const startParallel = Date.now();
  const parallelResults: Outcome[] = [];
  const batchSize = 3;

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} tasks)...`);

    const batchOutcomes = await Promise.all(
      batch.map(task => loop.execute(task))
    );

    parallelResults.push(...batchOutcomes);

    const batchSuccess = batchOutcomes.filter(o => o.success).length;
    console.log(`  ${batchSuccess}/${batch.length} succeeded\n`);
  }

  const parallelDuration = Date.now() - startParallel;

  console.log('Parallel Processing Complete:');
  console.log(`  Total time: ${parallelDuration}ms`);
  console.log(`  Average time per task: ${(parallelDuration / tasks.length).toFixed(0)}ms`);

  const parallelSuccess = parallelResults.filter(r => r.success).length;
  console.log(`  Success rate: ${parallelSuccess}/${tasks.length} (${((parallelSuccess / tasks.length) * 100).toFixed(0)}%)`);

  const speedup = ((sequentialDuration - parallelDuration) / sequentialDuration) * 100;
  console.log(`  Speedup: ${speedup.toFixed(1)}% faster than sequential\n`);

  // Summary by domain
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY BY DOMAIN');
  console.log('='.repeat(70) + '\n');

  const domainStats = new Map<string, { total: number; success: number; totalDuration: number }>();

  tasks.forEach((task, index) => {
    const outcome = parallelResults[index];
    const stats = domainStats.get(task.domain) || { total: 0, success: 0, totalDuration: 0 };

    stats.total++;
    if (outcome.success) stats.success++;
    stats.totalDuration += outcome.duration;

    domainStats.set(task.domain, stats);
  });

  for (const [domain, stats] of domainStats) {
    const successRate = (stats.success / stats.total) * 100;
    const avgDuration = stats.totalDuration / stats.total;

    console.log(`${domain}:`);
    console.log(`  Tasks: ${stats.total}`);
    console.log(`  Success rate: ${successRate.toFixed(0)}%`);
    console.log(`  Average duration: ${avgDuration.toFixed(0)}ms\n`);
  }

  console.log('='.repeat(70) + '\n');
}

main().catch(console.error);
