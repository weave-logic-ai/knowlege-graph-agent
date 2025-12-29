/**
 * Plugin Command
 *
 * CLI commands for managing knowledge graph plugins.
 * Provides listing, installation, enabling/disabling, and running plugins.
 *
 * @module cli/commands/plugin
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve, basename } from 'path';
import { validateProjectRoot } from '../../core/security.js';
import {
  createDefaultPluginManager,
  PluginManagerImpl,
} from '../../plugins/manager.js';
import type {
  PluginType,
  PluginHook,
  KGPluginManifest,
  AnalyzerPlugin,
  isAnalyzerPlugin,
} from '../../plugins/types.js';

/**
 * Format plugin type with color
 */
function formatType(type: PluginType): string {
  const colors: Record<PluginType, (s: string) => string> = {
    analyzer: chalk.cyan,
    transformer: chalk.magenta,
    exporter: chalk.blue,
    importer: chalk.green,
    integration: chalk.yellow,
    visualization: chalk.red,
    storage: chalk.gray,
    agent: chalk.white,
    hook: chalk.dim,
    generic: chalk.reset,
  };
  return (colors[type] || chalk.reset)(type);
}

/**
 * Format status with color
 */
function formatStatus(enabled: boolean, loaded: boolean): string {
  if (!enabled) {
    return chalk.gray('disabled');
  }
  if (loaded) {
    return chalk.green('active');
  }
  return chalk.yellow('enabled');
}

/**
 * Create a simple table row
 */
function tableRow(
  name: string,
  version: string,
  type: string,
  status: string,
  maxNameWidth: number = 30
): string {
  const nameCol = name.length > maxNameWidth
    ? name.slice(0, maxNameWidth - 3) + '...'
    : name.padEnd(maxNameWidth);
  return `  ${nameCol}  ${version.padEnd(10)}  ${type.padEnd(14)}  ${status}`;
}

/**
 * Plugin template for creating new plugins
 */
const PLUGIN_TEMPLATE = {
  'package.json': (name: string, type: PluginType = 'analyzer') => `{
  "name": "${name}",
  "version": "1.0.0",
  "description": "A custom knowledge graph plugin",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "kg-plugin": {
    "type": "${type}",
    "main": "dist/index.js",
    "displayName": "${name.split('/').pop()?.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') || name}",
    "hooks": [],
    "capabilities": [],
    "configSchema": {
      "type": "object",
      "properties": {},
      "defaults": {}
    }
  },
  "keywords": [
    "kg-plugin",
    "knowledge-graph"
  ],
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "peerDependencies": {
    "@weavelogic/knowledge-graph-agent": "*"
  }
}`,

  'tsconfig.json': () => `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,

  'src/index.ts': (name: string, type: PluginType = 'analyzer') => {
    const pluginName = name.split('/').pop() || name;
    const className = pluginName
      .split('-')
      .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('') + 'Plugin';

    if (type === 'analyzer') {
      return `/**
 * ${className}
 *
 * A custom analyzer plugin for knowledge graphs.
 */

import type {
  AnalyzerPlugin,
  PluginContext,
  AnalysisInput,
  AnalysisResult,
} from '@weavelogic/knowledge-graph-agent';

export class ${className} implements AnalyzerPlugin {
  readonly name = '${name}';
  readonly version = '1.0.0';
  readonly type = 'analyzer' as const;
  readonly supportedContentTypes = ['markdown', 'md', 'txt'];

  private context?: PluginContext;

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    context.logger.info('${className} initialized');
  }

  async destroy(): Promise<void> {
    this.context?.logger.info('${className} destroyed');
  }

  canAnalyze(contentType: string): boolean {
    return this.supportedContentTypes.includes(contentType.toLowerCase());
  }

  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      // Implement your analysis logic here
      const entities: AnalysisResult['entities'] = [];
      const relationships: AnalysisResult['relationships'] = [];
      const tags: AnalysisResult['tags'] = [];

      // Example: Extract simple patterns
      const lines = input.content.split('\\n');
      let wordCount = 0;

      for (const line of lines) {
        wordCount += line.split(/\\s+/).filter(Boolean).length;

        // Extract headings as entities
        const headingMatch = line.match(/^(#{1,6})\\s+(.+)$/);
        if (headingMatch) {
          entities.push({
            id: \`heading-\${entities.length}\`,
            type: 'heading',
            value: headingMatch[2].trim(),
            confidence: 1.0,
          });
        }

        // Extract links as relationships
        const linkMatches = line.matchAll(/\\[\\[([^\\]]+)\\]\\]/g);
        for (const match of linkMatches) {
          relationships.push({
            sourceId: input.filePath || input.id,
            targetId: match[1],
            type: 'references',
            confidence: 1.0,
          });
        }
      }

      return {
        success: true,
        analysisType: this.name,
        entities,
        relationships,
        tags,
        metrics: {
          durationMs: Date.now() - startTime,
          entitiesFound: entities.length,
          relationshipsFound: relationships.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        analysisType: this.name,
        error: {
          code: 'ANALYSIS_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
        metrics: {
          durationMs: Date.now() - startTime,
        },
      };
    }
  }

  async *analyzeStream(input: AnalysisInput): AsyncIterable<import('@weavelogic/knowledge-graph-agent').AnalysisStreamChunk> {
    yield {
      type: 'progress',
      data: 'Starting analysis...',
      progress: 0,
      timestamp: new Date(),
    };

    const result = await this.analyze(input);

    if (result.entities) {
      for (const entity of result.entities) {
        yield {
          type: 'entity',
          data: entity,
          timestamp: new Date(),
        };
      }
    }

    if (result.relationships) {
      for (const rel of result.relationships) {
        yield {
          type: 'relationship',
          data: rel,
          timestamp: new Date(),
        };
      }
    }

    yield {
      type: 'complete',
      data: result,
      progress: 100,
      timestamp: new Date(),
    };
  }
}

export default new ${className}();
`;
    }

    // Generic plugin template
    return `/**
 * ${className}
 *
 * A custom plugin for knowledge graphs.
 */

import type {
  KGPlugin,
  PluginContext,
} from '@weavelogic/knowledge-graph-agent';

export class ${className} implements KGPlugin {
  readonly name = '${name}';
  readonly version = '1.0.0';
  readonly type = '${type}' as const;

  private context?: PluginContext;

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    context.logger.info('${className} initialized');
  }

  async destroy(): Promise<void> {
    this.context?.logger.info('${className} destroyed');
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    message?: string;
    details?: Record<string, unknown>;
  }> {
    return {
      healthy: true,
      message: '${className} is running',
    };
  }
}

export default new ${className}();
`;
  },

  'README.md': (name: string) => `# ${name}

A custom knowledge graph plugin.

## Installation

\`\`\`bash
kg plugin install ./${name}
\`\`\`

## Usage

Once installed, the plugin will automatically be loaded.

## Development

\`\`\`bash
npm install
npm run build
\`\`\`

## License

MIT
`,
};

/**
 * Create plugin command
 */
export function createPluginCommand(): Command {
  const command = new Command('plugin');

  command
    .description('Manage knowledge graph plugins')
    .action(() => {
      console.log(chalk.cyan.bold('\n  Plugin Commands\n'));
      console.log(chalk.gray('  Manage plugins for the knowledge graph agent.\n'));
      console.log(chalk.white('  Usage:'));
      console.log(chalk.gray('    kg plugin list                    List installed plugins'));
      console.log(chalk.gray('    kg plugin install <name|path>     Install a plugin'));
      console.log(chalk.gray('    kg plugin uninstall <name>        Uninstall a plugin'));
      console.log(chalk.gray('    kg plugin enable <name>           Enable a plugin'));
      console.log(chalk.gray('    kg plugin disable <name>          Disable a plugin'));
      console.log(chalk.gray('    kg plugin info <name>             Show plugin details'));
      console.log(chalk.gray('    kg plugin run <name> [file]       Run analyzer plugin'));
      console.log(chalk.gray('    kg plugin create <name>           Create new plugin\n'));
    });

  // List command
  command
    .command('list')
    .alias('ls')
    .description('List installed plugins')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('--json', 'Output as JSON')
    .option('-a, --all', 'Show all discovered plugins including invalid ones')
    .action(async (options) => {
      const spinner = ora('Discovering plugins...').start();

      try {
        const projectRoot = validateProjectRoot(options.path);
        const manager = createDefaultPluginManager(projectRoot) as PluginManagerImpl;

        const discovered = await manager.loader.discover();

        spinner.stop();

        if (discovered.length === 0) {
          console.log(chalk.yellow('\n  No plugins found.\n'));
          console.log(chalk.gray('  Install plugins with:'));
          console.log(chalk.cyan('    kg plugin install <package-name>'));
          console.log(chalk.cyan('    kg plugin install ./path/to/plugin\n'));
          return;
        }

        // Filter if not showing all
        const plugins = options.all
          ? discovered
          : discovered.filter((d) => d.valid);

        if (options.json) {
          console.log(JSON.stringify(plugins.map((p) => ({
            name: p.manifest.name,
            version: p.manifest.version,
            type: p.manifest['kg-plugin'].type,
            valid: p.valid,
            path: p.path,
            description: p.manifest.description,
          })), null, 2));
          return;
        }

        console.log(chalk.cyan.bold('\n  Installed Plugins\n'));

        // Table header
        const maxNameWidth = Math.max(
          30,
          ...plugins.map((p) => p.manifest.name.length)
        );
        console.log(chalk.white(
          `  ${'NAME'.padEnd(maxNameWidth)}  ${'VERSION'.padEnd(10)}  ${'TYPE'.padEnd(14)}  STATUS`
        ));
        console.log(chalk.gray('  ' + '-'.repeat(maxNameWidth + 40)));

        for (const plugin of plugins) {
          const name = plugin.manifest.name;
          const version = plugin.manifest.version;
          const type = formatType(plugin.manifest['kg-plugin'].type);
          const status = plugin.valid
            ? formatStatus(true, manager.loader.isLoaded(name))
            : chalk.red('invalid');

          console.log(tableRow(name, version, type, status, maxNameWidth));

          if (!plugin.valid && plugin.errors) {
            for (const error of plugin.errors) {
              console.log(chalk.red(`    - ${error}`));
            }
          }
        }

        console.log();

        // Summary
        const activeCount = plugins.filter((p) => p.valid).length;
        const invalidCount = plugins.filter((p) => !p.valid).length;

        console.log(chalk.gray(`  Total: ${plugins.length} plugins`));
        if (invalidCount > 0) {
          console.log(chalk.yellow(`  Invalid: ${invalidCount} plugins`));
        }
        console.log();

      } catch (error) {
        spinner.fail('Failed to list plugins');
        console.error(chalk.red(String(error)));
        process.exit(1);
      }
    });

  // Install command
  command
    .command('install <source>')
    .alias('add')
    .description('Install a plugin from npm package or local path')
    .option('-p, --path <path>', 'Project root path', '.')
    .action(async (source: string, options) => {
      const spinner = ora(`Installing plugin: ${source}`).start();

      try {
        const projectRoot = validateProjectRoot(options.path);
        const manager = createDefaultPluginManager(projectRoot) as PluginManagerImpl;

        const result = await manager.install(source);

        if (result.success) {
          spinner.succeed(`Plugin installed: ${chalk.cyan(result.name)}@${result.version}`);
          console.log(chalk.gray('\n  The plugin is now enabled and ready to use.'));
          console.log(chalk.gray('  Run'), chalk.cyan(`kg plugin info ${result.name}`), chalk.gray('for details.\n'));
        } else {
          spinner.fail(`Failed to install plugin: ${result.error}`);
          process.exit(1);
        }

      } catch (error) {
        spinner.fail('Installation failed');
        console.error(chalk.red(String(error)));
        process.exit(1);
      }
    });

  // Uninstall command
  command
    .command('uninstall <name>')
    .alias('remove')
    .description('Uninstall a plugin')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('-y, --yes', 'Skip confirmation')
    .action(async (name: string, options) => {
      const spinner = ora(`Uninstalling plugin: ${name}`).start();

      try {
        const projectRoot = validateProjectRoot(options.path);
        const manager = createDefaultPluginManager(projectRoot) as PluginManagerImpl;

        const success = await manager.uninstall(name);

        if (success) {
          spinner.succeed(`Plugin uninstalled: ${chalk.cyan(name)}`);
        } else {
          spinner.fail(`Failed to uninstall plugin: ${name}`);
          process.exit(1);
        }

      } catch (error) {
        spinner.fail('Uninstallation failed');
        console.error(chalk.red(String(error)));
        process.exit(1);
      }
    });

  // Enable command
  command
    .command('enable <name>')
    .description('Enable a plugin')
    .option('-p, --path <path>', 'Project root path', '.')
    .action(async (name: string, options) => {
      const spinner = ora(`Enabling plugin: ${name}`).start();

      try {
        const projectRoot = validateProjectRoot(options.path);
        const manager = createDefaultPluginManager(projectRoot) as PluginManagerImpl;

        await manager.enablePlugin(name);
        spinner.succeed(`Plugin enabled: ${chalk.cyan(name)}`);

      } catch (error) {
        spinner.fail(`Failed to enable plugin: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });

  // Disable command
  command
    .command('disable <name>')
    .description('Disable a plugin')
    .option('-p, --path <path>', 'Project root path', '.')
    .action(async (name: string, options) => {
      const spinner = ora(`Disabling plugin: ${name}`).start();

      try {
        const projectRoot = validateProjectRoot(options.path);
        const manager = createDefaultPluginManager(projectRoot) as PluginManagerImpl;

        await manager.disablePlugin(name);
        spinner.succeed(`Plugin disabled: ${chalk.cyan(name)}`);

      } catch (error) {
        spinner.fail(`Failed to disable plugin: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });

  // Info command
  command
    .command('info <name>')
    .description('Show plugin details')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('--json', 'Output as JSON')
    .action(async (name: string, options) => {
      const spinner = ora(`Loading plugin info: ${name}`).start();

      try {
        const projectRoot = validateProjectRoot(options.path);
        const manager = createDefaultPluginManager(projectRoot) as PluginManagerImpl;

        const discovered = await manager.loader.discover();
        const found = discovered.find((d) => d.manifest.name === name);

        if (!found) {
          spinner.fail(`Plugin not found: ${name}`);
          process.exit(1);
        }

        spinner.stop();

        const manifest = found.manifest;
        const kgPlugin = manifest['kg-plugin'];

        if (options.json) {
          console.log(JSON.stringify({
            manifest,
            path: found.path,
            valid: found.valid,
            errors: found.errors,
          }, null, 2));
          return;
        }

        console.log(chalk.cyan.bold(`\n  ${manifest.name}\n`));

        // Basic info
        console.log(chalk.white('  Basic Information'));
        console.log(chalk.gray(`    Version:      ${manifest.version}`));
        console.log(chalk.gray(`    Type:         ${formatType(kgPlugin.type)}`));
        console.log(chalk.gray(`    Status:       ${found.valid ? chalk.green('valid') : chalk.red('invalid')}`));
        if (manifest.description) {
          console.log(chalk.gray(`    Description:  ${manifest.description}`));
        }
        if (manifest.author) {
          const author = typeof manifest.author === 'string'
            ? manifest.author
            : manifest.author.name;
          console.log(chalk.gray(`    Author:       ${author}`));
        }
        if (manifest.license) {
          console.log(chalk.gray(`    License:      ${manifest.license}`));
        }

        // Plugin configuration
        console.log();
        console.log(chalk.white('  Plugin Configuration'));
        console.log(chalk.gray(`    Entry:        ${kgPlugin.main}`));
        if (kgPlugin.displayName) {
          console.log(chalk.gray(`    Display Name: ${kgPlugin.displayName}`));
        }
        if (kgPlugin.minVersion) {
          console.log(chalk.gray(`    Min Version:  ${kgPlugin.minVersion}`));
        }
        if (kgPlugin.priority !== undefined) {
          console.log(chalk.gray(`    Priority:     ${kgPlugin.priority}`));
        }
        if (kgPlugin.hotReload) {
          console.log(chalk.gray(`    Hot Reload:   ${chalk.green('enabled')}`));
        }

        // Hooks
        if (kgPlugin.hooks && kgPlugin.hooks.length > 0) {
          console.log();
          console.log(chalk.white('  Lifecycle Hooks'));
          for (const hook of kgPlugin.hooks) {
            console.log(chalk.cyan(`    - ${hook}`));
          }
        }

        // Capabilities
        if (kgPlugin.capabilities && kgPlugin.capabilities.length > 0) {
          console.log();
          console.log(chalk.white('  Capabilities'));
          for (const cap of kgPlugin.capabilities) {
            console.log(chalk.cyan(`    - ${cap.name}`));
            if (cap.description) {
              console.log(chalk.gray(`      ${cap.description}`));
            }
          }
        }

        // Dependencies
        if (manifest.dependencies && Object.keys(manifest.dependencies).length > 0) {
          console.log();
          console.log(chalk.white('  Dependencies'));
          for (const [dep, version] of Object.entries(manifest.dependencies)) {
            console.log(chalk.gray(`    ${dep}: ${version}`));
          }
        }

        // Plugin dependencies
        if (kgPlugin.pluginDependencies && kgPlugin.pluginDependencies.length > 0) {
          console.log();
          console.log(chalk.white('  Plugin Dependencies'));
          for (const dep of kgPlugin.pluginDependencies) {
            const optional = dep.optional ? chalk.gray(' (optional)') : '';
            console.log(chalk.gray(`    ${dep.name}: ${dep.version}${optional}`));
          }
        }

        // Config schema
        if (kgPlugin.configSchema) {
          console.log();
          console.log(chalk.white('  Configuration Schema'));
          if (kgPlugin.configSchema.properties) {
            for (const [key, prop] of Object.entries(kgPlugin.configSchema.properties)) {
              const required = kgPlugin.configSchema.required?.includes(key)
                ? chalk.red('*')
                : '';
              const defaultVal = prop.default !== undefined
                ? chalk.gray(` (default: ${JSON.stringify(prop.default)})`)
                : '';
              console.log(chalk.gray(`    ${key}${required}: ${prop.type}${defaultVal}`));
              if (prop.description) {
                console.log(chalk.gray(`      ${prop.description}`));
              }
            }
          }
        }

        // Path
        console.log();
        console.log(chalk.white('  Location'));
        console.log(chalk.gray(`    Path: ${found.path}`));

        // Errors if any
        if (found.errors && found.errors.length > 0) {
          console.log();
          console.log(chalk.red('  Validation Errors'));
          for (const error of found.errors) {
            console.log(chalk.red(`    - ${error}`));
          }
        }

        console.log();

      } catch (error) {
        spinner.fail('Failed to get plugin info');
        console.error(chalk.red(String(error)));
        process.exit(1);
      }
    });

  // Run command
  command
    .command('run <name> [file]')
    .description('Run an analyzer plugin on a file')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('--stream', 'Use streaming output')
    .option('--json', 'Output as JSON')
    .option('-o, --options <json>', 'Plugin options as JSON string')
    .action(async (name: string, file: string | undefined, options) => {
      if (!file) {
        console.error(chalk.red('Error: File path is required'));
        console.log(chalk.gray('\nUsage: kg plugin run <name> <file>'));
        process.exit(1);
      }

      const spinner = ora(`Running plugin: ${name}`).start();

      try {
        const projectRoot = validateProjectRoot(options.path);
        const manager = createDefaultPluginManager(projectRoot) as PluginManagerImpl;

        // Find and load the plugin
        const discovered = await manager.loader.discover();
        const found = discovered.find((d) => d.manifest.name === name);

        if (!found) {
          spinner.fail(`Plugin not found: ${name}`);
          process.exit(1);
        }

        if (found.manifest['kg-plugin'].type !== 'analyzer') {
          spinner.fail(`Plugin ${name} is not an analyzer (type: ${found.manifest['kg-plugin'].type})`);
          process.exit(1);
        }

        // Load the plugin
        const loadResult = await manager.loader.loadFromPath(found.path);
        if (!loadResult.success || !loadResult.plugin) {
          spinner.fail(`Failed to load plugin: ${loadResult.error}`);
          process.exit(1);
        }

        // Initialize the plugin
        const context = (manager as any).getPluginContext(name);
        await loadResult.plugin.initialize(context);

        const analyzer = loadResult.plugin as AnalyzerPlugin;

        // Check if it can analyze the file type
        const filePath = resolve(projectRoot, file);
        if (!existsSync(filePath)) {
          spinner.fail(`File not found: ${file}`);
          process.exit(1);
        }

        const content = readFileSync(filePath, 'utf-8');
        const ext = filePath.split('.').pop() || '';

        if (!analyzer.canAnalyze(ext)) {
          spinner.warn(`Plugin may not support this file type: .${ext}`);
          console.log(chalk.gray(`  Supported types: ${analyzer.supportedContentTypes.join(', ')}`));
        }

        spinner.text = `Analyzing ${file}...`;

        const pluginOptions = options.options
          ? JSON.parse(options.options)
          : {};

        if (options.stream && analyzer.analyzeStream) {
          spinner.stop();
          console.log(chalk.cyan(`\n  Streaming analysis of ${file}\n`));

          for await (const chunk of analyzer.analyzeStream({
            id: `cli-${Date.now()}`,
            content,
            contentType: ext,
            filePath,
            options: pluginOptions,
          })) {
            switch (chunk.type) {
              case 'progress':
                console.log(chalk.gray(`  [${chunk.progress || 0}%] ${chunk.data}`));
                break;
              case 'entity':
                console.log(chalk.green(`  + Entity: ${JSON.stringify(chunk.data)}`));
                break;
              case 'relationship':
                console.log(chalk.blue(`  ~ Relationship: ${JSON.stringify(chunk.data)}`));
                break;
              case 'tag':
                console.log(chalk.yellow(`  # Tag: ${JSON.stringify(chunk.data)}`));
                break;
              case 'error':
                console.log(chalk.red(`  ! Error: ${JSON.stringify(chunk.data)}`));
                break;
              case 'complete':
                console.log(chalk.cyan('\n  Analysis complete.\n'));
                break;
            }
          }
        } else {
          const result = await analyzer.analyze({
            id: `cli-${Date.now()}`,
            content,
            contentType: ext,
            filePath,
            options: pluginOptions,
          });

          spinner.stop();

          if (options.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
          }

          console.log(chalk.cyan.bold(`\n  Analysis Results: ${file}\n`));

          if (!result.success) {
            console.log(chalk.red('  Analysis failed'));
            if (result.error) {
              console.log(chalk.red(`    ${result.error.code}: ${result.error.message}`));
            }
          } else {
            // Metrics
            if (result.metrics) {
              console.log(chalk.white('  Metrics'));
              console.log(chalk.gray(`    Duration:      ${result.metrics.durationMs}ms`));
              if (result.metrics.entitiesFound !== undefined) {
                console.log(chalk.gray(`    Entities:      ${result.metrics.entitiesFound}`));
              }
              if (result.metrics.relationshipsFound !== undefined) {
                console.log(chalk.gray(`    Relationships: ${result.metrics.relationshipsFound}`));
              }
            }

            // Entities
            if (result.entities && result.entities.length > 0) {
              console.log();
              console.log(chalk.white(`  Entities (${result.entities.length})`));
              for (const entity of result.entities.slice(0, 10)) {
                const confidence = chalk.gray(`[${(entity.confidence * 100).toFixed(0)}%]`);
                console.log(chalk.green(`    ${entity.type}: ${entity.value} ${confidence}`));
              }
              if (result.entities.length > 10) {
                console.log(chalk.gray(`    ... and ${result.entities.length - 10} more`));
              }
            }

            // Relationships
            if (result.relationships && result.relationships.length > 0) {
              console.log();
              console.log(chalk.white(`  Relationships (${result.relationships.length})`));
              for (const rel of result.relationships.slice(0, 10)) {
                const confidence = chalk.gray(`[${(rel.confidence * 100).toFixed(0)}%]`);
                console.log(chalk.blue(`    ${rel.sourceId} -[${rel.type}]-> ${rel.targetId} ${confidence}`));
              }
              if (result.relationships.length > 10) {
                console.log(chalk.gray(`    ... and ${result.relationships.length - 10} more`));
              }
            }

            // Tags
            if (result.tags && result.tags.length > 0) {
              console.log();
              console.log(chalk.white(`  Tags (${result.tags.length})`));
              const tagStr = result.tags
                .slice(0, 20)
                .map((t) => chalk.yellow(`#${t.value}`))
                .join(' ');
              console.log(`    ${tagStr}`);
              if (result.tags.length > 20) {
                console.log(chalk.gray(`    ... and ${result.tags.length - 20} more`));
              }
            }

            // Summary
            if (result.summary) {
              console.log();
              console.log(chalk.white('  Summary'));
              console.log(chalk.gray(`    ${result.summary}`));
            }

            // Suggestions
            if (result.suggestions && result.suggestions.length > 0) {
              console.log();
              console.log(chalk.white(`  Suggestions (${result.suggestions.length})`));
              for (const suggestion of result.suggestions.slice(0, 5)) {
                const icon = suggestion.type === 'add_link' ? '+'
                  : suggestion.type === 'add_tag' ? '#'
                  : suggestion.type === 'fix_format' ? '!'
                  : '*';
                console.log(chalk.yellow(`    ${icon} ${suggestion.message}`));
              }
              if (result.suggestions.length > 5) {
                console.log(chalk.gray(`    ... and ${result.suggestions.length - 5} more`));
              }
            }
          }

          console.log();
        }

        // Cleanup
        if (loadResult.plugin.destroy) {
          await loadResult.plugin.destroy();
        }

      } catch (error) {
        spinner.fail('Analysis failed');
        console.error(chalk.red(String(error)));
        process.exit(1);
      }
    });

  // Create command
  command
    .command('create <name>')
    .description('Create a new plugin from template')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('-t, --type <type>', 'Plugin type', 'analyzer')
    .option('-d, --dir <directory>', 'Output directory', 'plugins')
    .action(async (name: string, options) => {
      const spinner = ora(`Creating plugin: ${name}`).start();

      try {
        const projectRoot = validateProjectRoot(options.path);
        const pluginType = options.type as PluginType;

        // Validate plugin type
        const validTypes: PluginType[] = [
          'analyzer', 'transformer', 'exporter', 'importer',
          'integration', 'visualization', 'storage', 'agent', 'hook', 'generic'
        ];
        if (!validTypes.includes(pluginType)) {
          spinner.fail(`Invalid plugin type: ${pluginType}`);
          console.log(chalk.gray(`  Valid types: ${validTypes.join(', ')}`));
          process.exit(1);
        }

        // Determine output directory
        const pluginDir = join(projectRoot, options.dir, name.replace(/^@[^/]+\//, ''));

        if (existsSync(pluginDir)) {
          spinner.fail(`Directory already exists: ${pluginDir}`);
          process.exit(1);
        }

        // Create directory structure
        mkdirSync(join(pluginDir, 'src'), { recursive: true });

        // Write template files
        writeFileSync(
          join(pluginDir, 'package.json'),
          PLUGIN_TEMPLATE['package.json'](name, pluginType)
        );

        writeFileSync(
          join(pluginDir, 'tsconfig.json'),
          PLUGIN_TEMPLATE['tsconfig.json']()
        );

        writeFileSync(
          join(pluginDir, 'src', 'index.ts'),
          PLUGIN_TEMPLATE['src/index.ts'](name, pluginType)
        );

        writeFileSync(
          join(pluginDir, 'README.md'),
          PLUGIN_TEMPLATE['README.md'](name)
        );

        spinner.succeed(`Plugin created: ${chalk.cyan(name)}`);
        console.log();
        console.log(chalk.white('  Next steps:'));
        console.log(chalk.gray(`    1. cd ${join(options.dir, name.replace(/^@[^/]+\//, ''))}`));
        console.log(chalk.gray('    2. npm install'));
        console.log(chalk.gray('    3. npm run build'));
        console.log(chalk.gray(`    4. kg plugin install ./${join(options.dir, name.replace(/^@[^/]+\//, ''))}`));
        console.log();

      } catch (error) {
        spinner.fail('Failed to create plugin');
        console.error(chalk.red(String(error)));
        process.exit(1);
      }
    });

  return command;
}
