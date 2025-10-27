# Weaver Configuration Guide

**Version**: 1.0.0 (MVP)
**Date**: 2025-10-27

## Environment Variables

### Required Configuration

```env
# Vault Configuration
VAULT_PATH=/absolute/path/to/vault

# Obsidian API
OBSIDIAN_API_URL=http://localhost:27123
OBSIDIAN_API_KEY=your-api-key-here

# AI Provider
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Optional Configuration

```env
# Git Configuration
GIT_AUTHOR_NAME=Your Name
GIT_AUTHOR_EMAIL=your.email@example.com
AUTO_COMMIT_ENABLED=true
AUTO_COMMIT_DEBOUNCE_MS=300000

# Service Configuration
FILE_WATCHER_DEBOUNCE_MS=1000
SHADOW_CACHE_DB_PATH=.weaver/shadow-cache.db
LOG_LEVEL=info

# Performance Tuning
MAX_CONCURRENT_SYNCS=5
SYNC_BATCH_SIZE=100
```

## Configuration File (.weaver/config.json)

```json
{
  "version": "1.0.0",
  "services": {
    "fileWatcher": {
      "enabled": true,
      "debounceMs": 1000,
      "ignored": [".weaver", ".obsidian", ".git", "node_modules"]
    },
    "shadowCache": {
      "dbPath": ".weaver/shadow-cache.db",
      "syncOnStart": true,
      "incrementalSync": true
    },
    "workflowEngine": {
      "enabled": true,
      "maxConcurrent": 10
    },
    "gitAutoCommit": {
      "enabled": true,
      "debounceMs": 300000,
      "commitMessage": "Auto-commit via Weaver"
    }
  },
  "logging": {
    "level": "info",
    "directory": ".activity-logs",
    "rotation": "daily",
    "retention": 30
  }
}
```

## Performance Tuning

### For Large Vaults (10,000+ files)

```env
FILE_WATCHER_DEBOUNCE_MS=2000
MAX_CONCURRENT_SYNCS=10
SYNC_BATCH_SIZE=200
```

### For Real-Time Updates

```env
FILE_WATCHER_DEBOUNCE_MS=500
AUTO_COMMIT_DEBOUNCE_MS=60000  # 1 minute
```

### For Low-Resource Systems

```env
MAX_CONCURRENT_SYNCS=2
SYNC_BATCH_SIZE=50
LOG_LEVEL=warn
```

## Security Best Practices

1. **Never commit .env files**
2. **Use environment-specific .env files** (.env.production, .env.development)
3. **Rotate API keys regularly**
4. **Restrict file permissions**:
   ```bash
   chmod 600 .env
   chmod 700 .weaver
   ```

For more details, see [INSTALLATION.md](./INSTALLATION.md)
