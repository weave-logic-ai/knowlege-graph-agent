/**
 * Learn Command - Execute autonomous learning loop
 *
 * Usage: weaver learn "query" [options]
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { PerceptionManager } from '../../perception/perception-manager.js';
import { LearningOrchestrator } from '../../learning-loop/learning-orchestrator.js';
import type { PerceptionConfig } from '../../perception/types.js';

export function createLearnCommand(): Command {
  const command = new Command('learn')
    .description('Execute autonomous learning loop with perception and reasoning')
    .argument('<query>', 'Query or question to learn about')
    .option('-s, --sources <sources>', 'Comma-separated sources (web,search)', 'search')
    .option('-m, --max-results <number>', 'Maximum results per source', '10')
    .option('--no-perception', 'Disable perception pillar')
    .option('--no-reasoning', 'Disable reasoning pillar')
    .option('--no-memory', 'Disable memory pillar')
    .option('--no-execution', 'Disable execution pillar')
    .option('-v, --verbose', 'Verbose output')
    .action(async (query: string, options) => {
      const spinner = ora('Initializing learning loop...').start();

      try {
        // Parse sources
        const sources = options.sources.split(',').map((s: string) => s.trim());

        // Configure perception
        const perceptionConfig: PerceptionConfig = {
          webScraper: {
            enabled: sources.includes('web'),
            timeout: 30000,
            retries: 3,
            headless: true,
          },
          searchAPI: {
            enabled: sources.includes('search'),
            providers: [
              { name: 'duckduckgo', enabled: true, priority: 1 },
              {
                name: 'google',
                apiKey: process.env.GOOGLE_API_KEY,
                enabled: !!process.env.GOOGLE_API_KEY,
                priority: 2,
              },
              {
                name: 'bing',
                apiKey: process.env.BING_API_KEY,
                enabled: !!process.env.BING_API_KEY,
                priority: 3,
              },
            ],
            maxResults: parseInt(options.maxResults),
          },
          contentProcessor: {
            extractImages: false,
            extractLinks: true,
            maxContentLength: 10000,
            preserveMarkdown: false,
          },
        };

        // Initialize components
        spinner.text = 'Initializing perception manager...';
        const perceptionManager = new PerceptionManager(perceptionConfig);

        spinner.text = 'Initializing learning orchestrator...';
        const orchestrator = new LearningOrchestrator(perceptionManager, {
          enablePerception: options.perception !== false,
          enableReasoning: options.reasoning !== false,
          enableMemory: options.memory !== false,
          enableExecution: options.execution !== false,
        });

        // Execute learning loop
        spinner.text = 'Executing learning loop...';
        const result = await orchestrator.learn({
          query,
          goals: ['Learn comprehensively', 'Extract actionable insights'],
        });

        spinner.succeed('Learning loop completed');

        // Display results
        console.log('\n' + chalk.bold.blue('=== Learning Results ===\n'));

        // Perception
        if (options.perception !== false) {
          console.log(chalk.bold.cyan('📡 Perception:'));
          console.log(`  Sources gathered: ${result.perception.totalResults}`);
          console.log(
            `  Average relevance: ${(result.perception.metadata.averageRelevance || 0).toFixed(2)}`
          );
          console.log(`  Processing time: ${result.perception.processingTime}ms`);

          if (options.verbose && result.perception.sources.length > 0) {
            console.log('\n  Top sources:');
            result.perception.sources.slice(0, 3).forEach((source, i) => {
              console.log(`    ${i + 1}. ${source.title}`);
              console.log(`       ${chalk.gray(source.url)}`);
              console.log(`       Relevance: ${(source.relevanceScore || 0).toFixed(2)}`);
            });
          }
        }

        // Reasoning
        if (options.reasoning !== false) {
          console.log('\n' + chalk.bold.cyan('🧠 Reasoning:'));
          console.log(`  Insights: ${result.reasoning.insights.length}`);
          console.log(`  Patterns: ${result.reasoning.patterns.length}`);
          console.log(`  Confidence: ${result.reasoning.confidence.toFixed(2)}`);

          if (result.reasoning.insights.length > 0) {
            console.log('\n  Key insights:');
            result.reasoning.insights.forEach((insight, i) => {
              console.log(`    ${i + 1}. ${insight}`);
            });
          }
        }

        // Memory
        if (options.memory !== false) {
          console.log('\n' + chalk.bold.cyan('💾 Memory:'));
          console.log(`  Chunks stored: ${result.memory.totalChunks}`);
          console.log(`  Embedding model: ${result.memory.embeddingModel}`);
        }

        // Execution
        if (options.execution !== false) {
          console.log('\n' + chalk.bold.cyan('⚡ Execution:'));
          console.log(`  Actions generated: ${result.execution.actions.length}`);
          console.log(`  Confidence: ${result.execution.confidence.toFixed(2)}`);

          if (result.execution.response) {
            console.log('\n' + chalk.bold('Response:'));
            console.log(result.execution.response);
          }

          if (options.verbose && result.execution.actions.length > 0) {
            console.log('\n  Recommended actions:');
            result.execution.actions.forEach((action, i) => {
              console.log(`    ${i + 1}. ${action.description}`);
              console.log(`       Priority: ${action.priority}`);
            });
          }
        }

        // Metadata
        console.log('\n' + chalk.bold.cyan('📊 Metadata:'));
        console.log(`  Total processing time: ${result.metadata.processingTime}ms`);
        console.log(`  Overall confidence: ${result.metadata.confidence.toFixed(2)}`);

        if (result.metadata.learningSignals.length > 0) {
          console.log(`  Learning signals: ${result.metadata.learningSignals.join(', ')}`);
        }

        // Cleanup
        await perceptionManager.cleanup();

        console.log('\n' + chalk.green('✓ Learning complete'));
      } catch (error) {
        spinner.fail('Learning failed');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return command;
}
