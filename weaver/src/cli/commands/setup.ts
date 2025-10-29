/**
 * CLI command for automated setup and configuration
 */

import { Command } from 'commander';
import { existsSync, writeFileSync, mkdirSync, copyFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  formatSuccess,
  formatInfo,
  formatWarning,
  formatError,
  formatHeader,
} from '../utils/formatting.js';
import {
  showSpinner,
  succeedSpinner,
  failSpinner,
  updateSpinner,
} from '../utils/progress.js';

interface SetupOptions {
  vault?: string;
  skipMcp?: boolean;
  skipClaudeFlow?: boolean;
  skipEnv?: boolean;
}

export function createSetupCommand(): Command {
  return new Command('setup')
    .description('Automated setup and configuration')
    .addCommand(createClaudeFlowSetupCommand())
    .addCommand(createMcpSetupCommand())
    .addCommand(createEnvSetupCommand());
}

/**
 * Setup Claude-Flow integration (MCP + agent rules)
 */
function createClaudeFlowSetupCommand(): Command {
  return new Command('claude-flow')
    .description('Setup Claude-Flow integration with MCP server and agent rules')
    .option('--vault <path>', 'Vault path')
    .option('--skip-mcp', 'Skip Claude Desktop MCP configuration', false)
    .option('--skip-env', 'Skip .env file creation', false)
    .action(async (options: SetupOptions) => {
      console.log(formatHeader('🧵 Weaver + Claude-Flow Integration Setup'));
      console.log();

      try {
        // Get weaver root directory
        const weaverRoot = join(dirname(new URL(import.meta.url).pathname), '../../..');
        
        // Step 1: Check prerequisites
        const prereqSpinner = showSpinner('Checking prerequisites...');
        
        // Check if weaver CLI is available
        const weaverBin = join(weaverRoot, 'dist/cli/bin.js');
        if (!existsSync(weaverBin)) {
          failSpinner(prereqSpinner, 'Weaver CLI not built');
          console.log(formatError('Please run: npm run build:cli'));
          process.exit(1);
        }
        
        succeedSpinner(prereqSpinner, 'Prerequisites verified');

        // Step 2: Get vault path
        let vaultPath = options.vault;
        if (!vaultPath) {
          const answers = await inquirer.prompt([{
            type: 'input',
            name: 'vaultPath',
            message: 'Enter your vault path:',
            default: process.cwd(),
            validate: (value: string) => {
              if (!value) return 'Vault path is required';
              const expanded = value.replace(/^~/, homedir());
              if (!existsSync(expanded)) {
                return `Path does not exist: ${expanded}`;
              }
              return true;
            },
          }]);
          vaultPath = answers.vaultPath;
        }

        // Expand tilde and resolve path
        vaultPath = vaultPath.replace(/^~/, homedir());

        // Step 3: Setup Claude Desktop MCP
        if (!options.skipMcp) {
          const answers = await inquirer.prompt([{
            type: 'confirm',
            name: 'setupMcp',
            message: 'Configure Claude Desktop MCP server?',
            default: true,
          }]);

          if (answers.setupMcp) {
            await setupClaudeDesktopMcp(weaverRoot, vaultPath);
          }
        }

        // Step 4: Setup Claude-Flow config
        const cfSpinner = showSpinner('Setting up Claude-Flow configuration...');
        
        const claudeFlowConfigDir = join(homedir(), '.config/claude-flow');
        mkdirSync(claudeFlowConfigDir, { recursive: true });

        const mcpCliPath = join(weaverRoot, 'dist/mcp-server/cli.js');
        const cfConfig = {
          name: 'weaver',
          type: 'mcp-server',
          enabled: true,
          config: {
            command: 'node',
            args: [mcpCliPath],
            env: {
              VAULT_PATH: vaultPath,
              SHADOW_CACHE_PATH: join(vaultPath, '.shadow-cache.db'),
              LOG_LEVEL: 'info',
            },
          },
          tools: {
            enabled: [
              'weaver_search_vault',
              'weaver_get_file',
              'weaver_update_metadata',
              'weaver_search_tags',
              'weaver_cultivate',
              'weaver_init_vault',
            ],
          },
          rules: {
            auto_cultivate: true,
            auto_metadata: true,
            auto_commit: false,
          },
        };

        writeFileSync(
          join(claudeFlowConfigDir, 'weaver.json'),
          JSON.stringify(cfConfig, null, 2),
          'utf-8'
        );

        succeedSpinner(cfSpinner, 'Claude-Flow configuration created');

        // Step 5: Setup .env file
        if (!options.skipEnv) {
          const answers = await inquirer.prompt([{
            type: 'confirm',
            name: 'setupEnv',
            message: 'Create .env file with configuration?',
            default: true,
          }]);

          if (answers.setupEnv) {
            await setupEnvFile(weaverRoot, vaultPath);
          }
        }

        // Step 6: Copy agent rules
        const rulesSpinner = showSpinner('Setting up agent rules...');
        
        const agentRulesSource = join(weaverRoot, 'config/agent-rules.yaml');
        if (existsSync(agentRulesSource)) {
          succeedSpinner(rulesSpinner, `Agent rules available at ${agentRulesSource}`);
        } else {
          failSpinner(rulesSpinner, 'Agent rules not found');
          console.log(formatWarning('Run from project root or rebuild'));
        }

        // Step 7: Display summary
        console.log();
        console.log(formatHeader('✅ Setup Complete'));
        console.log();
        console.log(formatInfo('Configuration created:'));
        console.log(formatInfo(`  • Claude Desktop MCP: ~/.config/claude-desktop/config.json`));
        console.log(formatInfo(`  • Claude-Flow config: ~/.config/claude-flow/weaver.json`));
        console.log(formatInfo(`  • Vault path: ${vaultPath}`));
        console.log();
        console.log(formatSuccess('Next steps:'));
        console.log(formatSuccess('  1. Restart Claude Desktop to load MCP server'));
        console.log(formatSuccess('  2. Test: claude-flow mcp status weaver'));
        console.log(formatSuccess('  3. Try in Claude: "Search my vault for notes"'));
        console.log();

      } catch (error) {
        console.error(formatError('Setup failed:'), error);
        process.exit(1);
      }
    });
}

/**
 * Setup Claude Desktop MCP only
 */
function createMcpSetupCommand(): Command {
  return new Command('mcp')
    .description('Setup Claude Desktop MCP server configuration')
    .option('--vault <path>', 'Vault path')
    .action(async (options: SetupOptions) => {
      console.log(formatHeader('🔧 Claude Desktop MCP Setup'));
      console.log();

      try {
        const weaverRoot = join(dirname(new URL(import.meta.url).pathname), '../../..');
        
        let vaultPath = options.vault;
        if (!vaultPath) {
          const answers = await inquirer.prompt([{
            type: 'input',
            name: 'vaultPath',
            message: 'Enter your vault path:',
            default: process.cwd(),
          }]);
          vaultPath = answers.vaultPath;
        }

        vaultPath = vaultPath.replace(/^~/, homedir());

        await setupClaudeDesktopMcp(weaverRoot, vaultPath);

        console.log();
        console.log(formatSuccess('✅ MCP configuration complete'));
        console.log(formatInfo('Restart Claude Desktop to load the MCP server'));
      } catch (error) {
        console.error(formatError('MCP setup failed:'), error);
        process.exit(1);
      }
    });
}

/**
 * Setup .env file
 */
function createEnvSetupCommand(): Command {
  return new Command('env')
    .description('Create .env configuration file')
    .option('--vault <path>', 'Vault path')
    .action(async (options: SetupOptions) => {
      console.log(formatHeader('📝 Environment Configuration Setup'));
      console.log();

      try {
        const weaverRoot = join(dirname(new URL(import.meta.url).pathname), '../../..');
        
        let vaultPath = options.vault;
        if (!vaultPath) {
          const answers = await inquirer.prompt([{
            type: 'input',
            name: 'vaultPath',
            message: 'Enter your vault path:',
            default: process.cwd(),
          }]);
          vaultPath = answers.vaultPath;
        }

        vaultPath = vaultPath.replace(/^~/, homedir());

        await setupEnvFile(weaverRoot, vaultPath);

        console.log();
        console.log(formatSuccess('✅ .env file created'));
        console.log(formatInfo(`Edit ${join(weaverRoot, '.env')} to add API keys`));
      } catch (error) {
        console.error(formatError('Environment setup failed:'), error);
        process.exit(1);
      }
    });
}

/**
 * Helper: Setup Claude Desktop MCP configuration
 */
async function setupClaudeDesktopMcp(weaverRoot: string, vaultPath: string): Promise<void> {
  const mcpSpinner = showSpinner('Configuring Claude Desktop MCP...');

  const claudeConfigDir = join(homedir(), '.config/claude-desktop');
  const claudeConfigFile = join(claudeConfigDir, 'config.json');

  // Create config directory
  mkdirSync(claudeConfigDir, { recursive: true });

  // Backup existing config
  if (existsSync(claudeConfigFile)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `${claudeConfigFile}.backup.${timestamp}`;
    copyFileSync(claudeConfigFile, backupFile);
    updateSpinner(mcpSpinner, 'Backed up existing config');
  }

  // Create MCP config
  const mcpCliPath = join(weaverRoot, 'dist/mcp-server/cli.js');
  
  let existingConfig: any = {};
  if (existsSync(claudeConfigFile)) {
    try {
      existingConfig = JSON.parse(readFileSync(claudeConfigFile, 'utf-8'));
    } catch {
      // Ignore parse errors, start fresh
    }
  }

  const mcpConfig = {
    ...existingConfig,
    mcpServers: {
      ...(existingConfig.mcpServers || {}),
      weaver: {
        command: 'node',
        args: [mcpCliPath],
        env: {
          VAULT_PATH: vaultPath,
          SHADOW_CACHE_PATH: join(vaultPath, '.shadow-cache.db'),
          LOG_LEVEL: 'info',
        },
      },
    },
  };

  writeFileSync(claudeConfigFile, JSON.stringify(mcpConfig, null, 2), 'utf-8');

  succeedSpinner(mcpSpinner, 'Claude Desktop MCP configured');
  console.log(formatInfo(`  Config: ${claudeConfigFile}`));
  console.log(formatInfo(`  Vault: ${vaultPath}`));
}

/**
 * Helper: Setup .env file
 */
async function setupEnvFile(weaverRoot: string, vaultPath: string): Promise<void> {
  const envSpinner = showSpinner('Creating .env file...');

  const envPath = join(weaverRoot, '.env');
  
  if (existsSync(envPath)) {
    const answers = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: '.env file already exists. Overwrite?',
      default: false,
    }]);

    if (!answers.overwrite) {
      failSpinner(envSpinner, 'Skipped .env creation');
      return;
    }
  }

  const envContent = `# Vault Configuration
VAULT_PATH=${vaultPath}
SHADOW_CACHE_PATH=${vaultPath}/.shadow-cache.db

# MCP Server
MCP_PORT=3000
MCP_HOST=localhost

# Logging
LOG_LEVEL=info
LOG_FILE=logs/weaver.log

# Claude-Flow Integration
CLAUDE_FLOW_ENABLED=true
CLAUDE_FLOW_AUTO_CULTIVATE=true
CLAUDE_FLOW_AUTO_COMMIT=false

# API Keys (optional - for AI features)
# ANTHROPIC_API_KEY=sk-ant-...
# TAVILY_API_KEY=tvly-...
`;

  writeFileSync(envPath, envContent, 'utf-8');

  succeedSpinner(envSpinner, '.env file created');
  console.log(formatInfo(`  Path: ${envPath}`));
}
