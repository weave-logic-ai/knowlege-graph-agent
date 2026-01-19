/**
 * Docs Command
 *
 * Initialize and manage documentation directory.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';
import { initDocs, docsExist, getDocsPath } from '../../generators/docs-init.js';
import { generateDocsWithAgents } from '../../generators/doc-generator-agents.js';
import { cultivateDocs } from '../../generators/doc-cultivator.js';
import { validateProjectRoot, validateDocsPath } from '../../core/security.js';

/**
 * Create docs command
 */
export function createDocsCommand(): Command {
  const command = new Command('docs');

  command
    .description('Documentation management commands');

  // Init subcommand
  command
    .command('init')
    .description('Initialize documentation directory with weave-nn structure')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('-d, --docs <path>', 'Docs directory path', 'docs')
    .option('-t, --template <template>', 'Template to use (default, minimal)')
    .option('--no-examples', 'Skip example files')
    .option('--no-detect', 'Skip framework detection')
    .option('-f, --force', 'Overwrite existing files')
    .option('-g, --generate', 'Generate documents using expert agents')
    .option('--parallel', 'Run agent generation in parallel')
    .option('--dry-run', 'Show what would be generated without creating files')
    .option('-v, --verbose', 'Show detailed agent output')
    .option('--force-generate', 'Force regenerate documents even if they exist')
    .action(async (options) => {
      const spinner = ora('Initializing documentation...').start();

      try {
        // Validate paths to prevent traversal attacks
        const projectRoot = validateProjectRoot(options.path);
        const docsPath = options.docs;
        validateDocsPath(projectRoot, docsPath); // Ensure docs stays within project

        // Note: initDocs is additive - it only creates missing files/directories
        // The --force flag is for overwriting existing files if needed in the future
        const isExisting = docsExist(projectRoot, docsPath);
        if (isExisting) {
          spinner.text = 'Adding missing files to existing documentation...';
        }

        const result = await initDocs({
          projectRoot,
          docsPath,
          includeExamples: options.examples !== false,
          detectFramework: options.detect !== false,
        });

        if (result.success) {
          if (isExisting && result.filesCreated.length === 0) {
            spinner.succeed('Documentation already complete - no new files needed');
          } else if (isExisting) {
            spinner.succeed(`Documentation updated - added ${result.filesCreated.length} missing files`);
          } else {
            spinner.succeed('Documentation initialized!');
          }
        } else {
          spinner.warn('Documentation initialized with errors');
        }

        console.log();
        console.log(chalk.white('  Created:'));
        console.log(chalk.gray(`    Path: ${result.docsPath}`));
        console.log(chalk.green(`    Files: ${result.filesCreated.length}`));

        if (result.errors.length > 0) {
          console.log();
          console.log(chalk.yellow('  Errors:'));
          result.errors.forEach(err => {
            console.log(chalk.gray(`    - ${err}`));
          });
        }

        console.log();
        console.log(chalk.cyan('Structure created:'));
        console.log(chalk.gray(`
    ${docsPath}/
    ├── README.md           # Documentation home
    ├── PRIMITIVES.md       # Technology primitives
    ├── MOC.md              # Map of Content
    ├── concepts/           # Abstract concepts
    ├── components/         # Reusable components
    ├── services/           # Backend services
    ├── features/           # Product features
    ├── integrations/       # External integrations
    ├── standards/          # Coding standards
    ├── guides/             # How-to guides
    └── references/         # API references
        `));

        // Run agent generation if requested
        if (options.generate) {
          console.log();
          const genSpinner = ora('Analyzing project and generating documents with expert agents...').start();

          try {
            const genResult = await generateDocsWithAgents(projectRoot, result.docsPath, {
              parallel: options.parallel,
              dryRun: options.dryRun,
              verbose: options.verbose,
              force: options.forceGenerate,
            });

            if (options.dryRun) {
              genSpinner.info('Dry run complete - no files created');
            } else if (genResult.success) {
              genSpinner.succeed(`Generated ${genResult.documentsGenerated.filter(d => d.generated).length} documents using ${genResult.agentsSpawned} agents`);
            } else {
              genSpinner.warn(`Generated ${genResult.documentsGenerated.filter(d => d.generated).length} documents with ${genResult.errors.length} errors`);
            }

            if (genResult.documentsGenerated.length > 0 && !options.dryRun) {
              console.log();
              console.log(chalk.white('  Generated Documents:'));
              for (const doc of genResult.documentsGenerated) {
                const icon = doc.generated ? chalk.green('✓') : chalk.red('✗');
                console.log(`    ${icon} ${doc.path}${doc.error ? chalk.gray(` (${doc.error})`) : ''}`);
              }
            }

            if (genResult.errors.length > 0 && !options.dryRun) {
              console.log();
              console.log(chalk.yellow('  Agent Errors:'));
              genResult.errors.forEach(err => {
                console.log(chalk.gray(`    - ${err}`));
              });
            }
          } catch (genError) {
            genSpinner.fail('Agent generation failed');
            console.error(chalk.red(String(genError)));
          }
        }

        console.log();
        console.log(chalk.cyan('Next: ') + chalk.white('kg graph') + chalk.gray(' to generate knowledge graph'));
        console.log();

      } catch (error) {
        spinner.fail('Failed to initialize documentation');
        console.error(chalk.red(String(error)));
        process.exit(1);
      }
    });

  // Status subcommand
  command
    .command('status')
    .description('Show documentation status')
    .option('-p, --path <path>', 'Project root path', '.')
    .action(async (options) => {
      // Validate path to prevent traversal
      const projectRoot = validateProjectRoot(options.path);
      const docsPath = getDocsPath(projectRoot);

      if (!docsPath) {
        console.log(chalk.yellow('  No documentation directory found'));
        console.log(chalk.gray('  Run ') + chalk.cyan('kg docs init') + chalk.gray(' to create one'));
        return;
      }

      console.log(chalk.white('\n  Documentation Status\n'));
      console.log(chalk.gray('  Path:'), chalk.white(docsPath));
      console.log();

      // Count files
      const fg = await import('fast-glob');
      const files = await fg.default('**/*.md', {
        cwd: docsPath,
        ignore: ['node_modules/**', '.git/**'],
      });

      console.log(chalk.gray('  Markdown files:'), chalk.white(files.length));

      // Check for key files
      const keyFiles = ['README.md', 'PRIMITIVES.md', 'MOC.md'];
      const fs = await import('fs');
      const path = await import('path');

      console.log();
      console.log(chalk.white('  Key Files:'));
      keyFiles.forEach(file => {
        const exists = fs.existsSync(path.join(docsPath, file));
        const icon = exists ? chalk.green('✓') : chalk.red('✗');
        console.log(`    ${icon} ${file}`);
      });

      // Check directories
      const dirs = ['concepts', 'components', 'services', 'features', 'guides'];
      console.log();
      console.log(chalk.white('  Directories:'));
      dirs.forEach(dir => {
        const exists = fs.existsSync(path.join(docsPath, dir));
        const icon = exists ? chalk.green('✓') : chalk.gray('○');
        console.log(`    ${icon} ${dir}/`);
      });

      console.log();
    });

  // Cultivate subcommand - long-running swarm-based documentation buildout
  command
    .command('cultivate')
    .description('Recursively build out all documentation using claude-flow swarm')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('-d, --docs <path>', 'Docs directory path', 'docs')
    .option('--dry-run', 'Show what would be generated without creating files')
    .option('-v, --verbose', 'Show detailed output')
    .option('-f, --force', 'Force regenerate all documents')
    .option('--no-dev-plan', 'Skip development plan generation')
    .option('--no-infra-plan', 'Skip infrastructure plan generation')
    .option('--include-sops', 'Include SOP compliance analysis')
    .option('--services <services>', 'Comma-separated list of services to analyze')
    .option('--max-agents <number>', 'Maximum concurrent agents', '4')
    .option('--background', 'Run in background mode')
    .action(async (options) => {
      const projectRoot = validateProjectRoot(options.path);
      const docsPath = options.docs;
      validateDocsPath(projectRoot, docsPath);

      console.log();
      console.log(chalk.cyan.bold('  Documentation Cultivation'));
      console.log(chalk.gray('  ─────────────────────────────'));
      console.log();

      if (options.dryRun) {
        console.log(chalk.yellow('  [Dry Run Mode]'));
        console.log();
      }

      const spinner = ora('Starting documentation cultivation...').start();

      try {
        const result = await cultivateDocs(
          projectRoot,
          join(projectRoot, docsPath),
          {
            dryRun: options.dryRun,
            verbose: options.verbose,
            force: options.force,
            generateDevPlan: options.devPlan !== false,
            generateInfraPlan: options.infraPlan !== false,
            includeSops: options.includeSops,
            services: options.services?.split(',').map((s: string) => s.trim()),
            maxAgents: parseInt(options.maxAgents, 10),
            background: options.background,
          }
        );

        if (options.dryRun) {
          spinner.info('Dry run complete');
        } else if (result.success) {
          spinner.succeed('Documentation cultivation complete!');
        } else {
          spinner.warn('Cultivation completed with errors');
        }

        // Display results
        console.log();
        console.log(chalk.white('  Services Analyzed:'));
        for (const service of result.services) {
          console.log(chalk.gray(`    • ${service.name} (${service.type}) - ${service.sourceFiles.length} files`));
        }

        if (!options.dryRun) {
          console.log();
          console.log(chalk.white('  Documents Generated:'), chalk.green(result.documentsGenerated.length));
          if (result.documentsGenerated.length > 0 && options.verbose) {
            for (const doc of result.documentsGenerated) {
              console.log(chalk.gray(`    ✓ ${doc}`));
            }
          }

          if (result.developmentPlan) {
            console.log();
            console.log(chalk.white('  Development Plan:'));
            console.log(chalk.gray(`    Phases: ${result.developmentPlan.phases.length}`));
            console.log(chalk.gray(`    Total Estimate: ${result.developmentPlan.totalEstimate}`));
            for (const phase of result.developmentPlan.phases) {
              console.log(chalk.gray(`    • ${phase.name} (${phase.estimatedEffort})`));
            }
          }

          if (result.infrastructurePlan) {
            console.log();
            console.log(chalk.white('  Infrastructure Plan:'));
            console.log(chalk.gray(`    Environments: ${result.infrastructurePlan.environments.join(', ')}`));
          }

          if (result.sopCompliance) {
            console.log();
            console.log(chalk.white('  SOP Compliance:'));
            const scoreColor = result.sopCompliance.score >= 80 ? chalk.green :
                               result.sopCompliance.score >= 50 ? chalk.yellow : chalk.red;
            console.log(chalk.gray(`    Score: `) + scoreColor(`${result.sopCompliance.score}%`));
            if (result.sopCompliance.gaps.length > 0) {
              console.log(chalk.gray(`    Gaps: ${result.sopCompliance.gaps.length}`));
            }
          }
        }

        if (result.errors.length > 0) {
          console.log();
          console.log(chalk.yellow('  Errors:'));
          for (const error of result.errors.slice(0, 5)) {
            console.log(chalk.gray(`    - ${error}`));
          }
          if (result.errors.length > 5) {
            console.log(chalk.gray(`    ... and ${result.errors.length - 5} more`));
          }
        }

        console.log();
        console.log(chalk.cyan('  Generated files in: ') + chalk.white(join(projectRoot, docsPath)));
        console.log();

        if (!options.dryRun) {
          console.log(chalk.cyan('  Key documents:'));
          console.log(chalk.gray('    • docs/planning/development-plan.md'));
          console.log(chalk.gray('    • docs/planning/infrastructure-plan.md'));
          console.log(chalk.gray('    • docs/services/{service}/README.md'));
          console.log();
        }

        console.log(chalk.cyan('Next steps:'));
        console.log(chalk.gray('  1. Review generated documentation'));
        console.log(chalk.gray('  2. Fill in project-specific details'));
        console.log(chalk.gray('  3. Run ') + chalk.white('kg graph') + chalk.gray(' to visualize'));
        console.log();

      } catch (error) {
        spinner.fail('Cultivation failed');
        console.error(chalk.red(String(error)));
        process.exit(1);
      }
    });

  return command;
}
