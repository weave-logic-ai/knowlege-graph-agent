/**
 * Init Command
 *
 * Initialize knowledge graph in a project.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ConfigSchema } from '../../core/types.js';
import { createDatabase } from '../../core/database.js';
import { validateProjectRoot, validateDocsPath } from '../../core/security.js';

/**
 * Create init command
 */
export function createInitCommand(): Command {
  const command = new Command('init');

  command
    .description('Initialize knowledge graph in the current project')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('-d, --docs <path>', 'Docs directory path', 'docs')
    .option('-n, --name <name>', 'Project name')
    .option('--no-db', 'Skip database initialization')
    .option('--no-config', 'Skip config file creation')
    .option('-f, --force', 'Overwrite existing files')
    .action(async (options) => {
      const spinner = ora('Initializing knowledge graph...').start();

      try {
        // Validate paths to prevent traversal attacks
        const projectRoot = validateProjectRoot(options.path);
        const docsPath = options.docs; // Relative path for config, validated when used
        validateDocsPath(projectRoot, docsPath); // Validate it stays within project
        const kgDir = join(projectRoot, '.kg');

        // Check if already initialized
        if (existsSync(kgDir) && !options.force) {
          spinner.warn('Knowledge graph already initialized. Use --force to reinitialize.');
          return;
        }

        // Create .kg directory
        if (!existsSync(kgDir)) {
          mkdirSync(kgDir, { recursive: true });
        }

        // Initialize database
        if (options.db !== false) {
          spinner.text = 'Creating database...';
          const dbPath = join(kgDir, 'knowledge.db');
          const db = createDatabase(dbPath);

          // Set initial metadata
          db.setMetadata('projectRoot', projectRoot);
          db.setMetadata('docsPath', docsPath);
          db.setMetadata('initialized', new Date().toISOString());

          db.close();
        }

        // Create config file
        if (options.config !== false) {
          spinner.text = 'Creating configuration...';
          const configPath = join(kgDir, 'config.json');

          if (!existsSync(configPath) || options.force) {
            const config = ConfigSchema.parse({
              projectRoot: '.',
              docsRoot: docsPath,
              vaultName: options.name,
              graph: {
                includePatterns: ['**/*.md'],
                excludePatterns: ['node_modules/**', 'dist/**', '.git/**'],
              },
              database: {
                path: '.kg/knowledge.db',
              },
              claudeFlow: {
                enabled: true,
                namespace: 'knowledge-graph',
                syncOnChange: true,
              },
            });

            writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
          }
        }

        // Create .gitignore entry
        const gitignorePath = join(kgDir, '.gitignore');
        if (!existsSync(gitignorePath)) {
          writeFileSync(gitignorePath, '# Knowledge Graph Database\nknowledge.db\nknowledge.db-wal\nknowledge.db-shm\n', 'utf-8');
        }

        spinner.succeed('Knowledge graph initialized!');

        // Show next steps
        console.log('\n' + chalk.cyan('Next steps:'));
        console.log(chalk.gray('  1. Initialize docs:    ') + chalk.white('kg docs init'));
        console.log(chalk.gray('  2. Generate graph:     ') + chalk.white('kg graph'));
        console.log(chalk.gray('  3. Update CLAUDE.md:   ') + chalk.white('kg claude update'));
        console.log(chalk.gray('  4. Sync with claude-flow: ') + chalk.white('kg sync'));
        console.log();

      } catch (error) {
        spinner.fail('Failed to initialize knowledge graph');
        console.error(chalk.red(String(error)));
        process.exit(1);
      }
    });

  return command;
}
