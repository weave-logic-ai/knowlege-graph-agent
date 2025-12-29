# Plugins Guide

The Knowledge Graph Agent plugin system enables extensibility through analyzers, processors, and custom integrations. Plugins hook into the graph lifecycle to add functionality without modifying core code.

## Overview

The plugin system provides:

1. **Plugin Architecture** - Modular extension system
2. **Lifecycle Hooks** - 13 integration points
3. **Built-in Plugins** - Code complexity, dependency health
4. **Custom Development** - Create your own plugins

## Plugin Architecture

### Core Components

| Component | Purpose |
|-----------|---------|
| `PluginManager` | Loads, enables, and manages plugins |
| `PluginLoader` | Discovers and initializes plugins |
| `PluginRegistry` | Central plugin registration |
| `PluginContext` | Shared context for plugin execution |

### Plugin Structure

```typescript
interface Plugin {
  // Metadata
  name: string;
  version: string;
  description: string;
  author?: string;

  // Lifecycle
  initialize?(context: PluginContext): Promise<void>;
  destroy?(): Promise<void>;

  // Hooks
  hooks?: PluginHooks;

  // Configuration
  defaultConfig?: Record<string, unknown>;
  configSchema?: z.ZodSchema;
}
```

### Plugin Registration

```typescript
import { PluginRegistry } from '@knowledge-graph-agent/plugins';

// Register a plugin
PluginRegistry.register({
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',
  hooks: {
    onNodeCreated: async (node, context) => {
      // Handle node creation
    }
  }
});

// Check registered plugins
const plugins = PluginRegistry.list();
console.log('Registered plugins:', plugins.map(p => p.name));
```

## Lifecycle Hooks

### Available Hooks

The plugin system provides 13 lifecycle hooks:

| Hook | Trigger | Parameters |
|------|---------|------------|
| `onInitialize` | Plugin initialization | `context` |
| `onDestroy` | Plugin shutdown | - |
| `onNodeCreated` | Node created | `node`, `context` |
| `onNodeUpdated` | Node updated | `node`, `changes`, `context` |
| `onNodeDeleted` | Node deleted | `nodeId`, `context` |
| `onEdgeCreated` | Edge created | `edge`, `context` |
| `onEdgeDeleted` | Edge deleted | `edgeId`, `context` |
| `onSearch` | Search executed | `query`, `results`, `context` |
| `onAnalyze` | Analysis started | `target`, `options`, `context` |
| `onAnalyzeComplete` | Analysis finished | `results`, `context` |
| `onError` | Error occurred | `error`, `context` |
| `beforeSave` | Before persistence | `data`, `context` |
| `afterLoad` | After data loaded | `data`, `context` |

### Hook Implementation

```typescript
const myPlugin: Plugin = {
  name: 'event-logger',
  version: '1.0.0',
  description: 'Logs all graph events',

  hooks: {
    onNodeCreated: async (node, context) => {
      context.logger.info(`Node created: ${node.title}`);
      await context.metrics.increment('nodes.created');
    },

    onNodeUpdated: async (node, changes, context) => {
      context.logger.info(`Node updated: ${node.title}`, { changes });
    },

    onNodeDeleted: async (nodeId, context) => {
      context.logger.info(`Node deleted: ${nodeId}`);
    },

    onSearch: async (query, results, context) => {
      context.logger.debug(`Search: "${query}" returned ${results.length} results`);
    },

    onError: async (error, context) => {
      context.logger.error('Error occurred', { error: error.message });
      await context.alerting.send('plugin-error', error);
    }
  }
};
```

### Hook Priority

Plugins can specify hook priority for execution order:

```typescript
const highPriorityPlugin: Plugin = {
  name: 'validation-plugin',
  version: '1.0.0',
  description: 'Validates nodes before creation',

  hooks: {
    onNodeCreated: {
      priority: 100, // Higher = earlier execution
      handler: async (node, context) => {
        if (!isValid(node)) {
          throw new Error('Invalid node');
        }
      }
    }
  }
};
```

## Built-in Plugins

### Code Complexity Analyzer

Analyzes code complexity in technical documentation.

```typescript
import { CodeComplexityPlugin } from '@knowledge-graph-agent/plugins';

// Configuration
const complexityPlugin = new CodeComplexityPlugin({
  // Thresholds
  maxCyclomaticComplexity: 10,
  maxCognitiveComplexity: 15,
  maxLinesPerFunction: 50,

  // Analysis options
  languages: ['typescript', 'javascript', 'python'],
  includeTests: false,

  // Reporting
  reportFormat: 'detailed', // 'summary' | 'detailed'
  outputPath: './complexity-report.json'
});

// Register
PluginRegistry.register(complexityPlugin);
```

#### Complexity Metrics

| Metric | Description | Threshold |
|--------|-------------|-----------|
| Cyclomatic Complexity | Control flow complexity | < 10 |
| Cognitive Complexity | Human readability | < 15 |
| Lines of Code | Function/file size | < 50/200 |
| Nesting Depth | Control structure depth | < 4 |
| Parameter Count | Function parameters | < 5 |

#### Usage

```typescript
// Analyze a node's code blocks
const analysis = await complexityPlugin.analyze(node);

console.log(analysis);
// {
//   overall: { complexity: 8, grade: 'B' },
//   functions: [
//     { name: 'processData', complexity: 5, lines: 25 },
//     { name: 'validateInput', complexity: 3, lines: 15 }
//   ],
//   suggestions: ['Consider extracting nested logic']
// }
```

### Dependency Health Analyzer

Monitors dependency health and security.

```typescript
import { DependencyHealthPlugin } from '@knowledge-graph-agent/plugins';

// Configuration
const healthPlugin = new DependencyHealthPlugin({
  // Sources
  ecosystems: ['nodejs', 'python'],
  checkVulnerabilities: true,
  checkOutdated: true,

  // Thresholds
  maxAge: 365, // Days since last update
  securityLevel: 'high', // 'low' | 'medium' | 'high' | 'critical'

  // Actions
  autoCreateIssues: true,
  notifyOnCritical: true
});

// Register
PluginRegistry.register(healthPlugin);
```

#### Health Metrics

| Metric | Description | Weight |
|--------|-------------|--------|
| Vulnerabilities | Known security issues | 40% |
| Freshness | Time since last update | 20% |
| Maintenance | Commit frequency | 20% |
| Popularity | Downloads/stars | 10% |
| License | License compatibility | 10% |

#### Usage

```typescript
// Check dependency health
const health = await healthPlugin.analyze({
  projectRoot: '/path/to/project'
});

console.log(health);
// {
//   overall: { score: 85, grade: 'B' },
//   dependencies: [
//     { name: 'express', score: 95, vulnerabilities: 0 },
//     { name: 'lodash', score: 90, outdated: true }
//   ],
//   recommendations: [
//     'Update lodash to 4.17.21 for security fix'
//   ]
// }
```

## Custom Plugin Development

### Creating a Plugin

```typescript
import { Plugin, PluginContext } from '@knowledge-graph-agent/plugins';

export class MyCustomPlugin implements Plugin {
  name = 'my-custom-plugin';
  version = '1.0.0';
  description = 'A custom plugin for my use case';
  author = 'Your Name';

  // Plugin configuration
  private config: MyPluginConfig;

  constructor(config: Partial<MyPluginConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // Called when plugin is initialized
  async initialize(context: PluginContext): Promise<void> {
    context.logger.info('MyCustomPlugin initialized');

    // Setup resources
    await this.setupResources(context);

    // Register custom commands
    context.commands.register('my-command', this.handleCommand.bind(this));
  }

  // Called when plugin is destroyed
  async destroy(): Promise<void> {
    // Cleanup resources
    await this.cleanupResources();
  }

  // Lifecycle hooks
  hooks = {
    onNodeCreated: async (node: KnowledgeNode, context: PluginContext) => {
      // Process new nodes
      await this.processNode(node, context);
    },

    onAnalyze: async (target: string, options: any, context: PluginContext) => {
      // Add custom analysis
      return this.performAnalysis(target, options, context);
    }
  };

  // Custom methods
  private async processNode(node: KnowledgeNode, context: PluginContext) {
    // Custom processing logic
  }

  private async performAnalysis(target: string, options: any, context: PluginContext) {
    // Custom analysis logic
    return {
      pluginName: this.name,
      results: { /* analysis results */ }
    };
  }

  private async setupResources(context: PluginContext) {
    // Initialize any required resources
  }

  private async cleanupResources() {
    // Clean up resources on destroy
  }

  private async handleCommand(args: string[], context: PluginContext) {
    // Handle custom command
  }
}
```

### Plugin Configuration Schema

```typescript
import { z } from 'zod';

// Define configuration schema
const MyPluginConfigSchema = z.object({
  enabled: z.boolean().default(true),
  threshold: z.number().min(0).max(100).default(50),
  targets: z.array(z.string()).default(['**/*.md']),
  options: z.object({
    verbose: z.boolean().default(false),
    strict: z.boolean().default(true)
  }).default({})
});

type MyPluginConfig = z.infer<typeof MyPluginConfigSchema>;

export class MyCustomPlugin implements Plugin {
  name = 'my-custom-plugin';
  version = '1.0.0';
  description = 'A custom plugin';

  // Expose schema for validation
  configSchema = MyPluginConfigSchema;
  defaultConfig = MyPluginConfigSchema.parse({});

  private config: MyPluginConfig;

  constructor(config: Partial<MyPluginConfig> = {}) {
    // Validate and merge config
    this.config = MyPluginConfigSchema.parse({
      ...this.defaultConfig,
      ...config
    });
  }
}
```

### Plugin Context

The `PluginContext` provides access to system resources:

```typescript
interface PluginContext {
  // Graph access
  graph: KnowledgeGraph;

  // Database access
  db: Database;

  // Logging
  logger: Logger;

  // Metrics
  metrics: MetricsCollector;

  // Configuration
  config: KGConfig;

  // Commands
  commands: CommandRegistry;

  // Events
  events: EventEmitter;

  // Memory (claude-flow integration)
  memory: MemoryStore;

  // Agents
  agents: AgentManager;
}
```

### Using Context Resources

```typescript
const myPlugin: Plugin = {
  name: 'context-example',
  version: '1.0.0',
  description: 'Demonstrates context usage',

  hooks: {
    onNodeCreated: async (node, context) => {
      // Use logger
      context.logger.info('Processing node', { nodeId: node.id });

      // Access graph
      const related = await context.graph.getConnectedNodes(node.id);

      // Store in memory
      await context.memory.store({
        key: `processed:${node.id}`,
        value: { timestamp: Date.now() },
        namespace: 'my-plugin'
      });

      // Emit custom event
      context.events.emit('my-plugin:node-processed', { node, related });

      // Track metrics
      context.metrics.increment('my-plugin.nodes.processed');
    }
  }
};
```

## Plugin Manager

### Loading Plugins

```typescript
import { PluginManager } from '@knowledge-graph-agent/plugins';

const manager = new PluginManager({
  // Plugin discovery paths
  paths: [
    './plugins',
    './node_modules/@kg-plugins/*'
  ],

  // Auto-load on startup
  autoLoad: true,

  // Plugin configuration
  plugins: {
    'code-complexity': { maxComplexity: 15 },
    'dependency-health': { ecosystems: ['nodejs'] }
  }
});

// Initialize manager
await manager.initialize();

// Load specific plugin
await manager.load('my-plugin');

// Enable/disable plugins
await manager.enable('my-plugin');
await manager.disable('my-plugin');
```

### Managing Plugins

```typescript
// List all plugins
const plugins = manager.list();
for (const plugin of plugins) {
  console.log(`${plugin.name} v${plugin.version} - ${plugin.enabled ? 'enabled' : 'disabled'}`);
}

// Get plugin status
const status = manager.getStatus('my-plugin');
console.log(status);
// { name: 'my-plugin', enabled: true, loaded: true, errors: [] }

// Update plugin config
await manager.configure('my-plugin', { threshold: 75 });

// Reload plugin
await manager.reload('my-plugin');

// Unload plugin
await manager.unload('my-plugin');
```

### Plugin Events

```typescript
// Listen for plugin events
manager.on('plugin:loaded', (plugin) => {
  console.log(`Loaded: ${plugin.name}`);
});

manager.on('plugin:enabled', (plugin) => {
  console.log(`Enabled: ${plugin.name}`);
});

manager.on('plugin:error', (plugin, error) => {
  console.error(`Error in ${plugin.name}:`, error);
});
```

## Publishing Plugins

### Package Structure

```
my-kg-plugin/
  package.json
  src/
    index.ts
    plugin.ts
    config.ts
  dist/
    index.js
    plugin.js
    config.js
  README.md
```

### package.json

```json
{
  "name": "@myorg/kg-plugin-example",
  "version": "1.0.0",
  "description": "Example Knowledge Graph plugin",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": [
    "knowledge-graph-agent",
    "kg-plugin"
  ],
  "peerDependencies": {
    "@knowledge-graph-agent/core": "^1.0.0",
    "@knowledge-graph-agent/plugins": "^1.0.0"
  },
  "kg-plugin": {
    "name": "example-plugin",
    "entry": "dist/index.js",
    "configSchema": "dist/config.js"
  }
}
```

### Export Structure

```typescript
// src/index.ts
export { ExamplePlugin } from './plugin';
export { ExamplePluginConfig, ExamplePluginConfigSchema } from './config';

// Default export for auto-discovery
export default ExamplePlugin;
```

## Best Practices

### Plugin Development

1. **Keep plugins focused** - One responsibility per plugin
2. **Validate configuration** - Use Zod schemas
3. **Handle errors gracefully** - Don't crash the system
4. **Use context resources** - Don't create parallel resources
5. **Document thoroughly** - Include examples and configuration

### Performance

1. **Avoid blocking hooks** - Use async operations
2. **Cache when possible** - Don't repeat expensive operations
3. **Batch operations** - Combine related actions
4. **Monitor metrics** - Track plugin performance

### Security

1. **Validate inputs** - Never trust external data
2. **Limit permissions** - Request only needed access
3. **Sanitize outputs** - Clean data before display
4. **Log carefully** - Don't expose sensitive information

## Troubleshooting

### Common Issues

**Plugin not loading**
- Check package.json kg-plugin field
- Verify entry point exports plugin
- Check for initialization errors

**Hooks not firing**
- Verify plugin is enabled
- Check hook names are correct
- Review hook priority conflicts

**Configuration errors**
- Validate config against schema
- Check for required fields
- Review default values

### Debug Mode

```typescript
const manager = new PluginManager({
  debug: true,
  logLevel: 'debug'
});

// Enable per-plugin debugging
await manager.configure('my-plugin', {
  __debug: true
});
```

### Plugin Diagnostics

```typescript
// Get diagnostic information
const diagnostics = await manager.diagnose('my-plugin');
console.log(diagnostics);
// {
//   name: 'my-plugin',
//   status: 'healthy',
//   hooks: ['onNodeCreated', 'onAnalyze'],
//   resources: { memory: '2.5MB', handles: 3 },
//   errors: [],
//   warnings: ['Deprecated API usage in onAnalyze']
// }
```

## Related Guides

- [Knowledge Graph Guide](./knowledge-graph.md) - Graph operations
- [Agents Guide](./agents.md) - Agent integration
- [Cultivation Guide](./cultivation.md) - Analysis plugins
