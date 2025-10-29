/**
 * Complete Integration Example
 *
 * Shows how to integrate the feedback collection system
 * into a real SOP execution workflow.
 */

import { reflectionSystem } from './reflection';
import type { ExecutionResult } from './feedback-types';
import chalk from 'chalk';

/**
 * Example SOP Executor with Integrated Feedback Collection
 *
 * This demonstrates the complete workflow:
 * 1. Execute SOP logic
 * 2. Capture execution metrics
 * 3. Collect user feedback
 * 4. Store learnings for future improvement
 */
export class SOPExecutor {
  /**
   * Execute a SOP with automatic reflection and learning
   */
  async executeWithLearning(
    sopId: string,
    sopLogic: () => Promise<any>,
    options?: {
      skipReflection?: boolean;
      minimalFeedback?: boolean;
    }
  ) {
    console.log(chalk.blue.bold(`\n🚀 Executing SOP: ${sopId}\n`));

    const startTime = Date.now();
    let success = false;
    let errorCount = 0;
    let result: any;

    // Execute SOP
    try {
      result = await sopLogic();
      success = true;
      console.log(chalk.green('✓ SOP execution completed successfully'));
    } catch (error) {
      errorCount++;
      result = {
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined
      };
      console.error(chalk.red('✗ SOP execution failed:'), error);
    }

    const duration = Date.now() - startTime;

    // Build execution result
    const execution: ExecutionResult = {
      id: `exec_${Date.now()}`,
      sop: sopId,
      success,
      duration,
      errorCount,
      result,
      metadata: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    };

    // Reflect and learn
    if (!options?.skipReflection) {
      console.log(chalk.cyan('\n📊 Starting reflection stage...\n'));

      const lessons = await reflectionSystem.reflect(execution);

      // Display learning results
      this.displayLearningResults(lessons);

      // Apply learnings to future executions
      await this.applyLearnings(sopId, lessons);

      return { result, lessons, execution };
    }

    return { result, execution };
  }

  /**
   * Display learning results to user
   */
  private displayLearningResults(lessons: any) {
    console.log(chalk.blue.bold('\n╔════════════════════════════════════╗'));
    console.log(chalk.blue.bold('║     Learning Results Summary       ║'));
    console.log(chalk.blue.bold('╚════════════════════════════════════╝\n'));

    console.log(chalk.cyan('User Satisfaction:'),
      '⭐'.repeat(lessons.userSatisfaction) + '☆'.repeat(5 - lessons.userSatisfaction));

    console.log(chalk.cyan('Confidence Score:'),
      `${(lessons.confidenceScore * 100).toFixed(1)}%`);

    console.log(chalk.cyan('Learning Weight:'),
      `${lessons.weight.toFixed(2)}x`);

    if (lessons.userPreferredApproach) {
      console.log(chalk.green('\nPreferred Approach:'), lessons.userPreferredApproach);
    }

    if (lessons.synthesizedRecommendations.length > 0) {
      console.log(chalk.yellow('\n📝 Recommendations for Next Time:'));
      lessons.synthesizedRecommendations.forEach((rec: string, idx: number) => {
        console.log(chalk.gray(`  ${idx + 1}. ${rec}`));
      });
    }

    console.log(''); // Empty line
  }

  /**
   * Apply learnings to improve future executions
   */
  private async applyLearnings(sopId: string, lessons: any) {
    // Get historical analytics
    const analytics = await reflectionSystem.getAnalytics(sopId);

    // Check if satisfaction is improving
    const trend = analytics.satisfactionTrend;
    if (trend.length >= 3) {
      const recent = trend.slice(-3);
      const improving = recent.every((val, idx) =>
        idx === 0 || val >= recent[idx - 1]
      );

      if (improving) {
        console.log(chalk.green('📈 Trend: Satisfaction is improving!'));
      } else {
        console.log(chalk.yellow('📉 Trend: Satisfaction needs attention'));
      }
    }

    // Display top approaches
    if (analytics.topApproaches.length > 0) {
      console.log(chalk.blue('\n🏆 Top Performing Approaches:'));
      analytics.topApproaches.slice(0, 3).forEach((approach, idx) => {
        console.log(chalk.gray(
          `  ${idx + 1}. ${approach.id} (${approach.count}x, avg: ${approach.avgSatisfaction.toFixed(1)}⭐)`
        ));
      });
    }

    // TODO: Actually apply preferences to SOP configuration
    // This would integrate with your SOP configuration system
    if (lessons.userPreferredApproach) {
      // Example: await sopConfig.setPreferredApproach(sopId, lessons.userPreferredApproach);
      console.log(chalk.cyan(`\n💡 Will use "${lessons.userPreferredApproach}" approach by default next time`));
    }
  }

  /**
   * Get performance insights for a SOP
   */
  async getInsights(sopId: string) {
    const analytics = await reflectionSystem.getAnalytics(sopId);

    return {
      totalExecutions: analytics.totalFeedback,
      averageSatisfaction: analytics.averageSatisfaction,
      trend: analytics.satisfactionTrend,
      topApproaches: analytics.topApproaches,
      commonImprovements: analytics.commonImprovements
    };
  }
}

/**
 * Example usage in a real scenario
 */
async function exampleUsage() {
  const executor = new SOPExecutor();

  // Example: Create REST API SOP
  await executor.executeWithLearning(
    'create_rest_api',
    async () => {
      // Your actual SOP logic here
      console.log('  → Generating API structure...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('  → Creating routes and handlers...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('  → Writing tests...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('  → Generating documentation...');
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        files: [
          'src/api/routes.ts',
          'src/api/handlers.ts',
          'src/api/middleware.ts'
        ],
        tests: [
          'tests/api/routes.test.ts',
          'tests/api/handlers.test.ts'
        ],
        coverage: 87
      };
    }
  );

  console.log(chalk.green.bold('\n✓ Complete workflow executed with learning!\n'));

  // Get insights
  const insights = await executor.getInsights('create_rest_api');
  console.log('Insights:', insights);
}

/**
 * Example: Batch execution with learning
 */
async function batchExecutionExample() {
  const executor = new SOPExecutor();

  const sops = [
    { id: 'create_component', logic: async () => ({ component: 'Button.tsx' }) },
    { id: 'write_tests', logic: async () => ({ tests: 'Button.test.tsx' }) },
    { id: 'update_docs', logic: async () => ({ docs: 'Button.md' }) }
  ];

  console.log(chalk.magenta.bold('\n🔄 Batch Execution with Learning\n'));

  for (const sop of sops) {
    await executor.executeWithLearning(sop.id, sop.logic);
    console.log(''); // Spacing between SOPs
  }

  console.log(chalk.green.bold('✓ All SOPs executed and learned from!\n'));
}

/**
 * Example: Error handling with learning
 */
async function errorHandlingExample() {
  const executor = new SOPExecutor();

  await executor.executeWithLearning(
    'deploy_application',
    async () => {
      // Simulate error
      throw new Error('Deployment failed: Missing environment variables');
    }
  );

  // System will still collect feedback and learn from the failure
  console.log(chalk.yellow('Even failures provide valuable learning data!'));
}

// Export for use in other modules
export { exampleUsage, batchExecutionExample, errorHandlingExample };

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage().catch(console.error);
}
