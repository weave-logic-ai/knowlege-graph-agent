/**
 * Example Usage of Feedback Collection System
 *
 * Demonstrates how to integrate the reflection system
 * into SOP execution workflows.
 */

import { reflectionSystem } from './reflection';
import type { ExecutionResult } from './feedback-types';
import { FeedbackCollector } from './feedback-collector';
import { FeedbackStorage } from './feedback-storage';
import chalk from 'chalk';

/**
 * Example: Basic reflection after SOP execution
 */
async function basicReflectionExample() {
  console.log(chalk.blue.bold('\n=== Basic Reflection Example ===\n'));

  // Simulate SOP execution
  const execution: ExecutionResult = {
    id: 'exec_001',
    sop: 'create_rest_api',
    success: true,
    duration: 45000, // 45 seconds
    errorCount: 0,
    result: {
      files: ['src/api/routes.ts', 'src/api/handlers.ts'],
      tests: ['tests/api.test.ts'],
      coverage: 85
    },
    metadata: {
      framework: 'express',
      language: 'typescript'
    }
  };

  // Run reflection with user feedback
  const lessons = await reflectionSystem.reflect(execution);

  console.log(chalk.green('\n✓ Reflection complete!\n'));
  console.log('Enhanced Lessons:', JSON.stringify(lessons, null, 2));
}

/**
 * Example: Autonomous reflection (no user feedback)
 */
async function autonomousReflectionExample() {
  console.log(chalk.blue.bold('\n=== Autonomous Reflection Example ===\n'));

  const execution: ExecutionResult = {
    id: 'exec_002',
    sop: 'refactor_component',
    success: true,
    duration: 30000,
    errorCount: 0,
    result: {
      improved: true,
      metricsImprovement: {
        performance: '+15%',
        maintainability: '+20%'
      }
    }
  };

  // Run autonomous reflection only
  const lessons = await reflectionSystem.reflectAutonomous(execution);

  console.log(chalk.green('\n✓ Autonomous analysis complete!\n'));
  console.log('Lessons:', JSON.stringify(lessons, null, 2));
}

/**
 * Example: Custom feedback collector configuration
 */
async function customFeedbackExample() {
  console.log(chalk.blue.bold('\n=== Custom Feedback Example ===\n'));

  // Create custom feedback collector
  const collector = new FeedbackCollector({
    minimal: true,
    skipOnHighSatisfaction: true
  });

  const feedback = await collector.collect({
    sopId: 'custom_task',
    executionId: 'exec_003',
    result: { success: true },
    approaches: [
      {
        id: 'tdd',
        name: 'Test-Driven Development',
        description: 'Write tests first, then implementation',
        pros: ['High quality', 'Good coverage', 'Catch bugs early'],
        cons: ['Slower initial development', 'Learning curve'],
        estimatedEffort: '20 minutes',
        qualityScore: 0.9
      },
      {
        id: 'rapid_prototyping',
        name: 'Rapid Prototyping',
        description: 'Build quickly, test later',
        pros: ['Very fast', 'Quick feedback', 'Easy to iterate'],
        cons: ['Lower quality', 'More bugs', 'Technical debt'],
        estimatedEffort: '5 minutes',
        qualityScore: 0.6
      }
    ],
    suggestedImprovements: [
      'Add more comprehensive error handling',
      'Improve logging for debugging',
      'Add performance monitoring'
    ]
  });

  console.log(chalk.green('\n✓ Custom feedback collected!\n'));
  console.log('Feedback:', JSON.stringify(feedback, null, 2));
}

/**
 * Example: Analytics and trend analysis
 */
async function analyticsExample() {
  console.log(chalk.blue.bold('\n=== Analytics Example ===\n'));

  const storage = new FeedbackStorage();

  // Get analytics for a specific SOP
  const analytics = await storage.getAnalytics('create_rest_api');

  console.log(chalk.cyan('Analytics for create_rest_api:'));
  console.log(`  Total Feedback: ${analytics.totalFeedback}`);
  console.log(`  Average Satisfaction: ${analytics.averageSatisfaction.toFixed(2)}/5.0`);
  console.log(`  Satisfaction Trend: ${analytics.satisfactionTrend.join(' → ')}`);

  if (analytics.topApproaches.length > 0) {
    console.log(chalk.yellow('\n  Top Approaches:'));
    analytics.topApproaches.forEach((approach, idx) => {
      console.log(`    ${idx + 1}. ${approach.id} (used ${approach.count}x, avg satisfaction: ${approach.avgSatisfaction.toFixed(2)})`);
    });
  }

  if (analytics.commonImprovements.length > 0) {
    console.log(chalk.yellow('\n  Common Improvements:'));
    analytics.commonImprovements.forEach((improvement, idx) => {
      console.log(`    ${idx + 1}. ${improvement.text} (${improvement.frequency}x)`);
    });
  }

  // Get satisfaction trend
  const trend = await storage.getSatisfactionTrend('create_rest_api');
  console.log(chalk.green(`\n  Satisfaction Trend: ${trend.join(' → ')}`));

  // Get approach preferences
  const preferences = await storage.getApproachPreferences('create_rest_api');
  console.log(chalk.blue('\n  Approach Preferences:'));
  preferences.forEach((count, approach) => {
    console.log(`    ${approach}: ${count} votes`);
  });
}

/**
 * Example: Error handling and recovery
 */
async function errorHandlingExample() {
  console.log(chalk.blue.bold('\n=== Error Handling Example ===\n'));

  const execution: ExecutionResult = {
    id: 'exec_004',
    sop: 'deploy_application',
    success: false,
    duration: 120000, // 2 minutes
    errorCount: 3,
    result: {
      errors: [
        'Build failed: TypeScript compilation error',
        'Tests failed: 2 test cases',
        'Deployment failed: Missing environment variables'
      ]
    }
  };

  // Reflection will generate error-focused approaches
  const lessons = await reflectionSystem.reflect(execution);

  console.log(chalk.red('\n⚠ Execution had errors - reflection adapted:'));
  console.log('Confidence Score:', lessons.confidenceScore);
  console.log('Weight:', lessons.weight);
  console.log('\nRecommendations:');
  lessons.synthesizedRecommendations.forEach((rec, idx) => {
    console.log(`  ${idx + 1}. ${rec}`);
  });
}

/**
 * Example: Integration with SOP execution
 */
async function sopIntegrationExample() {
  console.log(chalk.blue.bold('\n=== SOP Integration Example ===\n'));

  // Simulate SOP execution with reflection
  async function executeSOP(sopId: string, sopLogic: () => Promise<any>) {
    const startTime = Date.now();
    let success = false;
    let errorCount = 0;
    let result: any;

    try {
      result = await sopLogic();
      success = true;
    } catch (error) {
      errorCount++;
      result = { error: String(error) };
    }

    const execution: ExecutionResult = {
      id: `exec_${Date.now()}`,
      sop: sopId,
      success,
      duration: Date.now() - startTime,
      errorCount,
      result
    };

    // Reflect and collect feedback
    const lessons = await reflectionSystem.reflect(execution);

    return { result, lessons };
  }

  // Execute SOP with automatic reflection
  const { result, lessons } = await executeSOP('create_component', async () => {
    // Simulate component creation
    return {
      component: 'Button.tsx',
      tests: 'Button.test.tsx',
      storybook: 'Button.stories.tsx'
    };
  });

  console.log(chalk.green('\n✓ SOP execution complete with reflection!'));
  console.log('Result:', result);
  console.log('User Satisfaction:', lessons.userSatisfaction);
  console.log('Confidence:', lessons.confidenceScore);
}

/**
 * Example: Minimal feedback mode
 */
async function minimalFeedbackExample() {
  console.log(chalk.blue.bold('\n=== Minimal Feedback Example ===\n'));

  const collector = new FeedbackCollector({ minimal: true });

  const feedback = await collector.collectMinimal({
    sopId: 'quick_task',
    executionId: 'exec_005',
    result: { success: true }
  });

  console.log(chalk.green('\n✓ Minimal feedback collected!'));
  console.log('Satisfaction:', '⭐'.repeat(feedback.satisfactionRating));
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log(chalk.magenta.bold('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.magenta.bold('║  Feedback Collection System Examples      ║'));
  console.log(chalk.magenta.bold('╚════════════════════════════════════════════╝\n'));

  try {
    // Run examples in sequence
    await basicReflectionExample();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await autonomousReflectionExample();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await customFeedbackExample();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await analyticsExample();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await errorHandlingExample();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await sopIntegrationExample();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await minimalFeedbackExample();

    console.log(chalk.green.bold('\n✓ All examples completed successfully!\n'));
  } catch (error) {
    console.error(chalk.red('\n✗ Error running examples:'), error);
    process.exit(1);
  }
}

// Export examples for testing
export {
  basicReflectionExample,
  autonomousReflectionExample,
  customFeedbackExample,
  analyticsExample,
  errorHandlingExample,
  sopIntegrationExample,
  minimalFeedbackExample,
  runAllExamples
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
