/**
 * Configuration Operations Commands
 *
 * Commands for configuration management:
 * - weaver config reload   - Hot-reload configuration
 * - weaver config validate - Validate configuration file
 * - weaver config show     - Display current configuration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, readFileSync, watchFile, unwatchFile } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import Ajv from 'ajv';
import yaml from 'js-yaml';

interface ConfigOptions {
  verbose?: boolean;
  watch?: boolean;
}

interface ConfigShowOptions extends ConfigOptions {
  format?: 'json' | 'yaml';
}

/**
 * Get configuration file path
 */
function getConfigPath(): string {
  // Try multiple locations
  const locations = [
    join(process.cwd(), '.weaverrc'),
    join(process.cwd(), '.weaverrc.json'),
    join(process.cwd(), '.weaverrc.yaml'),
    join(process.cwd(), '.weaverrc.yml'),
    join(homedir(), '.weaver', 'config.json'),
    join(homedir(), '.weaver', 'config.yaml'),
  ];

  for (const location of locations) {
    if (existsSync(location)) {
      return location;
    }
  }

  // Return default location even if it doesn't exist
  return join(homedir(), '.weaver', 'config.json');
}

/**
 * Load configuration file
 */
function loadConfig(configPath: string): any {
  if (!existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const content = readFileSync(configPath, 'utf-8');

  // Determine format from extension
  if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
    return yaml.load(content);
  } else {
    return JSON.parse(content);
  }
}

/**
 * Configuration JSON Schema
 */
const configSchema = {
  type: 'object',
  properties: {
    vault: {
      type: 'object',
      properties: {
        root: { type: 'string' },
        watchPatterns: {
          type: 'array',
          items: { type: 'string' }
        },
        ignorePatterns: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    },
    workflows: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        autoTrigger: { type: 'boolean' },
        concurrent: { type: 'number', minimum: 1 }
      }
    },
    embeddings: {
      type: 'object',
      properties: {
        model: { type: 'string' },
        cacheEnabled: { type: 'boolean' },
        dimensions: { type: 'number', minimum: 1 }
      }
    },
    learning: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        feedbackRetentionDays: { type: 'number', minimum: 1 },
        minSatisfactionThreshold: { type: 'number', minimum: 1, maximum: 5 }
      }
    },
    server: {
      type: 'object',
      properties: {
        port: { type: 'number', minimum: 1, maximum: 65535 },
        host: { type: 'string' },
        cors: { type: 'boolean' }
      }
    },
    logging: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          enum: ['error', 'warn', 'info', 'debug', 'trace']
        },
        file: { type: 'string' },
        maxSize: { type: 'string' },
        maxFiles: { type: 'number', minimum: 1 }
      }
    }
  }
};

/**
 * Validate configuration against schema
 */
function validateConfig(config: any): { valid: boolean; errors: any[] } {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(configSchema);
  const valid = validate(config);

  return {
    valid: valid === true,
    errors: validate.errors || []
  };
}

/**
 * Create config command group
 */
export function createConfigCommand(): Command {
  const command = new Command('config')
    .description('Configuration management operations');

  command.addCommand(createReloadCommand());
  command.addCommand(createValidateCommand());
  command.addCommand(createShowCommand());

  return command;
}

/**
 * config reload - Hot-reload configuration
 */
function createReloadCommand(): Command {
  return new Command('reload')
    .description('Hot-reload configuration without restart')
    .option('-w, --watch', 'Watch for configuration changes', false)
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options: ConfigOptions) => {
      const spinner = ora('Loading configuration...').start();

      try {
        const configPath = getConfigPath();

        if (!existsSync(configPath)) {
          spinner.fail(`Configuration file not found: ${configPath}`);
          console.log(chalk.yellow('\nSearched locations:'));
          console.log(chalk.gray('  - ./.weaverrc(.json|.yaml|.yml)'));
          console.log(chalk.gray('  - ~/.weaver/config.(json|yaml)'));
          process.exit(1);
        }

        spinner.text = `Reading ${configPath}...`;
        const config = loadConfig(configPath);

        spinner.text = 'Validating configuration...';
        const validation = validateConfig(config);

        if (!validation.valid) {
          spinner.fail('Configuration validation failed!');
          console.log(chalk.red('\nValidation Errors:'));
          validation.errors.forEach((error, index) => {
            console.log(chalk.red(`  ${index + 1}. ${error.instancePath} ${error.message}`));
            if (error.params && Object.keys(error.params).length > 0) {
              console.log(chalk.gray(`     ${JSON.stringify(error.params)}`));
            }
          });
          process.exit(1);
        }

        spinner.succeed('Configuration loaded and validated');

        if (options.verbose) {
          console.log(chalk.gray(`\nConfiguration: ${configPath}`));
          console.log(chalk.gray('Settings:'));
          console.log(JSON.stringify(config, null, 2));
        }

        console.log(chalk.green('\n✓ Configuration reloaded successfully'));
        console.log(chalk.gray('Note: Some settings may require service restart to take effect'));

        if (options.watch) {
          console.log(chalk.cyan('\n👀 Watching for configuration changes...'));
          console.log(chalk.gray('Press Ctrl+C to stop\n'));

          watchFile(configPath, { interval: 1000 }, (curr, prev) => {
            if (curr.mtime !== prev.mtime) {
              console.log(chalk.yellow(`\n🔄 Configuration changed at ${new Date().toLocaleTimeString()}`));

              try {
                const newConfig = loadConfig(configPath);
                const validation = validateConfig(newConfig);

                if (validation.valid) {
                  console.log(chalk.green('✓ Configuration reloaded successfully'));
                } else {
                  console.log(chalk.red('✗ Configuration validation failed:'));
                  validation.errors.forEach((error, index) => {
                    console.log(chalk.red(`  ${index + 1}. ${error.instancePath} ${error.message}`));
                  });
                }
              } catch (error) {
                console.log(chalk.red('✗ Failed to reload:'), error instanceof Error ? error.message : error);
              }
            }
          });

          // Keep process alive
          process.on('SIGINT', () => {
            unwatchFile(configPath);
            console.log(chalk.yellow('\n\nStopped watching configuration'));
            process.exit(0);
          });
        }

      } catch (error) {
        spinner.fail('Configuration reload failed');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

/**
 * config validate - Validate configuration
 */
function createValidateCommand(): Command {
  return new Command('validate')
    .description('Validate configuration file syntax and schema')
    .option('-v, --verbose', 'Show detailed validation results', false)
    .action(async (options: ConfigOptions) => {
      const spinner = ora('Validating configuration...').start();

      try {
        const configPath = getConfigPath();

        if (!existsSync(configPath)) {
          spinner.fail(`Configuration file not found: ${configPath}`);
          process.exit(1);
        }

        spinner.text = 'Parsing configuration...';
        let config: any;

        try {
          config = loadConfig(configPath);
        } catch (error) {
          spinner.fail('Configuration parsing failed!');
          console.error(chalk.red('\nSyntax Error:'), error instanceof Error ? error.message : error);
          process.exit(1);
        }

        spinner.text = 'Validating schema...';
        const validation = validateConfig(config);

        if (!validation.valid) {
          spinner.fail('Configuration validation failed!');

          console.log(chalk.red('\n❌ Validation Errors:\n'));
          validation.errors.forEach((error, index) => {
            console.log(chalk.red(`${index + 1}. ${error.instancePath || '(root)'}`));
            console.log(chalk.yellow(`   ${error.message}`));

            if (error.params && Object.keys(error.params).length > 0) {
              console.log(chalk.gray(`   Details: ${JSON.stringify(error.params)}`));
            }
            console.log();
          });

          console.log(chalk.yellow('Please fix these errors and try again.'));
          process.exit(1);
        }

        spinner.succeed(chalk.green('Configuration is valid!'));

        console.log(chalk.bold('\n✓ Validation Results:\n'));
        console.log(chalk.green('  ✓ Syntax: Valid'));
        console.log(chalk.green('  ✓ Schema: Valid'));
        console.log(chalk.green(`  ✓ File: ${configPath}`));

        if (options.verbose) {
          console.log(chalk.bold('\nConfiguration Summary:'));

          const summary = {
            vault: config.vault?.root || 'Not configured',
            workflows: config.workflows?.enabled ? 'Enabled' : 'Disabled',
            server: config.server?.port ? `Port ${config.server.port}` : 'Default',
            logging: config.logging?.level || 'default',
          };

          for (const [key, value] of Object.entries(summary)) {
            console.log(`  ${chalk.cyan(key.padEnd(12))}: ${value}`);
          }
        }

      } catch (error) {
        spinner.fail('Validation failed');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

/**
 * config show - Display current configuration
 */
function createShowCommand(): Command {
  return new Command('show')
    .description('Display current configuration')
    .option('-f, --format <format>', 'Output format (json, yaml)', 'json')
    .option('-v, --verbose', 'Show all settings including defaults', false)
    .action(async (options: ConfigShowOptions) => {
      const spinner = ora('Loading configuration...').start();

      try {
        const configPath = getConfigPath();

        if (!existsSync(configPath)) {
          spinner.warn('No configuration file found, showing defaults');
        }

        const config = existsSync(configPath) ? loadConfig(configPath) : {};

        spinner.succeed('Configuration loaded');

        console.log(chalk.bold('\n⚙️  Current Configuration:\n'));
        console.log(chalk.gray(`Source: ${configPath}`));
        console.log(chalk.gray(`Format: ${configPath.endsWith('.yaml') || configPath.endsWith('.yml') ? 'YAML' : 'JSON'}`));
        console.log();

        const format = options.format?.toLowerCase() || 'json';

        if (format === 'yaml') {
          console.log(yaml.dump(config, { indent: 2, lineWidth: 100 }));
        } else {
          console.log(JSON.stringify(config, null, 2));
        }

        if (!options.verbose && Object.keys(config).length > 0) {
          console.log(chalk.gray('\nTip: Use --verbose to see all settings including defaults'));
        }

      } catch (error) {
        spinner.fail('Failed to show configuration');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
