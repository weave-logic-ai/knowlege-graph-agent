---
title: Configuration
description: Complete configuration reference for @weavelogic/knowledge-graph-agent
category: getting-started
---

# Configuration

This guide covers all configuration options for `@weavelogic/knowledge-graph-agent`, including file structure, environment variables, and example configurations.

## Configuration File Location

The default configuration file is located at:

```
.kg/config.json
```

This path is relative to your project root. The `.kg` directory is created when you run `kg init`.

### Custom Configuration Path

Specify a custom configuration path:

```bash
# CLI
kg --config /path/to/custom/config.json serve --all

# Programmatically
import { createConfigManager } from '@weavelogic/knowledge-graph-agent';
const manager = createConfigManager('/path/to/custom/config.json');
```

## Configuration File Structure

The complete configuration file structure:

```json
{
  "version": "1.0.0",
  "projectRoot": ".",
  "docsPath": "docs",
  "database": {
    "path": ".kg/knowledge.db",
    "walMode": true,
    "busyTimeout": 5000,
    "cacheSize": 2000,
    "autoBackup": true,
    "backupInterval": 86400000,
    "maxBackups": 5
  },
  "cache": {
    "enabled": true,
    "maxSize": 104857600,
    "defaultTtl": 3600000,
    "evictionPolicy": "lru"
  },
  "agents": {
    "maxConcurrent": 5,
    "defaultTimeout": 30000,
    "retryAttempts": 3,
    "enableLogging": true,
    "claudeFlowEnabled": false
  },
  "services": {
    "fileWatcher": true,
    "watchPaths": ["docs", "src"],
    "schedulerEnabled": true,
    "syncEnabled": true,
    "healthCheckInterval": 60000
  },
  "logging": {
    "level": "info",
    "format": "text",
    "console": true,
    "filePath": null
  },
  "graphql": {
    "port": 4000,
    "cors": true,
    "playground": true
  },
  "dashboard": {
    "port": 3000
  },
  "plugins": {
    "autoLoad": true,
    "searchPaths": ["./plugins", "./node_modules"]
  }
}
```

## Core Configuration Options

### Project Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `version` | string | `"1.0.0"` | Configuration version for migrations |
| `projectRoot` | string | `"."` | Project root directory |
| `docsPath` | string | `"docs"` | Documentation directory relative to projectRoot |

```json
{
  "projectRoot": "/home/user/myproject",
  "docsPath": "documentation"
}
```

## Database Configuration

SQLite database settings for knowledge storage.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `path` | string | `".kg/knowledge.db"` | Database file path |
| `walMode` | boolean | `true` | Enable Write-Ahead Logging for better concurrency |
| `busyTimeout` | number | `5000` | Timeout in ms when database is locked |
| `cacheSize` | number | `2000` | SQLite page cache size |
| `autoBackup` | boolean | `true` | Enable automatic backups |
| `backupInterval` | number | `86400000` | Backup interval in ms (default: 24 hours) |
| `maxBackups` | number | `5` | Maximum backup files to retain |

```json
{
  "database": {
    "path": ".kg/knowledge.db",
    "walMode": true,
    "busyTimeout": 5000,
    "cacheSize": 2000,
    "autoBackup": true,
    "backupInterval": 86400000,
    "maxBackups": 5
  }
}
```

### Database Path Examples

```json
// Relative path (recommended)
{ "database": { "path": ".kg/knowledge.db" } }

// Absolute path
{ "database": { "path": "/var/data/kg/knowledge.db" } }

// In-memory (for testing)
{ "database": { "path": ":memory:" } }
```

## Cache Configuration

In-memory caching for performance optimization.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable caching |
| `maxSize` | number | `104857600` | Maximum cache size in bytes (100MB) |
| `defaultTtl` | number | `3600000` | Time-to-live in ms (1 hour) |
| `evictionPolicy` | string | `"lru"` | Eviction policy: `lru`, `lfu`, `fifo` |

```json
{
  "cache": {
    "enabled": true,
    "maxSize": 104857600,
    "defaultTtl": 3600000,
    "evictionPolicy": "lru"
  }
}
```

### Eviction Policies

| Policy | Description |
|--------|-------------|
| `lru` | Least Recently Used - evicts items not accessed recently |
| `lfu` | Least Frequently Used - evicts items with lowest access count |
| `fifo` | First In First Out - evicts oldest items first |

## Agent Configuration

Settings for the multi-agent system.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxConcurrent` | number | `5` | Maximum concurrent agent executions |
| `defaultTimeout` | number | `30000` | Default operation timeout in ms |
| `retryAttempts` | number | `3` | Retry count for failed operations |
| `enableLogging` | boolean | `true` | Enable agent operation logging |
| `claudeFlowEnabled` | boolean | `false` | Enable claude-flow integration |

```json
{
  "agents": {
    "maxConcurrent": 5,
    "defaultTimeout": 30000,
    "retryAttempts": 3,
    "enableLogging": true,
    "claudeFlowEnabled": true
  }
}
```

### Agent Types

Available agent types when using the agent system:

- `ResearcherAgent` - Research and information gathering
- `CoderAgent` - Code generation and modification
- `TesterAgent` - Test creation and validation
- `AnalystAgent` - Analysis and recommendations
- `ArchitectAgent` - System design and architecture

## Services Configuration

Background service settings.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fileWatcher` | boolean | `true` | Enable file system watcher |
| `watchPaths` | string[] | `["docs", "src"]` | Paths to watch for changes |
| `schedulerEnabled` | boolean | `true` | Enable task scheduler |
| `syncEnabled` | boolean | `true` | Enable sync service |
| `healthCheckInterval` | number | `60000` | Health check interval in ms |

```json
{
  "services": {
    "fileWatcher": true,
    "watchPaths": ["docs", "src", "lib"],
    "schedulerEnabled": true,
    "syncEnabled": true,
    "healthCheckInterval": 60000
  }
}
```

## Logging Configuration

Logging and debugging settings.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `level` | string | `"info"` | Log level: `debug`, `info`, `warn`, `error` |
| `format` | string | `"text"` | Output format: `json`, `text` |
| `console` | boolean | `true` | Enable console output |
| `filePath` | string | `null` | Optional log file path |

```json
{
  "logging": {
    "level": "debug",
    "format": "json",
    "console": true,
    "filePath": ".kg/logs/kg.log"
  }
}
```

## Server Configuration

### GraphQL Server

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | number | `4000` | GraphQL server port |
| `cors` | boolean | `true` | Enable CORS |
| `playground` | boolean | `true` | Enable GraphQL Playground |

```json
{
  "graphql": {
    "port": 4000,
    "cors": true,
    "playground": true
  }
}
```

### Dashboard Server

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | number | `3000` | Dashboard server port |

```json
{
  "dashboard": {
    "port": 3001
  }
}
```

## Plugin Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoLoad` | boolean | `true` | Automatically load plugins on startup |
| `searchPaths` | string[] | `["./plugins", "./node_modules"]` | Plugin search directories |

```json
{
  "plugins": {
    "autoLoad": true,
    "searchPaths": ["./plugins", "./node_modules", "/usr/local/kg-plugins"]
  }
}
```

## Environment Variables

Override configuration with environment variables:

| Variable | Description |
|----------|-------------|
| `KG_DATABASE_PATH` | Override database path |
| `KG_LOG_LEVEL` | Override log level |
| `KG_GRAPHQL_PORT` | Override GraphQL server port |
| `KG_DASHBOARD_PORT` | Override dashboard port |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI features |

Example:

```bash
export KG_LOG_LEVEL=debug
export KG_GRAPHQL_PORT=8080
kg serve --all
```

## CLI Configuration Commands

### Show Current Configuration

```bash
kg config show
kg config show --json
```

### Set Configuration Values

```bash
# Set database path
kg config set database.path /data/kg/knowledge.db

# Set cache size (100MB)
kg config set cache.maxSize 104857600

# Enable debug logging
kg config set logging.level debug

# Set agent timeout
kg config set agents.defaultTimeout 60000
```

### Reset to Defaults

```bash
kg config reset
```

### Validate Configuration

```bash
kg config validate
```

### View Default Values

```bash
kg config defaults
```

## Example Configurations

### Development Configuration

Optimized for development with debug logging and faster refreshes:

```json
{
  "projectRoot": ".",
  "docsPath": "docs",
  "database": {
    "path": ".kg/knowledge.db",
    "walMode": true
  },
  "cache": {
    "enabled": true,
    "maxSize": 52428800,
    "defaultTtl": 300000,
    "evictionPolicy": "lru"
  },
  "agents": {
    "maxConcurrent": 3,
    "defaultTimeout": 60000,
    "enableLogging": true,
    "claudeFlowEnabled": true
  },
  "services": {
    "fileWatcher": true,
    "watchPaths": ["docs", "src"],
    "healthCheckInterval": 30000
  },
  "logging": {
    "level": "debug",
    "format": "text",
    "console": true
  },
  "graphql": {
    "port": 4000,
    "playground": true
  },
  "dashboard": {
    "port": 3001
  }
}
```

### Production Configuration

Optimized for performance and stability:

```json
{
  "projectRoot": "/app",
  "docsPath": "docs",
  "database": {
    "path": "/data/knowledge.db",
    "walMode": true,
    "busyTimeout": 10000,
    "cacheSize": 4000,
    "autoBackup": true,
    "backupInterval": 86400000,
    "maxBackups": 7
  },
  "cache": {
    "enabled": true,
    "maxSize": 209715200,
    "defaultTtl": 7200000,
    "evictionPolicy": "lru"
  },
  "agents": {
    "maxConcurrent": 10,
    "defaultTimeout": 120000,
    "retryAttempts": 5,
    "enableLogging": true,
    "claudeFlowEnabled": true
  },
  "services": {
    "fileWatcher": false,
    "schedulerEnabled": true,
    "syncEnabled": true,
    "healthCheckInterval": 60000
  },
  "logging": {
    "level": "info",
    "format": "json",
    "console": false,
    "filePath": "/var/log/kg/app.log"
  },
  "graphql": {
    "port": 4000,
    "cors": true,
    "playground": false
  },
  "dashboard": {
    "port": 3000
  }
}
```

### CI/CD Configuration

Minimal configuration for testing pipelines:

```json
{
  "projectRoot": ".",
  "docsPath": "docs",
  "database": {
    "path": ":memory:",
    "walMode": false
  },
  "cache": {
    "enabled": false
  },
  "agents": {
    "maxConcurrent": 2,
    "defaultTimeout": 10000,
    "enableLogging": false
  },
  "services": {
    "fileWatcher": false,
    "schedulerEnabled": false,
    "syncEnabled": false
  },
  "logging": {
    "level": "error",
    "format": "json",
    "console": true
  }
}
```

### Large Documentation Repository

Configuration for repositories with thousands of documents:

```json
{
  "database": {
    "path": ".kg/knowledge.db",
    "walMode": true,
    "busyTimeout": 30000,
    "cacheSize": 8000
  },
  "cache": {
    "enabled": true,
    "maxSize": 524288000,
    "defaultTtl": 14400000,
    "evictionPolicy": "lfu"
  },
  "agents": {
    "maxConcurrent": 8,
    "defaultTimeout": 300000
  },
  "services": {
    "fileWatcher": true,
    "watchPaths": ["docs"],
    "healthCheckInterval": 120000
  }
}
```

## Programmatic Configuration

### Using ConfigManager

```typescript
import { createConfigManager, getDefaultConfig } from '@weavelogic/knowledge-graph-agent';

// Create manager with custom path
const manager = createConfigManager('.kg/config.json');

// Load existing configuration
await manager.load();

// Get current configuration
const config = manager.get();

// Update configuration
manager.update({
  logging: { level: 'debug' },
  cache: { maxSize: 200 * 1024 * 1024 }
});

// Save changes
await manager.save();

// Validate configuration
const result = manager.validate();
if (!result.valid) {
  console.error('Invalid config:', result.errors);
}

// Reset to defaults
manager.reset();
```

### Getting Default Configuration

```typescript
import { getDefaultConfig } from '@weavelogic/knowledge-graph-agent';

const defaults = getDefaultConfig();
console.log(defaults);
```

## Configuration Migrations

The configuration system supports automatic migrations when the schema changes:

```typescript
import { createConfigManager, ConfigMigration } from '@weavelogic/knowledge-graph-agent';

const manager = createConfigManager();

// Register a migration
const migration: ConfigMigration = {
  version: 2,
  description: 'Add new cache options',
  migrate: (config) => ({
    ...config,
    cache: {
      ...config.cache,
      compression: true
    }
  })
};

manager.registerMigration(migration);
manager.applyMigrations(1); // Apply migrations from version 1
```

## Next Steps

- [Quick Start Guide](./quick-start.md) - Get started with basic usage
- [CLI Commands Reference](/docs/CLI-COMMANDS-REFERENCE.md) - Full command documentation
- [API Reference](/docs/API.md) - Programmatic API documentation
- [Architecture](/docs/ARCHITECTURE.md) - System architecture overview
