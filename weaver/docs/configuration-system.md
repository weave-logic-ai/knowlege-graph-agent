# Weaver Configuration Management System

Complete guide to Weaver's flexible, multi-source configuration system.

## Overview

The configuration system provides:

- **Multi-source loading**: Defaults → Files → Environment → CLI flags
- **Validation**: JSON Schema validation with helpful error messages
- **Security**: Automatic masking of sensitive values (API keys, tokens)
- **Hot-reload**: Automatic configuration updates via file watching
- **Migration**: Automatic version migration for smooth upgrades
- **Type safety**: Full TypeScript typing for all configuration

## Configuration Sources (Precedence Order)

1. **Defaults** - Embedded in application (lowest priority)
2. **Config files** - `.weaverrc.json`, `weaver.config.json`, etc.
3. **User config** - `~/.weaver/config.json`
4. **Environment variables** - `WEAVER_*` prefix
5. **CLI flags** - `--port`, `--log-level`, etc. (highest priority)

## Configuration File Locations

The system searches for config files in this order:

```
.weaverrc.json
.weaverrc.yaml
.weaverrc.yml
weaver.config.json
weaver.config.yaml
weaver.config.yml
~/.weaver/config.json  (user-level)
```

## Configuration Structure

```typescript
{
  version: "1.0.0",

  server: {
    port: 3000,
    host: "127.0.0.1",
    logLevel: "info",        // debug | info | warn | error
    nodeEnv: "development"   // development | production | test
  },

  database: {
    path: "./data/shadow-cache.db",
    backupDir: "./data/backups",
    autoBackup: true,
    syncInterval: 300        // seconds
  },

  workflows: {
    enabled: true,
    dbPath: "./data/workflows.db",
    maxConcurrency: 5,
    timeout: 300000          // milliseconds
  },

  embeddings: {
    provider: "xenova",      // openai | xenova
    model: "text-embedding-ada-002",
    apiKey: "sk-...",        // Optional for OpenAI
    maxChunkSize: 1000,
    chunkOverlap: 100
  },

  perception: {
    searchProvider: "duckduckgo",  // brave | google | duckduckgo | bing
    apiKey: "...",                 // Provider-specific
    googleApiKey: "...",
    googleCseId: "...",
    bingApiKey: "...",
    enableWebScraping: false,
    enableSearch: true,
    defaultSource: "search",       // search | scrape
    maxResults: 10,
    webScraper: {
      headless: true,
      timeout: 30000,
      retries: 3,
      userAgent: "Mozilla/5.0 (compatible; WeaverBot/1.0)"
    }
  },

  learning: {
    enabled: true,
    feedbackThreshold: 0.7,
    enablePerception: true,
    enableReasoning: true,
    enableMemory: true,
    enableExecution: true,
    autoAdaptation: true,
    minExecutions: 5,
    adaptationThreshold: 0.7,
    maxStrategies: 10
  },

  git: {
    autoCommit: true,
    authorName: "Weaver",
    authorEmail: "weaver@weave-nn.local",
    commitDebounceMs: 300000
  },

  vault: {
    path: "/home/user/Documents/weave-nn",
    fileWatcher: {
      enabled: true,
      debounce: 1000,
      ignore: [".obsidian", ".git", "node_modules", ".archive"]
    }
  },

  obsidian: {
    apiUrl: "https://localhost:27124",
    apiKey: "your-api-key"
  },

  ai: {
    provider: "vercel-gateway",  // vercel-gateway | anthropic
    vercelApiKey: "vck_...",
    anthropicApiKey: "sk-ant-...",
    defaultModel: "claude-3-5-sonnet-20241022"
  },

  features: {
    aiEnabled: true,
    temporalEnabled: false,
    graphAnalytics: false,
    mcpEnabled: true,
    mcpTransport: "stdio"    // stdio | http
  }
}
```

## Environment Variables

All configuration can be set via environment variables:

```bash
# Server Configuration
WEAVER_PORT=3000
WEAVER_HOST=127.0.0.1
LOG_LEVEL=info
NODE_ENV=development

# Database Configuration
SHADOW_CACHE_DB_PATH=./data/shadow-cache.db
CACHE_SYNC_INTERVAL=300

# Workflows Configuration
WORKFLOWS_ENABLED=true
WORKFLOWS_DB_PATH=./data/workflows.db

# Embeddings Configuration
MEMORY_MAX_CHUNK_SIZE=1000
MEMORY_CHUNK_OVERLAP=100
MEMORY_EMBEDDING_MODEL=text-embedding-ada-002

# Perception Configuration
PERCEPTION_ENABLE_WEB_SCRAPING=false
PERCEPTION_ENABLE_SEARCH=true
PERCEPTION_DEFAULT_SOURCE=search
PERCEPTION_MAX_RESULTS=10
WEB_SCRAPER_HEADLESS=true
WEB_SCRAPER_TIMEOUT=30000
WEB_SCRAPER_RETRIES=3
WEB_SCRAPER_USER_AGENT="Mozilla/5.0 (compatible; WeaverBot/1.0)"

# Learning Loop Configuration
LEARNING_ENABLE_PERCEPTION=true
LEARNING_ENABLE_REASONING=true
LEARNING_ENABLE_MEMORY=true
LEARNING_ENABLE_EXECUTION=true
LEARNING_AUTO_ADAPTATION=true
LEARNING_MIN_EXECUTIONS=5
ADAPTATION_THRESHOLD=0.7

# Git Configuration
GIT_AUTO_COMMIT=true
GIT_AUTHOR_NAME=Weaver
GIT_AUTHOR_EMAIL=weaver@weave-nn.local
GIT_COMMIT_DEBOUNCE_MS=300000

# Vault Configuration
VAULT_PATH=/home/user/vault
FILE_WATCHER_ENABLED=true
FILE_WATCHER_DEBOUNCE=1000
FILE_WATCHER_IGNORE=.obsidian,.git,node_modules,.archive

# Obsidian Configuration
OBSIDIAN_API_URL=https://localhost:27124
OBSIDIAN_API_KEY=your-api-key

# AI Configuration
AI_PROVIDER=vercel-gateway
VERCEL_AI_GATEWAY_API_KEY=vck_...
ANTHROPIC_API_KEY=sk-ant-...
DEFAULT_AI_MODEL=claude-3-5-sonnet-20241022

# Perception API Keys
GOOGLE_API_KEY=your-google-key
GOOGLE_CSE_ID=your-cse-id
BING_API_KEY=your-bing-key

# Feature Flags
FEATURE_AI_ENABLED=true
FEATURE_TEMPORAL_ENABLED=false
FEATURE_GRAPH_ANALYTICS=false
MCP_ENABLED=true
MCP_TRANSPORT=stdio
```

## CLI Usage

### Show Current Configuration

```bash
# Show entire configuration (with masked secrets)
weaver config show

# Show specific key
weaver config show --key server.port

# Show raw JSON
weaver config show --raw
```

### Set Configuration Values

```bash
# Set server port
weaver config set server.port 8080

# Set log level
weaver config set server.logLevel debug

# Set nested value with dot notation
weaver config set vault.fileWatcher.debounce 2000

# Set without persisting to file
weaver config set server.port 3001 --no-persist
```

### Get Configuration Values

```bash
# Get specific value
weaver config get server.port

# Get raw value (useful for scripting)
weaver config get server.port --raw
```

### List All Keys

```bash
# List all configuration keys
weaver config keys

# Filter keys by pattern
weaver config keys --filter "server"
```

### Show Differences

```bash
# Show differences from defaults
weaver config diff

# Show as raw JSON
weaver config diff --raw
```

### Reset Configuration

```bash
# Reset to defaults (with confirmation)
weaver config reset

# Reset without confirmation
weaver config reset --yes
```

## Programmatic Usage

### Basic Usage

```typescript
import { getConfigManager } from './config';

const manager = getConfigManager();

// Load configuration
await manager.load({ watch: true });

// Get entire config
const config = manager.get();

// Get specific value
const port = manager.get('server.port');

// Set value
await manager.set('server.port', 8080);

// Get with masked secrets
const masked = manager.getMasked();
```

### Hot-Reload

```typescript
const manager = getConfigManager();
await manager.load({ watch: true });

// Listen for configuration changes
manager.on('config:changed', (newConfig, changes) => {
  console.log('Configuration changed:', changes);
  // React to changes
});

// Listen for errors
manager.on('config:error', (error) => {
  console.error('Configuration error:', error);
});

// Stop watching when done
manager.stopWatcher();
```

### Validation

Configuration is automatically validated against JSON schema. Invalid configurations will throw errors with helpful messages:

```typescript
try {
  await manager.set('server.port', 'invalid');
} catch (error) {
  // Error: Configuration validation failed: server.port must be number
}
```

## Security Features

### Automatic Secret Masking

Sensitive values are automatically masked in output:

- API keys
- Tokens
- Passwords
- Secrets

```typescript
const masked = manager.getMasked();
// { anthropicApiKey: "sk-a******************" }
```

### Secure Storage

Sensitive values can be stored securely in the OS keychain:

```typescript
import keytar from 'keytar';

// Store API key securely
await keytar.setPassword('weaver', 'anthropic-api-key', apiKey);

// Retrieve from keychain
const apiKey = await keytar.getPassword('weaver', 'anthropic-api-key');
```

## Migration System

Configuration versions are automatically migrated:

```typescript
// Old config (v0.1.0)
{
  "version": "0.1.0",
  "port": 3000,
  "dbPath": "./data/db.sqlite"
}

// Automatically migrated to v1.0.0
{
  "version": "1.0.0",
  "server": { "port": 3000 },
  "database": { "path": "./data/db.sqlite" }
}
```

Migrations are applied automatically during load:

```typescript
const manager = getConfigManager();
await manager.load(); // Automatically migrates if needed
```

## File Examples

### .weaverrc.json

```json
{
  "version": "1.0.0",
  "server": {
    "port": 4000,
    "logLevel": "debug"
  },
  "vault": {
    "path": "/home/user/my-vault"
  }
}
```

### weaver.config.yaml

```yaml
version: "1.0.0"
server:
  port: 4000
  logLevel: debug
vault:
  path: /home/user/my-vault
```

## Best Practices

1. **Use environment variables for secrets**: Never commit API keys to config files
2. **Use config files for project settings**: Team-specific configurations
3. **Use user config for personal preferences**: Individual developer settings
4. **Enable hot-reload in development**: Faster iteration
5. **Validate early**: Load and validate config at startup
6. **Mask secrets in logs**: Always use `getMasked()` for logging

## Troubleshooting

### Configuration Not Loading

```bash
# Check if config file exists
ls -la .weaverrc.json ~/.weaver/config.json

# Show current configuration sources
weaver config show --raw
```

### Validation Errors

```bash
# Check differences from defaults
weaver config diff

# Validate specific key
weaver config get server.port
```

### Hot-Reload Not Working

```typescript
// Ensure watch is enabled
await manager.load({ watch: true });

// Check for file watcher errors
manager.on('config:error', console.error);
```

## Advanced Topics

### Custom Validation

Add custom validators for specific use cases:

```typescript
import { configSchema } from './config';

// Extend schema with custom validation
const customSchema = {
  ...configSchema,
  properties: {
    ...configSchema.properties,
    custom: { type: 'string', minLength: 10 }
  }
};
```

### Configuration Inheritance

Layer multiple config files:

```
1. Default config (code)
2. Team config (.weaverrc.json)
3. User config (~/.weaver/config.json)
4. Environment variables
```

### Dynamic Configuration

Update configuration at runtime:

```typescript
// Update and notify listeners
await manager.set('server.logLevel', 'debug');

// Temporary change (no persist)
await manager.set('workflows.maxConcurrency', 10, false);
```

## API Reference

See full API documentation in `/home/aepod/dev/weave-nn/weaver/src/config/`

- `config-manager.ts` - Main configuration manager
- `schema.ts` - TypeScript types and JSON schema
- `defaults.ts` - Default configuration values
- `migrations.ts` - Version migration system
