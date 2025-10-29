/**
 * AI-Powered Commit Command
 *
 * Generate intelligent git commit messages using LLM analysis
 * of staged changes with conventional commit format
 *
 * @module cli/commands/commit
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { GitClient } from '../../git/git-client.js';
import { ClaudeClient } from '../../agents/claude-client.js';
import { CommitGenerator, type CommitGenerationOptions } from '../../git/commit-generator.js';
import type { ConventionalCommit, ConventionalCommitType } from '../../git/conventional.js';
import { config } from '../../config/index.js';

interface CommitCommandOptions {
  dryRun?: boolean;
  interactive?: boolean;
  template?: string;
  type?: ConventionalCommitType;
  scope?: string;
  breaking?: boolean;
  context?: string;
  noHistory?: boolean;
}

/**
 * Create the AI-powered commit command
 */
export function createCommitCommand(): Command {
  const command = new Command('commit');

  command
    .description('Generate AI-powered conventional commit messages')
    .option('--dry-run', 'Preview message without committing')
    .option('-i, --interactive', 'Refine AI suggestion interactively')
    .option('--template <file>', 'Use custom commit template')
    .option('--type <type>', 'Override commit type (feat, fix, docs, etc.)')
    .option('--scope <scope>', 'Set commit scope')
    .option('--breaking', 'Mark as breaking change')
    .option('--context <text>', 'Additional context for AI')
    .option('--no-history', 'Don\'t analyze recent commits for style')
    .action(async (options: CommitCommandOptions) => {
      try {
        await handleCommitCommand(options);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });

  return command;
}

/**
 * Handle commit command execution
 */
async function handleCommitCommand(options: CommitCommandOptions): Promise<void> {
  // Initialize clients
  const gitClient = new GitClient(process.cwd());
  await gitClient.init();

  const claudeClient = new ClaudeClient({
    apiKey: config.ai.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '',
    model: config.ai.defaultModel
  });

  const generator = new CommitGenerator(gitClient, claudeClient);

  // Check for staged changes
  const status = await gitClient.status();
  if (status.staged.length === 0) {
    console.log(chalk.yellow('No staged changes found.'));
    console.log(chalk.gray('Use `git add <files>` to stage changes first.'));
    process.exit(0);
  }

  console.log(chalk.blue('Staged files:'));
  for (const file of status.staged) {
    console.log(chalk.gray(`  • ${file}`));
  }
  console.log('');

  // Generate commit message
  const spinner = ora('Generating commit message with AI...').start();

  const generationOptions: CommitGenerationOptions = {
    templatePath: options.template,
    type: options.type,
    scope: options.scope,
    breaking: options.breaking,
    context: options.context,
    includeHistory: !options.noHistory,
    dryRun: options.dryRun
  };

  let generated;
  try {
    generated = await generator.generate(generationOptions);
    spinner.succeed('Commit message generated');
  } catch (error) {
    spinner.fail('Failed to generate commit message');
    throw error;
  }

  // Display generated message
  console.log('');
  console.log(chalk.bold('Generated Commit Message:'));
  console.log(chalk.gray('─'.repeat(50)));
  displayCommitMessage(generated.message);
  console.log(chalk.gray('─'.repeat(50)));
  console.log('');

  // Show analysis summary
  displayAnalysisSummary(generated.analysis);
  console.log('');

  // Interactive mode
  if (options.interactive) {
    const refined = await interactiveRefinement(generator, generated.message);
    generated.message = refined;

    console.log('');
    console.log(chalk.bold('Final Commit Message:'));
    console.log(chalk.gray('─'.repeat(50)));
    displayCommitMessage(generated.message);
    console.log(chalk.gray('─'.repeat(50)));
    console.log('');
  }

  // Confirm or dry run
  if (options.dryRun) {
    console.log(chalk.yellow('DRY RUN - No commit created'));
    return;
  }

  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Create commit with this message?',
      default: true
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Commit cancelled'));
    return;
  }

  // Create commit
  const commitSpinner = ora('Creating commit...').start();
  try {
    const result = await generator.commit(generated);
    commitSpinner.succeed(`Commit created: ${chalk.green(result.sha.substring(0, 7))}`);
    console.log(chalk.gray(`Message: ${result.message.split('\n')[0]}`));
  } catch (error) {
    commitSpinner.fail('Failed to create commit');
    throw error;
  }
}

/**
 * Interactive refinement loop
 */
async function interactiveRefinement(
  generator: CommitGenerator,
  initialMessage: string
): Promise<string> {
  let currentMessage = initialMessage;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { action } = await inquirer.prompt<{ action: string }>([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Accept this message', value: 'accept' },
          { name: 'Edit manually', value: 'edit' },
          { name: 'Ask AI to refine', value: 'refine' },
          { name: 'Regenerate completely', value: 'regenerate' }
        ]
      }
    ]);

    if (action === 'accept') {
      return currentMessage;
    }

    if (action === 'edit') {
      const { edited } = await inquirer.prompt<{ edited: string }>([
        {
          type: 'editor',
          name: 'edited',
          message: 'Edit commit message:',
          default: currentMessage
        }
      ]);
      currentMessage = edited;
      continue;
    }

    if (action === 'refine') {
      const { feedback } = await inquirer.prompt<{ feedback: string }>([
        {
          type: 'input',
          name: 'feedback',
          message: 'What should be changed?',
          validate: (input: string) => input.trim().length > 0 || 'Please provide feedback'
        }
      ]);

      const spinner = ora('Refining message...').start();
      try {
        currentMessage = await generator.refine(currentMessage, feedback);
        spinner.succeed('Message refined');
      } catch (error) {
        spinner.fail('Failed to refine message');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        continue;
      }

      console.log('');
      console.log(chalk.bold('Refined Message:'));
      console.log(chalk.gray('─'.repeat(50)));
      displayCommitMessage(currentMessage);
      console.log(chalk.gray('─'.repeat(50)));
      console.log('');
      continue;
    }

    if (action === 'regenerate') {
      console.log(chalk.yellow('Regeneration not implemented - use edit or refine instead'));
      continue;
    }
  }
}

/**
 * Display commit message with formatting
 */
function displayCommitMessage(message: string): void {
  const lines = message.split('\n');
  const header = lines[0];

  // Highlight header
  if (header) {
    console.log(chalk.cyan(header));
  }

  // Body and footer
  const rest = lines.slice(1).join('\n');
  if (rest.trim()) {
    console.log(chalk.white(rest));
  }
}

/**
 * Display analysis summary
 */
function displayAnalysisSummary(analysis: any): void {
  console.log(chalk.bold('Analysis:'));
  console.log(chalk.gray(`  Type: ${analysis.suggestedType}`));
  if (analysis.suggestedScope) {
    console.log(chalk.gray(`  Scope: ${analysis.suggestedScope}`));
  }
  console.log(chalk.gray(`  Files: ${analysis.stats.filesChanged}`));
  console.log(chalk.gray(`  +${analysis.stats.insertions} -${analysis.stats.deletions}`));

  if (analysis.hasBreakingChanges) {
    console.log(chalk.red(`  Breaking: ${analysis.breakingChangeIndicators.join(', ')}`));
  }
}
