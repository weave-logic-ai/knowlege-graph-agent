# Weaver Configuration Quick Reference

Quick reference for common configuration tasks.

## Quick Start

### View Current Configuration

```bash
weaver config show
```

### Set a Value

```bash
weaver config set server.port 8080
```

### Reset to Defaults

```bash
weaver config reset --yes
```

## Common Configuration Tasks

### Change Server Port

```bash
weaver config set server.port 4000
```

### Change Log Level

```bash
weaver config set server.logLevel debug
```

### Configure Vault Path

```bash
weaver config set vault.path /path/to/vault
```

### Set AI Provider

```bash
# Use Vercel AI Gateway
weaver config set ai.provider vercel-gateway
weaver config set ai.vercelApiKey vck_your_key

# Or use Anthropic directly
weaver config set ai.provider anthropic
weaver config set ai.anthropicApiKey sk-ant-your_key
```

### Configure Search Provider

```bash
# DuckDuckGo (no API key needed)
weaver config set perception.searchProvider duckduckgo

# Google (requires API key)
weaver config set perception.searchProvider google
weaver config set perception.googleApiKey your_key
weaver config set perception.googleCseId your_cse_id
```

### Enable/Disable Features

```bash
# Enable AI features
weaver config set features.aiEnabled true

# Enable graph analytics
weaver config set features.graphAnalytics true

# Disable temporal queries
weaver config set features.temporalEnabled false
```

### Configure Workflows

```bash
# Set max concurrent workflows
weaver config set workflows.maxConcurrency 10

# Set workflow timeout (milliseconds)
weaver config set workflows.timeout 600000
```

### Git Configuration

```bash
# Enable auto-commit
weaver config set git.autoCommit true

# Set git author
weaver config set git.authorName "Your Name"
weaver config set git.authorEmail "your@email.com"

# Set commit debounce (milliseconds)
weaver config set git.commitDebounceMs 300000
```

## Environment Variables

### Server

```bash
WEAVER_PORT=3000
LOG_LEVEL=info
NODE_ENV=development
```

### Database

```bash
SHADOW_CACHE_DB_PATH=./data/shadow-cache.db
CACHE_SYNC_INTERVAL=300
```

### AI

```bash
AI_PROVIDER=vercel-gateway
VERCEL_AI_GATEWAY_API_KEY=vck_your_key
ANTHROPIC_API_KEY=sk-ant-your_key
DEFAULT_AI_MODEL=claude-3-5-sonnet-20241022
```

### Vault

```bash
VAULT_PATH=/path/to/vault
FILE_WATCHER_ENABLED=true
FILE_WATCHER_DEBOUNCE=1000
```

## Programmatic Usage

### Load Configuration

```typescript
import { getConfigManager } from '@weave-nn/weaver/config';

const manager = getConfigManager();
await manager.load({ watch: true });
```

### Get Values

```typescript
// Get entire config
const config = manager.get();

// Get specific value
const port = manager.get('server.port');
```

### Set Values

```typescript
// Set and persist
await manager.set('server.port', 8080);

// Set without persisting
await manager.set('server.port', 8080, false);
```

### Listen for Changes

```typescript
manager.on('config:changed', (config, changes) => {
  console.log('Config changed:', changes);
});
```

## Configuration Files

### JSON Format

```json
{
  "version": "1.0.0",
  "server": {
    "port": 4000,
    "logLevel": "debug"
  }
}
```

### YAML Format

```yaml
version: "1.0.0"
server:
  port: 4000
  logLevel: debug
```

## File Locations

The system searches for config files in this order:

1. `.weaverrc.json`
2. `.weaverrc.yaml`
3. `.weaverrc.yml`
4. `weaver.config.json`
5. `weaver.config.yaml`
6. `weaver.config.yml`
7. `~/.weaver/config.json` (user config)

## Troubleshooting

### Configuration Not Loading

```bash
# Check config files
ls -la .weaverrc.json ~/.weaver/config.json

# View current config
weaver config show --raw
```

### Validation Errors

```bash
# Check differences from defaults
weaver config diff

# Verify specific value
weaver config get server.port
```

### Reset Everything

```bash
# Reset to defaults
weaver config reset --yes

# Verify reset
weaver config diff
```

## Best Practices

1. **Use .env for secrets** - Never commit API keys
2. **Use config files for project settings** - Team configurations
3. **Use user config for personal preferences** - `~/.weaver/config.json`
4. **Enable hot-reload in development** - Faster iteration
5. **Validate after changes** - Run `weaver config show` to verify

## Common Patterns

### Development Setup

```bash
weaver config set server.logLevel debug
weaver config set features.aiEnabled true
weaver config set workflows.maxConcurrency 3
```

### Production Setup

```bash
weaver config set server.logLevel warn
weaver config set server.nodeEnv production
weaver config set workflows.maxConcurrency 10
weaver config set database.autoBackup true
```

### Testing Setup

```bash
weaver config set server.logLevel error
weaver config set features.aiEnabled false
weaver config set git.autoCommit false
```

## See Also

- [Full Configuration Guide](./configuration-system.md)
- [Environment Variables](./../.env.example)
- [Migration Guide](./configuration-system.md#migration-system)
