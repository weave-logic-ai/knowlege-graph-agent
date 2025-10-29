/**
 * External Knowledge Example
 * Demonstrates using web search for current information
 */

import { AutonomousLearningLoop } from '../../src/learning-loop';
import { ClaudeFlowClient } from '../../src/memory/claude-flow-client';
import { ClaudeClient } from '../../src/agents/claude-client';
import type { Task, Outcome } from '../../src/learning-loop/types';

// Mock web fetch tool (replace with actual implementation)
class WebFetchTool {
  async search(query: string): Promise<any[]> {
    console.log(`  🔍 Searching web for: "${query}"`);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    return [
      {
        source: 'documentation',
        content: 'TypeScript 5.3 introduces decorators in stable form...',
        url: 'https://devblogs.microsoft.com/typescript/announcing-typescript-5-3/',
        score: 0.95
      },
      {
        source: 'blog',
        content: 'New features in TypeScript 5.3 include improved type inference...',
        url: 'https://blog.logrocket.com/typescript-5-3-new-features/',
        score: 0.88
      },
      {
        source: 'github',
        content: 'TypeScript 5.3 release notes - performance improvements...',
        url: 'https://github.com/microsoft/TypeScript/releases/tag/v5.3.0',
        score: 0.82
      }
    ];
  }

  async fetch(url: string): Promise<string> {
    console.log(`  📥 Fetching: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return '<html>...</html>';
  }
}

async function main() {
  console.log('Initializing with external knowledge support...\n');

  // Initialize clients
  const claudeFlow = new ClaudeFlowClient({ mcpServer: 'claude-flow' });
  const claudeClient = new ClaudeClient({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const webFetch = new WebFetchTool();

  // Create learning loop with web search enabled
  const loop = new AutonomousLearningLoop(
    claudeFlow,
    claudeClient,
    undefined,      // shadowCache (optional)
    undefined,      // workflowEngine (optional)
    webFetch,       // webFetch enabled
    {
      enableExternalKnowledge: true,  // Enable web search
      maxNotesPerQuery: 30,
      maxAlternativePlans: 5
    }
  );

  // Task that benefits from current information
  const task: Task = {
    id: 'research_001',
    description: 'Research and document the new features in TypeScript 5.3',
    domain: 'research',
    priority: 'high'
  };

  console.log('='.repeat(60));
  console.log('Task:', task.description);
  console.log('Domain:', task.domain);
  console.log('External knowledge: ENABLED');
  console.log('='.repeat(60) + '\n');

  console.log('📊 Perception Stage:');

  try {
    const outcome: Outcome = await loop.execute(task);

    console.log('\n' + '='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));

    if (outcome.success) {
      console.log('✅ Task completed successfully!');

      console.log('\n⏱️  Performance:');
      console.log('  Total duration:', outcome.duration + 'ms');
      console.log('  Steps completed:', outcome.metrics.stepsCompleted + '/' + outcome.metrics.stepsTotal);
      console.log('  Success rate:', (outcome.metrics.successRate * 100).toFixed(1) + '%');

      console.log('\n🌐 Knowledge Sources:');
      console.log('  ✓ Past experiences');
      console.log('  ✓ Vault notes');
      console.log('  ✓ Web search results');

      if (outcome.data) {
        console.log('\n📄 Output:');
        console.log(JSON.stringify(outcome.data, null, 2));
      }
    } else {
      console.log('❌ Task failed:', outcome.error?.message);

      if (outcome.logs && outcome.logs.length > 0) {
        console.log('\nLogs:');
        outcome.logs.forEach(log => console.log('  -', log));
      }
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\nError:', error);
  }

  console.log('\n💡 Tips:');
  console.log('  - Web search adds ~500-1000ms to perception stage');
  console.log('  - Enable only for research/current-info tasks');
  console.log('  - Results are cached for 1 hour');
  console.log('  - Top 3 results are used for context');

  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(console.error);
