/**
 * Cultivate Command - Systematically enhance the knowledge graph
 *
 * This command provides cultivation tasks:
 * - Seed primitives from codebase analysis
 * - Deep analysis with claude-flow integration
 * - Graph enhancement and optimization
 *
 * @module cli/commands/cultivate
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { resolve, join, relative } from 'path';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'fs';
import { SeedGenerator } from '../../cultivation/seed-generator.js';
import { ShadowCache, loadShadowCache } from '../../core/cache.js';
import type { CultivationOptions, Ecosystem, SeedAnalysis } from '../../cultivation/types.js';

/**
 * Cultivation result
 */
interface CultivationResult {
  success: boolean;
  seed: {
    created: number;
    documents: Array<{ title: string; path: string; type: string }>;
  };
  analysis: {
    filesProcessed: number;
    dependenciesFound: number;
    servicesFound: number;
  };
  cache: {
    updated: number;
    hits: number;
    misses: number;
  };
  duration: number;
  warnings: string[];
  errors: string[];
}

/**
 * Create cultivate command
 */
export function createCultivateCommand(): Command {
  return new Command('cultivate')
    .description('Systematically cultivate and enhance the knowledge graph')
    .argument('[path]', 'Directory to cultivate (defaults to current directory)', '.')
    .option('--dry-run', 'Preview changes without executing', false)
    .option('-d, --docs <path>', 'Documentation path', 'docs')
    .option('-v, --verbose', 'Verbose output', false)
    .option('--seed', 'Bootstrap vault with primitives from codebase analysis', false)
    .option('--deep-analysis', 'Use claude-flow agents for deep analysis', false)
    .option('--cache', 'Use shadow cache for incremental updates', true)
    .option('--ecosystem <ecosystems>', 'Filter to specific ecosystems (comma-separated)', undefined)
    .option('--include-dev', 'Include dev dependencies', false)
    .option('--major-only', 'Only process major dependencies', false)
    .option('--refresh-cache', 'Force refresh the shadow cache', false)
    .action(async (targetPath: string, options: {
      dryRun?: boolean;
      docs?: string;
      verbose?: boolean;
      seed?: boolean;
      deepAnalysis?: boolean;
      cache?: boolean;
      ecosystem?: string;
      includeDev?: boolean;
      majorOnly?: boolean;
      refreshCache?: boolean;
    }) => {
      const projectRoot = resolve(targetPath);
      const docsPath = options.docs || 'docs';
      const verbose = options.verbose || false;
      const dryRun = options.dryRun || false;

      console.log(chalk.bold.green('\n🌱 Knowledge Graph Cultivator\n'));
      console.log(`  Project: ${projectRoot}`);
      console.log(`  Docs: ${docsPath}`);
      if (dryRun) {
        console.log(`  Mode: ${chalk.yellow('Dry Run')}`);
      }
      console.log('');

      // Determine tasks
      const tasks = {
        seed: options.seed || false,
        deepAnalysis: options.deepAnalysis || false,
      };

      // If no tasks selected, show help
      if (!tasks.seed && !tasks.deepAnalysis) {
        console.log(chalk.yellow('💡 No tasks selected. Use one or more of:'));
        console.log('  --seed           Bootstrap vault with primitives from codebase');
        console.log('  --deep-analysis  Use claude-flow for deep codebase analysis');
        console.log('');
        console.log(chalk.gray('Options:'));
        console.log('  --dry-run        Preview without writing files');
        console.log('  --cache          Use shadow cache for incremental updates (default: true)');
        console.log('  --refresh-cache  Force refresh the shadow cache');
        console.log('  --ecosystem      Filter to ecosystems (nodejs,python,rust,go,php,java)');
        console.log('  --include-dev    Include dev dependencies');
        console.log('  --major-only     Only process major dependencies');
        console.log('');
        console.log('Run "kg cultivate --help" for more options');
        return;
      }

      const startTime = Date.now();
      const result: CultivationResult = {
        success: true,
        seed: { created: 0, documents: [] },
        analysis: { filesProcessed: 0, dependenciesFound: 0, servicesFound: 0 },
        cache: { updated: 0, hits: 0, misses: 0 },
        duration: 0,
        warnings: [],
        errors: [],
      };

      try {
        // Initialize shadow cache
        let cache: ShadowCache | undefined;
        if (options.cache !== false) {
          console.log(chalk.cyan('📦 Initializing shadow cache...'));
          cache = await loadShadowCache(projectRoot);

          if (options.refreshCache) {
            cache.clear();
            console.log(chalk.gray('  Cache cleared (refresh mode)'));
          }

          const stats = cache.getStats();
          console.log(chalk.gray(`  Entries: ${stats.totalEntries}, Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`));
          console.log('');
        }

        // Task 1: Seed primitives
        if (tasks.seed) {
          console.log(chalk.cyan('🌱 Seeding primitives from codebase...\n'));

          // Parse ecosystem filter
          let ecosystems: Ecosystem[] | undefined;
          if (options.ecosystem) {
            ecosystems = options.ecosystem.split(',').map(e => e.trim() as Ecosystem);
            console.log(chalk.gray(`  Ecosystems: ${ecosystems.join(', ')}`));
          }

          // Create generator
          const generator = await SeedGenerator.create(projectRoot, docsPath);

          // Analyze
          console.log(chalk.gray('  Analyzing codebase...'));
          const analysis = await generator.analyze();

          result.analysis = {
            filesProcessed: analysis.metadata.filesScanned,
            dependenciesFound: analysis.dependencies.length,
            servicesFound: analysis.services.length,
          };

          // Display analysis
          console.log(`\n  ${chalk.bold('Analysis Results:')}`);
          console.log(`    Languages: ${analysis.languages.join(', ') || 'none'}`);
          console.log(`    Dependencies: ${analysis.dependencies.length}`);
          console.log(`    Frameworks: ${analysis.frameworks.length}`);
          console.log(`    Services: ${analysis.services.length}`);
          console.log(`    Deployments: ${analysis.deployments.length}`);

          if (verbose) {
            displayDetailedAnalysis(analysis);
          }

          console.log('');

          // Generate primitives
          console.log(chalk.gray('  Generating primitive nodes...'));
          const documents = await generator.generatePrimitives(analysis);

          if (dryRun) {
            console.log(`\n  ${chalk.yellow('[DRY RUN]')} Would create ${documents.length} primitives:`);
            for (const doc of documents.slice(0, 10)) {
              console.log(`    - ${doc.frontmatter.type}: ${doc.title}`);
            }
            if (documents.length > 10) {
              console.log(`    ... and ${documents.length - 10} more`);
            }
            result.seed.documents = documents.map(d => ({
              title: d.title,
              path: d.path,
              type: d.frontmatter.type || 'unknown',
            }));
          } else {
            const writeResult = await generator.writePrimitives(documents);
            result.seed.created = writeResult.documentsGenerated.length;
            result.seed.documents = writeResult.documentsGenerated;

            console.log(`\n  ${chalk.green('✓')} Created ${writeResult.documentsGenerated.length} primitives`);

            if (writeResult.warnings.length > 0) {
              result.warnings.push(...writeResult.warnings);
              if (verbose) {
                console.log(chalk.yellow(`  Warnings: ${writeResult.warnings.length}`));
              }
            }

            if (writeResult.errors.length > 0) {
              result.errors.push(...writeResult.errors);
              console.log(chalk.red(`  Errors: ${writeResult.errors.length}`));
            }
          }

          console.log('');
        }

        // Task 2: Deep Analysis with claude-flow
        if (tasks.deepAnalysis) {
          console.log(chalk.cyan('🧠 Running deep analysis with claude-flow...\n'));

          // Check if claude-flow is available
          const hasClaudeFlow = await checkClaudeFlowAvailable();

          if (!hasClaudeFlow) {
            console.log(chalk.yellow('  ⚠️  claude-flow not available'));
            console.log(chalk.gray('  Install with: npm install -g claude-flow@alpha'));
            result.warnings.push('claude-flow not available for deep analysis');
          } else {
            if (dryRun) {
              console.log(chalk.yellow('  [DRY RUN] Would spawn claude-flow agents:'));
              console.log('    - Researcher: Analyze codebase patterns');
              console.log('    - Analyst: Identify architectural decisions');
              console.log('    - Coder: Detect implementation patterns');
              console.log('    - Tester: Analyze testing coverage');
            } else {
              // Import and run DeepAnalyzer
              try {
                const { DeepAnalyzer } = await import('../../cultivation/deep-analyzer.js');
                const analyzer = new DeepAnalyzer({
                  projectRoot,
                  docsPath,
                  verbose,
                });

                const deepResult = await analyzer.analyze();

                console.log(`  ${chalk.green('✓')} Deep analysis complete`);
                console.log(`    Agents spawned: ${deepResult.agentsSpawned}`);
                console.log(`    Insights generated: ${deepResult.insightsCount}`);
                console.log(`    Documentation created: ${deepResult.documentsCreated}`);
              } catch (error) {
                result.errors.push(`Deep analysis failed: ${error instanceof Error ? error.message : String(error)}`);
                console.log(chalk.red(`  ✗ Deep analysis failed: ${error instanceof Error ? error.message : String(error)}`));
              }
            }
          }

          console.log('');
        }

        // Update cache
        if (cache) {
          const stats = cache.getStats();
          result.cache = {
            updated: stats.totalEntries,
            hits: stats.hitCount,
            misses: stats.missCount,
          };

          await cache.save();
        }

        result.duration = Date.now() - startTime;
        result.success = result.errors.length === 0;

        // Final summary
        displaySummary(result, dryRun);

      } catch (error) {
        console.error(chalk.red('\n❌ Cultivation failed:'), error);
        process.exit(1);
      }
    });
}

/**
 * Display detailed analysis output
 */
function displayDetailedAnalysis(analysis: SeedAnalysis): void {
  if (analysis.frameworks.length > 0) {
    console.log(`\n    ${chalk.gray('Frameworks:')}`);
    for (const fw of analysis.frameworks) {
      console.log(`      - ${fw.name} (${fw.ecosystem}) v${fw.version}`);
    }
  }

  if (analysis.services.length > 0) {
    console.log(`\n    ${chalk.gray('Services:')}`);
    for (const svc of analysis.services) {
      console.log(`      - ${svc.name}: ${svc.type} (${svc.technology})`);
    }
  }

  if (analysis.deployments.length > 0) {
    console.log(`\n    ${chalk.gray('Deployments:')}`);
    for (const dep of analysis.deployments) {
      console.log(`      - ${dep}`);
    }
  }
}

/**
 * Display cultivation summary
 */
function displaySummary(result: CultivationResult, dryRun: boolean): void {
  console.log(chalk.bold.blue('📊 Cultivation Summary\n'));

  if (dryRun) {
    console.log(chalk.yellow('[DRY RUN] No changes were made\n'));
  }

  console.log('  Analysis:');
  console.log(`    Files processed: ${result.analysis.filesProcessed}`);
  console.log(`    Dependencies: ${result.analysis.dependenciesFound}`);
  console.log(`    Services: ${result.analysis.servicesFound}`);

  if (result.seed.created > 0 || result.seed.documents.length > 0) {
    console.log('\n  Seed:');
    console.log(`    Primitives ${dryRun ? 'would create' : 'created'}: ${dryRun ? result.seed.documents.length : result.seed.created}`);
  }

  if (result.cache.updated > 0) {
    console.log('\n  Cache:');
    console.log(`    Entries: ${result.cache.updated}`);
    const hitRate = result.cache.hits + result.cache.misses > 0
      ? (result.cache.hits / (result.cache.hits + result.cache.misses) * 100).toFixed(1)
      : 0;
    console.log(`    Hit rate: ${hitRate}%`);
  }

  console.log(`\n  Duration: ${(result.duration / 1000).toFixed(2)}s`);

  if (result.warnings.length > 0) {
    console.log(chalk.yellow(`\n  ⚠️  Warnings: ${result.warnings.length}`));
    for (const warning of result.warnings.slice(0, 5)) {
      console.log(chalk.gray(`    - ${warning}`));
    }
  }

  if (result.errors.length > 0) {
    console.log(chalk.red(`\n  ❌ Errors: ${result.errors.length}`));
    for (const error of result.errors.slice(0, 5)) {
      console.log(chalk.gray(`    - ${error}`));
    }
  }

  if (result.success && !dryRun) {
    console.log(chalk.bold.green('\n✨ Cultivation complete!\n'));
  } else if (!result.success) {
    console.log(chalk.yellow('\n⚠️  Cultivation completed with errors\n'));
  } else {
    console.log(chalk.gray('\nRun without --dry-run to apply changes\n'));
  }
}

/**
 * Check if claude-flow is available
 */
async function checkClaudeFlowAvailable(): Promise<boolean> {
  try {
    const { execSync } = await import('child_process');
    execSync('npx claude-flow@alpha --version', { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
