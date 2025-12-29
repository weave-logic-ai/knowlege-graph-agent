/**
 * Claude Command
 *
 * Manage CLAUDE.md configuration file.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  generateClaudeMd,
  updateClaudeMd,
  addSection,
  getSectionTemplate,
  listSectionTemplates,
} from '../../generators/claude-md.js';
import { validateProjectRoot, validatePath } from '../../core/security.js';

/**
 * Create claude command
 */
export function createClaudeCommand(): Command {
  const command = new Command('claude');

  command
    .description('CLAUDE.md management commands');

  // Update/generate subcommand
  command
    .command('update')
    .description('Generate or update CLAUDE.md file')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('-o, --output <path>', 'Output path for CLAUDE.md')
    .option('-t, --template <template>', 'Template to use (default, minimal, full)')
    .option('--no-kg', 'Skip knowledge graph section')
    .option('--no-cf', 'Skip claude-flow section')
    .option('-f, --force', 'Overwrite existing file')
    .action(async (options) => {
      const spinner = ora('Updating CLAUDE.md...').start();

      try {
        // Validate paths to prevent traversal attacks
        const projectRoot = validateProjectRoot(options.path);
        const claudeMdPath = options.output
          ? validatePath(projectRoot, options.output)
          : join(projectRoot, 'CLAUDE.md');

        // Check if file exists
        if (existsSync(claudeMdPath) && !options.force) {
          spinner.warn('CLAUDE.md already exists. Use --force to overwrite.');
          return;
        }

        const result = await updateClaudeMd({
          projectRoot,
          outputPath: claudeMdPath,
          template: options.template,
          includeKnowledgeGraph: options.kg !== false,
          includeClaudeFlow: options.cf !== false,
        });

        if (result.created) {
          spinner.succeed('CLAUDE.md created!');
        } else {
          spinner.succeed('CLAUDE.md updated!');
        }

        console.log();
        console.log(chalk.gray('  Path:'), chalk.white(result.path));
        console.log(chalk.gray('  Size:'), chalk.white(`${result.content.length} bytes`));
        console.log();

      } catch (error) {
        spinner.fail('Failed to update CLAUDE.md');
        console.error(chalk.red(String(error)));
        process.exit(1);
      }
    });

  // Preview subcommand
  command
    .command('preview')
    .description('Preview CLAUDE.md without writing')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('-t, --template <template>', 'Template to use')
    .action(async (options) => {
      try {
        const projectRoot = validateProjectRoot(options.path);

        const content = generateClaudeMd({
          projectRoot,
          template: options.template,
          includeKnowledgeGraph: true,
          includeClaudeFlow: true,
        });

        console.log(chalk.cyan('\n--- CLAUDE.md Preview ---\n'));
        console.log(content);
        console.log(chalk.cyan('\n--- End Preview ---\n'));

      } catch (error) {
        console.error(chalk.red('Failed to generate preview:'), String(error));
        process.exit(1);
      }
    });

  // Add section subcommand
  command
    .command('add-section <name>')
    .description('Add a section to existing CLAUDE.md')
    .option('-p, --path <path>', 'Project root path', '.')
    .action(async (name, options) => {
      try {
        const projectRoot = validateProjectRoot(options.path);

        // Check for built-in section template
        const template = getSectionTemplate(name);

        if (!template) {
          console.log(chalk.yellow(`Unknown section template: ${name}`));
          console.log();
          console.log(chalk.white('Available templates:'));
          listSectionTemplates().forEach(t => {
            console.log(chalk.gray(`  - ${t}`));
          });
          return;
        }

        const added = addSection(projectRoot, template);

        if (added) {
          console.log(chalk.green(`✓ Added section: ${template.title}`));
        } else {
          console.log(chalk.yellow(`Section "${template.title}" already exists or CLAUDE.md not found`));
        }

      } catch (error) {
        console.error(chalk.red('Failed to add section:'), String(error));
        process.exit(1);
      }
    });

  // List templates subcommand
  command
    .command('templates')
    .description('List available section templates')
    .action(() => {
      console.log(chalk.white('\n  Available Section Templates\n'));

      const templates = listSectionTemplates();
      templates.forEach(name => {
        const template = getSectionTemplate(name);
        if (template) {
          console.log(chalk.cyan(`  ${name}`));
          console.log(chalk.gray(`    ${template.title}`));
        }
      });

      console.log();
      console.log(chalk.gray('  Add with: ') + chalk.white('kg claude add-section <name>'));
      console.log();
    });

  return command;
}
