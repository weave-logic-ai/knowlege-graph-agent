/**
 * Docs Command
 *
 * Initialize and manage documentation directory.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { initDocs, docsExist, getDocsPath } from '../../generators/docs-init.js';
import { generateDocsWithAgents } from '../../generators/doc-generator-agents.js';
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

  return command;
}
