#!/usr/bin/env node
/**
 * MCP Server CLI Entry Point
 *
 * Command-line interface for the Weaver MCP server.
 * Provides version info, help, and configuration utilities.
 *
 * Commands:
 * - weaver-mcp            Start MCP server (default)
 * - weaver-mcp --version  Show version information
 * - weaver-mcp --help     Show help and usage
 * - weaver-mcp --check    Validate configuration
 */

import { program } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get package.json for version info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf-8')
);

// Configure CLI
program
  .name('weaver-mcp')
  .description('Weaver MCP Server - Expose vault metadata and workflows via MCP')
  .version(packageJson.version);

// Default command: Start MCP server
program
  .action(async () => {
    console.log('🧵 Starting Weaver MCP Server...');
    console.log(`Version: ${packageJson.version}`);
    console.log('');

    // Import and run MCP server bin
    // The bin.js file runs immediately when imported
    await import('./bin.js');
  });

// Check command: Validate configuration
program
  .command('check')
  .description('Validate MCP server configuration')
  .action(async () => {
    console.log('🔍 Checking Weaver MCP configuration...\n');

    try {
      // Check required environment variables
      const vaultPath = process.env['WEAVER_VAULT_PATH'];
      if (!vaultPath) {
        console.error('❌ WEAVER_VAULT_PATH environment variable not set');
        console.error('   Set it to your vault root directory');
        process.exit(1);
      }

      console.log(`✅ WEAVER_VAULT_PATH: ${vaultPath}`);

      // Check if vault path exists
      const { existsSync } = await import('fs');
      if (!existsSync(vaultPath)) {
        console.error(`❌ Vault directory not found: ${vaultPath}`);
        process.exit(1);
      }

      console.log('✅ Vault directory exists');

      // Check if vault contains .md files
      const { readdirSync } = await import('fs');
      const files = readdirSync(vaultPath);
      const mdFiles = files.filter((f) => f.endsWith('.md'));

      if (mdFiles.length === 0) {
        console.warn('⚠️  No .md files found in vault root');
        console.warn('   Vault may be empty or files in subdirectories');
      } else {
        console.log(`✅ Found ${mdFiles.length} markdown files in vault root`);
      }

      // Check shadow cache
      const dbPath = join(vaultPath, '.weaver', 'shadow-cache.db');
      if (existsSync(dbPath)) {
        console.log('✅ Shadow cache database exists');

        // Check database size
        const { statSync } = await import('fs');
        const stats = statSync(dbPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`   Database size: ${sizeMB} MB`);
      } else {
        console.warn('⚠️  Shadow cache not found');
        console.warn('   Will be created on first sync');
      }

      // Check log level
      const logLevel = process.env['WEAVER_LOG_LEVEL'] || 'info';
      console.log(`✅ Log level: ${logLevel}`);

      // Check workflows
      const workflowsEnabled = process.env['WORKFLOWS_ENABLED'] !== 'false';
      console.log(`✅ Workflows enabled: ${workflowsEnabled}`);

      console.log('\n✅ Configuration check passed!');
      console.log('   Run "weaver-mcp" to start the server');
    } catch (error) {
      console.error('❌ Configuration check failed:', error);
      process.exit(1);
    }
  });

// Info command: Show detailed server info
program
  .command('info')
  .description('Show detailed server information')
  .action(async () => {
    console.log('📊 Weaver MCP Server Information\n');

    console.log(`Version: ${packageJson.version}`);
    console.log(`Description: ${packageJson.description}`);
    console.log('');

    console.log('Available MCP Tools:');
    console.log('  Shadow Cache Tools (Query vault metadata):');
    console.log('    - query_files        Query vault files with filters');
    console.log('    - get_file           Get file metadata and content');
    console.log('    - get_file_content   Read file content');
    console.log('    - search_tags        Search files by tags');
    console.log('    - search_links       Find wikilinks between files');
    console.log('    - get_stats          Get vault statistics');
    console.log('');
    console.log('  Workflow Tools (Execute and monitor workflows):');
    console.log('    - trigger_workflow   Manually trigger a workflow');
    console.log('    - list_workflows     List all registered workflows');
    console.log('    - get_workflow_status   Check execution status');
    console.log('    - get_workflow_history  Get historical executions');
    console.log('');

    console.log('Environment Variables:');
    console.log('  WEAVER_VAULT_PATH       Path to vault root (required)');
    console.log('  WEAVER_DB_PATH          Custom shadow cache location (optional)');
    console.log('  WEAVER_LOG_LEVEL        Logging level (trace|debug|info|warn|error)');
    console.log('  WORKFLOWS_ENABLED       Enable workflow tools (true|false)');
    console.log('');

    console.log('Documentation:');
    console.log('  Setup Guide: docs/claude-desktop-setup.md');
    console.log('  GitHub: https://github.com/aepod/weave-nn');
  });

// Parse command line arguments
program.parse();
