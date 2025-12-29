/**
 * Knowledge Graph Agent CLI
 *
 * Main CLI setup and command registration.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createInitCommand } from './commands/init.js';
import { createGraphCommand } from './commands/graph.js';
import { createDocsCommand } from './commands/docs.js';
import { createClaudeCommand } from './commands/claude.js';
import { createSyncCommand } from './commands/sync.js';
import { createStatsCommand } from './commands/stats.js';
import { createSearchCommand } from './commands/search.js';
import { createConvertCommand, createFrontmatterCommand } from './commands/convert.js';
import { createAnalyzeCommand } from './commands/analyze.js';
import { createSOPCommands } from './commands/sop.js';
import { createInitPrimitivesCommand, createAnalyzeCodebaseCommand } from './commands/init-primitives.js';
import { createCultivateCommand } from './commands/cultivate.js';
import { createCommitCommand } from './commands/commit.js';
import { createConfigCommand } from './commands/config.js';
import { createDiagnosticsCommand } from './commands/diagnostics.js';
import { createWorkflowCommand } from './commands/workflow.js';
import { createAuditCommand } from './commands/audit.js';
import { createVectorCommand } from './commands/vector.js';
import { createServeCommand } from './commands/serve.js';
import { createDashboardCommand } from './commands/dashboard.js';
import { createPluginCommand } from './commands/plugin.js';
import { createHiveMindCommand } from './commands/hive-mind/index.js';

/**
 * CLI version
 */
const VERSION = '0.4.0';

/**
 * Create and configure the CLI program
 */
export function createCLI(): Command {
  const program = new Command();

  program
    .name('kg')
    .description('Knowledge Graph Agent - Generate and manage knowledge graphs for Claude Code')
    .version(VERSION, '-v, --version', 'Display version number');

  // Configure help
  program.configureHelp({
    sortSubcommands: true,
    sortOptions: true,
  });

  // Add commands
  program.addCommand(createInitCommand());
  program.addCommand(createGraphCommand());
  program.addCommand(createDocsCommand());
  program.addCommand(createClaudeCommand());
  program.addCommand(createSyncCommand());
  program.addCommand(createStatsCommand());
  program.addCommand(createSearchCommand());
  program.addCommand(createConvertCommand());
  program.addCommand(createFrontmatterCommand());
  program.addCommand(createAnalyzeCommand());
  program.addCommand(createSOPCommands());
  program.addCommand(createInitPrimitivesCommand());
  program.addCommand(createAnalyzeCodebaseCommand());
  program.addCommand(createCultivateCommand());
  program.addCommand(createCommitCommand());
  program.addCommand(createConfigCommand());
  program.addCommand(createDiagnosticsCommand());
  program.addCommand(createWorkflowCommand());
  program.addCommand(createAuditCommand());
  program.addCommand(createVectorCommand());
  program.addCommand(createServeCommand());
  program.addCommand(createDashboardCommand());
  program.addCommand(createPluginCommand());
  program.addCommand(createHiveMindCommand());

  // Default action (show help)
  program.action(() => {
    console.log(chalk.cyan.bold('\n  Knowledge Graph Agent\n'));
    console.log(chalk.gray('  Generate and manage knowledge graphs for Claude Code\n'));

    console.log(chalk.white('  Quick Start:'));
    console.log(chalk.gray('    $ kg init                  # Initialize knowledge graph'));
    console.log(chalk.gray('    $ kg docs init             # Initialize docs directory'));
    console.log(chalk.gray('    $ kg graph                 # Generate knowledge graph'));
    console.log(chalk.gray('    $ kg claude update         # Update CLAUDE.md'));
    console.log(chalk.gray('    $ kg sync                  # Sync with claude-flow\n'));

    console.log(chalk.white('  Migration & Analysis:'));
    console.log(chalk.gray('    $ kg analyze               # Analyze & migrate to knowledge graph'));
    console.log(chalk.gray('    $ kg analyze deep          # Deep analysis with claude-flow'));
    console.log(chalk.gray('    $ kg analyze report        # Generate analysis report'));
    console.log(chalk.gray('    $ kg convert docs          # Convert docs/ → docs-nn/'));
    console.log(chalk.gray('    $ kg frontmatter add       # Add frontmatter to files'));
    console.log(chalk.gray('    $ kg frontmatter validate  # Validate frontmatter\n'));

    console.log(chalk.white('  AI-SDLC SOP Compliance:'));
    console.log(chalk.gray('    $ kg sop init              # Initialize SOP standards layer'));
    console.log(chalk.gray('    $ kg sop check             # Check compliance against SOPs'));
    console.log(chalk.gray('    $ kg sop gaps              # Analyze compliance gaps'));
    console.log(chalk.gray('    $ kg sop report            # Generate compliance report'));
    console.log(chalk.gray('    $ kg sop list              # List available SOPs\n'));

    console.log(chalk.white('  Cultivation & Primitives:'));
    console.log(chalk.gray('    $ kg init-primitives       # Bootstrap primitives from codebase'));
    console.log(chalk.gray('    $ kg analyze-codebase      # Analyze dependencies & services'));
    console.log(chalk.gray('    $ kg init-primitives --dry-run  # Preview without writing\n'));

    console.log(chalk.white('  Git Integration:'));
    console.log(chalk.gray('    $ kg commit                # Show status and suggested message'));
    console.log(chalk.gray('    $ kg commit -a             # Auto-commit with generated message'));
    console.log(chalk.gray('    $ kg commit -i             # Interactive commit mode'));
    console.log(chalk.gray('    $ kg commit -m "message"   # Commit with custom message'));
    console.log(chalk.gray('    $ kg commit status         # Show git status with analysis'));
    console.log(chalk.gray('    $ kg commit log            # Show recent commits'));
    console.log(chalk.gray('    $ kg commit diff           # Show diff of changes\n'));

    console.log(chalk.white('  Diagnostics & Health:'));
    console.log(chalk.gray('    $ kg diag run              # Run full diagnostics'));
    console.log(chalk.gray('    $ kg diag run --fix        # Attempt to fix issues'));
    console.log(chalk.gray('    $ kg diag health           # Check system health'));
    console.log(chalk.gray('    $ kg diag repair           # Repair database issues'));
    console.log(chalk.gray('    $ kg diag backup           # Create database backup'));
    console.log(chalk.gray('    $ kg diag backup --list    # List existing backups'));
    console.log(chalk.gray('    $ kg diag info             # Show system information\n'));

    console.log(chalk.white('  Workflow Management:'));
    console.log(chalk.gray('    $ kg workflow start <type> # Start a workflow'));
    console.log(chalk.gray('    $ kg workflow status [id]  # Check workflow status'));
    console.log(chalk.gray('    $ kg workflow list         # List active workflows'));
    console.log(chalk.gray('    $ kg workflow stop <id>    # Stop a workflow'));
    console.log(chalk.gray('    $ kg workflow history      # Show workflow history\n'));

    console.log(chalk.white('  Vector Operations:'));
    console.log(chalk.gray('    $ kg vector search <query> # Semantic search'));
    console.log(chalk.gray('    $ kg vector stats          # Vector store statistics'));
    console.log(chalk.gray('    $ kg vector rebuild        # Rebuild vector index'));
    console.log(chalk.gray('    $ kg vector traj list      # List trajectories'));
    console.log(chalk.gray('    $ kg vector traj show <id> # Show trajectory details'));
    console.log(chalk.gray('    $ kg vector traj patterns  # Show detected patterns\n'));

    console.log(chalk.white('  Audit & Exochain:'));
    console.log(chalk.gray('    $ kg audit query           # Query the audit log'));
    console.log(chalk.gray('    $ kg audit checkpoint      # Create a checkpoint'));
    console.log(chalk.gray('    $ kg audit verify          # Verify chain integrity'));
    console.log(chalk.gray('    $ kg audit sync status     # Check sync status'));
    console.log(chalk.gray('    $ kg audit sync peers      # List sync peers'));
    console.log(chalk.gray('    $ kg audit export          # Export audit log\n'));

    console.log(chalk.white('  Server Mode:'));
    console.log(chalk.gray('    $ kg serve                 # Start MCP server (stdio)'));
    console.log(chalk.gray('    $ kg serve --graphql       # Start GraphQL server'));
    console.log(chalk.gray('    $ kg serve --dashboard     # Start web dashboard'));
    console.log(chalk.gray('    $ kg serve --all           # Start all servers'));
    console.log(chalk.gray('    $ kg serve status          # Show server status\n'));

    console.log(chalk.white('  Dashboard:'));
    console.log(chalk.gray('    $ kg dashboard start       # Start dashboard dev server'));
    console.log(chalk.gray('    $ kg dashboard build       # Build dashboard for production'));
    console.log(chalk.gray('    $ kg dashboard serve       # Serve built dashboard'));
    console.log(chalk.gray('    $ kg dashboard open        # Open dashboard in browser'));
    console.log(chalk.gray('    $ kg dashboard status      # Check dashboard status\n'));

    console.log(chalk.white('  Plugin Management:'));
    console.log(chalk.gray('    $ kg plugin list           # List installed plugins'));
    console.log(chalk.gray('    $ kg plugin install <pkg>  # Install a plugin'));
    console.log(chalk.gray('    $ kg plugin uninstall <n>  # Uninstall a plugin'));
    console.log(chalk.gray('    $ kg plugin enable <name>  # Enable a plugin'));
    console.log(chalk.gray('    $ kg plugin disable <name> # Disable a plugin'));
    console.log(chalk.gray('    $ kg plugin info <name>    # Show plugin details'));
    console.log(chalk.gray('    $ kg plugin run <n> <file> # Run analyzer plugin'));
    console.log(chalk.gray('    $ kg plugin create <name>  # Create new plugin\n'));

    console.log(chalk.white('  Hive Mind (Graph Reconnection):'));
    console.log(chalk.gray('    $ kg hive-mind analyze-links <vault>     # Analyze wiki-links'));
    console.log(chalk.gray('    $ kg hive-mind find-connections <vault>  # Find potential links'));
    console.log(chalk.gray('    $ kg hive-mind validate-names <vault>    # Validate file names'));
    console.log(chalk.gray('    $ kg hive-mind add-frontmatter <vault>   # Add YAML frontmatter\n'));

    console.log(chalk.white('  Commands:'));
    program.commands.forEach(cmd => {
      console.log(chalk.cyan(`    ${cmd.name().padEnd(20)}`), chalk.gray(cmd.description() || ''));
    });

    console.log('\n  Run', chalk.cyan('kg <command> --help'), 'for more information\n');
  });

  return program;
}
