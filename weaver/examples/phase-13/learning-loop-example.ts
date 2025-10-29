/**
 * Learning Loop Example
 *
 * Demonstrates the Four-Pillar Autonomous Learning System:
 * 1. Perception - Gather information
 * 2. Reasoning - Analyze and extract insights
 * 3. Memory - Store in chunked embeddings
 * 4. Execution - Generate actions
 */

import { LearningOrchestrator } from '../../src/learning-loop/index.js';
import { createPerceptionManager } from '../../src/perception/index.js';
import { createFeedbackCollector } from '../../src/learning-loop/feedback-collector.js';
import { reflectionSystem } from '../../src/learning-loop/reflection.js';

async function main() {
  console.log('=== Four-Pillar Learning Loop Example ===\n');

  // Initialize components
  const perceptionManager = createPerceptionManager();
  const orchestrator = new LearningOrchestrator(perceptionManager, {
    enablePerception: true,
    enableReasoning: true,
    enableMemory: true,
    enableExecution: true,
    maxIterations: 3,
  });

  const feedbackCollector = createFeedbackCollector('./data/feedback.db');

  // === EXAMPLE 1: Single Learning Loop ===
  console.log('Example 1: Single Learning Loop\n');

  const result = await orchestrator.learn({
    query: 'How to implement JWT authentication in Express?',
    task: 'auth-implementation',
    constraints: ['Use TypeScript', 'Secure by default', 'Easy to maintain'],
    goals: ['Production-ready', 'Well-documented', 'Testable'],
  });

  // Display results from each pillar
  console.log('\n--- Pillar 1: Perception ---');
  console.log(`Sources gathered: ${result.perception.sources.length}`);
  console.log(`Processing time: ${result.perception.processingTime}ms`);
  console.log(`Average relevance: ${result.perception.metadata.averageRelevance?.toFixed(2)}`);

  if (result.perception.sources.length > 0) {
    console.log('\nTop 3 sources:');
    result.perception.sources.slice(0, 3).forEach((source, i) => {
      console.log(`${i + 1}. ${source.title}`);
      console.log(`   Type: ${source.type}`);
      console.log(`   Relevance: ${source.relevanceScore?.toFixed(2) || 'N/A'}`);
      console.log(`   Location: ${source.location}\n`);
    });
  }

  console.log('\n--- Pillar 2: Reasoning ---');
  console.log(`Insights extracted: ${result.reasoning.insights.length}`);
  console.log(`Patterns identified: ${result.reasoning.patterns.length}`);
  console.log(`Confidence: ${(result.reasoning.confidence * 100).toFixed(1)}%`);

  if (result.reasoning.insights.length > 0) {
    console.log('\nKey Insights:');
    result.reasoning.insights.forEach((insight, i) => {
      console.log(`${i + 1}. ${insight}`);
    });
  }

  if (result.reasoning.patterns.length > 0) {
    console.log('\nPatterns:');
    result.reasoning.patterns.forEach((pattern, i) => {
      console.log(`${i + 1}. ${pattern.type}: ${pattern.description}`);
      console.log(`   Frequency: ${pattern.frequency}`);
    });
  }

  console.log('\n--- Pillar 3: Memory ---');
  console.log(`Chunks stored: ${result.memory.totalChunks}`);
  console.log(`Embedding model: ${result.memory.embeddingModel}`);

  console.log('\n--- Pillar 4: Execution ---');
  console.log(`Actions generated: ${result.execution.actions.length}`);
  console.log(`Confidence: ${(result.execution.confidence * 100).toFixed(1)}%`);

  if (result.execution.actions.length > 0) {
    console.log('\nActions (by priority):');
    result.execution.actions.forEach((action, i) => {
      console.log(`${i + 1}. [Priority ${action.priority}] ${action.description}`);
      if (action.estimated_duration) {
        console.log(`   Estimated duration: ${action.estimated_duration}`);
      }
    });
  }

  console.log('\n--- Overall Results ---');
  console.log(`Overall confidence: ${(result.metadata.confidence * 100).toFixed(1)}%`);
  console.log(`Total processing time: ${result.metadata.processingTime}ms`);
  console.log(`Learning signals: ${result.metadata.learningSignals.join(', ')}`);

  // === EXAMPLE 2: Iterative Learning ===
  console.log('\n\nExample 2: Iterative Learning\n');

  let context = {
    query: 'Build a scalable REST API',
    task: 'api-development',
    goals: ['Scalable', 'Documented', 'Production-ready'],
    previousResults: [] as any[],
  };

  for (let i = 0; i < 2; i++) {
    console.log(`\n--- Iteration ${i + 1} ---`);

    const iterResult = await orchestrator.learn(context);

    console.log(`Confidence: ${(iterResult.metadata.confidence * 100).toFixed(1)}%`);
    console.log(`Sources: ${iterResult.perception.sources.length}`);
    console.log(`Insights: ${iterResult.reasoning.insights.length}`);
    console.log(`Actions: ${iterResult.execution.actions.length}`);

    // Store result for next iteration
    context.previousResults.push({
      iteration: i + 1,
      confidence: iterResult.metadata.confidence,
      insights: iterResult.reasoning.insights,
    });

    if (iterResult.metadata.confidence > 0.8) {
      console.log('\n✓ High confidence achieved!');
      break;
    }
  }

  // === EXAMPLE 3: Feedback Collection ===
  console.log('\n\nExample 3: Feedback Collection\n');

  // Simulate user feedback
  await feedbackCollector.collectFeedback({
    taskId: 'auth-implementation',
    rating: 5,
    comment: 'Excellent guidance on JWT implementation. Clear and comprehensive.',
    tags: ['helpful', 'complete', 'clear'],
    metadata: {
      confidence: result.metadata.confidence,
      sources: result.perception.sources.length,
      executionTime: result.metadata.processingTime,
    },
  });

  console.log('✓ Feedback collected');

  // Retrieve feedback
  const taskFeedback = await feedbackCollector.getFeedback('auth-implementation');
  if (taskFeedback.length > 0) {
    console.log('\nFeedback:');
    taskFeedback.forEach((fb, i) => {
      console.log(`${i + 1}. Rating: ${fb.rating}/5`);
      console.log(`   Comment: ${fb.comment}`);
      console.log(`   Tags: ${fb.tags?.join(', ')}`);
    });
  }

  // === EXAMPLE 4: Autonomous Reflection ===
  console.log('\n\nExample 4: Autonomous Reflection\n');

  const execution = {
    id: `exec_${Date.now()}`,
    sop: 'jwt-authentication',
    success: true,
    duration: result.metadata.processingTime,
    errorCount: 0,
    result: {
      query: result.perception.query,
      confidence: result.metadata.confidence,
      insights: result.reasoning.insights.length,
      actions: result.execution.actions.length,
    },
  };

  const reflection = await reflectionSystem.reflectAutonomous(execution);

  console.log('Reflection:');
  console.log(`Confidence: ${(reflection.confidence * 100).toFixed(1)}%`);

  if (reflection.insights.length > 0) {
    console.log('\nInsights:');
    reflection.insights.forEach((insight, i) => {
      console.log(`${i + 1}. ${insight}`);
    });
  }

  if (reflection.improvements.length > 0) {
    console.log('\nSuggested Improvements:');
    reflection.improvements.forEach((improvement, i) => {
      console.log(`${i + 1}. ${improvement}`);
    });
  }

  if (reflection.nextSteps.length > 0) {
    console.log('\nNext Steps:');
    reflection.nextSteps.forEach((step, i) => {
      console.log(`${i + 1}. ${step}`);
    });
  }

  // === EXAMPLE 5: Custom Context ===
  console.log('\n\nExample 5: Custom Context\n');

  const customResult = await orchestrator.learn({
    query: 'Database migration strategy',
    task: 'db-migration',
    constraints: [
      'Zero downtime',
      'Backward compatible',
      'Rollback capability',
    ],
    goals: [
      'Safe migrations',
      'Version controlled',
      'Automated',
    ],
    previousResults: [
      {
        source: 'previous_analysis',
        recommendation: 'Use incremental migrations',
      },
    ],
  });

  console.log(`Query: ${customResult.perception.query}`);
  console.log(`Constraints: ${3} specified`);
  console.log(`Goals: ${3} specified`);
  console.log(`Confidence: ${(customResult.metadata.confidence * 100).toFixed(1)}%`);

  if (customResult.execution.response) {
    console.log('\nGenerated Response:');
    console.log(customResult.execution.response);
  }

  // Cleanup
  feedbackCollector.close();

  console.log('\n✓ Learning loop examples complete!');
}

// Run example
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
