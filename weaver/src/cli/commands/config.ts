/**
 * Configuration CLI Commands
 *
 * Provides CLI interface for configuration management:
 * - weaver config show - Display current configuration
 * - weaver config set <key> <value> - Update configuration
 * - weaver config reset - Reset to defaults
 * - weaver config diff - Show differences from defaults
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { getConfigManager } from '../../config/index.js';

/**
 * Format configuration for display
 */
function formatConfig(config: any, indent: number = 0): string {
  const lines: string[] = [];
  const spacing = '  '.repeat(indent);

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      lines.push(`${spacing}${chalk.cyan(key)}:`);
      lines.push(formatConfig(value, indent + 1));
    } else if (Array.isArray(value)) {
      lines.push(`${spacing}${chalk.cyan(key)}: ${chalk.yellow(JSON.stringify(value))}`);
    } else if (typeof value === 'boolean') {
      lines.push(`${spacing}${chalk.cyan(key)}: ${value ? chalk.green('true') : chalk.red('false')}`);
    } else if (typeof value === 'number') {
      lines.push(`${spacing}${chalk.cyan(key)}: ${chalk.yellow(value)}`);
    } else {
      lines.push(`${spacing}${chalk.cyan(key)}: ${chalk.white(value)}`);
    }
  }

  return lines.join('\n');
}

/**
 * Parse value from string
 */
function parseValue(value: string): any {
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Number
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

  // Array (comma-separated)
  if (value.includes(',')) {
    return value.split(',').map(s => s.trim());
  }

  // String
  return value;
}

/**
 * Create config command
 */
export function createConfigCommand(): Command {
  const configCmd = new Command('config')
    .description('Manage Weaver configuration');

  // Show current configuration
  configCmd
    .command('show')
    .description('Display current active configuration (with masked secrets)')
    .option('-r, --raw', 'Show raw JSON output')
    .option('-k, --key <key>', 'Show specific configuration key')
    .action(async (options) => {
      try {
        const manager = getConfigManager();
        await manager.load();

        const config = options.key
          ? manager.get(options.key)
          : manager.getMasked();

        if (options.raw) {
          console.log(JSON.stringify(config, null, 2));
        } else {
          console.log(chalk.bold('\n📋 Current Configuration:\n'));
          if (typeof config === 'object') {
            console.log(formatConfig(config));
          } else {
            console.log(`${chalk.cyan(options.key)}: ${chalk.white(config)}`);
          }
          console.log();
        }
      } catch (error) {
        console.error(chalk.red('Error loading configuration:'), error);
        process.exit(1);
      }
    });

  // Set configuration value
  configCmd
    .command('set')
    .description('Update configuration value and save to file')
    .argument('<key>', 'Configuration key (use dot notation for nested keys)')
    .argument('<value>', 'Value to set')
    .option('--no-persist', 'Do not save to config file')
    .action(async (key: string, value: string, options) => {
      try {
        const manager = getConfigManager();
        await manager.load();

        const parsedValue = parseValue(value);

        await manager.set(key, parsedValue, options.persist);

        console.log(chalk.green('✓'), `Configuration updated: ${chalk.cyan(key)} = ${chalk.yellow(JSON.stringify(parsedValue))}`);

        if (options.persist) {
          console.log(chalk.dim(`  Saved to user configuration file`));
        }
      } catch (error) {
        console.error(chalk.red('Error updating configuration:'), error);
        process.exit(1);
      }
    });

  // Reset configuration
  configCmd
    .command('reset')
    .description('Reset configuration to defaults')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (options) => {
      try {
        if (!options.yes) {
          const { default: inquirer } = await import('inquirer');
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Are you sure you want to reset all configuration to defaults?',
              default: false,
            },
          ]);

          if (!confirm) {
            console.log(chalk.yellow('Reset cancelled'));
            return;
          }
        }

        const manager = getConfigManager();
        await manager.load();
        await manager.reset();

        console.log(chalk.green('✓'), 'Configuration reset to defaults');
      } catch (error) {
        console.error(chalk.red('Error resetting configuration:'), error);
        process.exit(1);
      }
    });

  // Show differences from defaults
  configCmd
    .command('diff')
    .description('Show differences from default configuration')
    .option('-r, --raw', 'Show raw JSON output')
    .action(async (options) => {
      try {
        const manager = getConfigManager();
        await manager.load();

        const diff = manager.getDiff();

        if (Object.keys(diff).length === 0) {
          console.log(chalk.green('✓'), 'No differences from default configuration');
          return;
        }

        if (options.raw) {
          console.log(JSON.stringify(diff, null, 2));
        } else {
          console.log(chalk.bold('\n📝 Configuration Differences:\n'));
          console.log(formatConfig(diff));
          console.log();
        }
      } catch (error) {
        console.error(chalk.red('Error calculating diff:'), error);
        process.exit(1);
      }
    });

  // Get configuration value
  configCmd
    .command('get')
    .description('Get specific configuration value')
    .argument('<key>', 'Configuration key (use dot notation)')
    .option('-r, --raw', 'Show raw value without formatting')
    .action(async (key: string, options) => {
      try {
        const manager = getConfigManager();
        await manager.load();

        const value = manager.get(key);

        if (value === undefined) {
          console.error(chalk.red(`Configuration key not found: ${key}`));
          process.exit(1);
        }

        if (options.raw) {
          console.log(typeof value === 'object' ? JSON.stringify(value) : String(value));
        } else {
          console.log(`${chalk.cyan(key)}: ${chalk.white(JSON.stringify(value, null, 2))}`);
        }
      } catch (error) {
        console.error(chalk.red('Error getting configuration:'), error);
        process.exit(1);
      }
    });

  // List all configuration keys
  configCmd
    .command('keys')
    .description('List all available configuration keys')
    .option('-f, --filter <pattern>', 'Filter keys by pattern')
    .action(async (options) => {
      try {
        const manager = getConfigManager();
        await manager.load();

        const config = manager.get();
        const keys: string[] = [];

        const extractKeys = (obj: any, prefix: string = ''): void => {
          for (const key in obj) {
            const path = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              extractKeys(obj[key], path);
            } else {
              keys.push(path);
            }
          }
        };

        extractKeys(config);

        const filteredKeys = options.filter
          ? keys.filter(k => k.includes(options.filter))
          : keys;

        console.log(chalk.bold('\n📋 Available Configuration Keys:\n'));
        filteredKeys.forEach(key => {
          console.log(`  ${chalk.cyan(key)}`);
        });
        console.log(`\n${chalk.dim(`Total: ${filteredKeys.length} keys`)}\n`);
      } catch (error) {
        console.error(chalk.red('Error listing keys:'), error);
        process.exit(1);
      }
    });

  return configCmd;
}
