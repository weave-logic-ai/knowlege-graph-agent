/**
 * Config Command
 *
 * Manage knowledge graph configuration.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createConfigManager, getDefaultConfig } from '../../config/index.js';
import type { KGConfiguration } from '../../config/index.js';

export function createConfigCommand(): Command {
  const config = new Command('config')
    .description('Manage knowledge graph configuration');

  config
    .command('show')
    .description('Show current configuration')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const manager = createConfigManager();
        await manager.load();
        const currentConfig = manager.get();

        if (options.json) {
          console.log(JSON.stringify(currentConfig, null, 2));
        } else {
          console.log(chalk.cyan.bold('\nKnowledge Graph Configuration\n'));
          console.log(chalk.white('Database:'));
          console.log(chalk.gray(`  Path: ${currentConfig.database.path}`));
          console.log(chalk.gray(`  WAL Mode: ${currentConfig.database.walMode}`));
          console.log(chalk.gray(`  Cache Size: ${currentConfig.database.cacheSize} pages`));

          if (currentConfig.cache) {
            console.log(chalk.white('\nCache:'));
            console.log(chalk.gray(`  Enabled: ${currentConfig.cache.enabled}`));
            console.log(chalk.gray(`  Max Size: ${(currentConfig.cache.maxSize || 0) / (1024 * 1024)}MB`));
            console.log(chalk.gray(`  Policy: ${currentConfig.cache.evictionPolicy}`));
          }

          if (currentConfig.logging) {
            console.log(chalk.white('\nLogging:'));
            console.log(chalk.gray(`  Level: ${currentConfig.logging.level}`));
            console.log(chalk.gray(`  Format: ${currentConfig.logging.format}`));
          }

          console.log('');
        }
      } catch (error) {
        console.error(chalk.red('Error reading configuration:'), error);
        process.exit(1);
      }
    });

  config
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action(async (key: string, value: string) => {
      try {
        const manager = createConfigManager();
        await manager.load();

        // Parse the key path (e.g., 'database.path')
        const parts = key.split('.');
        const updates: Partial<KGConfiguration> = {};

        if (parts[0] === 'database' && parts[1]) {
          updates.database = { path: '', [parts[1]]: parseValue(value) } as any;
        } else if (parts[0] === 'cache' && parts[1]) {
          updates.cache = { enabled: true, [parts[1]]: parseValue(value) } as any;
        } else if (parts[0] === 'logging' && parts[1]) {
          updates.logging = { level: 'info', [parts[1]]: parseValue(value) } as any;
        } else {
          (updates as any)[key] = parseValue(value);
        }

        manager.update(updates);
        await manager.save();

        console.log(chalk.green(`Configuration updated: ${key} = ${value}`));
      } catch (error) {
        console.error(chalk.red('Error updating configuration:'), error);
        process.exit(1);
      }
    });

  config
    .command('reset')
    .description('Reset configuration to defaults')
    .option('-y, --yes', 'Skip confirmation')
    .action(async (options) => {
      try {
        const manager = createConfigManager();
        manager.reset();
        await manager.save();
        console.log(chalk.green('Configuration reset to defaults'));
      } catch (error) {
        console.error(chalk.red('Error resetting configuration:'), error);
        process.exit(1);
      }
    });

  config
    .command('validate')
    .description('Validate current configuration')
    .action(async () => {
      try {
        const manager = createConfigManager();
        await manager.load();
        const result = manager.validate();

        if (result.valid) {
          console.log(chalk.green('Configuration is valid'));
        } else {
          console.log(chalk.red('Configuration has errors:'));
          result.errors.forEach((err: string) => {
            console.log(chalk.yellow(`  - ${err}`));
          });
          process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red('Error validating configuration:'), error);
        process.exit(1);
      }
    });

  config
    .command('defaults')
    .description('Show default configuration values')
    .action(() => {
      const defaults = getDefaultConfig();
      console.log(chalk.cyan.bold('\nDefault Configuration:\n'));
      console.log(JSON.stringify(defaults, null, 2));
    });

  return config;
}

function parseValue(value: string): string | number | boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  const num = Number(value);
  if (!isNaN(num)) return num;
  return value;
}
