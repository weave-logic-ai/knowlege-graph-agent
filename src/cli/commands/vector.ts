/**
 * Vector Command
 *
 * CLI commands for vector operations including semantic search,
 * vector store statistics, index management, and trajectory tracking.
 *
 * @module cli/commands/vector
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  createVectorStore,
  createTrajectoryTracker,
  type VectorIndexStats,
  type SearchResult,
  type AgentTrajectory,
  type DetectedPattern,
} from '../../vector/index.js';
import { validateProjectRoot } from '../../core/security.js';

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
}

/**
 * Format table row with padding
 */
function formatRow(cells: string[], widths: number[]): string {
  return cells.map((cell, i) => cell.padEnd(widths[i])).join('  ');
}

/**
 * Print a table with headers and rows
 */
function printTable(
  headers: string[],
  rows: string[][],
  options: { indent?: number; headerColor?: typeof chalk.white } = {}
): void {
  const indent = '  '.repeat(options.indent ?? 1);
  const headerColor = options.headerColor ?? chalk.white;

  // Calculate column widths
  const widths = headers.map((h, i) => {
    const maxRowWidth = Math.max(...rows.map((r) => (r[i] || '').length));
    return Math.max(h.length, maxRowWidth);
  });

  // Print header
  console.log(indent + headerColor(formatRow(headers, widths)));
  console.log(indent + chalk.gray('-'.repeat(widths.reduce((a, b) => a + b + 2, 0))));

  // Print rows
  for (const row of rows) {
    console.log(indent + chalk.gray(formatRow(row, widths)));
  }
}

/**
 * Create vector command group
 */
export function createVectorCommand(): Command {
  const vector = new Command('vector')
    .alias('vec')
    .description('Vector operations for semantic search and trajectory tracking');

  // Search subcommand
  vector
    .command('search <query>')
    .description('Perform semantic search on vector store')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('-k, --top-k <n>', 'Number of results to return', '10')
    .option('-t, --type <type>', 'Filter by node type')
    .option('--hybrid', 'Enable hybrid search (combines vector + graph)')
    .option('--min-score <score>', 'Minimum similarity score (0-1)', '0')
    .option('--json', 'Output as JSON')
    .action(async (query, options) => {
      const spinner = ora('Searching vectors...').start();

      try {
        const projectRoot = validateProjectRoot(options.path);
        const topK = parseInt(options.topK, 10) || 10;
        const minScore = parseFloat(options.minScore) || 0;

        // Create vector store
        const store = createVectorStore();
        await store.initialize();

        // Check if we have vectors
        const stats = store.getStats();
        if (stats.totalVectors === 0) {
          spinner.warn('Vector store is empty');
          console.log(chalk.gray('  No vectors have been indexed yet.'));
          console.log(chalk.gray('  Run ') + chalk.cyan('kg vector rebuild') + chalk.gray(' to index vectors.'));
          return;
        }

        spinner.text = 'Generating query embedding...';

        // For now, create a mock embedding from the query
        // In production, this would use an actual embedding model
        const queryEmbedding = createMockEmbedding(query, stats.dimensions);

        spinner.text = `Searching ${stats.totalVectors} vectors...`;

        let results: SearchResult[];

        if (options.hybrid) {
          // Hybrid search
          const hybridResults = await store.hybridSearch({
            embedding: queryEmbedding,
            limit: topK,
            minScore,
            filters: options.type ? { type: options.type } : undefined,
          });
          results = hybridResults;
        } else {
          // Standard vector search
          results = await store.search({
            vector: queryEmbedding,
            k: topK,
            minScore,
            filter: options.type ? { type: options.type } : undefined,
          });
        }

        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
          return;
        }

        console.log(chalk.cyan(`\n  Search Results for "${query}"\n`));

        if (results.length === 0) {
          console.log(chalk.gray('  No results found'));
          return;
        }

        console.log(chalk.gray(`  Found ${results.length} result${results.length === 1 ? '' : 's'}\n`));

        // Display results as a table
        const headers = ['#', 'ID', 'Score', 'Type', 'Metadata'];
        const rows = results.map((r, i) => [
          String(i + 1),
          r.id.substring(0, 24) + (r.id.length > 24 ? '...' : ''),
          r.score.toFixed(4),
          (r.metadata?.type as string) || '-',
          Object.keys(r.metadata || {}).length > 0
            ? Object.keys(r.metadata).slice(0, 3).join(', ')
            : '-',
        ]);

        printTable(headers, rows);

        // Show detailed metadata for top results
        console.log(chalk.white('\n  Top Result Details:\n'));
        const top = results[0];
        console.log(chalk.gray(`    ID: ${top.id}`));
        console.log(chalk.gray(`    Score: ${top.score.toFixed(6)}`));
        if (top.distance !== undefined) {
          console.log(chalk.gray(`    Distance: ${top.distance.toFixed(6)}`));
        }
        if (Object.keys(top.metadata || {}).length > 0) {
          console.log(chalk.gray('    Metadata:'));
          for (const [key, value] of Object.entries(top.metadata)) {
            const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            console.log(chalk.gray(`      ${key}: ${displayValue.substring(0, 50)}`));
          }
        }

        console.log();
      } catch (error) {
        spinner.fail('Search failed');
        console.error(chalk.red(String(error)));
        process.exit(1);
      }
    });

  // Stats subcommand
  vector
    .command('stats')
    .description('Display vector store statistics')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const projectRoot = validateProjectRoot(options.path);

        // Create vector store
        const store = createVectorStore();
        await store.initialize();

        const stats = store.getStats();

        if (options.json) {
          console.log(JSON.stringify(stats, null, 2));
          return;
        }

        console.log(chalk.cyan.bold('\n  Vector Store Statistics\n'));

        // Overview
        console.log(chalk.white('  Overview'));
        console.log(chalk.gray(`    Total Vectors:   ${stats.totalVectors.toLocaleString()}`));
        console.log(chalk.gray(`    Dimensions:      ${stats.dimensions}`));
        console.log(chalk.gray(`    Index Type:      ${stats.indexType.toUpperCase()}`));
        console.log(chalk.gray(`    Memory Usage:    ${formatBytes(stats.memoryUsage)}`));
        console.log(chalk.gray(`    Last Updated:    ${stats.lastUpdated.toISOString()}`));

        // Index stats
        if (stats.indexStats) {
          console.log();
          console.log(chalk.white('  Index Configuration'));
          if (stats.indexStats.levels !== undefined) {
            console.log(chalk.gray(`    HNSW Levels:     ${stats.indexStats.levels}`));
          }
          if (stats.indexStats.entryPoint) {
            console.log(chalk.gray(`    Entry Point:     ${stats.indexStats.entryPoint.substring(0, 24)}...`));
          }
          if (stats.indexStats.avgConnections !== undefined) {
            console.log(chalk.gray(`    Avg Connections: ${stats.indexStats.avgConnections.toFixed(2)}`));
          }
        }

        // Namespace breakdown
        if (stats.namespaces && Object.keys(stats.namespaces).length > 0) {
          console.log();
          console.log(chalk.white('  Namespaces'));
          for (const [ns, count] of Object.entries(stats.namespaces)) {
            const bar = '|'.repeat(Math.min(count, 30));
            console.log(chalk.gray(`    ${ns.padEnd(15)} ${String(count).padStart(6)} ${chalk.blue(bar)}`));
          }
        }

        // Performance hints
        console.log();
        console.log(chalk.white('  Performance'));
        if (stats.totalVectors === 0) {
          console.log(chalk.yellow('    [!] Vector store is empty'));
          console.log(chalk.gray('        Run "kg vector rebuild" to populate the index'));
        } else if (stats.totalVectors < 100) {
          console.log(chalk.green('    [OK] Small index - linear search may be faster'));
        } else if (stats.totalVectors < 10000) {
          console.log(chalk.green('    [OK] Medium index - HNSW optimal'));
        } else {
          console.log(chalk.yellow('    [!] Large index - consider quantization'));
        }

        console.log();
      } catch (error) {
        console.error(chalk.red('Failed to get stats:'), String(error));
        process.exit(1);
      }
    });

  // Rebuild subcommand
  vector
    .command('rebuild')
    .description('Rebuild vector index from knowledge graph')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('--force', 'Force rebuild even if index exists')
    .option('--batch-size <size>', 'Batch size for indexing', '100')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options) => {
      const spinner = ora('Rebuilding vector index...').start();

      try {
        const projectRoot = validateProjectRoot(options.path);
        const batchSize = parseInt(options.batchSize, 10) || 100;

        // Create vector store
        const store = createVectorStore();
        await store.initialize();

        const existingStats = store.getStats();

        if (existingStats.totalVectors > 0 && !options.force) {
          spinner.warn(`Index already contains ${existingStats.totalVectors} vectors`);
          console.log(chalk.gray('  Use --force to rebuild anyway'));
          return;
        }

        if (options.force && existingStats.totalVectors > 0) {
          spinner.text = 'Clearing existing index...';
          await store.clear();
        }

        // In a real implementation, this would:
        // 1. Read nodes from the knowledge graph database
        // 2. Generate embeddings for each node
        // 3. Insert vectors in batches

        spinner.text = 'Scanning knowledge graph...';

        // Simulate rebuild process
        const kgPath = join(projectRoot, '.kg', 'knowledge.db');
        if (!existsSync(kgPath)) {
          spinner.fail('Knowledge graph not found');
          console.log(chalk.gray('  Run ') + chalk.cyan('kg graph') + chalk.gray(' first'));
          return;
        }

        // Mock rebuild with progress
        spinner.text = 'Generating embeddings...';

        // For demonstration, we show what would happen
        spinner.succeed('Vector index rebuild complete');

        console.log();
        console.log(chalk.white('  Rebuild Summary'));
        console.log(chalk.gray(`    Vectors indexed: 0 (mock - no embedding model configured)`));
        console.log(chalk.gray(`    Batch size:      ${batchSize}`));
        console.log(chalk.gray(`    Project root:    ${projectRoot}`));

        console.log();
        console.log(chalk.yellow('  Note: Full vector indexing requires an embedding model.'));
        console.log(chalk.gray('  Configure OPENAI_API_KEY or use local embeddings.'));
        console.log();

      } catch (error) {
        spinner.fail('Rebuild failed');
        console.error(chalk.red(String(error)));
        process.exit(1);
      }
    });

  // Trajectory subcommand group
  const trajectory = vector
    .command('trajectory')
    .alias('traj')
    .description('Agent trajectory tracking operations');

  // trajectory list
  trajectory
    .command('list')
    .description('List recorded agent trajectories')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('-a, --agent <id>', 'Filter by agent ID')
    .option('-w, --workflow <id>', 'Filter by workflow ID')
    .option('-l, --limit <n>', 'Maximum number of trajectories', '20')
    .option('--success', 'Show only successful trajectories')
    .option('--failed', 'Show only failed trajectories')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const limit = parseInt(options.limit, 10) || 20;

        // Create trajectory tracker
        const tracker = createTrajectoryTracker({
          maxTrajectories: 1000,
          enableAutoLearning: true,
        });

        const stats = tracker.getStats();

        if (options.json) {
          const exported = tracker.export();
          let trajectories = exported.trajectories;

          if (options.agent) {
            trajectories = trajectories.filter((t) => t.agentId === options.agent);
          }
          if (options.workflow) {
            trajectories = trajectories.filter((t) => t.workflowId === options.workflow);
          }
          if (options.success) {
            trajectories = trajectories.filter((t) => t.success);
          }
          if (options.failed) {
            trajectories = trajectories.filter((t) => !t.success);
          }

          console.log(JSON.stringify(trajectories.slice(0, limit), null, 2));
          return;
        }

        console.log(chalk.cyan.bold('\n  Agent Trajectories\n'));

        // Overview stats
        console.log(chalk.white('  Overview'));
        console.log(chalk.gray(`    Active:     ${stats.activeTrajectories}`));
        console.log(chalk.gray(`    Completed:  ${stats.completedTrajectories}`));
        console.log(chalk.gray(`    Success:    ${(stats.successRate * 100).toFixed(1)}%`));
        console.log(chalk.gray(`    Avg Duration: ${formatDuration(stats.avgDuration)}`));
        console.log(chalk.gray(`    Patterns:   ${stats.detectedPatterns}`));

        // Get trajectories
        const exported = tracker.export();
        let trajectories = exported.trajectories;

        if (options.agent) {
          trajectories = trajectories.filter((t) => t.agentId === options.agent);
        }
        if (options.workflow) {
          trajectories = trajectories.filter((t) => t.workflowId === options.workflow);
        }
        if (options.success) {
          trajectories = trajectories.filter((t) => t.success);
        }
        if (options.failed) {
          trajectories = trajectories.filter((t) => !t.success);
        }

        trajectories = trajectories.slice(-limit).reverse();

        if (trajectories.length === 0) {
          console.log();
          console.log(chalk.gray('  No trajectories found'));
          console.log(chalk.gray('  Trajectories are recorded during agent operations.'));
          console.log();
          return;
        }

        console.log();
        console.log(chalk.white(`  Recent Trajectories (${trajectories.length})`));

        const headers = ['ID', 'Agent', 'Steps', 'Duration', 'Status'];
        const rows = trajectories.map((t) => [
          t.id.substring(0, 16) + '...',
          t.agentId.substring(0, 12) + (t.agentId.length > 12 ? '...' : ''),
          String(t.steps.length),
          formatDuration(t.totalDuration),
          t.success ? chalk.green('OK') : chalk.red('FAIL'),
        ]);

        printTable(headers, rows);
        console.log();

      } catch (error) {
        console.error(chalk.red('Failed to list trajectories:'), String(error));
        process.exit(1);
      }
    });

  // trajectory show
  trajectory
    .command('show <id>')
    .description('Show detailed trajectory information')
    .option('--json', 'Output as JSON')
    .action(async (id, options) => {
      try {
        // Create trajectory tracker
        const tracker = createTrajectoryTracker({
          maxTrajectories: 1000,
          enableAutoLearning: true,
        });

        const trajectory = tracker.getTrajectory(id);

        if (!trajectory) {
          console.log(chalk.yellow(`\n  Trajectory not found: ${id}\n`));
          console.log(chalk.gray('  Use "kg vector trajectory list" to see available trajectories.'));
          console.log();
          return;
        }

        if (options.json) {
          console.log(JSON.stringify(trajectory, null, 2));
          return;
        }

        console.log(chalk.cyan.bold('\n  Trajectory Details\n'));

        // Basic info
        console.log(chalk.white('  Information'));
        console.log(chalk.gray(`    ID:         ${trajectory.id}`));
        console.log(chalk.gray(`    Agent:      ${trajectory.agentId}`));
        if (trajectory.workflowId) {
          console.log(chalk.gray(`    Workflow:   ${trajectory.workflowId}`));
        }
        console.log(chalk.gray(`    Started:    ${trajectory.startedAt.toISOString()}`));
        if (trajectory.completedAt) {
          console.log(chalk.gray(`    Completed:  ${trajectory.completedAt.toISOString()}`));
        }
        console.log(chalk.gray(`    Duration:   ${formatDuration(trajectory.totalDuration)}`));
        console.log(
          chalk.gray('    Status:     ') +
            (trajectory.success ? chalk.green('SUCCESS') : chalk.red('FAILED'))
        );

        // Steps
        if (trajectory.steps.length > 0) {
          console.log();
          console.log(chalk.white(`  Steps (${trajectory.steps.length})`));

          const stepHeaders = ['#', 'Action', 'Outcome', 'Duration'];
          const stepRows = trajectory.steps.map((s, i) => [
            String(i + 1),
            s.action.substring(0, 30) + (s.action.length > 30 ? '...' : ''),
            s.outcome === 'success'
              ? chalk.green(s.outcome)
              : s.outcome === 'failure'
              ? chalk.red(s.outcome)
              : chalk.yellow(s.outcome),
            formatDuration(s.duration),
          ]);

          printTable(stepHeaders, stepRows);
        }

        // Metadata
        if (trajectory.metadata && Object.keys(trajectory.metadata).length > 0) {
          console.log();
          console.log(chalk.white('  Metadata'));
          for (const [key, value] of Object.entries(trajectory.metadata)) {
            const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            console.log(chalk.gray(`    ${key}: ${displayValue.substring(0, 60)}`));
          }
        }

        console.log();
      } catch (error) {
        console.error(chalk.red('Failed to show trajectory:'), String(error));
        process.exit(1);
      }
    });

  // trajectory patterns
  trajectory
    .command('patterns')
    .description('Show detected action patterns')
    .option('--min-confidence <n>', 'Minimum confidence threshold (0-1)', '0.5')
    .option('--type <type>', 'Filter by pattern type (success, failure, optimization)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const minConfidence = parseFloat(options.minConfidence) || 0.5;

        // Create trajectory tracker
        const tracker = createTrajectoryTracker({
          maxTrajectories: 1000,
          enableAutoLearning: true,
        });

        const patterns = tracker.getPatterns({
          minConfidence,
          type: options.type as 'success' | 'failure' | 'optimization' | undefined,
        });

        if (options.json) {
          console.log(JSON.stringify(patterns, null, 2));
          return;
        }

        console.log(chalk.cyan.bold('\n  Detected Patterns\n'));

        if (patterns.length === 0) {
          console.log(chalk.gray('  No patterns detected yet.'));
          console.log(chalk.gray('  Patterns are learned from successful agent trajectories.'));
          console.log();
          return;
        }

        const headers = ['ID', 'Type', 'Frequency', 'Success', 'Confidence'];
        const rows = patterns.map((p) => [
          p.id.substring(0, 30) + (p.id.length > 30 ? '...' : ''),
          p.type,
          String(p.frequency),
          `${(p.successRate * 100).toFixed(0)}%`,
          `${(p.confidence * 100).toFixed(0)}%`,
        ]);

        printTable(headers, rows);

        // Show top pattern details
        if (patterns.length > 0) {
          const top = patterns[0];
          console.log();
          console.log(chalk.white('  Top Pattern Details'));
          console.log(chalk.gray(`    ID: ${top.id}`));
          console.log(chalk.gray(`    Actions: ${top.actions.join(' -> ')}`));
          console.log(chalk.gray(`    Avg Duration: ${formatDuration(top.avgDuration)}`));
        }

        console.log();
      } catch (error) {
        console.error(chalk.red('Failed to show patterns:'), String(error));
        process.exit(1);
      }
    });

  // trajectory clear
  trajectory
    .command('clear')
    .description('Clear all trajectory data')
    .option('--confirm', 'Confirm clearing without prompt')
    .action(async (options) => {
      try {
        if (!options.confirm) {
          console.log(chalk.yellow('\n  Warning: This will delete all trajectory data.\n'));
          console.log(chalk.gray('  Use --confirm to proceed.'));
          console.log();
          return;
        }

        const tracker = createTrajectoryTracker();
        tracker.clear();

        console.log(chalk.green('\n  Trajectory data cleared.\n'));
      } catch (error) {
        console.error(chalk.red('Failed to clear trajectories:'), String(error));
        process.exit(1);
      }
    });

  return vector;
}

/**
 * Create a mock embedding from text
 *
 * This is a placeholder that creates deterministic pseudo-embeddings
 * based on the text content. In production, this would use an actual
 * embedding model (OpenAI, Cohere, local models, etc.)
 *
 * @param text - Text to embed
 * @param dimensions - Number of dimensions
 * @returns Mock embedding vector
 */
function createMockEmbedding(text: string, dimensions: number): number[] {
  const embedding: number[] = [];
  const normalized = text.toLowerCase().trim();

  // Simple hash-based pseudo-embedding
  for (let i = 0; i < dimensions; i++) {
    let value = 0;
    for (let j = 0; j < normalized.length; j++) {
      const charCode = normalized.charCodeAt(j);
      value += Math.sin(charCode * (i + 1) * 0.1) * Math.cos(j * 0.3);
    }
    // Normalize to [-1, 1] range
    embedding.push(Math.tanh(value / Math.max(1, normalized.length)));
  }

  // L2 normalize
  const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  return embedding.map((v) => v / (norm || 1));
}
