/**
 * SOP Commands - Standard Operating Procedures
 * Unified command interface for all 8 SOPs
 */

import { Command } from 'commander';
import { featurePlanCommand } from '../../../sops/feature-planning.js';
import { phasePlanCommand } from '../../../sops/phase-planning.js';
import { releaseCommand } from '../../../sops/release-management.js';
import { debugCommand } from '../../../sops/debugging.js';
import { docsCommand } from '../../../sops/documentation.js';
import { vaultCommand } from '../../../sops/vault-management.js';
import { reviewCommand } from '../../../sops/code-review.js';
import { perfCommand } from '../../../sops/performance-analysis.js';
import chalk from 'chalk';

/**
 * Create the main SOP command group
 */
export function createSopCommand(): Command {
  const sop = new Command('sop')
    .description('Execute Standard Operating Procedures (SOPs)')
    .addHelpText('after', `
${chalk.bold('Available SOPs:')}
  ${chalk.cyan('feature-plan')}      SOP-001: Feature Planning Workflow
  ${chalk.cyan('phase-plan')}        SOP-002: Phase/Milestone Planning Workflow
  ${chalk.cyan('release')}           SOP-003: Release Management Workflow
  ${chalk.cyan('debug')}             SOP-004: Systematic Debugging Workflow
  ${chalk.cyan('docs')}              SOP-005: Documentation Workflow
  ${chalk.cyan('vault')}             SOP-006: Vault Management Workflow
  ${chalk.cyan('review')}            SOP-007: Code Review Workflow
  ${chalk.cyan('perf')}              SOP-008: Performance Analysis Workflow

${chalk.bold('Examples:')}
  ${chalk.gray('$ weaver sop feature-plan "Add user authentication"')}
  ${chalk.gray('$ weaver sop phase-plan 12 --objectives "Migrate to microservices"')}
  ${chalk.gray('$ weaver sop release 2.5.0 --type minor')}
  ${chalk.gray('$ weaver sop debug 1234')}
  ${chalk.gray('$ weaver sop docs generate --type api')}
  ${chalk.gray('$ weaver sop vault organize')}
  ${chalk.gray('$ weaver sop review 5678')}
  ${chalk.gray('$ weaver sop perf analyze --target api')}

${chalk.bold('Documentation:')}
  Full SOP documentation available at: ${chalk.blue('weave-nn/_sops/')}
`);

  // Add all 8 SOP subcommands
  sop.addCommand(featurePlanCommand);
  sop.addCommand(phasePlanCommand);
  sop.addCommand(releaseCommand);
  sop.addCommand(debugCommand);
  sop.addCommand(docsCommand);
  sop.addCommand(vaultCommand);
  sop.addCommand(reviewCommand);
  sop.addCommand(perfCommand);

  return sop;
}

// Export individual commands for direct usage
export {
  featurePlanCommand,
  phasePlanCommand,
  releaseCommand,
  debugCommand,
  docsCommand,
  vaultCommand,
  reviewCommand,
  perfCommand,
};
