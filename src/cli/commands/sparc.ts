/**
 * SPARC CLI Command
 *
 * CLI command for creating comprehensive SPARC plans using
 * concurrent agents, consensus building, and knowledge graph integration.
 *
 * @module cli/commands/sparc
 */

import { Command } from 'commander';
import { resolve, join } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { createLogger } from '../../utils/index.js';
import {
  createSPARCPlanner,
  type SPARCPlannerOptions,
} from '../../sparc/index.js';

const logger = createLogger('cli:sparc');

/**
 * Create the SPARC command
 */
export function createSPARCCommand(): Command {
  const cmd = new Command('sparc')
    .description('SPARC planning system - create comprehensive development plans')
    .addCommand(createPlanCommand())
    .addCommand(createReviewCommand())
    .addCommand(createStatusCommand());

  return cmd;
}

/**
 * Create the plan subcommand
 */
function createPlanCommand(): Command {
  return new Command('plan')
    .description('Create a comprehensive SPARC plan')
    .argument('<description>', 'Description of what to plan')
    .option('-n, --name <name>', 'Plan name', 'SPARC Plan')
    .option('-p, --path <path>', 'Project root path', process.cwd())
    .option('-o, --output <dir>', 'Output directory for plan artifacts')
    .option('--no-research', 'Skip research phase')
    .option('--no-consensus', 'Skip consensus building')
    .option('--no-review', 'Skip review phase')
    .option('--passes <number>', 'Number of review passes', '3')
    .option('--parallel', 'Enable parallel research', true)
    .option('--kg', 'Enable knowledge graph integration', true)
    .option('--vector', 'Enable vector database integration', true)
    .option('--json', 'Output result as JSON')
    .action(async (description, options) => {
      const spinner = ora('Initializing SPARC planner...').start();

      try {
        const projectRoot = resolve(options.path);
        const outputDir = options.output
          ? resolve(options.output)
          : join(projectRoot, '.sparc');

        // Validate project root exists
        if (!existsSync(projectRoot)) {
          spinner.fail(`Project root not found: ${projectRoot}`);
          process.exit(1);
        }

        logger.info('Starting SPARC planning', {
          description,
          projectRoot,
          outputDir,
        });

        // Create planner options
        const plannerOptions: SPARCPlannerOptions = {
          projectRoot,
          outputDir,
          name: options.name,
          description,
          parallelResearch: options.parallel,
          reviewPasses: parseInt(options.passes, 10),
          autoConsensus: options.consensus !== false,
          kgEnabled: options.kg,
          vectorEnabled: options.vector,
        };

        spinner.text = 'Creating SPARC planner...';
        const planner = createSPARCPlanner(plannerOptions);

        spinner.text = 'Executing planning process...';

        // Execute planning with progress updates
        const plan = await executePlanningWithProgress(planner, spinner, {
          skipResearch: options.research === false,
          skipConsensus: options.consensus === false,
          skipReview: options.review === false,
        });

        spinner.succeed('SPARC planning completed!');

        // Output results
        if (options.json) {
          console.log(JSON.stringify(plan, null, 2));
        } else {
          displayPlanSummary(plan);
        }

        // Show output location
        console.log('');
        console.log(chalk.blue('📁 Plan artifacts saved to:'), outputDir);
        console.log(chalk.gray('   - sparc-plan.json'));
        console.log(chalk.gray('   - sparc-plan.md'));
        console.log(chalk.gray('   - decision-log.json'));
        console.log(chalk.gray('   - decision-log.md'));

      } catch (error) {
        spinner.fail('SPARC planning failed');
        logger.error('Planning error', error instanceof Error ? error : new Error(String(error)));

        if (error instanceof Error) {
          console.error(chalk.red('Error:'), error.message);
        }
        process.exit(1);
      }
    });
}

/**
 * Execute planning with spinner progress updates
 */
async function executePlanningWithProgress(
  planner: ReturnType<typeof createSPARCPlanner>,
  spinner: ReturnType<typeof ora>,
  options: {
    skipResearch: boolean;
    skipConsensus: boolean;
    skipReview: boolean;
  }
): Promise<ReturnType<typeof planner.getPlan>> {
  // For now, execute the full planning process
  // In full implementation, would hook into planner events for progress
  spinner.text = 'Phase 1: Research and analysis...';
  await delay(500);

  spinner.text = 'Phase 2: Specification...';
  await delay(300);

  spinner.text = 'Phase 3: Pseudocode design...';
  await delay(300);

  spinner.text = 'Phase 4: Architecture design...';
  await delay(300);

  spinner.text = 'Phase 5: Refinement (task breakdown)...';
  await delay(300);

  spinner.text = 'Phase 6: Review process...';

  // Execute the actual planning
  return planner.executePlanning();
}

/**
 * Display plan summary in console
 */
function displayPlanSummary(plan: ReturnType<ReturnType<typeof createSPARCPlanner>['getPlan']>): void {
  console.log('');
  console.log(chalk.bold.green('═══════════════════════════════════════════════════════'));
  console.log(chalk.bold.green(`  SPARC Plan: ${plan.name}`));
  console.log(chalk.bold.green('═══════════════════════════════════════════════════════'));
  console.log('');

  // Status
  const statusColor = plan.status === 'approved'
    ? chalk.green
    : plan.status === 'failed'
      ? chalk.red
      : chalk.yellow;
  console.log(chalk.bold('Status:'), statusColor(plan.status.toUpperCase()));
  console.log('');

  // Statistics
  console.log(chalk.bold('📊 Statistics:'));
  console.log(`   Total Tasks:        ${plan.statistics.totalTasks}`);
  console.log(`   Parallelizable:     ${plan.statistics.parallelizableTasks}`);
  console.log(`   Estimated Hours:    ${plan.statistics.estimatedHours}h`);
  console.log(`   Research Findings:  ${plan.statistics.researchFindings}`);
  console.log(`   Decisions Made:     ${plan.statistics.decisions}`);
  console.log('');

  // Specification
  if (plan.specification) {
    console.log(chalk.bold('📋 Specification:'));
    console.log(`   Requirements:       ${plan.specification.requirements.length}`);
    console.log(`   Features:           ${plan.specification.features.length}`);
    console.log('');
  }

  // Architecture
  if (plan.architecture) {
    console.log(chalk.bold('🏗️  Architecture:'));
    console.log(`   Components:         ${plan.architecture.components.length}`);
    console.log(`   Patterns:           ${plan.architecture.patterns.join(', ')}`);
    console.log('');
  }

  // Tasks summary by phase
  console.log(chalk.bold('📝 Tasks by Phase:'));
  const tasksByPhase = new Map<string, number>();
  for (const task of plan.tasks) {
    tasksByPhase.set(task.phase, (tasksByPhase.get(task.phase) || 0) + 1);
  }
  for (const [phase, count] of tasksByPhase.entries()) {
    console.log(`   ${phase.padEnd(15)} ${count} tasks`);
  }
  console.log('');

  // Parallel groups
  if (plan.parallelGroups.length > 0) {
    console.log(chalk.bold('⚡ Parallel Execution Groups:'), plan.parallelGroups.length);
    console.log('');
  }

  // Review result
  if (plan.reviewResult) {
    console.log(chalk.bold('🔍 Review Result:'));
    const reviewStatus = plan.reviewResult.overallStatus === 'approved'
      ? chalk.green('APPROVED')
      : plan.reviewResult.overallStatus === 'rejected'
        ? chalk.red('REJECTED')
        : chalk.yellow('NEEDS WORK');
    console.log(`   Status:             ${reviewStatus}`);
    console.log(`   Total Findings:     ${plan.reviewResult.totalFindings}`);
    console.log(`   Critical Findings:  ${plan.reviewResult.criticalFindings}`);
    console.log('');

    if (plan.reviewResult.recommendations.length > 0) {
      console.log(chalk.bold('💡 Recommendations:'));
      for (const rec of plan.reviewResult.recommendations) {
        console.log(`   • ${rec}`);
      }
      console.log('');
    }
  }

  // Existing code
  if (plan.existingCode) {
    console.log(chalk.bold('📂 Existing Code Analysis:'));
    console.log(`   Files Found:        ${plan.existingCode.fileCount}`);
    console.log(`   Entry Points:       ${plan.existingCode.entryPoints.length}`);
    console.log(`   Patterns:           ${plan.existingCode.patterns.join(', ') || 'None identified'}`);
    console.log('');
  }
}

/**
 * Create the review subcommand
 */
function createReviewCommand(): Command {
  return new Command('review')
    .description('Review an existing SPARC plan')
    .option('-p, --path <path>', 'Path to SPARC plan directory', join(process.cwd(), '.sparc'))
    .option('--passes <number>', 'Number of review passes', '3')
    .option('--strict', 'Enable strict mode (fail on any finding)')
    .option('--json', 'Output result as JSON')
    .action(async (options) => {
      const spinner = ora('Loading SPARC plan...').start();

      try {
        const planPath = resolve(options.path, 'sparc-plan.json');

        if (!existsSync(planPath)) {
          spinner.fail(`SPARC plan not found at: ${planPath}`);
          console.log('');
          console.log('Create a plan first with:');
          console.log(chalk.cyan('  kg-agent sparc plan "your project description"'));
          process.exit(1);
        }

        spinner.text = 'Loading plan...';
        const planContent = await import('fs').then(fs =>
          fs.readFileSync(planPath, 'utf-8')
        );
        const plan = JSON.parse(planContent);

        // Restore dates
        plan.createdAt = new Date(plan.createdAt);
        plan.updatedAt = new Date(plan.updatedAt);

        spinner.text = 'Running review process...';
        const { createReviewProcess } = await import('../../sparc/index.js');

        const reviewer = createReviewProcess({
          plan,
          passes: parseInt(options.passes, 10),
          strictMode: options.strict,
        });

        const result = await reviewer.executeReview();

        spinner.succeed('Review completed!');

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          displayReviewResult(result);
        }

      } catch (error) {
        spinner.fail('Review failed');
        if (error instanceof Error) {
          console.error(chalk.red('Error:'), error.message);
        }
        process.exit(1);
      }
    });
}

/**
 * Display review result
 */
function displayReviewResult(result: {
  overallStatus: string;
  totalFindings: number;
  criticalFindings: number;
  passes: Array<{ passNumber: number; type: string; findings: unknown[]; status: string }>;
  recommendations: string[];
}): void {
  console.log('');
  console.log(chalk.bold('🔍 Review Result'));
  console.log('');

  const statusColor = result.overallStatus === 'approved'
    ? chalk.green
    : result.overallStatus === 'rejected'
      ? chalk.red
      : chalk.yellow;

  console.log('Status:', statusColor(result.overallStatus.toUpperCase()));
  console.log('Total Findings:', result.totalFindings);
  console.log('Critical Findings:', result.criticalFindings);
  console.log('');

  console.log(chalk.bold('Passes:'));
  for (const pass of result.passes) {
    const passStatus = pass.status === 'passed'
      ? chalk.green('✓')
      : pass.status === 'failed'
        ? chalk.red('✗')
        : chalk.yellow('?');
    console.log(`  ${passStatus} Pass ${pass.passNumber} (${pass.type}): ${pass.findings.length} findings`);
  }
  console.log('');

  if (result.recommendations.length > 0) {
    console.log(chalk.bold('Recommendations:'));
    for (const rec of result.recommendations) {
      console.log(`  • ${rec}`);
    }
  }
}

/**
 * Create the status subcommand
 */
function createStatusCommand(): Command {
  return new Command('status')
    .description('Show status of current SPARC plan')
    .option('-p, --path <path>', 'Path to SPARC plan directory', join(process.cwd(), '.sparc'))
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const planPath = resolve(options.path, 'sparc-plan.json');

        if (!existsSync(planPath)) {
          console.log(chalk.yellow('No SPARC plan found.'));
          console.log('');
          console.log('Create a plan with:');
          console.log(chalk.cyan('  kg-agent sparc plan "your project description"'));
          return;
        }

        const planContent = await import('fs').then(fs =>
          fs.readFileSync(planPath, 'utf-8')
        );
        const plan = JSON.parse(planContent);

        if (options.json) {
          console.log(JSON.stringify({
            id: plan.id,
            name: plan.name,
            status: plan.status,
            currentPhase: plan.currentPhase,
            statistics: plan.statistics,
          }, null, 2));
        } else {
          console.log('');
          console.log(chalk.bold(`SPARC Plan: ${plan.name}`));
          console.log('');
          console.log('ID:', plan.id);
          console.log('Status:', plan.status);
          console.log('Phase:', plan.currentPhase);
          console.log('Tasks:', `${plan.statistics.completedTasks}/${plan.statistics.totalTasks}`);
          console.log('Created:', plan.createdAt);
          console.log('');
        }

      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red('Error:'), error.message);
        }
        process.exit(1);
      }
    });
}

/**
 * Helper to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
