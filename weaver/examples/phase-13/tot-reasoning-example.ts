/**
 * Tree-of-Thought Reasoning Example
 *
 * Real-world usage: Design a REST API with ToT reasoning
 */

import { TreeOfThought } from '../../src/reasoning/tree-of-thought.js';
import {
  ThoughtTreeVisualizer,
  printTree,
} from '../../src/reasoning/visualization/thought-tree-visualizer.js';

/**
 * Example: Design a REST API using Tree-of-Thought reasoning
 */
async function designRESTAPIWithToT() {
  console.log('🌳 Tree-of-Thought: REST API Design\n');

  // Create ToT instance with ensemble evaluation
  const tot = new TreeOfThought({
    maxDepth: 4,
    branchingFactor: 3,
    evaluationStrategy: 'ensemble',
    enablePruning: true,
    pruneThreshold: 0.4,
    ensembleWeights: {
      value: 0.4,
      vote: 0.3,
      comparison: 0.3,
    },
  });

  const problem = 'Design a scalable REST API for a social media platform';

  console.log(`Problem: ${problem}\n`);
  console.log('Exploring thought space...\n');

  // Explore thought tree
  const startTime = Date.now();
  const bestPath = await tot.explore(problem);
  const elapsed = Date.now() - startTime;

  // Get metrics
  const metrics = tot.getMetrics();

  console.log('✅ Exploration Complete!\n');
  console.log('📊 Metrics:');
  console.log(`   Total nodes explored: ${metrics.totalNodes}`);
  console.log(`   Nodes pruned: ${metrics.prunedNodes}`);
  console.log(`   Max depth reached: ${metrics.maxDepth}`);
  console.log(`   Avg branching factor: ${metrics.branchingFactorAvg.toFixed(2)}`);
  console.log(`   Exploration time: ${elapsed}ms`);
  console.log(`   Best path length: ${bestPath.length}\n`);

  // Display best reasoning path
  console.log('🎯 Best Reasoning Path:\n');
  bestPath.forEach((node, index) => {
    console.log(
      `   ${index + 1}. ${node.thought} (confidence: ${(node.value * 100).toFixed(1)}%)`
    );
  });

  return { bestPath, metrics };
}

/**
 * Example: Compare different evaluation strategies
 */
async function compareEvaluationStrategies() {
  console.log('\n\n🔬 Comparing Evaluation Strategies\n');

  const problem = 'Implement user authentication system';
  const strategies = ['value', 'vote', 'comparison', 'ensemble'] as const;
  const results: Record<string, any> = {};

  for (const strategy of strategies) {
    console.log(`Testing ${strategy} strategy...`);

    const tot = new TreeOfThought({
      maxDepth: 3,
      branchingFactor: 3,
      evaluationStrategy: strategy,
    });

    const startTime = Date.now();
    const path = await tot.explore(problem);
    const elapsed = Date.now() - startTime;
    const metrics = tot.getMetrics();

    results[strategy] = {
      pathLength: path.length,
      totalNodes: metrics.totalNodes,
      time: elapsed,
      avgConfidence:
        path.reduce((sum, node) => sum + node.value, 0) / path.length,
    };

    console.log(`   ✓ Path length: ${path.length}`);
    console.log(`   ✓ Time: ${elapsed}ms\n`);
  }

  console.log('📊 Strategy Comparison:');
  console.table(results);

  return results;
}

/**
 * Example: Visualize thought tree in different formats
 */
async function demonstrateVisualization() {
  console.log('\n\n🎨 Visualization Demo\n');

  const tot = new TreeOfThought({
    maxDepth: 3,
    branchingFactor: 3,
    evaluationStrategy: 'ensemble',
  });

  const problem = 'Choose database for microservices architecture';
  const bestPath = await tot.explore(problem);

  // Create sample tree for visualization (simplified)
  const sampleTree = {
    id: 'root',
    thought: problem,
    value: 0,
    children: [
      {
        id: 'root-0',
        thought: 'SQL Database (PostgreSQL)',
        value: 0.85,
        children: [
          {
            id: 'root-0-0',
            thought: 'Use connection pooling',
            value: 0.88,
            children: [],
          },
          {
            id: 'root-0-1',
            thought: 'Implement read replicas',
            value: 0.82,
            children: [],
          },
        ],
      },
      {
        id: 'root-1',
        thought: 'NoSQL Database (MongoDB)',
        value: 0.78,
        children: [
          {
            id: 'root-1-0',
            thought: 'Use sharding',
            value: 0.75,
            children: [],
          },
        ],
      },
      {
        id: 'root-2',
        thought: 'Polyglot Persistence',
        value: 0.92,
        children: [
          {
            id: 'root-2-0',
            thought: 'PostgreSQL for transactions',
            value: 0.90,
            children: [],
          },
          {
            id: 'root-2-1',
            thought: 'Redis for caching',
            value: 0.93,
            children: [],
          },
        ],
      },
    ],
  };

  const samplePath = [
    sampleTree.children[2],
    sampleTree.children[2].children[1],
  ];

  console.log('1️⃣  ASCII Visualization:\n');
  printTree(sampleTree, samplePath);

  console.log('\n2️⃣  JSON Visualization:\n');
  const jsonVisualizer = new ThoughtTreeVisualizer({ format: 'json' });
  const jsonResult = jsonVisualizer.visualize(sampleTree, samplePath);
  console.log(jsonResult.output.substring(0, 500) + '...\n');

  console.log('3️⃣  Mermaid Diagram:\n');
  const mermaidVisualizer = new ThoughtTreeVisualizer({ format: 'mermaid' });
  const mermaidResult = mermaidVisualizer.visualize(sampleTree, samplePath);
  console.log(mermaidResult.output);

  console.log('\n📊 Visualization Metadata:');
  console.table(mermaidResult.metadata);

  return { sampleTree, samplePath };
}

/**
 * Example: Deep exploration with pruning
 */
async function demonstrateDeepExploration() {
  console.log('\n\n🌊 Deep Exploration with Pruning\n');

  const problem = 'Optimize database query performance';

  // Without pruning
  console.log('Without pruning:');
  const withoutPruning = new TreeOfThought({
    maxDepth: 6,
    branchingFactor: 4,
    enablePruning: false,
  });

  const start1 = Date.now();
  await withoutPruning.explore(problem);
  const time1 = Date.now() - start1;
  const metrics1 = withoutPruning.getMetrics();

  console.log(`   Nodes: ${metrics1.totalNodes}`);
  console.log(`   Time: ${time1}ms\n`);

  // With pruning
  console.log('With pruning (threshold: 0.5):');
  const withPruning = new TreeOfThought({
    maxDepth: 6,
    branchingFactor: 4,
    enablePruning: true,
    pruneThreshold: 0.5,
  });

  const start2 = Date.now();
  await withPruning.explore(problem);
  const time2 = Date.now() - start2;
  const metrics2 = withPruning.getMetrics();

  console.log(`   Nodes: ${metrics2.totalNodes}`);
  console.log(`   Pruned: ${metrics2.prunedNodes}`);
  console.log(`   Time: ${time2}ms\n`);

  const efficiency =
    ((metrics1.totalNodes - metrics2.totalNodes + metrics2.prunedNodes) /
      metrics1.totalNodes) *
    100;
  console.log(`💡 Pruning efficiency: ${efficiency.toFixed(1)}%`);
  console.log(`⚡ Speedup: ${(time1 / time2).toFixed(2)}x faster\n`);

  return { metrics1, metrics2 };
}

/**
 * Main example runner
 */
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Tree-of-Thought Reasoning Examples');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Example 1: Basic ToT usage
    await designRESTAPIWithToT();

    // Example 2: Strategy comparison
    await compareEvaluationStrategies();

    // Example 3: Visualization
    await demonstrateVisualization();

    // Example 4: Deep exploration
    await demonstrateDeepExploration();

    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}

export {
  designRESTAPIWithToT,
  compareEvaluationStrategies,
  demonstrateVisualization,
  demonstrateDeepExploration,
};
