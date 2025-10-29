/**
 * Perceive Command - Multi-source information gathering
 *
 * Usage: weaver perceive "query" [options]
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { PerceptionManager } from '../../perception/perception-manager.js';
import type { PerceptionConfig, PerceptionRequest } from '../../perception/types.js';

export function createPerceiveCommand(): Command {
  const command = new Command('perceive')
    .description('Gather information from multiple sources')
    .argument('<query>', 'Query or question')
    .option('-s, --sources <sources>', 'Comma-separated sources (web,search)', 'search')
    .option('-m, --max-results <number>', 'Maximum results', '10')
    .option('--urls <urls>', 'Comma-separated URLs to scrape (for web source)')
    .option('--domains <domains>', 'Comma-separated domains to filter')
    .option('-v, --verbose', 'Verbose output with full content')
    .option('--json', 'Output as JSON')
    .action(async (query: string, options) => {
      const spinner = ora('Initializing perception...').start();

      try {
        // Parse sources
        const sources = options.sources.split(',').map((s: string) => s.trim());

        // Configure perception
        const config: PerceptionConfig = {
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
            extractImages: true,
            extractLinks: true,
            maxContentLength: 50000,
            preserveMarkdown: true,
          },
        };

        // Initialize perception manager
        spinner.text = 'Setting up perception manager...';
        const manager = new PerceptionManager(config);

        // Build request
        const request: PerceptionRequest = {
          query,
          sources: sources as ('web' | 'search')[],
          maxResults: parseInt(options.maxResults),
          context: options.urls
            ? { urls: options.urls.split(',').map((u: string) => u.trim()) }
            : undefined,
          filters: options.domains
            ? { domains: options.domains.split(',').map((d: string) => d.trim()) }
            : undefined,
        };

        // Execute perception
        spinner.text = 'Gathering information...';
        const result = await manager.perceive(request);

        spinner.succeed('Perception completed');

        // Output results
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log('\n' + chalk.bold.blue('=== Perception Results ===\n'));

          // Summary
          console.log(chalk.bold.cyan('📊 Summary:'));
          console.log(`  Query: "${query}"`);
          console.log(`  Total results: ${result.totalResults}`);
          console.log(`  Processing time: ${result.processingTime}ms`);
          console.log(
            `  Average relevance: ${(result.metadata.averageRelevance || 0).toFixed(2)}`
          );
          console.log(`  Successful sources: ${result.metadata.successfulSources}`);
          console.log(`  Failed sources: ${result.metadata.failedSources}`);

          // Sources
          if (result.sources.length > 0) {
            console.log('\n' + chalk.bold.cyan('📚 Sources:\n'));

            result.sources.forEach((source, i) => {
              console.log(`${chalk.bold(`${i + 1}.`)} ${chalk.bold(source.title)}`);
              console.log(`   ${chalk.gray(source.url)}`);
              console.log(`   Type: ${source.type} | Provider: ${source.provider}`);
              console.log(`   Relevance: ${(source.relevanceScore || 0).toFixed(2)}`);
              console.log(`   Word count: ${source.metadata.wordCount}`);

              if (source.snippet) {
                console.log(`   ${chalk.italic(source.snippet.substring(0, 150))}...`);
              }

              if (options.verbose) {
                console.log(`\n   ${chalk.dim('Content:')}`);
                console.log(
                  `   ${source.content.substring(0, 500).split('\n').join('\n   ')}...`
                );

                if (source.links && source.links.length > 0) {
                  console.log(`\n   ${chalk.dim('Links:')} ${source.links.length} found`);
                }

                if (source.images && source.images.length > 0) {
                  console.log(`   ${chalk.dim('Images:')} ${source.images.length} found`);
                }
              }

              console.log('');
            });
          } else {
            console.log('\n' + chalk.yellow('No sources found'));
          }

          // Errors
          if (result.metadata.errors && result.metadata.errors.length > 0) {
            console.log(chalk.bold.yellow('\n⚠️  Errors:'));
            result.metadata.errors.forEach(err => {
              console.log(`  ${err.source}: ${err.error}`);
              console.log(`  Recoverable: ${err.recoverable ? 'Yes' : 'No'}`);
            });
          }

          // Cache stats
          const cacheStats = manager.getCacheStats();
          console.log('\n' + chalk.bold.cyan('💾 Cache:'));
          console.log(`  Entries: ${cacheStats.entries} / ${cacheStats.size}`);
        }

        // Cleanup
        await manager.cleanup();

        console.log('\n' + chalk.green('✓ Perception complete'));
      } catch (error) {
        spinner.fail('Perception failed');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return command;
}
