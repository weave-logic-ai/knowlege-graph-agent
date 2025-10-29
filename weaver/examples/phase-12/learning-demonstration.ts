/**
 * Learning Demonstration Example
 * Shows how the agent improves over multiple iterations
 */

import { AutonomousLearningLoop } from '../../src/learning-loop';
import { ClaudeFlowClient } from '../../src/memory/claude-flow-client';
import { ClaudeClient } from '../../src/agents/claude-client';
import type { Task, LearningReport } from '../../src/learning-loop/types';

async function main() {
  // Initialize
  const claudeFlow = new ClaudeFlowClient({ mcpServer: 'claude-flow' });
  const claudeClient = new ClaudeClient({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const loop = new AutonomousLearningLoop(claudeFlow, claudeClient);

  // Define a task to repeat
  const task: Task = {
    id: 'learning_demo_001',
    description: 'Optimize database query performance for customer analytics dashboard',
    domain: 'engineering'
  };

  console.log('\n' + '='.repeat(70));
  console.log('LEARNING DEMONSTRATION');
  console.log('='.repeat(70));
  console.log('Task:', task.description);
  console.log('Iterations: 5');
  console.log('Objective: Demonstrate autonomous learning and improvement');
  console.log('='.repeat(70) + '\n');

  // Run learning demonstration
  const report: LearningReport = await loop.demonstrateLearning(task, 5);

  // Display results
  console.log('\n' + '='.repeat(70));
  console.log('LEARNING REPORT');
  console.log('='.repeat(70));

  console.log('\n📊 Overall Metrics:');
  console.log('  Iterations:', report.iterations);
  console.log('  Overall Improvement:', report.overallImprovement.toFixed(1) + '%');
  console.log('  Success Rate:', (report.metrics.successRate * 100).toFixed(1) + '%');
  console.log('  Average Confidence:', report.metrics.averageConfidence.toFixed(2));
  console.log('  Average Duration:', report.metrics.averageDuration.toFixed(0) + 'ms');
  console.log('  Total Lessons Learned:', report.metrics.totalLessons);
  console.log('  Improvement Rate:', report.metrics.improvementRate.toFixed(1) + '%');

  console.log('\n📈 Iteration Details:');
  report.results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const improvement = result.improvement ? ` (+${result.improvement.toFixed(1)}%)` : '';

    console.log(`  ${index + 1}. ${status} Duration: ${result.duration}ms, Confidence: ${result.confidence.toFixed(2)}, Lessons: ${result.lessonsLearned}${improvement}`);
  });

  console.log('\n💡 Key Learnings:');
  report.keyLearnings.forEach((learning, index) => {
    console.log(`  ${index + 1}. ${learning}`);
  });

  console.log('\n🎯 Recommendations:');
  report.recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec}`);
  });

  console.log('\n' + '='.repeat(70));

  // Analyze improvement trajectory
  console.log('\n📉 Improvement Trajectory:');

  const durations = report.results.map(r => r.duration);
  const confidences = report.results.map(r => r.confidence);

  const durationTrend = durations[durations.length - 1] < durations[0] ? '↓ Decreasing' : '↑ Increasing';
  const confidenceTrend = confidences[confidences.length - 1] > confidences[0] ? '↑ Increasing' : '↓ Decreasing';

  console.log(`  Duration: ${durationTrend}`);
  console.log(`  Confidence: ${confidenceTrend}`);

  const firstDuration = durations[0];
  const lastDuration = durations[durations.length - 1];
  const durationChange = ((lastDuration - firstDuration) / firstDuration) * 100;

  console.log(`  Duration Change: ${durationChange.toFixed(1)}%`);

  const firstConfidence = confidences[0];
  const lastConfidence = confidences[confidences.length - 1];
  const confidenceChange = ((lastConfidence - firstConfidence) / firstConfidence) * 100;

  console.log(`  Confidence Change: ${confidenceChange.toFixed(1)}%`);

  console.log('\n' + '='.repeat(70));

  // Success summary
  const successCount = report.results.filter(r => r.success).length;
  const successRate = (successCount / report.results.length) * 100;

  console.log('\n✨ Summary:');
  console.log(`  ${successCount}/${report.results.length} tasks succeeded (${successRate.toFixed(0)}%)`);
  console.log(`  Learning improved performance by ${report.overallImprovement.toFixed(1)}%`);
  console.log(`  System learned ${report.metrics.totalLessons} lessons`);

  console.log('\n' + '='.repeat(70) + '\n');
}

main().catch(console.error);
