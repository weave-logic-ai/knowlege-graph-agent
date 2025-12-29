/**
 * Analyze Command
 *
 * Advanced documentation analyzer using claude-flow for deep analysis
 * and creating proper knowledge graph documentation structure.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { join } from 'path';
import { analyzeDocs } from '../../generators/docs-analyzer.js';
import { validateProjectRoot } from '../../core/security.js';

/**
 * Create analyze command
 */
export function createAnalyzeCommand(): Command {
  const command = new Command('analyze');

  command
    .description('Analyze and migrate docs to knowledge graph structure')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('-s, --source <dir>', 'Source docs directory', 'docs')
    .option('-t, --target <dir>', 'Target directory', 'docs-nn')
    .option('--use-claude-flow', 'Use claude-flow for deep analysis')
    .option('--no-moc', 'Skip MOC (Map of Content) generation')
    .option('--no-link-original', 'Do not link back to original docs')
    .option('--max-depth <n>', 'Maximum analysis depth', '3')
    .option('--dry-run', 'Show what would be done without making changes')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options) => {
      const spinner = ora('Analyzing documentation...').start();

      try {
        const projectRoot = validateProjectRoot(options.path);
        const sourceDir = options.source;
        const targetDir = options.target;

        // Check source exists
        if (!existsSync(join(projectRoot, sourceDir))) {
          spinner.fail(`Source directory not found: ${sourceDir}`);
          console.log(chalk.gray('  Specify source with --source <dir>'));
          process.exit(1);
        }

        // Check if target already exists
        if (existsSync(join(projectRoot, targetDir)) && !options.dryRun) {
          spinner.warn(`Target directory exists: ${targetDir}`);
          console.log(chalk.yellow('  Files may be overwritten. Use --dry-run to preview.'));
        }

        if (options.dryRun) {
          spinner.text = 'Analyzing documentation (dry run)...';
        }

        if (options.useClaudeFlow) {
          spinner.text = 'Analyzing with claude-flow (deep analysis)...';
        }

        const result = await analyzeDocs({
          sourceDir,
          targetDir,
          projectRoot,
          useClaudeFlow: options.useClaudeFlow,
          createMOC: options.moc !== false,
          linkOriginal: options.linkOriginal !== false,
          maxDepth: parseInt(options.maxDepth, 10),
          dryRun: options.dryRun,
          verbose: options.verbose,
        });

        if (result.success) {
          if (options.dryRun) {
            spinner.succeed('Dry run complete!');
          } else {
            spinner.succeed('Documentation analyzed and migrated!');
          }
        } else {
          spinner.warn('Analysis completed with errors');
        }

        // Display results
        console.log();
        console.log(chalk.cyan.bold('  Analysis Results'));
        console.log(chalk.gray('  ─────────────────────────────────────'));
        console.log();
        console.log(chalk.white('  Summary:'));
        console.log(chalk.gray(`    Source:          ${sourceDir}/`));
        console.log(chalk.gray(`    Target:          ${targetDir}/`));
        console.log(chalk.green(`    Files analyzed:  ${result.filesAnalyzed}`));
        console.log(chalk.green(`    Files created:   ${result.filesCreated}`));
        console.log(chalk.blue(`    MOC files:       ${result.mocFilesCreated}`));

        // Category breakdown
        if (result.structure.size > 0) {
          console.log();
          console.log(chalk.white('  Categories:'));
          for (const [category, docs] of result.structure) {
            console.log(chalk.cyan(`    ${category.padEnd(15)}`), chalk.gray(`${docs.length} docs`));
          }
        }

        // Show sample analyzed documents
        if (result.analyzed.length > 0 && options.verbose) {
          console.log();
          console.log(chalk.white('  Sample documents:'));
          result.analyzed.slice(0, 5).forEach(doc => {
            console.log(chalk.gray(`    ${doc.originalPath}`));
            console.log(chalk.cyan(`      → ${doc.newPath}`) + chalk.gray(` [${doc.type}]`));
            if (doc.tags.length > 0) {
              console.log(chalk.gray(`        tags: ${doc.tags.slice(0, 5).map(t => `#${t}`).join(' ')}`));
            }
          });
          if (result.analyzed.length > 5) {
            console.log(chalk.gray(`    ... and ${result.analyzed.length - 5} more`));
          }
        }

        // Show errors
        if (result.errors.length > 0) {
          console.log();
          console.log(chalk.red('  Errors:'));
          result.errors.slice(0, 5).forEach(err => {
            console.log(chalk.gray(`    - ${err}`));
          });
          if (result.errors.length > 5) {
            console.log(chalk.gray(`    ... and ${result.errors.length - 5} more`));
          }
        }

        // Research needed summary
        const researchDocs = result.analyzed.filter(d => d.researchNeeded.length > 0);
        const todoDocs = result.analyzed.filter(d => d.todos.length > 0);

        if (researchDocs.length > 0 || todoDocs.length > 0) {
          console.log();
          console.log(chalk.yellow('  Attention Needed:'));
          if (researchDocs.length > 0) {
            console.log(chalk.yellow(`    📚 ${researchDocs.length} docs need research`));
          }
          if (todoDocs.length > 0) {
            console.log(chalk.yellow(`    ✏️  ${todoDocs.length} docs have TODOs`));
          }
        }

        // Next steps
        if (!options.dryRun && result.filesCreated > 0) {
          console.log();
          console.log(chalk.cyan('  Next steps:'));
          console.log(chalk.white(`    1. Review ${targetDir}/MOC.md (Master Index)`));
          console.log(chalk.white(`    2. Check ${targetDir}/PRIMITIVES.md`));
          console.log(chalk.white(`    3. Run: kg graph --docs ${targetDir}`));
          console.log(chalk.white(`    4. Run: kg stats --docs ${targetDir}`));
          if (researchDocs.length > 0) {
            console.log(chalk.white(`    5. Address research items in flagged docs`));
          }
        }

        console.log();

      } catch (error) {
        spinner.fail('Analysis failed');
        console.error(chalk.red(String(error)));
        process.exit(1);
      }
    });

  // Deep analyze subcommand (uses claude-flow agents)
  command
    .command('deep')
    .description('Deep analysis using claude-flow agents for comprehensive knowledge extraction')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('-s, --source <dir>', 'Source docs directory', 'docs')
    .option('-t, --target <dir>', 'Target directory', 'docs-nn')
    .option('--agents <n>', 'Number of parallel agents', '3')
    .action(async (options) => {
      const spinner = ora('Initializing deep analysis with claude-flow...').start();

      try {
        const projectRoot = validateProjectRoot(options.path);
        const sourceDir = options.source;
        const targetDir = options.target;

        // Check source exists
        if (!existsSync(join(projectRoot, sourceDir))) {
          spinner.fail(`Source directory not found: ${sourceDir}`);
          process.exit(1);
        }

        spinner.text = 'Running claude-flow deep analysis...';

        // Run deep analysis with claude-flow
        const result = await analyzeDocs({
          sourceDir,
          targetDir,
          projectRoot,
          useClaudeFlow: true,
          createMOC: true,
          linkOriginal: true,
          maxDepth: 5,
          dryRun: false,
          verbose: true,
        });

        if (result.success) {
          spinner.succeed('Deep analysis complete!');
        } else {
          spinner.warn('Deep analysis completed with some errors');
        }

        console.log();
        console.log(chalk.cyan.bold('  Deep Analysis Results'));
        console.log(chalk.gray('  ─────────────────────────────────────'));
        console.log(chalk.green(`    Documents analyzed:  ${result.filesAnalyzed}`));
        console.log(chalk.green(`    Knowledge docs:      ${result.filesCreated}`));
        console.log(chalk.blue(`    Index files (MOC):   ${result.mocFilesCreated}`));
        console.log(chalk.gray(`    Categories:          ${result.structure.size}`));

        // Research summary
        const totalResearch = result.analyzed.reduce((sum, d) => sum + d.researchNeeded.length, 0);
        const totalTodos = result.analyzed.reduce((sum, d) => sum + d.todos.length, 0);

        console.log();
        console.log(chalk.white('  Knowledge extraction:'));
        console.log(chalk.cyan(`    Research areas:  ${totalResearch}`));
        console.log(chalk.cyan(`    TODOs found:     ${totalTodos}`));
        console.log(chalk.cyan(`    Concepts:        ${result.analyzed.reduce((sum, d) => sum + d.concepts.length, 0)}`));
        console.log(chalk.cyan(`    Cross-refs:      ${result.analyzed.reduce((sum, d) => sum + d.related.length, 0)}`));

        console.log();
        console.log(chalk.white(`  Output: ${targetDir}/`));
        console.log(chalk.gray(`    MOC.md           Master index`));
        console.log(chalk.gray(`    PRIMITIVES.md    Core building blocks`));
        console.log(chalk.gray(`    */\_MOC.md        Category indexes`));
        console.log();

      } catch (error) {
        spinner.fail('Deep analysis failed');
        console.error(chalk.red(String(error)));
        process.exit(1);
      }
    });

  // Report subcommand
  command
    .command('report')
    .description('Generate analysis report without creating files')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('-s, --source <dir>', 'Source docs directory', 'docs')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Generating analysis report...').start();

      try {
        const projectRoot = validateProjectRoot(options.path);
        const sourceDir = options.source;

        if (!existsSync(join(projectRoot, sourceDir))) {
          spinner.fail(`Source directory not found: ${sourceDir}`);
          process.exit(1);
        }

        const result = await analyzeDocs({
          sourceDir,
          targetDir: 'docs-nn',
          projectRoot,
          useClaudeFlow: false,
          createMOC: false,
          linkOriginal: false,
          dryRun: true,
          verbose: false,
        });

        spinner.succeed('Report generated!');

        if (options.json) {
          // JSON output
          const report = {
            summary: {
              totalDocs: result.filesAnalyzed,
              categories: Object.fromEntries(result.structure),
            },
            documents: result.analyzed.map(d => ({
              original: d.originalPath,
              target: d.newPath,
              type: d.type,
              category: d.category,
              tags: d.tags,
              concepts: d.concepts,
              researchNeeded: d.researchNeeded,
              todos: d.todos,
            })),
            researchAreas: result.analyzed
              .flatMap(d => d.researchNeeded.map(r => ({ doc: d.title, area: r }))),
            todos: result.analyzed
              .flatMap(d => d.todos.map(t => ({ doc: d.title, todo: t }))),
          };
          console.log(JSON.stringify(report, null, 2));
        } else {
          // Human-readable output
          console.log();
          console.log(chalk.cyan.bold('  Documentation Analysis Report'));
          console.log(chalk.gray('  ─────────────────────────────────────'));
          console.log();
          console.log(chalk.white(`  Total documents: ${result.filesAnalyzed}`));
          console.log();

          // Type breakdown
          const byType = new Map<string, number>();
          result.analyzed.forEach(d => {
            byType.set(d.type, (byType.get(d.type) || 0) + 1);
          });

          console.log(chalk.white('  By Type:'));
          for (const [type, count] of byType) {
            const bar = '█'.repeat(Math.ceil(count / result.filesAnalyzed * 20));
            console.log(chalk.cyan(`    ${type.padEnd(12)} ${bar} ${count}`));
          }
          console.log();

          // Category breakdown
          console.log(chalk.white('  By Category:'));
          for (const [category, docs] of result.structure) {
            const bar = '█'.repeat(Math.ceil(docs.length / result.filesAnalyzed * 20));
            console.log(chalk.cyan(`    ${category.padEnd(12)} ${bar} ${docs.length}`));
          }
          console.log();

          // Issues
          const withResearch = result.analyzed.filter(d => d.researchNeeded.length > 0);
          const withTodos = result.analyzed.filter(d => d.todos.length > 0);

          console.log(chalk.white('  Areas Needing Attention:'));
          console.log(chalk.yellow(`    📚 Research needed:   ${withResearch.length} docs`));
          console.log(chalk.yellow(`    ✏️  With TODOs:        ${withTodos.length} docs`));
          console.log();

          // Top research areas
          if (withResearch.length > 0) {
            console.log(chalk.white('  Top Research Areas:'));
            withResearch.slice(0, 5).forEach(d => {
              console.log(chalk.gray(`    ${d.title}:`));
              d.researchNeeded.slice(0, 2).forEach(r => {
                console.log(chalk.yellow(`      - ${r.slice(0, 60)}...`));
              });
            });
            console.log();
          }

          console.log(chalk.cyan('  Run `kg analyze` to migrate documentation'));
          console.log();
        }

      } catch (error) {
        spinner.fail('Report generation failed');
        console.error(chalk.red(String(error)));
        process.exit(1);
      }
    });

  return command;
}
