/**
 * Commit Command
 *
 * CLI command for creating commits with optional AI-powered message generation.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { createGitClient, GitClient, GitStatusSummary } from '../../integrations/git.js';
import { createAutoCommit, AutoCommit, ChangeAnalysis, ChangeType } from '../../integrations/auto-commit.js';
import { validateProjectRoot } from '../../core/security.js';

/**
 * Commit command options
 */
interface CommitOptions {
  message?: string;
  dryRun: boolean;
  auto: boolean;
  push: boolean;
  path: string;
  interactive: boolean;
  all: boolean;
  amend: boolean;
}

/**
 * Format status for display
 */
function formatStatus(status: GitStatusSummary): void {
  console.log();
  console.log(chalk.cyan.bold('  Git Status'));
  console.log();
  console.log(chalk.white(`  Branch: ${chalk.green(status.branch)}`));

  if (status.tracking) {
    const ahead = status.tracking.ahead > 0 ? chalk.green(`+${status.tracking.ahead}`) : '';
    const behind = status.tracking.behind > 0 ? chalk.red(`-${status.tracking.behind}`) : '';
    const tracking = [ahead, behind].filter(Boolean).join(' ');
    console.log(chalk.gray(`  Tracking: ${status.tracking.remote} ${tracking}`));
  }

  console.log();

  if (status.isClean) {
    console.log(chalk.green('  Working tree is clean'));
    return;
  }

  // Show file counts
  const counts: string[] = [];
  if (status.staged > 0) counts.push(chalk.green(`${status.staged} staged`));
  if (status.modified > 0) counts.push(chalk.yellow(`${status.modified} modified`));
  if (status.untracked > 0) counts.push(chalk.gray(`${status.untracked} untracked`));
  if (status.deleted > 0) counts.push(chalk.red(`${status.deleted} deleted`));
  if (status.conflicted > 0) counts.push(chalk.red(`${status.conflicted} conflicted`));

  console.log(chalk.white(`  Changes: ${counts.join(', ')}`));
  console.log();

  // Group files by status
  const staged = status.files.filter(f => f.isStaged);
  const unstaged = status.files.filter(f => !f.isStaged);

  if (staged.length > 0) {
    console.log(chalk.green('  Staged Changes:'));
    staged.slice(0, 10).forEach(f => {
      const icon = getStatusIcon(f.indexStatus);
      console.log(chalk.green(`    ${icon} ${f.path}`));
    });
    if (staged.length > 10) {
      console.log(chalk.gray(`    ... and ${staged.length - 10} more`));
    }
    console.log();
  }

  if (unstaged.length > 0) {
    console.log(chalk.yellow('  Unstaged Changes:'));
    unstaged.slice(0, 10).forEach(f => {
      const icon = getStatusIcon(f.workingTreeStatus);
      console.log(chalk.yellow(`    ${icon} ${f.path}`));
    });
    if (unstaged.length > 10) {
      console.log(chalk.gray(`    ... and ${unstaged.length - 10} more`));
    }
    console.log();
  }
}

/**
 * Get icon for file status
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'M':
      return 'modified:';
    case 'A':
      return 'added:   ';
    case 'D':
      return 'deleted: ';
    case 'R':
      return 'renamed: ';
    case '?':
      return 'new:     ';
    case 'U':
      return 'conflict:';
    default:
      return '         ';
  }
}

/**
 * Format analysis for display
 */
function formatAnalysis(analysis: ChangeAnalysis): void {
  console.log();
  console.log(chalk.cyan.bold('  Change Analysis'));
  console.log();
  console.log(chalk.white(`  Type: ${chalk.yellow(analysis.type)}`));
  if (analysis.scope) {
    console.log(chalk.white(`  Scope: ${chalk.blue(analysis.scope)}`));
  }
  console.log(chalk.white(`  Description: ${analysis.description}`));
  if (analysis.breaking) {
    console.log(chalk.red(`  Breaking Change: Yes`));
  }
  console.log();
}

/**
 * Interactive mode for reviewing and editing commit
 */
async function interactiveCommit(
  git: GitClient,
  autoCommit: AutoCommit,
  status: GitStatusSummary,
  analysis: ChangeAnalysis,
  options: CommitOptions
): Promise<boolean> {
  // Show current state
  formatStatus(status);
  formatAnalysis(analysis);

  // Generate suggested message
  const suggestedMessage = autoCommit.generateCommitMessage(analysis);

  console.log(chalk.cyan.bold('  Suggested Commit Message:'));
  console.log();
  console.log(chalk.gray('  ---'));
  suggestedMessage.split('\n').forEach(line => {
    console.log(chalk.white(`  ${line}`));
  });
  console.log(chalk.gray('  ---'));
  console.log();

  // Ask for confirmation
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Commit with suggested message', value: 'commit' },
        { name: 'Edit message', value: 'edit' },
        { name: 'Stage all changes first', value: 'stage-all' },
        { name: 'Select files to stage', value: 'select' },
        { name: 'View diff', value: 'diff' },
        { name: 'Cancel', value: 'cancel' },
      ],
    },
  ]);

  switch (action) {
    case 'commit':
      return performCommit(git, autoCommit, suggestedMessage, options);

    case 'edit':
      const { editedMessage } = await inquirer.prompt([
        {
          type: 'editor',
          name: 'editedMessage',
          message: 'Edit commit message:',
          default: suggestedMessage,
        },
      ]);
      return performCommit(git, autoCommit, editedMessage.trim(), options);

    case 'stage-all':
      await git.add('.');
      const newStatus = await git.getStatus();
      const newAnalysis = await autoCommit.analyzeChanges(newStatus);
      return interactiveCommit(git, autoCommit, newStatus, newAnalysis, options);

    case 'select':
      const unstaged = status.files.filter(f => !f.isStaged);
      if (unstaged.length === 0) {
        console.log(chalk.yellow('\n  No unstaged files to select.\n'));
        return interactiveCommit(git, autoCommit, status, analysis, options);
      }

      const { filesToStage } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'filesToStage',
          message: 'Select files to stage:',
          choices: unstaged.map(f => ({
            name: `${getStatusIcon(f.workingTreeStatus).trim()} ${f.path}`,
            value: f.path,
          })),
        },
      ]);

      if (filesToStage.length > 0) {
        await git.add(filesToStage);
      }
      const updatedStatus = await git.getStatus();
      const updatedAnalysis = await autoCommit.analyzeChanges(updatedStatus);
      return interactiveCommit(git, autoCommit, updatedStatus, updatedAnalysis, options);

    case 'diff':
      const diff = await git.getDiffContent({ staged: true });
      console.log();
      console.log(chalk.cyan.bold('  Staged Diff:'));
      console.log(chalk.gray('  ---'));
      if (diff) {
        diff.split('\n').slice(0, 50).forEach(line => {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            console.log(chalk.green(`  ${line}`));
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            console.log(chalk.red(`  ${line}`));
          } else {
            console.log(chalk.gray(`  ${line}`));
          }
        });
        if (diff.split('\n').length > 50) {
          console.log(chalk.gray('  ... (truncated)'));
        }
      } else {
        console.log(chalk.gray('  No staged changes'));
      }
      console.log(chalk.gray('  ---'));
      console.log();
      return interactiveCommit(git, autoCommit, status, analysis, options);

    case 'cancel':
    default:
      console.log(chalk.yellow('\n  Commit cancelled.\n'));
      return false;
  }
}

/**
 * Perform the actual commit
 */
async function performCommit(
  git: GitClient,
  autoCommit: AutoCommit,
  message: string,
  options: CommitOptions
): Promise<boolean> {
  const spinner = ora('Creating commit...').start();

  try {
    const result = await autoCommit.commit({
      message,
      stageAll: options.all,
      dryRun: options.dryRun,
    });

    if (options.dryRun) {
      spinner.info('Dry run - no commit created');
      console.log();
      console.log(chalk.cyan('  Would commit with message:'));
      console.log(chalk.gray('  ---'));
      message.split('\n').forEach(line => {
        console.log(chalk.white(`  ${line}`));
      });
      console.log(chalk.gray('  ---'));
      console.log();
      return true;
    }

    if (!result.success) {
      spinner.fail('Commit failed');
      console.error(chalk.red(`  Error: ${result.error}`));
      return false;
    }

    spinner.succeed('Commit created');
    console.log();
    console.log(chalk.white(`  Hash: ${chalk.green(result.hash || 'unknown')}`));
    console.log();

    // Push if requested
    if (options.push) {
      const pushSpinner = ora('Pushing to remote...').start();
      try {
        await git.push();
        pushSpinner.succeed('Pushed to remote');
      } catch (error) {
        pushSpinner.fail('Push failed');
        console.error(chalk.red(`  Error: ${error instanceof Error ? error.message : String(error)}`));
        return false;
      }
    }

    return true;
  } catch (error) {
    spinner.fail('Commit failed');
    console.error(chalk.red(`  Error: ${error instanceof Error ? error.message : String(error)}`));
    return false;
  }
}

/**
 * Create commit command
 */
export function createCommitCommand(): Command {
  const command = new Command('commit');

  command
    .description('Create a git commit with optional auto-generated message')
    .option('-m, --message <message>', 'Commit message (skips auto-generation)')
    .option('-n, --dry-run', 'Show what would be committed without committing', false)
    .option('-a, --auto', 'Automatically generate commit message', false)
    .option('-p, --push', 'Push to remote after committing', false)
    .option('--path <path>', 'Repository path', '.')
    .option('-i, --interactive', 'Interactive mode for reviewing changes', false)
    .option('-A, --all', 'Stage all changes before committing', false)
    .option('--amend', 'Amend the previous commit', false)
    .action(async (options: CommitOptions) => {
      try {
        // Validate path
        const projectRoot = validateProjectRoot(options.path);

        // Create clients
        const git = createGitClient({ workingDirectory: projectRoot });
        const autoCommit = createAutoCommit({
          workingDirectory: projectRoot,
          stageAll: options.all,
        });

        // Check if this is a git repository
        if (!(await git.isRepo())) {
          console.error(chalk.red('\n  Error: Not a git repository\n'));
          process.exit(1);
        }

        // Get current status
        const status = await git.getStatus();

        // Handle clean working directory
        if (status.isClean && !options.amend) {
          console.log(chalk.yellow('\n  Nothing to commit, working tree clean\n'));
          process.exit(0);
        }

        // Analyze changes
        const analysis = await autoCommit.analyzeChanges(status);

        // Interactive mode
        if (options.interactive) {
          const success = await interactiveCommit(git, autoCommit, status, analysis, options);
          process.exit(success ? 0 : 1);
        }

        // If message provided, use it directly
        if (options.message) {
          const success = await performCommit(git, autoCommit, options.message, options);
          process.exit(success ? 0 : 1);
        }

        // Auto mode - generate and commit
        if (options.auto) {
          const message = autoCommit.generateCommitMessage(analysis);
          const success = await performCommit(git, autoCommit, message, options);
          process.exit(success ? 0 : 1);
        }

        // Default: show status and suggested message
        formatStatus(status);
        formatAnalysis(analysis);

        const suggestedMessage = autoCommit.generateCommitMessage(analysis);

        console.log(chalk.cyan.bold('  Suggested Commit Message:'));
        console.log();
        console.log(chalk.gray('  ---'));
        suggestedMessage.split('\n').forEach(line => {
          console.log(chalk.white(`  ${line}`));
        });
        console.log(chalk.gray('  ---'));
        console.log();

        console.log(chalk.gray('  Use -a/--auto to commit with this message'));
        console.log(chalk.gray('  Use -i/--interactive for interactive mode'));
        console.log(chalk.gray('  Use -m/--message to provide your own message'));
        console.log();

      } catch (error) {
        console.error(chalk.red(`\n  Error: ${error instanceof Error ? error.message : String(error)}\n`));
        process.exit(1);
      }
    });

  // Status subcommand
  command
    .command('status')
    .description('Show git status with analysis')
    .option('--path <path>', 'Repository path', '.')
    .action(async (opts) => {
      try {
        const projectRoot = validateProjectRoot(opts.path);
        const git = createGitClient({ workingDirectory: projectRoot });
        const autoCommit = createAutoCommit({ workingDirectory: projectRoot });

        if (!(await git.isRepo())) {
          console.error(chalk.red('\n  Error: Not a git repository\n'));
          process.exit(1);
        }

        const status = await git.getStatus();
        formatStatus(status);

        if (!status.isClean) {
          const analysis = await autoCommit.analyzeChanges(status);
          formatAnalysis(analysis);
        }
      } catch (error) {
        console.error(chalk.red(`\n  Error: ${error instanceof Error ? error.message : String(error)}\n`));
        process.exit(1);
      }
    });

  // Log subcommand
  command
    .command('log')
    .description('Show recent commits')
    .option('--path <path>', 'Repository path', '.')
    .option('-n, --count <count>', 'Number of commits to show', '10')
    .action(async (opts) => {
      try {
        const projectRoot = validateProjectRoot(opts.path);
        const git = createGitClient({ workingDirectory: projectRoot });

        if (!(await git.isRepo())) {
          console.error(chalk.red('\n  Error: Not a git repository\n'));
          process.exit(1);
        }

        const log = await git.getLog({ maxCount: parseInt(opts.count, 10) });

        console.log();
        console.log(chalk.cyan.bold('  Recent Commits'));
        console.log();

        log.forEach(commit => {
          const date = commit.date.toISOString().split('T')[0];
          console.log(chalk.yellow(`  ${commit.hashAbbrev}`) + chalk.gray(` (${date})`) + chalk.white(` ${commit.message}`));
          console.log(chalk.gray(`           ${commit.author} <${commit.email}>`));
        });

        console.log();
      } catch (error) {
        console.error(chalk.red(`\n  Error: ${error instanceof Error ? error.message : String(error)}\n`));
        process.exit(1);
      }
    });

  // Diff subcommand
  command
    .command('diff')
    .description('Show diff of changes')
    .option('--path <path>', 'Repository path', '.')
    .option('-s, --staged', 'Show only staged changes', false)
    .option('-f, --file <file>', 'Show diff for specific file')
    .action(async (opts) => {
      try {
        const projectRoot = validateProjectRoot(opts.path);
        const git = createGitClient({ workingDirectory: projectRoot });

        if (!(await git.isRepo())) {
          console.error(chalk.red('\n  Error: Not a git repository\n'));
          process.exit(1);
        }

        const diff = await git.getDiffContent({
          staged: opts.staged,
          file: opts.file,
        });

        if (!diff) {
          console.log(chalk.yellow('\n  No changes to show\n'));
          process.exit(0);
        }

        console.log();
        diff.split('\n').forEach(line => {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            console.log(chalk.green(line));
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            console.log(chalk.red(line));
          } else if (line.startsWith('@@')) {
            console.log(chalk.cyan(line));
          } else if (line.startsWith('diff ') || line.startsWith('index ')) {
            console.log(chalk.blue(line));
          } else {
            console.log(line);
          }
        });
        console.log();
      } catch (error) {
        console.error(chalk.red(`\n  Error: ${error instanceof Error ? error.message : String(error)}\n`));
        process.exit(1);
      }
    });

  return command;
}
